import 'dart:convert';
import 'package:flutter/material.dart';
import '../core/constants/api_constants.dart';
import '../core/network/api_client.dart';
import '../core/services/storage_service.dart';
import '../models/user_model.dart';

class AuthProvider extends ChangeNotifier {
  UserModel? _user;
  bool _isLoading = false;
  String? _errorMessage;
  String? _successMessage;
  String? _generatedResetToken;

  UserModel? get user => _user;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _user != null;
  String? get errorMessage => _errorMessage;
  String? get successMessage => _successMessage;
  String? get generatedResetToken => _generatedResetToken;

  Future<bool> tryAutoLogin() async {
    try {
      final token = await StorageService.getToken();
      final userJson = await StorageService.getUser();
      if (token != null && token.isNotEmpty && userJson != null) {
        _user = UserModel.fromJson(jsonDecode(userJson));
        notifyListeners();
        return true;
      }
    } catch (e) {
      debugPrint('AUTO LOGIN ERROR: $e');
    }
    return false;
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
        final token = data['accessToken'] as String?;
        if (token != null) {
          await StorageService.saveToken(token);
        }
        if (data['user'] != null) {
          _user = UserModel.fromJson(data['user']);
          await StorageService.saveUser(jsonEncode(data['user']));
        }
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

  Future<void> logout() async {
    _user = null;
    await StorageService.clearAll();
    notifyListeners();
  }
}
