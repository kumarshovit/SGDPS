import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../services/storage_service.dart';

class ApiClient {
  static Future<Map<String, String>> _getHeaders({bool includeContentType = false}) async {
    final token = await StorageService.getToken();
    final headers = <String, String>{
      'Accept': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      'User-Agent': 'SGDPSMobile/1.0',
    };
    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  static Future<http.Response> get(String url) async {
    final headers = await _getHeaders(includeContentType: false);
    debugPrint('API GET: $url');
    final response = await http.get(Uri.parse(url), headers: headers);
    debugPrint('API GET response [${response.statusCode}] from $url');
    return response;
  }

  static Future<http.Response> post(String url, Map<String, dynamic> body) async {
    final headers = await _getHeaders(includeContentType: true);
    debugPrint('API POST: $url');
    final response = await http.post(
      Uri.parse(url),
      headers: headers,
      body: jsonEncode(body),
    );
    debugPrint('API POST response [${response.statusCode}] from $url');
    return response;
  }
}
