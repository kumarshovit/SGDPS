import 'package:flutter/material.dart';
import 'app.dart';
import 'core/services/location_service.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  LocationService.requestPermissionIfNeeded();
  runApp(const SgdpsMobileApp());
}

