// import 'package:flutter/material.dart';
// import 'package:provider/provider.dart';
// import '../../core/constants/colors.dart';
// import '../../providers/auth_provider.dart';
// import '../auth/login_view.dart';
// import '../dashboard/collector_dashboard_view.dart';

// class SplashView extends StatefulWidget {
//   const SplashView({Key? key}) : super(key: key);

//   @override
//   State<SplashView> createState() => _SplashViewState();
// }

// class _SplashViewState extends State<SplashView> with SingleTickerProviderStateMixin {
//   late AnimationController _controller;
//   late Animation<double> _fadeAnimation;
//   late Animation<double> _scaleAnimation;

//   @override
//   void initState() {
//     super.initState();

//     _controller = AnimationController(
//       vsync: this,
//       duration: const Duration(milliseconds: 1000),
//     );

//     _fadeAnimation = CurvedAnimation(
//       parent: _controller,
//       curve: Curves.easeIn,
//     );

//     _scaleAnimation = Tween<double>(begin: 0.85, end: 1.0).animate(
//       CurvedAnimation(
//         parent: _controller,
//         curve: Curves.easeOutBack,
//       ),
//     );

//     _controller.forward();
//     _checkAuthAndNavigate();
//   }

//   @override
//   void dispose() {
//     _controller.dispose();
//     super.dispose();
//   }

//   Future<void> _checkAuthAndNavigate() async {
//     // Keep splash visible for at least 1.6s for a smooth, premium brand impression
//     await Future.delayed(const Duration(milliseconds: 1600));

//     if (!mounted) return;

//     final authProvider = Provider.of<AuthProvider>(context, listen: false);
//     final isLoggedIn = await authProvider.tryAutoLogin();

//     if (!mounted) return;

//     Navigator.of(context).pushReplacement(
//       PageRouteBuilder(
//         transitionDuration: const Duration(milliseconds: 600),
//         pageBuilder: (_, __, ___) =>
//             isLoggedIn ? const CollectorDashboardView() : const LoginView(),
//         transitionsBuilder: (_, animation, __, child) {
//           return FadeTransition(opacity: animation, child: child);
//         },
//       ),
//     );
//   }

//   @override
//   Widget build(BuildContext context) {
//     final size = MediaQuery.of(context).size;

//     return Scaffold(
//       body: Container(
//         width: double.infinity,
//         height: double.infinity,
//         decoration: const BoxDecoration(
//           gradient: RadialGradient(
//             center: Alignment(0, -0.2),
//             radius: 1.2,
//             colors: [
//               Color(0xFF5E1422), // Glowing inner maroon
//               AppColors.maroonDark, // Signature Royal Maroon #4A101A
//               Color(0xFF1E050A), // Deep dark vignette edge
//             ],
//             stops: [0.0, 0.55, 1.0],
//           ),
//         ),
//         child: SafeArea(
//           child: Stack(
//             children: [
//               // Subtle background decorative golden rings
//               Positioned(
//                 top: size.height * 0.18,
//                 left: size.width * 0.5 - 140,
//                 child: Container(
//                   width: 280,
//                   height: 280,
//                   decoration: BoxDecoration(
//                     shape: BoxShape.circle,
//                     border: Border.all(
//                       color: AppColors.gold.withOpacity(0.08),
//                       width: 1.5,
//                     ),
//                   ),
//                 ),
//               ),
//               Positioned(
//                 top: size.height * 0.15,
//                 left: size.width * 0.5 - 170,
//                 child: Container(
//                   width: 340,
//                   height: 340,
//                   decoration: BoxDecoration(
//                     shape: BoxShape.circle,
//                     border: Border.all(
//                       color: AppColors.gold.withOpacity(0.05),
//                       width: 1,
//                     ),
//                   ),
//                 ),
//               ),

//               // Main Animated Content
//               Center(
//                 child: FadeTransition(
//                   opacity: _fadeAnimation,
//                   child: ScaleTransition(
//                     scale: _scaleAnimation,
//                     child: Column(
//                       mainAxisSize: MainAxisSize.min,
//                       children: [
//                         // Golden Glow Container around App Emblem
//                         Container(
//                           width: 120,
//                           height: 120,
//                           decoration: BoxDecoration(
//                             shape: BoxShape.circle,
//                             gradient: const RadialGradient(
//                               colors: [
//                                 Color(0xFFFFE082),
//                                 AppColors.gold,
//                                 Color(0xFFB8860B),
//                               ],
//                             ),
//                             boxShadow: [
//                               BoxShadow(
//                                 color: AppColors.gold.withOpacity(0.35),
//                                 blurRadius: 30,
//                                 spreadRadius: 5,
//                               ),
//                               BoxShadow(
//                                 color: Colors.black.withOpacity(0.4),
//                                 blurRadius: 15,
//                                 offset: const Offset(0, 8),
//                               ),
//                             ],
//                           ),
//                           padding: const EdgeInsets.all(4),
//                           child: ClipOval(
//                             child: Image.asset(
//                               'assets/images/app_icon.png',
//                               fit: BoxFit.cover,
//                               errorBuilder: (_, __, ___) => Container(
//                                 color: AppColors.maroonDark,
//                                 child: const Center(
//                                   child: Text('🔱', style: TextStyle(fontSize: 48)),
//                                 ),
//                               ),
//                             ),
//                           ),
//                         ),
//                         const SizedBox(height: 28),

//                         // App Title
//                         const Text(
//                           'SGDPS',
//                           style: TextStyle(
//                             fontSize: 32,
//                             fontWeight: FontWeight.w900,
//                             letterSpacing: 4,
//                             color: AppColors.goldLight,
//                             fontFamily: 'serif',
//                             shadows: [
//                               Shadow(
//                                 color: Colors.black54,
//                                 offset: Offset(0, 2),
//                                 blurRadius: 6,
//                               ),
//                             ],
//                           ),
//                         ),
//                         const SizedBox(height: 4),

//                         const Text(
//                           'FIELD COLLECTOR',
//                           style: TextStyle(
//                             fontSize: 14,
//                             fontWeight: FontWeight.bold,
//                             letterSpacing: 3.5,
//                             color: Colors.white,
//                           ),
//                         ),
//                         const SizedBox(height: 8),

//                         // Hindi Subtitle
//                         Text(
//                           'श्री गणेश दुर्गा पूजा समिति',
//                           style: TextStyle(
//                             fontSize: 13,
//                             color: AppColors.gold.withOpacity(0.9),
//                             letterSpacing: 0.5,
//                           ),
//                         ),
//                         const SizedBox(height: 14),

//                         // Small Golden Divider
//                         Container(
//                           width: 48,
//                           height: 2,
//                           decoration: BoxDecoration(
//                             color: AppColors.gold,
//                             borderRadius: BorderRadius.circular(1),
//                           ),
//                         ),
//                       ],
//                     ),
//                   ),
//                 ),
//               ),

//               // Bottom Progress Indicator & Footer
//               Positioned(
//                 bottom: 30,
//                 left: 0,
//                 right: 0,
//                 child: FadeTransition(
//                   opacity: _fadeAnimation,
//                   child: Column(
//                     children: [
//                       const SizedBox(
//                         width: 22,
//                         height: 22,
//                         child: CircularProgressIndicator(
//                           strokeWidth: 2.2,
//                           valueColor: AlwaysStoppedAnimation<Color>(AppColors.gold),
//                         ),
//                       ),
//                       const SizedBox(height: 14),
//                       Text(
//                         'Durga Puja 2026 · Secure & Transparent',
//                         style: TextStyle(
//                           fontSize: 11,
//                           color: Colors.white.withOpacity(0.6),
//                           letterSpacing: 0.5,
//                         ),
//                       ),
//                     ],
//                   ),
//                 ),
//               ),
//             ],
//           ),
//         ),
//       ),
//     );
//   }
// }
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/constants/colors.dart';
import '../../providers/auth_provider.dart';
import '../auth/login_view.dart';
import '../dashboard/collector_dashboard_view.dart';

class SplashView extends StatefulWidget {
  const SplashView({Key? key}) : super(key: key);

  @override
  State<SplashView> createState() => _SplashViewState();
}

class _SplashViewState extends State<SplashView>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();

    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );

    _fadeAnimation = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeIn,
    );

    _scaleAnimation = Tween<double>(
      begin: 0.85,
      end: 1.0,
    ).animate(
      CurvedAnimation(
        parent: _controller,
        curve: Curves.easeOutBack,
      ),
    );

    _controller.forward();

    _checkAuthAndNavigate();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _checkAuthAndNavigate() async {
    // Keep splash visible for at least 1.6 seconds
    // for a smooth branded experience.
    await Future.delayed(
      const Duration(milliseconds: 1600),
    );

    if (!mounted) return;

    final authProvider = Provider.of<AuthProvider>(
      context,
      listen: false,
    );

    final isLoggedIn = await authProvider.tryAutoLogin();

    if (!mounted) return;

    Navigator.of(context).pushReplacement(
      PageRouteBuilder(
        transitionDuration: const Duration(milliseconds: 600),
        pageBuilder: (_, __, ___) {
          return isLoggedIn
              ? const CollectorDashboardView()
              : const LoginView();
        },
        transitionsBuilder: (_, animation, __, child) {
          return FadeTransition(
            opacity: animation,
            child: child,
          );
        },
      ),
    );
  }

  // ============================================
  // SMALL GOLD DECORATIVE DOT
  // ============================================

  Widget _goldDot(double size) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: AppColors.gold.withOpacity(0.35),
        boxShadow: [
          BoxShadow(
            color: AppColors.gold.withOpacity(0.25),
            blurRadius: 8,
          ),
        ],
      ),
    );
  }

  // ============================================
  // MAIN BUILD
  // ============================================

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,

        // ========================================
        // PREMIUM MAROON BACKGROUND
        // ========================================

        decoration: const BoxDecoration(
          gradient: RadialGradient(
            center: Alignment(0, -0.25),
            radius: 1.25,
            colors: [
              Color(0xFF651724),
              AppColors.maroonDark,
              Color(0xFF180307),
            ],
            stops: [
              0.0,
              0.55,
              1.0,
            ],
          ),
        ),

        child: SafeArea(
          child: Stack(
            children: [
              // ====================================
              // LARGE BACKGROUND CIRCLE
              // ====================================

              Positioned(
                top: size.height * 0.12,
                left: size.width / 2 - 170,
                child: IgnorePointer(
                  child: Container(
                    width: 340,
                    height: 340,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: AppColors.gold.withOpacity(0.045),
                        width: 1,
                      ),
                    ),
                  ),
                ),
              ),

              // ====================================
              // SECOND BACKGROUND CIRCLE
              // ====================================

              Positioned(
                top: size.height * 0.16,
                left: size.width / 2 - 140,
                child: IgnorePointer(
                  child: Container(
                    width: 280,
                    height: 280,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: AppColors.gold.withOpacity(0.07),
                        width: 1.5,
                      ),
                    ),
                  ),
                ),
              ),

              // ====================================
              // DECORATIVE GOLD DOTS
              // ====================================

              Positioned(
                top: size.height * 0.19,
                left: size.width * 0.18,
                child: _goldDot(4),
              ),

              Positioned(
                top: size.height * 0.30,
                right: size.width * 0.15,
                child: _goldDot(3),
              ),

              Positioned(
                top: size.height * 0.42,
                left: size.width * 0.10,
                child: _goldDot(2),
              ),

              Positioned(
                top: size.height * 0.23,
                right: size.width * 0.25,
                child: _goldDot(2),
              ),

              // ====================================
              // MAIN BRANDING
              // ====================================

              Align(
                alignment: const Alignment(0, -0.12),
                child: FadeTransition(
                  opacity: _fadeAnimation,
                  child: ScaleTransition(
                    scale: _scaleAnimation,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // ==========================
                        // APP EMBLEM
                        // ==========================

                        Container(
                          width: 150,
                          height: 150,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.gold.withOpacity(0.22),
                                blurRadius: 45,
                                spreadRadius: 8,
                              ),
                              BoxShadow(
                                color: Colors.black.withOpacity(0.45),
                                blurRadius: 25,
                                offset: const Offset(0, 12),
                              ),
                            ],
                          ),
                          child: Container(
                            padding: const EdgeInsets.all(5),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: const LinearGradient(
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                                colors: [
                                  Color(0xFFFFE7A0),
                                  AppColors.gold,
                                  Color(0xFF9A6B00),
                                ],
                              ),
                            ),
                            child: Container(
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: AppColors.maroonDark,
                                border: Border.all(
                                  color: Colors.white.withOpacity(0.12),
                                  width: 1,
                                ),
                              ),
                              child: ClipOval(
                                child: Padding(
                                  padding: const EdgeInsets.all(8),
                                  child: Image.asset(
                                    'assets/images/app_icon.png',

                                    // Important:
                                    // contain prevents the logo
                                    // from getting cropped.
                                    fit: BoxFit.contain,

                                    errorBuilder: (
                                      context,
                                      error,
                                      stackTrace,
                                    ) {
                                      return const Center(
                                        child: Text(
                                          '🔱',
                                          style: TextStyle(
                                            fontSize: 52,
                                          ),
                                        ),
                                      );
                                    },
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),

                        const SizedBox(height: 30),

                        // ==========================
                        // APP NAME
                        // ==========================

                        const Text(
                          'SGDPS',
                          style: TextStyle(
                            fontSize: 34,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 5,
                            color: AppColors.goldLight,
                            fontFamily: 'serif',
                            shadows: [
                              Shadow(
                                color: Colors.black54,
                                offset: Offset(0, 3),
                                blurRadius: 8,
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 6),

                        // ==========================
                        // APP TYPE
                        // ==========================

                        Text(
                          'FIELD COLLECTOR',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 4,
                            color: Colors.white.withOpacity(0.92),
                          ),
                        ),

                        const SizedBox(height: 14),

                        // ==========================
                        // HINDI NAME
                        // ==========================

                        // Text(
                        //   'श्री गणेश दुर्गा पूजा समिति',
                        //   style: TextStyle(
                        //     fontSize: 14,
                        //     color: AppColors.gold.withOpacity(0.92),
                        //     letterSpacing: 0.7,
                        //   ),
                        // ),

                        const SizedBox(height: 18),

                        // ==========================
                        // ORNAMENTAL DIVIDER
                        // ==========================

                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              width: 28,
                              height: 1,
                              color: AppColors.gold.withOpacity(0.45),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              width: 7,
                              height: 7,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: AppColors.gold,
                                boxShadow: [
                                  BoxShadow(
                                    color: AppColors.gold.withOpacity(0.5),
                                    blurRadius: 6,
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              width: 28,
                              height: 1,
                              color: AppColors.gold.withOpacity(0.45),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              // ====================================
              // BOTTOM LOADING SECTION
              // ====================================

              Positioned(
                left: 0,
                right: 0,
                bottom: 32,
                child: FadeTransition(
                  opacity: _fadeAnimation,
                  child: Column(
                    children: [
                      // ==========================
                      // LOADING INDICATOR
                      // ==========================

                      const SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(
                            AppColors.gold,
                          ),
                        ),
                      ),

                      const SizedBox(height: 14),

                      // ==========================
                      // LOADING TEXT
                      // ==========================

                      Text(
                        'Loading...',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                          color: Colors.white.withOpacity(0.65),
                          letterSpacing: 1,
                        ),
                      ),

                      const SizedBox(height: 8),

                      // ==========================
                      // FOOTER
                      // ==========================

                      Text(
                        'Durga Puja 2026  ·  Secure & Transparent',
                        style: TextStyle(
                          fontSize: 10,
                          color: Colors.white.withOpacity(0.38),
                          letterSpacing: 0.4,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
