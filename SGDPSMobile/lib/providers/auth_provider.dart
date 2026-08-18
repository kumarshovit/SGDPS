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

  UserModel? get user => _user;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _user != null;
  String? get errorMessage => _errorMessage;
  String? get successMessage => _successMessage;

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    _successMessage = null;
    notifyListeners();

    try {
      final response = await ApiClient.post(ApiConstants.login, {
        'email': email.trim(),
        'password': password.trim(),
      });

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final token = data['accessToken'] as String?;
        if (token != null) {
          await StorageService.saveToken(token);
        }
        if (data['user'] != null) {
          _user = UserModel.fromJson(data['user']);
        }
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        final data = jsonDecode(response.body);
        _errorMessage = data['detail'] ?? data['title'] ?? 'Invalid login credentials';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
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
        // Automatically login after successful registration
        return await login(email, password);
      } else {
        final data = jsonDecode(response.body);
        _errorMessage = data['detail'] ?? data['title'] ?? 'Registration failed';
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
    notifyListeners();

    try {
      final response = await ApiClient.post(ApiConstants.forgotPassword, {
        'email': email.trim(),
      });

      final data = jsonDecode(response.body);
      if (response.statusCode == 200) {
        _successMessage = data['message'] ?? 'Password reset token generated. You can now reset password.';
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _errorMessage = data['detail'] ?? data['title'] ?? 'Failed to process request';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
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
        _successMessage = data['message'] ?? 'Password reset successfully! Please sign in.';
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _errorMessage = data['detail'] ?? data['title'] ?? 'Failed to reset password';
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
