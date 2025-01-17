import log from "@/next/log";
import EnteSpinner from "@ente/shared/components/EnteSpinner";
import { boxSealOpen, toB64 } from "@ente/shared/crypto/internal/libsodium";
import castGateway from "@ente/shared/network/cast";
import LargeType from "components/LargeType";
import _sodium from "libsodium-wrappers";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { storeCastData } from "services/cast/castService";
import { useCastReceiver } from "../utils/useCastReceiver";

// Function to generate cryptographically secure digits
const generateSecureData = (length: number): Uint8Array => {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    // Modulo operation to ensure each byte is a single digit
    for (let i = 0; i < length; i++) {
        array[i] = array[i] % 10;
    }
    return array;
};

const convertDataToDecimalString = (data: Uint8Array): string => {
    let decimalString = "";
    for (let i = 0; i < data.length; i++) {
        decimalString += data[i].toString(); // No need to pad, as each value is a single digit
    }
    return decimalString;
};

export default function PairingMode() {
    const [digits, setDigits] = useState<string[]>([]);
    const [publicKeyB64, setPublicKeyB64] = useState("");
    const [privateKeyB64, setPrivateKeyB64] = useState("");
    const [codePending, setCodePending] = useState(true);
    const [isCastReady, setIsCastReady] = useState(false);

    const { cast } = useCastReceiver();

    useEffect(() => {
        init();
    }, []);

    useEffect(() => {
        if (!cast) {
            console.log("cast not ready");
            return;
        }
        if (isCastReady) {
            console.log("cast already ready");
            return;
        }
        const context = cast.framework.CastReceiverContext.getInstance();
        context.setLoggerLevel(cast.framework.LoggerLevel.DEBUG);
        const castDebugLogger = cast.debug.CastDebugLogger.getInstance();
        try {
            const options = new cast.framework.CastReceiverOptions();
            options.maxInactivity = 3600;
            context.addEventListener(
                cast.framework.system.EventType.READY,
                () => {
                    if (!castDebugLogger.debugOverlayElement_) {
                        // Enable debug logger and show a 'DEBUG MODE' overlay at top left corner.
                        castDebugLogger.setEnabled(true);
                    }
                },
            );
            context.addEventListener(
                cast.framework.system.EventType.ERROR,
                (event) => {
                    castDebugLogger.info(
                        "Context Error - ",
                        JSON.stringify(event),
                    );
                },
            );
            options.customNamespaces = Object.assign({});
            options.customNamespaces["urn:x-cast:pair-request"] =
                cast.framework.system.MessageType.JSON;

            options.disableIdleTimeout = true;
            context.set;

            context.addCustomMessageListener(
                "urn:x-cast:pair-request",
                messageReceiveHandler,
            );
            context.start(options);
            setIsCastReady(true);
        } catch (e) {
            console.log("failed to create cast context", e);
            log.error("failed to create cast context", e);
        }

        return () => {
            console.log("stopping cast context");
            context.stop();
        };
    }, [cast]);

    const messageReceiveHandler = (message: {
        type: string;
        senderId: string;
        data: any;
    }) => {
        console.log("received message", message);
        try {
            console.log("sending pair request response message");
            cast.framework.CastReceiverContext.getInstance().sendCustomMessage(
                "urn:x-cast:pair-request",
                message.senderId,
                {
                    code: digits.join(""),
                },
            );
            console.log("sent pair request response message");
        } catch (e) {
            console.log("failed to pair request response message", e);
            log.error("failed to send message", e);
        }
    };

    const init = async () => {
        try {
            const data = generateSecureData(6);
            setDigits(convertDataToDecimalString(data).split(""));
            const keypair = await generateKeyPair();
            setPublicKeyB64(await toB64(keypair.publicKey));
            setPrivateKeyB64(await toB64(keypair.privateKey));
        } catch (e) {
            console.log("failed to generate keypair", e);
            log.error("failed to generate keypair", e);
            throw e;
        }
    };

    const generateKeyPair = async () => {
        await _sodium.ready;

        const keypair = _sodium.crypto_box_keypair();

        return keypair;
    };

    const pollForCastData = async () => {
        if (codePending) {
            return;
        }
        // see if we were acknowledged on the client.
        // the client will send us the encrypted payload using our public key that we advertised.
        // then, we can decrypt this and store all the necessary info locally so we can play the collection slideshow.
        let devicePayload = "";
        try {
            const encDastData = await castGateway.getCastData(
                `${digits.join("")}`,
            );
            if (!encDastData) return;
            devicePayload = encDastData;
        } catch (e) {
            setCodePending(true);
            init();
            return;
        }

        const decryptedPayload = await boxSealOpen(
            devicePayload,
            publicKeyB64,
            privateKeyB64,
        );

        const decryptedPayloadObj = JSON.parse(atob(decryptedPayload));

        return decryptedPayloadObj;
    };

    const advertisePublicKey = async (publicKeyB64: string) => {
        // hey client, we exist!
        try {
            await castGateway.registerDevice(
                `${digits.join("")}`,
                publicKeyB64,
            );
            setCodePending(false);
        } catch (e) {
            // schedule re-try after 5 seconds
            setTimeout(() => {
                init();
            }, 5000);
            return;
        }
    };

    const router = useRouter();

    useEffect(() => {
        if (digits.length < 1 || !publicKeyB64 || !privateKeyB64) return;

        const interval = setInterval(async () => {
            const data = await pollForCastData();
            if (!data) return;
            storeCastData(data);
            await router.push("/slideshow");
        }, 1000);

        return () => {
            clearInterval(interval);
        };
    }, [digits, publicKeyB64, privateKeyB64, codePending]);

    useEffect(() => {
        if (!publicKeyB64) return;
        advertisePublicKey(publicKeyB64);
    }, [publicKeyB64]);

    return (
        <>
            <div
                style={{
                    height: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <div
                    style={{
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                    }}
                >
                    <img width={150} src="/images/ente.svg" />
                    <h1
                        style={{
                            fontWeight: "normal",
                        }}
                    >
                        Enter this code on <b>ente</b> to pair this TV
                    </h1>
                    <div
                        style={{
                            borderRadius: "10px",
                            overflow: "hidden",
                        }}
                    >
                        {codePending ? (
                            <EnteSpinner />
                        ) : (
                            <>
                                <LargeType chars={digits} />
                            </>
                        )}
                    </div>
                    <p
                        style={{
                            fontSize: "1.2rem",
                        }}
                    >
                        Visit{" "}
                        <a
                            style={{
                                textDecoration: "none",
                                color: "#87CEFA",
                                fontWeight: "bold",
                            }}
                            href="https://ente.io/cast"
                            target="_blank"
                        >
                            ente.io/cast
                        </a>{" "}
                        for help
                    </p>
                    <div
                        style={{
                            position: "fixed",
                            bottom: "20px",
                            right: "20px",
                            backgroundColor: "white",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            padding: "10px",
                            borderRadius: "10px",
                        }}
                    >
                        <img src="/images/help-qrcode.webp" />
                    </div>
                </div>
            </div>
        </>
    );
}
