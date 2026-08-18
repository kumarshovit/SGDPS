import 'dart:convert';
import 'package:flutter/material.dart';
import '../core/constants/api_constants.dart';
import '../core/network/api_client.dart';
import '../models/flat_model.dart';

class FlatProvider extends ChangeNotifier {
  List<FlatModel> _flats = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<FlatModel> get flats => _flats;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> fetchFlats() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await ApiClient.get(ApiConstants.flats);
      debugPrint('FETCH FLATS STATUS: ${response.statusCode}');
      if (response.statusCode == 200) {
        final List<dynamic> list = jsonDecode(response.body);
        _flats = list.map((e) => FlatModel.fromJson(e as Map<String, dynamic>)).toList();
        debugPrint('FETCHED ${_flats.length} FLATS');
      } else {
        _errorMessage = 'Failed to load flats (${response.statusCode})';
      }
    } catch (e, stack) {
      debugPrint('FETCH FLATS ERROR: $e\n$stack');
      _errorMessage = 'Network connection failed';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
