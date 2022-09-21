// @dart=2.9

import 'package:flutter/material.dart';
import 'package:flutter_datetime_picker/flutter_datetime_picker.dart';
import 'package:photos/theme/colors.dart';
import 'package:photos/theme/effects.dart';

final lightThemeData = ThemeData(
  fontFamily: 'Inter',
  brightness: Brightness.light,
  hintColor: Colors.grey,
  primaryColor: Colors.deepOrangeAccent,
  primaryColorLight: Colors.black54,
  iconTheme: const IconThemeData(color: Colors.black),
  primaryIconTheme:
      const IconThemeData(color: Colors.red, opacity: 1.0, size: 50.0),
  colorScheme: const ColorScheme.light(
    primary: Colors.black,
    secondary: Color.fromARGB(255, 163, 163, 163),
  ),
  accentColor: const Color.fromRGBO(0, 0, 0, 0.6),
  outlinedButtonTheme: buildOutlinedButtonThemeData(
    bgDisabled: Colors.grey.shade500,
    bgEnabled: Colors.black,
    fgDisabled: Colors.white,
    fgEnabled: Colors.white,
  ),
  elevatedButtonTheme: buildElevatedButtonThemeData(
    onPrimary: Colors.white,
    primary: Colors.black,
  ),
  toggleableActiveColor: Colors.green[400],
  scaffoldBackgroundColor: Colors.white,
  backgroundColor: Colors.white,
  appBarTheme: const AppBarTheme().copyWith(
    backgroundColor: Colors.white,
    foregroundColor: Colors.black,
    iconTheme: const IconThemeData(color: Colors.black),
    elevation: 0,
  ),
  //https://api.flutter.dev/flutter/material/TextTheme-class.html
  textTheme: _buildTextTheme(Colors.black),
  primaryTextTheme: const TextTheme().copyWith(
    bodyText2: const TextStyle(color: Colors.yellow),
    bodyText1: const TextStyle(color: Colors.orange),
  ),
  cardColor: const Color.fromRGBO(250, 250, 250, 1.0),
  dialogTheme: const DialogTheme().copyWith(
    backgroundColor: const Color.fromRGBO(250, 250, 250, 1.0), //
    titleTextStyle: const TextStyle(
      color: Colors.black,
      fontSize: 24,
      fontWeight: FontWeight.w600,
    ),
    contentTextStyle: const TextStyle(
      fontFamily: 'Inter-Medium',
      color: Colors.black,
      fontSize: 16,
      fontWeight: FontWeight.w500,
    ),
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
  ),
  inputDecorationTheme: const InputDecorationTheme().copyWith(
    focusedBorder: const UnderlineInputBorder(
      borderSide: BorderSide(
        color: Color.fromRGBO(45, 194, 98, 1.0),
      ),
    ),
  ),
  checkboxTheme: CheckboxThemeData(
    side: const BorderSide(
      color: Colors.black,
      width: 2,
    ),
    fillColor: MaterialStateProperty.resolveWith((states) {
      return states.contains(MaterialState.selected)
          ? Colors.black
          : Colors.white;
    }),
    checkColor: MaterialStateProperty.resolveWith((states) {
      return states.contains(MaterialState.selected)
          ? Colors.white
          : Colors.black;
    }),
  ),
);

final darkThemeData = ThemeData(
  fontFamily: 'Inter',
  brightness: Brightness.dark,
  primaryColorLight: Colors.white70,
  iconTheme: const IconThemeData(color: Colors.white),
  primaryIconTheme:
      const IconThemeData(color: Colors.red, opacity: 1.0, size: 50.0),
  hintColor: Colors.grey,
  colorScheme: const ColorScheme.dark(primary: Colors.white),
  accentColor: const Color.fromRGBO(45, 194, 98, 0.2),
  buttonTheme: const ButtonThemeData().copyWith(
    buttonColor: const Color.fromRGBO(45, 194, 98, 1.0),
  ),
  textTheme: _buildTextTheme(Colors.white),
  toggleableActiveColor: Colors.green[400],
  outlinedButtonTheme: buildOutlinedButtonThemeData(
    bgDisabled: Colors.grey.shade500,
    bgEnabled: Colors.white,
    fgDisabled: Colors.white,
    fgEnabled: Colors.black,
  ),
  elevatedButtonTheme: buildElevatedButtonThemeData(
    onPrimary: Colors.black,
    primary: Colors.white,
  ),
  scaffoldBackgroundColor: Colors.black,
  backgroundColor: Colors.black,
  appBarTheme: const AppBarTheme().copyWith(
    color: Colors.black,
    elevation: 0,
  ),
  cardColor: const Color.fromRGBO(10, 15, 15, 1.0),
  dialogTheme: const DialogTheme().copyWith(
    backgroundColor: const Color.fromRGBO(15, 15, 15, 1.0),
    titleTextStyle: const TextStyle(
      color: Colors.white,
      fontSize: 24,
      fontWeight: FontWeight.w600,
    ),
    contentTextStyle: const TextStyle(
      fontFamily: 'Inter-Medium',
      color: Colors.white,
      fontSize: 16,
      fontWeight: FontWeight.w500,
    ),
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
  ),
  inputDecorationTheme: const InputDecorationTheme().copyWith(
    focusedBorder: const UnderlineInputBorder(
      borderSide: BorderSide(
        color: Color.fromRGBO(45, 194, 98, 1.0),
      ),
    ),
  ),
  checkboxTheme: CheckboxThemeData(
    side: const BorderSide(
      color: Colors.grey,
      width: 2,
    ),
    fillColor: MaterialStateProperty.resolveWith((states) {
      if (states.contains(MaterialState.selected)) {
        return Colors.grey;
      } else {
        return Colors.black;
      }
    }),
    checkColor: MaterialStateProperty.resolveWith((states) {
      if (states.contains(MaterialState.selected)) {
        return Colors.black;
      } else {
        return Colors.grey;
      }
    }),
  ),
);

TextTheme _buildTextTheme(Color textColor) {
  return const TextTheme().copyWith(
    headline4: TextStyle(
      color: textColor,
      fontSize: 32,
      fontWeight: FontWeight.w600,
      fontFamily: 'Inter',
    ),
    headline5: TextStyle(
      color: textColor,
      fontSize: 24,
      fontWeight: FontWeight.w600,
      fontFamily: 'Inter',
    ),
    headline6: TextStyle(
      color: textColor,
      fontSize: 18,
      fontFamily: 'Inter',
      fontWeight: FontWeight.w600,
    ),
    subtitle1: TextStyle(
      color: textColor,
      fontFamily: 'Inter',
      fontSize: 16,
      fontWeight: FontWeight.w500,
    ),
    subtitle2: TextStyle(
      color: textColor,
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: FontWeight.w500,
    ),
    bodyText1: TextStyle(
      fontFamily: 'Inter',
      color: textColor,
      fontSize: 16,
      fontWeight: FontWeight.w500,
    ),
    bodyText2: TextStyle(
      fontFamily: 'Inter',
      color: textColor,
      fontSize: 14,
      fontWeight: FontWeight.w500,
    ),
    caption: TextStyle(
      color: textColor.withOpacity(0.6),
      fontSize: 14,
      fontWeight: FontWeight.w500,
    ),
    overline: TextStyle(
      fontFamily: 'Inter',
      color: textColor,
      fontSize: 14,
      fontWeight: FontWeight.w500,
      decoration: TextDecoration.underline,
    ),
  );
}

extension CustomColorScheme on ColorScheme {
  Color get defaultBackgroundColor =>
      brightness == Brightness.light ? Colors.white : Colors.black;

  Color get defaultTextColor =>
      brightness == Brightness.light ? Colors.black : Colors.white;

  Color get inverseTextColor =>
      brightness == Brightness.light ? Colors.white : Colors.black;

  Color get inverseIconColor =>
      brightness == Brightness.light ? Colors.white : Colors.black;

  Color get inverseBackgroundColor =>
      brightness == Brightness.light ? Colors.black : Colors.white;

  Color get boxSelectColor => brightness == Brightness.light
      ? const Color.fromRGBO(67, 186, 108, 1)
      : const Color.fromRGBO(16, 32, 32, 1);

  Color get boxUnSelectColor => brightness == Brightness.light
      ? const Color.fromRGBO(240, 240, 240, 1)
      : const Color.fromRGBO(8, 18, 18, 0.4);

  Color get greenAlternative => const Color.fromRGBO(45, 194, 98, 1.0);

  Color get dynamicFABBackgroundColor =>
      brightness == Brightness.light ? Colors.black : Colors.grey[850];

  Color get dynamicFABTextColor => Colors.white; //same for both themes

  // todo: use brightness == Brightness.light for changing color for dark/light theme
  ButtonStyle get optionalActionButtonStyle => buildElevatedButtonThemeData(
        onPrimary: const Color(0xFF777777),
        primary: const Color(0xFFF0F0F0),
        elevation: 0,
      ).style;

  Color get recoveryKeyBoxColor => brightness == Brightness.light
      ? const Color.fromRGBO(49, 155, 86, 0.2)
      : const Color(0xFF1DB954);

  Color get frostyBlurBackdropFilterColor => brightness == Brightness.light
      ? const Color.fromRGBO(238, 238, 238, 0.5)
      : const Color.fromRGBO(48, 48, 48, 0.5);

  Color get iconColor => brightness == Brightness.light
      ? Colors.black.withOpacity(0.75)
      : Colors.white;

  Color get bgColorForQuestions => brightness == Brightness.light
      ? Colors.white
      : const Color.fromRGBO(10, 15, 15, 1.0);

  Color get greenText => const Color.fromARGB(255, 40, 190, 113);

  Color get cupertinoPickerTopColor => brightness == Brightness.light
      ? const Color.fromARGB(255, 238, 238, 238)
      : Colors.white.withOpacity(0.1);

  DatePickerTheme get dateTimePickertheme => brightness == Brightness.light
      ? const DatePickerTheme(
          backgroundColor: Colors.white,
          itemStyle: TextStyle(color: Colors.black),
          cancelStyle: TextStyle(color: Colors.black),
        )
      : const DatePickerTheme(
          backgroundColor: Colors.black,
          itemStyle: TextStyle(color: Colors.white),
          cancelStyle: TextStyle(color: Colors.white),
        );

  Color get stepProgressUnselectedColor => brightness == Brightness.light
      ? const Color.fromRGBO(196, 196, 196, 0.6)
      : const Color.fromRGBO(255, 255, 255, 0.7);

  Color get gNavBackgroundColor => brightness == Brightness.light
      ? const Color.fromRGBO(196, 196, 196, 0.6)
      : const Color.fromRGBO(40, 40, 40, 0.6);

  Color get gNavBarActiveColor => brightness == Brightness.light
      ? const Color.fromRGBO(255, 255, 255, 0.6)
      : const Color.fromRGBO(255, 255, 255, 0.9);

  Color get gNavIconColor => brightness == Brightness.light
      ? const Color.fromRGBO(0, 0, 0, 0.8)
      : const Color.fromRGBO(255, 255, 255, 0.8);

  Color get gNavActiveIconColor => brightness == Brightness.light
      ? const Color.fromRGBO(0, 0, 0, 0.8)
      : const Color.fromRGBO(0, 0, 0, 0.8);

  Color get galleryThumbBackgroundColor => brightness == Brightness.light
      ? const Color.fromRGBO(240, 240, 240, 1)
      : const Color.fromRGBO(20, 20, 20, 1);

  Color get galleryThumbDrawColor => brightness == Brightness.light
      ? Colors.black.withOpacity(0.8)
      : Colors.white.withOpacity(0.5);

  Color get backupEnabledBgColor => brightness == Brightness.light
      ? const Color.fromRGBO(230, 230, 230, 0.95)
      : const Color.fromRGBO(10, 40, 40, 0.3);

  Color get dotsIndicatorActiveColor => brightness == Brightness.light
      ? Colors.black.withOpacity(0.5)
      : Colors.white.withOpacity(0.5);

  Color get dotsIndicatorInactiveColor => brightness == Brightness.light
      ? Colors.black.withOpacity(0.12)
      : Colors.white.withOpacity(0.12);

  Color get toastTextColor =>
      brightness == Brightness.light ? Colors.white : Colors.black;

  Color get toastBackgroundColor => brightness == Brightness.light
      ? const Color.fromRGBO(24, 24, 24, 0.95)
      : const Color.fromRGBO(255, 255, 255, 0.95);

  Color get subTextColor => brightness == Brightness.light
      ? const Color.fromRGBO(180, 180, 180, 1)
      : const Color.fromRGBO(100, 100, 100, 1);

  Color get themeSwitchIndicatorColor => brightness == Brightness.light
      ? Colors.black.withOpacity(0.75)
      : Colors.white;

  Color get themeSwitchActiveIconColor =>
      brightness == Brightness.light ? Colors.white : Colors.black;

  Color get themeSwitchInactiveIconColor => brightness == Brightness.light
      ? Colors.black.withOpacity(0.5)
      : Colors.white.withOpacity(0.5);

  Color get searchResultsColor => brightness == Brightness.light
      ? const Color.fromRGBO(245, 245, 245, 1.0)
      : const Color.fromRGBO(30, 30, 30, 1.0);

  Color get searchResultsCountTextColor => brightness == Brightness.light
      ? const Color.fromRGBO(80, 80, 80, 1)
      : const Color.fromRGBO(150, 150, 150, 1);

  Color get searchResultsBackgroundColor => brightness == Brightness.light
      ? Colors.black.withOpacity(0.32)
      : Colors.black.withOpacity(0.64);

  Color get fillFaint =>
      brightness == Brightness.light ? fillFaintLight : fillFaintDark;

  List<BoxShadow> get shadowMenu =>
      brightness == Brightness.light ? shadowMenuLight : shadowMenuDark;
}

OutlinedButtonThemeData buildOutlinedButtonThemeData({
  Color bgDisabled,
  Color bgEnabled,
  Color fgDisabled,
  Color fgEnabled,
}) {
  return OutlinedButtonThemeData(
    style: OutlinedButton.styleFrom(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
      ),
      alignment: Alignment.center,
      padding: const EdgeInsets.fromLTRB(50, 16, 50, 16),
      textStyle: const TextStyle(
        fontWeight: FontWeight.w600,
        fontFamily: 'Inter-SemiBold',
        fontSize: 18,
      ),
    ).copyWith(
      backgroundColor: MaterialStateProperty.resolveWith<Color>(
        (Set<MaterialState> states) {
          if (states.contains(MaterialState.disabled)) {
            return bgDisabled;
          }
          return bgEnabled;
        },
      ),
      foregroundColor: MaterialStateProperty.resolveWith<Color>(
        (Set<MaterialState> states) {
          if (states.contains(MaterialState.disabled)) {
            return fgDisabled;
          }
          return fgEnabled;
        },
      ),
      alignment: Alignment.center,
    ),
  );
}

ElevatedButtonThemeData buildElevatedButtonThemeData({
  @required Color onPrimary, // text button color
  @required Color primary,
  double elevation = 2, // background color of button
}) {
  return ElevatedButtonThemeData(
    style: ElevatedButton.styleFrom(
      elevation: elevation,
      onPrimary: onPrimary,
      primary: primary,
      alignment: Alignment.center,
      textStyle: const TextStyle(
        fontWeight: FontWeight.w600,
        fontFamily: 'Inter-SemiBold',
        fontSize: 18,
      ),
      padding: const EdgeInsets.symmetric(vertical: 18),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(8)),
      ),
    ),
  );
}
