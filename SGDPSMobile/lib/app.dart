import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'core/constants/colors.dart';
import 'providers/auth_provider.dart';
import 'providers/collection_provider.dart';
import 'providers/flat_provider.dart';
import 'views/auth/login_view.dart';

class SgdpsMobileApp extends StatelessWidget {
  const SgdpsMobileApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => FlatProvider()),
        ChangeNotifierProvider(create: (_) => CollectionProvider()),
      ],
      child: MaterialApp(
        title: 'SGDPS Field Collector',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          useMaterial3: true,
          colorScheme: ColorScheme.fromSeed(
            seedColor: AppColors.saffron,
            primary: AppColors.saffron,
            secondary: AppColors.gold,
            surface: AppColors.cream,
          ),
          fontFamily: GoogleFonts.inter().fontFamily,
          scaffoldBackgroundColor: AppColors.cream,
          inputDecorationTheme: const InputDecorationTheme(
            fillColor: AppColors.creamCard,
            filled: true,
            labelStyle: TextStyle(color: AppColors.inkMuted),
          ),
          appBarTheme: const AppBarTheme(
            backgroundColor: AppColors.maroonDark,
            foregroundColor: AppColors.cream,
            elevation: 0,
          ),
        ),
        home: const LoginView(),
      ),
    );
  }
}
