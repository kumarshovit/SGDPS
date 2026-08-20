import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';

class LocationService {
  static Position? _cachedPosition;
  static DateTime? _lastFetchTime;

  /// Proactively warms up the GPS provider and caches last known location
  static Future<void> requestPermissionIfNeeded() async {
    try {
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }

      if (permission == LocationPermission.whileInUse ||
          permission == LocationPermission.always) {
        // Pre-fetch last known position into memory cache
        final lastKnown = await Geolocator.getLastKnownPosition();
        if (lastKnown != null) {
          _cachedPosition = lastKnown;
          _lastFetchTime = DateTime.now();
          debugPrint('LocationService pre-cached lastKnown: ${_cachedPosition?.latitude}, ${_cachedPosition?.longitude}');
        }

        // Trigger background GPS acquisition so fresh position is ready
        Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.medium,
          timeLimit: const Duration(seconds: 10),
        ).then((fresh) {
          _cachedPosition = fresh;
          _lastFetchTime = DateTime.now();
          debugPrint('LocationService background fresh GPS lock: ${_cachedPosition?.latitude}, ${_cachedPosition?.longitude}');
        }).catchError((e) {
          debugPrint('LocationService background GPS lock skipped: $e');
        });
      }
    } catch (e) {
      debugPrint('LocationService requestPermissionIfNeeded error: $e');
    }
  }

  /// Automatically captures GPS coordinates in the background
  static Future<Position?> getCurrentLocation() async {
    try {
      // 1. Check & request permission if needed
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }

      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        debugPrint('LocationService: Permission denied by user ($permission)');
        return _cachedPosition;
      }

      // 2. Try last known position first as instant baseline
      try {
        final lastKnown = await Geolocator.getLastKnownPosition();
        if (lastKnown != null) {
          _cachedPosition = lastKnown;
          _lastFetchTime = DateTime.now();
        }
      } catch (_) {}

      // 3. Acquire fresh position
      try {
        final fresh = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.medium,
          timeLimit: const Duration(seconds: 6),
        );
        _cachedPosition = fresh;
        _lastFetchTime = DateTime.now();
        debugPrint('LocationService fresh position obtained: ${fresh.latitude}, ${fresh.longitude}');
        return fresh;
      } catch (e) {
        debugPrint('LocationService getCurrentPosition timeout/fail, falling back to cache: $e');
      }

      // 4. Return cached position if available
      if (_cachedPosition != null) {
        debugPrint('LocationService returning cached position: ${_cachedPosition?.latitude}, ${_cachedPosition?.longitude}');
        return _cachedPosition;
      }

      // 5. Final fallback attempt with lowest accuracy
      try {
        final fallback = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.lowest,
          timeLimit: const Duration(seconds: 4),
        );
        _cachedPosition = fallback;
        return fallback;
      } catch (_) {
        return null;
      }
    } catch (e) {
      debugPrint('LocationService getCurrentLocation top-level error: $e');
      return _cachedPosition;
    }
  }
}


