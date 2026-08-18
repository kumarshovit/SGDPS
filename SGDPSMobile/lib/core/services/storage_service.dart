import 'package:shared_preferences/shared_preferences.dart';

class StorageService {
  static const String _tokenKey = 'sgdps_mobile_token';
  static const String _userKey = 'sgdps_mobile_user';

  static Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
  }

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  static Future<void> clearAll() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }
}
