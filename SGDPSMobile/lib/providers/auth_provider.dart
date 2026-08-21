import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import '../app.dart';
import '../core/constants/api_constants.dart';
import '../core/network/api_client.dart';
import '../core/services/storage_service.dart';
import '../models/user_model.dart';
import '../views/auth/login_view.dart';

class AuthProvider extends ChangeNotifier {
  UserModel? _user;
  bool _isLoading = false;
  String? _errorMessage;
  String? _successMessage;
  String? _generatedResetToken;
  Timer? _heartbeatTimer;

  AuthProvider() {
    ApiClient.onUnauthorized = () {
      if (_user != null) {
        logout(reason: 'Password or account permissions updated by admin. Please sign in again.');
      }
    };
  }

  UserModel? get user => _user;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _user != null;
  String? get errorMessage => _errorMessage;
  String? get successMessage => _successMessage;
  String? get generatedResetToken => _generatedResetToken;

  void _startHeartbeat() {
    _heartbeatTimer?.cancel();
    _heartbeatTimer = Timer.periodic(const Duration(seconds: 4), (_) async {
      if (_user != null) {
        await verifyAccountStatus();
      }
    });
  }

  void _stopHeartbeat() {
    _heartbeatTimer?.cancel();
    _heartbeatTimer = null;
  }

  Future<bool> tryAutoLogin() async {
    try {
      final token = await StorageService.getToken();
      final userJson = await StorageService.getUser();
      if (token != null && token.isNotEmpty && userJson != null) {
        // Verify active token & account status with server
        try {
          final response = await ApiClient.get(ApiConstants.getMe);
          if (response.statusCode == 200) {
            final data = jsonDecode(response.body);
            final user = UserModel.fromJson(data);
            if (user.isActive) {
              _user = user;
              await StorageService.saveUser(jsonEncode(data));
              _startHeartbeat();
              notifyListeners();
              return true;
            }
          }
          // Server returned 401/403/404 or user is inactive: clear session
          await logout();
          return false;
        } catch (netErr) {
          // If server is temporarily unreachable, fallback to cached user only if active
          final cachedUser = UserModel.fromJson(jsonDecode(userJson));
          if (cachedUser.isActive) {
            _user = cachedUser;
            _startHeartbeat();
            notifyListeners();
            return true;
          }
        }
      }
    } catch (e) {
      debugPrint('AUTO LOGIN ERROR: $e');
    }
    return false;
  }

  Future<bool> verifyAccountStatus() async {
    try {
      final token = await StorageService.getToken();
      if (token == null || token.isEmpty) return false;

      final response = await ApiClient.get(ApiConstants.getMe);
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final user = UserModel.fromJson(data);
        if (!user.isActive) {
          debugPrint('ACCOUNT INACTIVE: auto-logging out deactivated collector');
          await logout(reason: 'Your account has been deactivated. Please contact your administrator.');
          return false;
        }
        _user = user;
        notifyListeners();
        return true;
      } else if (response.statusCode == 401 || response.statusCode == 403 || response.statusCode == 404) {
        debugPrint('ACCOUNT UNAUTHORIZED / PASSWORD CHANGED [${response.statusCode}]: auto-logging out');
        await logout(reason: 'Password or account permissions updated by admin. Please sign in again.');
        return false;
      }
    } catch (e) {
      debugPrint('VERIFY ACCOUNT STATUS ERROR: $e');
    }
    return _user?.isActive ?? false;
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    _successMessage = null;
    notifyListeners();
    debugPrint('LOGIN URL: ${ApiConstants.login}');

    try {
      final response = await ApiClient.post(ApiConstants.login, {
        'email': email.trim(),
        'password': password.trim(),
      });
      debugPrint('LOGIN STATUS: ${response.statusCode}');
      debugPrint('LOGIN RESPONSE: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['user'] != null) {
          final user = UserModel.fromJson(data['user']);
          if (!user.isActive) {
            _errorMessage = 'This account has been deactivated or deleted. Please contact your administrator.';
            _isLoading = false;
            notifyListeners();
            return false;
          }
          _user = user;
          await StorageService.saveUser(jsonEncode(data['user']));
        }
        final token = data['accessToken'] as String?;
        if (token != null) {
          await StorageService.saveToken(token);
        }
        _startHeartbeat();
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        final data = jsonDecode(response.body);
        _errorMessage =
            data['detail'] ?? data['title'] ?? 'Invalid login credentials';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e, stackTrace) {
      debugPrint('LOGIN ERROR: $e\n$stackTrace');
      _errorMessage = 'Network error: Cannot reach server';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> register({
    required String firstName,
    required String lastName,
    required String email,
    required String password,
    String role = 'Collector',
  }) async {
    _isLoading = true;
    _errorMessage = null;
    _successMessage = null;
    notifyListeners();

    try {
      final response = await ApiClient.post(ApiConstants.register, {
        'firstName': firstName.trim(),
        'lastName': lastName.trim(),
        'email': email.trim(),
        'password': password.trim(),
        'role': role,
      });

      if (response.statusCode == 200 || response.statusCode == 201) {
        return await login(email, password);
      } else {
        final data = jsonDecode(response.body);
        _errorMessage =
            data['detail'] ?? data['title'] ?? 'Registration failed';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _errorMessage = 'Network error during registration';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> forgotPassword(String email) async {
    _isLoading = true;
    _errorMessage = null;
    _successMessage = null;
    _generatedResetToken = null;
    notifyListeners();

    try {
      final response = await ApiClient.post(ApiConstants.forgotPassword, {
        'email': email.trim(),
      });

      debugPrint('FORGOT PASSWORD STATUS: ${response.statusCode}');
      debugPrint('FORGOT PASSWORD BODY: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        _generatedResetToken = data['resetToken'] as String?;
        _successMessage = data['message'] ??
            'Password reset token generated. You can now reset password.';
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        try {
          final data = jsonDecode(response.body);
          _errorMessage = data['detail'] ?? data['title'] ?? 'Failed to process request';
        } catch (_) {
          _errorMessage = 'Server error (${response.statusCode})';
        }
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e, stack) {
      debugPrint('FORGOT PASSWORD ERROR: $e\n$stack');
      _errorMessage = 'Network error: Cannot reach server';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> resetPassword({
    required String email,
    required String resetToken,
    required String newPassword,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    _successMessage = null;
    notifyListeners();

    try {
      final response = await ApiClient.post(ApiConstants.resetPassword, {
        'email': email.trim(),
        'resetToken': resetToken.trim(),
        'newPassword': newPassword.trim(),
      });

      final data = jsonDecode(response.body);
      if (response.statusCode == 200) {
        _successMessage =
            data['message'] ?? 'Password reset successfully! Please sign in.';
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _errorMessage =
            data['detail'] ?? data['title'] ?? 'Failed to reset password';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _errorMessage = 'Network error during password reset';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout({String? reason}) async {
    _stopHeartbeat();
    _user = null;
    if (reason != null && reason.isNotEmpty) {
      _errorMessage = reason;
    }
    await StorageService.clearAll();
    notifyListeners();
    navigatorKey.currentState?.pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginView()),
      (route) => false,
    );
  }

  @override
  void dispose() {
    _stopHeartbeat();
    super.dispose();
  }
}
