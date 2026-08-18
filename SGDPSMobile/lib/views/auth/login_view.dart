import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/colors.dart';
import '../../providers/auth_provider.dart';
import '../dashboard/collector_dashboard_view.dart';

enum AuthMode { login, register, forgot, reset }

class LoginView extends StatefulWidget {
  const LoginView({Key? key}) : super(key: key);

  @override
  State<LoginView> createState() => _LoginViewState();
}

class _LoginViewState extends State<LoginView> {
  final _formKey = GlobalKey<FormState>();
  AuthMode _mode = AuthMode.login;

  // Controllers
  final _emailController = TextEditingController(text: 'collector@sgdps.com');
  final _passwordController = TextEditingController(text: 'Collector@123');
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _resetTokenController = TextEditingController();
  final _newPasswordController = TextEditingController();

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

  void _handleRegister() async {
    if (!_formKey.currentState!.validate()) return;

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final success = await authProvider.register(
      firstName: _firstNameController.text.trim(),
      lastName: _lastNameController.text.trim(),
      email: _emailController.text.trim(),
      password: _passwordController.text.trim(),
      role: 'Collector',
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
                      const SizedBox(height: 18),

                      // Segmented Mode Switcher
                      Container(
                        decoration: BoxDecoration(
                          color: AppColors.creamDark,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.creamBorder),
                        ),
                        padding: const EdgeInsets.all(3),
                        child: Row(
                          children: [
                            _buildSegmentTab('Sign In', AuthMode.login),
                            _buildSegmentTab('New Collector', AuthMode.register),
                            _buildSegmentTab('Reset Pass', AuthMode.forgot),
                          ],
                        ),
                      ),
                      const SizedBox(height: 18),

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

                      // MODE 2: REGISTER NEW COLLECTOR
                      if (_mode == AuthMode.register) ...[
                        Row(
                          children: [
                            Expanded(
                              child: _buildInputField(
                                controller: _firstNameController,
                                label: 'First Name',
                                icon: Icons.person_outline,
                                validator: (v) => v!.isEmpty ? 'Required' : null,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: _buildInputField(
                                controller: _lastNameController,
                                label: 'Last Name',
                                icon: Icons.person_outline,
                                validator: (v) => v!.isEmpty ? 'Required' : null,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        _buildInputField(
                          controller: _emailController,
                          label: 'Email Address',
                          icon: Icons.email_outlined,
                          validator: (v) => v!.isEmpty ? 'Email required' : null,
                        ),
                        const SizedBox(height: 12),
                        _buildInputField(
                          controller: _passwordController,
                          label: 'Create Password',
                          icon: Icons.lock_outline,
                          obscure: true,
                          validator: (v) => v!.isEmpty ? 'Password required' : null,
                        ),
                        const SizedBox(height: 16),
                        _buildPrimaryButton(
                          label: 'Register as Collector',
                          isLoading: auth.isLoading,
                          onPressed: _handleRegister,
                        ),
                      ],

                      // MODE 3: FORGOT PASSWORD
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
                        TextButton(
                          onPressed: () => setState(() => _mode = AuthMode.reset),
                          child: const Text(
                            'Already have a token? Reset here',
                            style: TextStyle(fontSize: 11, color: AppColors.saffron, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],

                      // MODE 4: RESET PASSWORD
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
                      ],

                      const SizedBox(height: 16),

                      const Text(
                        'Central Database · Real-Time GPS Tracking',
                        style: TextStyle(fontSize: 11, color: AppColors.inkLight),
                      ),
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

  Widget _buildSegmentTab(String title, AuthMode mode) {
    final isSelected = _mode == mode || (_mode == AuthMode.reset && mode == AuthMode.forgot);
    return Expanded(
      child: InkWell(
        onTap: () {
          setState(() {
            _mode = mode;
          });
        },
        borderRadius: BorderRadius.circular(10),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.creamCard : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.06),
                      blurRadius: 4,
                      offset: const Offset(0, 1),
                    ),
                  ]
                : null,
          ),
          child: Text(
            title,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 11,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              color: isSelected ? AppColors.saffron : AppColors.inkMuted,
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
