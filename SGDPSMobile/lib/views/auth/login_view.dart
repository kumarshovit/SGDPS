import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/colors.dart';
import '../../providers/auth_provider.dart';
import '../dashboard/collector_dashboard_view.dart';

enum AuthMode { login, forgot, reset }

class LoginView extends StatefulWidget {
  const LoginView({Key? key}) : super(key: key);

  @override
  State<LoginView> createState() => _LoginViewState();
}

class _LoginViewState extends State<LoginView> {
  final _formKey = GlobalKey<FormState>();
  AuthMode _mode = AuthMode.login;

  // Controllers
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _resetTokenController = TextEditingController();
  final _newPasswordController = TextEditingController();

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _resetTokenController.dispose();
    _newPasswordController.dispose();
    super.dispose();
  }

  void _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final success = await authProvider.login(
      _emailController.text.trim(),
      _passwordController.text.trim(),
    );

    if (success && mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const CollectorDashboardView()),
      );
    }
  }

  void _handleForgotPassword() async {
    if (_emailController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter your email address')),
      );
      return;
    }

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final success = await authProvider.forgotPassword(_emailController.text.trim());

    if (success && mounted) {
      final token = authProvider.generatedResetToken;
      if (token != null && token.isNotEmpty) {
        _resetTokenController.text = token;
      }
      setState(() {
        _mode = AuthMode.reset;
      });
    }
  }

  void _handleResetPassword() async {
    if (!_formKey.currentState!.validate()) return;

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final success = await authProvider.resetPassword(
      email: _emailController.text.trim(),
      resetToken: _resetTokenController.text.trim(),
      newPassword: _newPasswordController.text.trim(),
    );

    if (success && mounted) {
      setState(() {
        _mode = AuthMode.login;
        _passwordController.text = _newPasswordController.text.trim();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);

    return Scaffold(
      backgroundColor: AppColors.cream,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 16.0),
            child: Card(
              color: AppColors.creamCard,
              elevation: 4,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(24),
                side: const BorderSide(color: AppColors.creamBorder),
              ),
              child: Padding(
                padding: const EdgeInsets.all(22.0),
                child: Form(
                  key: _formKey,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Festive Flame Icon
                      Container(
                        width: 64,
                        height: 64,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: const LinearGradient(
                            colors: [AppColors.maroonDark, AppColors.saffron, AppColors.gold],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          border: Border.all(color: AppColors.gold, width: 2),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.gold.withOpacity(0.3),
                              blurRadius: 14,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: const Icon(Icons.local_fire_department, color: Colors.white, size: 34),
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        'SGDPS Field Collector',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: AppColors.maroonDark,
                          fontFamily: 'serif',
                        ),
                      ),
                      const Text(
                        'Durga Puja Collection & Mobile Ledger',
                        style: TextStyle(fontSize: 11, color: AppColors.inkMuted, fontWeight: FontWeight.w500),
                      ),
                      const SizedBox(height: 20),

                      // Feedback Messages
                      if (auth.errorMessage != null)
                        Container(
                          padding: const EdgeInsets.all(10),
                          margin: const EdgeInsets.only(bottom: 14),
                          decoration: BoxDecoration(
                            color: Colors.red.shade50,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: Colors.red.shade200),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.error_outline, color: Colors.red, size: 16),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  auth.errorMessage!,
                                  style: const TextStyle(fontSize: 12, color: Colors.red),
                                ),
                              ),
                            ],
                          ),
                        ),

                      if (auth.successMessage != null)
                        Container(
                          padding: const EdgeInsets.all(10),
                          margin: const EdgeInsets.only(bottom: 14),
                          decoration: BoxDecoration(
                            color: AppColors.forestLight,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: AppColors.forest.withOpacity(0.3)),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.check_circle_outline, color: AppColors.forest, size: 16),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  auth.successMessage!,
                                  style: const TextStyle(fontSize: 12, color: AppColors.forest, fontWeight: FontWeight.bold),
                                ),
                              ),
                            ],
                          ),
                        ),

                      // MODE 1: LOGIN
                      if (_mode == AuthMode.login) ...[
                        _buildInputField(
                          controller: _emailController,
                          label: 'Collector Email',
                          icon: Icons.email_outlined,
                          validator: (v) => v!.isEmpty ? 'Email is required' : null,
                        ),
                        const SizedBox(height: 12),
                        _buildInputField(
                          controller: _passwordController,
                          label: 'Password',
                          icon: Icons.lock_outline,
                          obscure: true,
                          validator: (v) => v!.isEmpty ? 'Password is required' : null,
                        ),
                        Align(
                          alignment: Alignment.centerRight,
                          child: TextButton(
                            onPressed: () => setState(() => _mode = AuthMode.forgot),
                            child: const Text(
                              'Forgot Password?',
                              style: TextStyle(fontSize: 11, color: AppColors.saffron, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        _buildPrimaryButton(
                          label: 'Sign In as Collector',
                          isLoading: auth.isLoading,
                          onPressed: _handleLogin,
                        ),
                      ],

                      // MODE 2: FORGOT PASSWORD
                      if (_mode == AuthMode.forgot) ...[
                        const Text(
                          'Enter your registered email to request a reset token.',
                          style: TextStyle(fontSize: 12, color: AppColors.inkMuted),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 12),
                        _buildInputField(
                          controller: _emailController,
                          label: 'Registered Email',
                          icon: Icons.email_outlined,
                          validator: (v) => v!.isEmpty ? 'Email required' : null,
                        ),
                        const SizedBox(height: 16),
                        _buildPrimaryButton(
                          label: 'Request Reset Token',
                          isLoading: auth.isLoading,
                          onPressed: _handleForgotPassword,
                        ),
                        const SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            TextButton(
                              onPressed: () => setState(() => _mode = AuthMode.login),
                              child: const Text(
                                '‹ Back to Sign In',
                                style: TextStyle(fontSize: 11, color: AppColors.inkMuted, fontWeight: FontWeight.bold),
                              ),
                            ),
                            TextButton(
                              onPressed: () => setState(() => _mode = AuthMode.reset),
                              child: const Text(
                                'Have a token? Reset here',
                                style: TextStyle(fontSize: 11, color: AppColors.saffron, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ],
                        ),
                      ],

                      // MODE 3: RESET PASSWORD
                      if (_mode == AuthMode.reset) ...[
                        _buildInputField(
                          controller: _emailController,
                          label: 'Registered Email',
                          icon: Icons.email_outlined,
                          validator: (v) => v!.isEmpty ? 'Email required' : null,
                        ),
                        const SizedBox(height: 12),
                        _buildInputField(
                          controller: _resetTokenController,
                          label: 'Reset Token',
                          icon: Icons.key_outlined,
                          validator: (v) => v!.isEmpty ? 'Token required' : null,
                        ),
                        const SizedBox(height: 12),
                        _buildInputField(
                          controller: _newPasswordController,
                          label: 'New Password',
                          icon: Icons.lock_reset_outlined,
                          obscure: true,
                          validator: (v) => v!.isEmpty ? 'New password required' : null,
                        ),
                        const SizedBox(height: 16),
                        _buildPrimaryButton(
                          label: 'Confirm New Password',
                          isLoading: auth.isLoading,
                          onPressed: _handleResetPassword,
                        ),
                        const SizedBox(height: 8),
                        TextButton(
                          onPressed: () => setState(() => _mode = AuthMode.login),
                          child: const Text(
                            '‹ Back to Sign In',
                            style: TextStyle(fontSize: 11, color: AppColors.inkMuted, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],

                      const SizedBox(height: 8),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildInputField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    bool obscure = false,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      obscureText: obscure,
      style: const TextStyle(fontSize: 14, color: AppColors.ink),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(color: AppColors.inkMuted, fontSize: 12),
        prefixIcon: Icon(icon, color: AppColors.goldDark, size: 18),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.creamBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.gold, width: 2),
        ),
        filled: true,
        fillColor: AppColors.cream,
        isDense: true,
        contentPadding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
      ),
      validator: validator,
    );
  }

  Widget _buildPrimaryButton({
    required String label,
    required bool isLoading,
    required VoidCallback onPressed,
  }) {
    return SizedBox(
      width: double.infinity,
      height: 46,
      child: ElevatedButton(
        onPressed: isLoading ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.saffron,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          elevation: 2,
        ),
        child: isLoading
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(label, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                  const SizedBox(width: 6),
                  const Icon(Icons.arrow_forward, size: 16),
                ],
              ),
      ),
    );
  }
}
