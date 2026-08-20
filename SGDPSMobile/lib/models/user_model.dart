class UserModel {
  final int id;
  final String firstName;
  final String lastName;
  final String email;
  final bool isActive;
  final List<String> roles;

  UserModel({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.email,
    this.isActive = true,
    required this.roles,
  });

  String get fullName => '$firstName $lastName'.trim();

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as int? ?? 0,
      firstName: json['firstName'] as String? ?? '',
      lastName: json['lastName'] as String? ?? '',
      email: json['email'] as String? ?? '',
      isActive: json['isActive'] as bool? ?? true,
      roles: (json['roles'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? ['Collector'],
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'firstName': firstName,
    'lastName': lastName,
    'email': email,
    'isActive': isActive,
    'roles': roles,
  };
}
