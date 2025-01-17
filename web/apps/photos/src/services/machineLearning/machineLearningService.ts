import log from "@/next/log";
import { APPS } from "@ente/shared/apps/constants";
import ComlinkCryptoWorker from "@ente/shared/crypto";
import { CustomError, parseUploadErrorCodes } from "@ente/shared/error";
import { MAX_ML_SYNC_ERROR_COUNT } from "constants/mlConfig";
import downloadManager from "services/download";
import { putEmbedding } from "services/embeddingService";
import { getLocalFiles } from "services/fileService";
import { EnteFile } from "types/file";
import {
    MLSyncContext,
    MLSyncFileContext,
    MLSyncResult,
    MlFileData,
} from "types/machineLearning";
import { getMLSyncConfig } from "utils/machineLearning/config";
import { LocalFileMlDataToServerFileMl } from "utils/machineLearning/mldataMappers";
import mlIDbStorage from "utils/storage/mlIDbStorage";
import FaceService from "./faceService";
import { MLFactory } from "./machineLearningFactory";
import PeopleService from "./peopleService";
import ReaderService from "./readerService";

class MachineLearningService {
    private localSyncContext: Promise<MLSyncContext>;
    private syncContext: Promise<MLSyncContext>;

    public async sync(token: string, userID: number): Promise<MLSyncResult> {
        if (!token) {
            throw Error("Token needed by ml service to sync file");
        }

        await downloadManager.init(APPS.PHOTOS, { token });

        const syncContext = await this.getSyncContext(token, userID);

        await this.syncLocalFiles(syncContext);

        await this.getOutOfSyncFiles(syncContext);

        if (syncContext.outOfSyncFiles.length > 0) {
            await this.syncFiles(syncContext);
        }

        // TODO: running index before all files are on latest ml version
        // may be need to just take synced files on latest ml version for indexing
        if (
            syncContext.outOfSyncFiles.length <= 0 ||
            (syncContext.nSyncedFiles === syncContext.config.batchSize &&
                Math.random() < 0.2)
        ) {
            await this.syncIndex(syncContext);
        }

        const mlSyncResult: MLSyncResult = {
            nOutOfSyncFiles: syncContext.outOfSyncFiles.length,
            nSyncedFiles: syncContext.nSyncedFiles,
            nSyncedFaces: syncContext.nSyncedFaces,
            nFaceClusters:
                syncContext.mlLibraryData?.faceClusteringResults?.clusters
                    .length,
            nFaceNoise:
                syncContext.mlLibraryData?.faceClusteringResults?.noise.length,
            error: syncContext.error,
        };
        // log.info('[MLService] sync results: ', mlSyncResult);

        return mlSyncResult;
    }

    public async regenerateFaceCrop(
        token: string,
        userID: number,
        faceID: string,
    ) {
        await downloadManager.init(APPS.PHOTOS, { token });
        const syncContext = await this.getSyncContext(token, userID);
        return FaceService.regenerateFaceCrop(syncContext, faceID);
    }

    private newMlData(fileId: number) {
        return {
            fileId,
            mlVersion: 0,
            errorCount: 0,
        } as MlFileData;
    }

    private async getLocalFilesMap(syncContext: MLSyncContext) {
        if (!syncContext.localFilesMap) {
            const localFiles = await getLocalFiles();

            const personalFiles = localFiles.filter(
                (f) => f.ownerID === syncContext.userID,
            );
            syncContext.localFilesMap = new Map<number, EnteFile>();
            personalFiles.forEach((f) =>
                syncContext.localFilesMap.set(f.id, f),
            );
        }

        return syncContext.localFilesMap;
    }

    private async syncLocalFiles(syncContext: MLSyncContext) {
        const startTime = Date.now();
        const localFilesMap = await this.getLocalFilesMap(syncContext);

        const db = await mlIDbStorage.db;
        const tx = db.transaction("files", "readwrite");
        const mlFileIdsArr = await mlIDbStorage.getAllFileIdsForUpdate(tx);
        const mlFileIds = new Set<number>();
        mlFileIdsArr.forEach((mlFileId) => mlFileIds.add(mlFileId));

        const newFileIds: Array<number> = [];
        for (const localFileId of localFilesMap.keys()) {
            if (!mlFileIds.has(localFileId)) {
                newFileIds.push(localFileId);
            }
        }

        let updated = false;
        if (newFileIds.length > 0) {
            log.info("newFiles: ", newFileIds.length);
            const newFiles = newFileIds.map((fileId) => this.newMlData(fileId));
            await mlIDbStorage.putAllFiles(newFiles, tx);
            updated = true;
        }

        const removedFileIds: Array<number> = [];
        for (const mlFileId of mlFileIds) {
            if (!localFilesMap.has(mlFileId)) {
                removedFileIds.push(mlFileId);
            }
        }

        if (removedFileIds.length > 0) {
            log.info("removedFiles: ", removedFileIds.length);
            await mlIDbStorage.removeAllFiles(removedFileIds, tx);
            updated = true;
        }

        await tx.done;

        if (updated) {
            // TODO: should do in same transaction
            await mlIDbStorage.incrementIndexVersion("files");
        }

        log.info("syncLocalFiles", Date.now() - startTime, "ms");
    }

    private async getOutOfSyncFiles(syncContext: MLSyncContext) {
        const startTime = Date.now();
        const fileIds = await mlIDbStorage.getFileIds(
            syncContext.config.batchSize,
            syncContext.config.mlVersion,
            MAX_ML_SYNC_ERROR_COUNT,
        );

        log.info("fileIds: ", JSON.stringify(fileIds));

        const localFilesMap = await this.getLocalFilesMap(syncContext);
        syncContext.outOfSyncFiles = fileIds.map((fileId) =>
            localFilesMap.get(fileId),
        );
        log.info("getOutOfSyncFiles", Date.now() - startTime, "ms");
    }

    private async syncFiles(syncContext: MLSyncContext) {
        try {
            const functions = syncContext.outOfSyncFiles.map(
                (outOfSyncfile) => async () => {
                    await this.syncFileWithErrorHandler(
                        syncContext,
                        outOfSyncfile,
                    );
                    // TODO: just store file and faces count in syncContext
                },
            );
            syncContext.syncQueue.on("error", () => {
                syncContext.syncQueue.clear();
            });
            await syncContext.syncQueue.addAll(functions);
        } catch (error) {
            console.error("Error in sync job: ", error);
            syncContext.error = error;
        }
        await syncContext.syncQueue.onIdle();
        log.info("allFaces: ", syncContext.nSyncedFaces);

        // TODO: In case syncJob has to use multiple ml workers
        // do in same transaction with each file update
        // or keep in files store itself
        await mlIDbStorage.incrementIndexVersion("files");
        // await this.disposeMLModels();
    }

    private async getSyncContext(token: string, userID: number) {
        if (!this.syncContext) {
            log.info("Creating syncContext");

            this.syncContext = getMLSyncConfig().then((mlSyncConfig) =>
                MLFactory.getMLSyncContext(token, userID, mlSyncConfig, true),
            );
        } else {
            log.info("reusing existing syncContext");
        }
        return this.syncContext;
    }

    private async getLocalSyncContext(token: string, userID: number) {
        if (!this.localSyncContext) {
            log.info("Creating localSyncContext");
            this.localSyncContext = getMLSyncConfig().then((mlSyncConfig) =>
                MLFactory.getMLSyncContext(token, userID, mlSyncConfig, false),
            );
        } else {
            log.info("reusing existing localSyncContext");
        }
        return this.localSyncContext;
    }

    public async closeLocalSyncContext() {
        if (this.localSyncContext) {
            log.info("Closing localSyncContext");
            const syncContext = await this.localSyncContext;
            await syncContext.dispose();
            this.localSyncContext = undefined;
        }
    }

    public async syncLocalFile(
        token: string,
        userID: number,
        enteFile: EnteFile,
        localFile?: globalThis.File,
    ): Promise<MlFileData | Error> {
        const syncContext = await this.getLocalSyncContext(token, userID);

        try {
            const mlFileData = await this.syncFileWithErrorHandler(
                syncContext,
                enteFile,
                localFile,
            );

            if (syncContext.nSyncedFiles >= syncContext.config.batchSize) {
                await this.closeLocalSyncContext();
            }
            // await syncContext.dispose();
            return mlFileData;
        } catch (e) {
            console.error("Error while syncing local file: ", enteFile.id, e);
            return e;
        }
    }

    private async syncFileWithErrorHandler(
        syncContext: MLSyncContext,
        enteFile: EnteFile,
        localFile?: globalThis.File,
    ): Promise<MlFileData> {
        try {
            console.log(
                `Indexing ${enteFile.title ?? "<untitled>"} ${enteFile.id}`,
            );
            const mlFileData = await this.syncFile(
                syncContext,
                enteFile,
                localFile,
            );
            syncContext.nSyncedFaces += mlFileData.faces?.length || 0;
            syncContext.nSyncedFiles += 1;
            return mlFileData;
        } catch (e) {
            log.error("ML syncFile failed", e);
            let error = e;
            console.error(
                "Error in ml sync, fileId: ",
                enteFile.id,
                "name: ",
                enteFile.metadata.title,
                error,
            );
            if ("status" in error) {
                const parsedMessage = parseUploadErrorCodes(error);
                error = parsedMessage;
            }
            // TODO: throw errors not related to specific file
            // sync job run should stop after these errors
            // don't persist these errors against file,
            // can include indexeddb/cache errors too
            switch (error.message) {
                case CustomError.SESSION_EXPIRED:
                case CustomError.NETWORK_ERROR:
                    throw error;
            }

            await this.persistMLFileSyncError(enteFile, error);
            syncContext.nSyncedFiles += 1;
        }
    }

    private async syncFile(
        syncContext: MLSyncContext,
        enteFile: EnteFile,
        localFile?: globalThis.File,
    ) {
        console.log("Syncing for file" + enteFile.title);
        const fileContext: MLSyncFileContext = { enteFile, localFile };
        const oldMlFile =
            (fileContext.oldMlFile = await this.getMLFileData(enteFile.id)) ??
            this.newMlData(enteFile.id);
        if (
            fileContext.oldMlFile?.mlVersion === syncContext.config.mlVersion
            // TODO: reset mlversion of all files when user changes image source
        ) {
            return fileContext.oldMlFile;
        }
        const newMlFile = (fileContext.newMlFile = this.newMlData(enteFile.id));

        if (syncContext.shouldUpdateMLVersion) {
            newMlFile.mlVersion = syncContext.config.mlVersion;
        } else if (fileContext.oldMlFile?.mlVersion) {
            newMlFile.mlVersion = fileContext.oldMlFile.mlVersion;
        }

        try {
            await ReaderService.getImageBitmap(syncContext, fileContext);
            await Promise.all([
                this.syncFileAnalyzeFaces(syncContext, fileContext),
            ]);
            newMlFile.errorCount = 0;
            newMlFile.lastErrorMessage = undefined;
            await this.persistOnServer(newMlFile, enteFile);
            await mlIDbStorage.putFile(newMlFile);
        } catch (e) {
            log.error("ml detection failed", e);
            newMlFile.mlVersion = oldMlFile.mlVersion;
            throw e;
        } finally {
            fileContext.imageBitmap && fileContext.imageBitmap.close();
        }

        return newMlFile;
    }

    private async persistOnServer(mlFileData: MlFileData, enteFile: EnteFile) {
        const serverMl = LocalFileMlDataToServerFileMl(mlFileData);
        log.info(mlFileData);

        const comlinkCryptoWorker = await ComlinkCryptoWorker.getInstance();
        const { file: encryptedEmbeddingData } =
            await comlinkCryptoWorker.encryptMetadata(serverMl, enteFile.key);
        log.info(
            `putEmbedding embedding to server for file: ${enteFile.metadata.title} fileID: ${enteFile.id}`,
        );
        const res = await putEmbedding({
            fileID: enteFile.id,
            encryptedEmbedding: encryptedEmbeddingData.encryptedData,
            decryptionHeader: encryptedEmbeddingData.decryptionHeader,
            model: "file-ml-clip-face",
        });
        log.info("putEmbedding response: ", res);
    }

    private async getMLFileData(fileId: number) {
        return mlIDbStorage.getFile(fileId);
    }

    private async persistMLFileSyncError(enteFile: EnteFile, e: Error) {
        try {
            await mlIDbStorage.upsertFileInTx(enteFile.id, (mlFileData) => {
                if (!mlFileData) {
                    mlFileData = this.newMlData(enteFile.id);
                }
                mlFileData.errorCount = (mlFileData.errorCount || 0) + 1;
                mlFileData.lastErrorMessage = e.message;

                return mlFileData;
            });
        } catch (e) {
            // TODO: logError or stop sync job after most of the requests are failed
            console.error("Error while storing ml sync error", e);
        }
    }

    private async getMLLibraryData(syncContext: MLSyncContext) {
        syncContext.mlLibraryData = await mlIDbStorage.getLibraryData();
        if (!syncContext.mlLibraryData) {
            syncContext.mlLibraryData = {};
        }
    }

    private async persistMLLibraryData(syncContext: MLSyncContext) {
        return mlIDbStorage.putLibraryData(syncContext.mlLibraryData);
    }

    public async syncIndex(syncContext: MLSyncContext) {
        await this.getMLLibraryData(syncContext);

        await PeopleService.syncPeopleIndex(syncContext);

        await this.persistMLLibraryData(syncContext);
    }

    private async syncFileAnalyzeFaces(
        syncContext: MLSyncContext,
        fileContext: MLSyncFileContext,
    ) {
        const { newMlFile } = fileContext;
        const startTime = Date.now();
        await FaceService.syncFileFaceDetections(syncContext, fileContext);

        if (newMlFile.faces && newMlFile.faces.length > 0) {
            await FaceService.syncFileFaceCrops(syncContext, fileContext);

            const alignedFacesData = await FaceService.syncFileFaceAlignments(
                syncContext,
                fileContext,
            );

            await FaceService.syncFileFaceEmbeddings(
                syncContext,
                fileContext,
                alignedFacesData,
            );

            await FaceService.syncFileFaceMakeRelativeDetections(
                syncContext,
                fileContext,
            );
        }
        log.info(
            `face detection time taken ${fileContext.enteFile.id}`,
            Date.now() - startTime,
            "ms",
        );
    }
}

export default new MachineLearningService();
