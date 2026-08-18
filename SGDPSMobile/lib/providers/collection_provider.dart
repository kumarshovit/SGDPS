import 'dart:convert';
import 'package:flutter/material.dart';
import '../core/constants/api_constants.dart';
import '../core/network/api_client.dart';
import '../core/services/location_service.dart';
import '../models/collection_model.dart';
import '../models/flat_model.dart';

class CollectionProvider extends ChangeNotifier {
  List<CollectionModel> _collections = [];
  bool _isLoading = false;
  bool _isSubmitting = false;
  String? _errorMessage;

  List<CollectionModel> get collections => _collections;
  bool get isLoading => _isLoading;
  bool get isSubmitting => _isSubmitting;
  String? get errorMessage => _errorMessage;

  static bool _isSameCalendarDay(DateTime a, DateTime b) {
    final la = a.isUtc ? a.toLocal() : a;
    final lb = b.isUtc ? b.toLocal() : b;
    return la.year == lb.year && la.month == lb.month && la.day == lb.day;
  }

  double get todayTotal {
    final now = DateTime.now();
    return _collections
        .where((c) => _isSameCalendarDay(c.collectionDateTime, now))
        .fold(0.0, (sum, c) => sum + c.amount);
  }

  int get todayCount {
    final now = DateTime.now();
    return _collections
        .where((c) => _isSameCalendarDay(c.collectionDateTime, now))
        .length;
  }

  double get todayTotalAmount => todayTotal;

  int get todayCollectionsCount => todayCount;

  double get totalAmount {
    return _collections.fold(
      0.0,
      (sum, collection) => sum + collection.amount,
    );
  }

  Future<void> fetchCollections({String? collectorId}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await ApiClient.get(ApiConstants.collections);
      debugPrint('FETCH COLLECTIONS STATUS: ${response.statusCode}');
      if (response.statusCode == 200) {
        final List<dynamic> list = jsonDecode(response.body);
        _collections = list
            .map((e) => CollectionModel.fromJson(e as Map<String, dynamic>))
            .toList();
        debugPrint('FETCHED ${_collections.length} COLLECTIONS');
      } else {
        _errorMessage = 'Failed to load history (${response.statusCode})';
      }
    } catch (e, stack) {
      debugPrint('FETCH COLLECTIONS ERROR: $e\n$stack');
      _errorMessage = 'Network connection failed';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<CollectionModel?> submitCollection({
    required FlatModel flat,
    required double amount,
    required String mode,
    required String collectorName,
    String? referenceNo,
    String? remarks,
  }) async {
    _isSubmitting = true;
    _errorMessage = null;
    notifyListeners();

    try {
      // Auto-capture GPS location in the background
      final position = await LocationService.getCurrentLocation();

      final payload = {
        'type': 'ResidentBlock',
        'flatId': flat.id,
        'block': flat.block,
        'floor': flat.floor,
        'flatNumber': flat.flatNumber,
        'donorResidentName': flat.ownerName,
        'amount': amount,
        'mode': mode,
        'transactionReference': referenceNo,
        'latitude': position?.latitude,
        'longitude': position?.longitude,
        'collectedByName': collectorName,
        'remarks': remarks,
        'collectionDateTime': DateTime.now().toIso8601String(),
      };

      final response = await ApiClient.post(ApiConstants.collections, payload);

      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final newCollection = CollectionModel.fromJson(data);
        _collections.insert(0, newCollection);
        _isSubmitting = false;
        notifyListeners();
        return newCollection;
      } else {
        final data = jsonDecode(response.body);
        _errorMessage = data['detail'] ?? 'Failed to submit collection';
        _isSubmitting = false;
        notifyListeners();
        return null;
      }
    } catch (e) {
      _errorMessage = 'Network error: Collection not recorded';
      _isSubmitting = false;
      notifyListeners();
      return null;
    }
  }
}
