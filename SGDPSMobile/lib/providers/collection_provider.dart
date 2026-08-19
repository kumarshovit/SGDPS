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

  CollectionModel? get latestCollection =>
      _collections.isNotEmpty ? _collections.first : null;

  List<CollectionModel> get top10Collections =>
      _collections.take(10).toList();

  static bool matchesMode(String itemMode, String targetMode) {
    if (targetMode == 'All') return true;
    final a = itemMode.toLowerCase().replaceAll(' ', '').replaceAll('_', '');
    final b = targetMode.toLowerCase().replaceAll(' ', '').replaceAll('_', '');
    return a == b;
  }

  List<CollectionModel> getFilteredCollections({
    DateTime? startDate,
    DateTime? endDate,
    String? type,
    String? mode,
  }) {
    return _collections.where((c) {
      final dt = c.collectionDateTime.isUtc
          ? c.collectionDateTime.toLocal()
          : c.collectionDateTime;
      final d = DateTime(dt.year, dt.month, dt.day);

      if (startDate != null) {
        final s = DateTime(startDate.year, startDate.month, startDate.day);
        if (d.isBefore(s)) return false;
      }
      if (endDate != null) {
        final e = DateTime(endDate.year, endDate.month, endDate.day);
        if (d.isAfter(e)) return false;
      }
      if (type != null && type != 'All') {
        if (c.type != type) return false;
      }
      if (mode != null && mode != 'All') {
        if (!matchesMode(c.mode, mode)) return false;
      }
      return true;
    }).toList();
  }

  double getModeTotal(String mode,
      {DateTime? startDate, DateTime? endDate, String? type}) {
    final list = getFilteredCollections(
      startDate: startDate,
      endDate: endDate,
      type: type,
      mode: mode == 'All' ? null : mode,
    );
    return list.fold(0.0, (sum, c) => sum + c.amount);
  }

  int getModeCount(String mode,
      {DateTime? startDate, DateTime? endDate, String? type}) {
    final list = getFilteredCollections(
      startDate: startDate,
      endDate: endDate,
      type: type,
      mode: mode == 'All' ? null : mode,
    );
    return list.length;
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

  double getSponsorshipTotal({DateTime? startDate, DateTime? endDate}) {
    final list = getFilteredCollections(
      startDate: startDate,
      endDate: endDate,
      type: 'SponsorshipOther',
    );
    return list.fold(0.0, (sum, c) => sum + c.amount);
  }

  int getSponsorshipCount({DateTime? startDate, DateTime? endDate}) {
    final list = getFilteredCollections(
      startDate: startDate,
      endDate: endDate,
      type: 'SponsorshipOther',
    );
    return list.length;
  }

  double getResidentTotal({DateTime? startDate, DateTime? endDate}) {
    final list = getFilteredCollections(
      startDate: startDate,
      endDate: endDate,
      type: 'ResidentBlock',
    );
    return list.fold(0.0, (sum, c) => sum + c.amount);
  }

  int getResidentCount({DateTime? startDate, DateTime? endDate}) {
    final list = getFilteredCollections(
      startDate: startDate,
      endDate: endDate,
      type: 'ResidentBlock',
    );
    return list.length;
  }

  Future<CollectionModel?> submitCollection({
    String type = 'ResidentBlock',
    FlatModel? flat,
    String? block,
    int? floor,
    String? flatNumber,
    String? category,
    String? donorResidentName,
    String? ownerPhone,
    required double amount,
    required String mode,
    required String collectorName,
    String? collectorUserId,
    String? referenceNo,
    String? remarks,
  }) async {
    _isSubmitting = true;
    _errorMessage = null;
    notifyListeners();

    try {
      // Auto-capture GPS location in the background
      final position = await LocationService.getCurrentLocation();

      final payload = <String, dynamic>{
        'type': type,
        'amount': amount,
        'mode': mode,
        'transactionReference': referenceNo,
        'latitude': position?.latitude,
        'longitude': position?.longitude,
        'collectedByUserId': collectorUserId,
        'collectedByName': collectorName,
        'remarks': remarks,
        'collectionDateTime': DateTime.now().toUtc().toIso8601String(),
      };

      if (type == 'ResidentBlock') {
        payload['flatId'] = flat?.id;
        payload['block'] = block ?? flat?.block;
        payload['floor'] = floor ?? flat?.floor;
        payload['flatNumber'] = flatNumber ?? flat?.flatNumber;
        payload['donorResidentName'] = donorResidentName ?? flat?.ownerName;
        if (ownerPhone != null && ownerPhone.isNotEmpty) {
          payload['ownerPhone'] = ownerPhone;
        }
      } else {
        payload['category'] = category;
        payload['donorResidentName'] = donorResidentName;
        if (ownerPhone != null && ownerPhone.isNotEmpty) {
          payload['ownerPhone'] = ownerPhone;
        }
      }

      debugPrint('COLLECTION SUBMIT PAYLOAD: ${jsonEncode(payload)}');
      final response = await ApiClient.post(ApiConstants.collections, payload);
      debugPrint('COLLECTION SUBMIT RESPONSE [${response.statusCode}]: ${response.body}');

      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final newCollection = CollectionModel.fromJson(data);
        _collections.insert(0, newCollection);
        _isSubmitting = false;
        notifyListeners();
        return newCollection;
      } else {
        try {
          final data = jsonDecode(response.body);
          _errorMessage = data['detail'] ?? data['title'] ?? 'Server error (${response.statusCode})';
        } catch (_) {
          _errorMessage = 'Server returned status ${response.statusCode}';
        }
        _isSubmitting = false;
        notifyListeners();
        return null;
      }
    } catch (e, stack) {
      debugPrint('SUBMIT COLLECTION EXCEPTION: $e\n$stack');
      _errorMessage = 'Network connection failed: $e';
      _isSubmitting = false;
      notifyListeners();
      return null;
    }
  }
}
