class ApiConstants {
  // Use 10.0.2.2 for Android Emulator, or localhost / IP for physical device
  //static const String baseUrl = 'http://10.0.2.2:5000/api';
  static const String baseUrl = 'http://164.52.216.107:9012/api';
  // static const String baseUrl ='https://abdominal-supreme-unsubtle.ngrok-free.dev/api';

  static const String login = '$baseUrl/auth/login';
  static const String register = '$baseUrl/auth/register';
  static const String forgotPassword = '$baseUrl/auth/forgot-password';
  static const String resetPassword = '$baseUrl/auth/reset-password';
  static const String getMe = '$baseUrl/auth/me';
  static const String flats = '$baseUrl/flats';
  static const String collections = '$baseUrl/collections';
  static const String dashboardKpis = '$baseUrl/dashboard/kpis';
}
