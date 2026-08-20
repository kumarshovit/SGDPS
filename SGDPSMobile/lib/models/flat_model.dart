class FlatModel {
  final int id;
  final String block;
  final int floor;
  final String flatNumber;
  final String ownerName;
  final String ownerPhone;
  final double expectedAmount;
  final double totalCollected;
  final double pendingAmount;
  final String paymentStatus;
  final bool isActive;

  FlatModel({
    required this.id,
    required this.block,
    required this.floor,
    required this.flatNumber,
    required this.ownerName,
    required this.ownerPhone,
    required this.expectedAmount,
    required this.totalCollected,
    required this.pendingAmount,
    required this.paymentStatus,
    this.isActive = true,
  });

  String get displayName => '$block · Fl $floor · Flat $flatNumber ($ownerName)';

  factory FlatModel.fromJson(Map<String, dynamic> json) {
    return FlatModel(
      id: json['id'] as int? ?? 0,
      block: json['block'] as String? ?? '',
      floor: json['floor'] as int? ?? 1,
      flatNumber: json['flatNumber'] as String? ?? '',
      ownerName: json['ownerName'] as String? ?? '',
      ownerPhone: json['ownerPhone'] as String? ?? '',
      expectedAmount: (json['expectedAmount'] as num?)?.toDouble() ?? 0.0,
      totalCollected: (json['totalCollected'] as num?)?.toDouble() ?? 0.0,
      pendingAmount: (json['pendingAmount'] as num?)?.toDouble() ?? 0.0,
      paymentStatus: json['paymentStatus'] as String? ?? 'Pending',
      isActive: json['isActive'] as bool? ?? true,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is FlatModel &&
          runtimeType == other.runtimeType &&
          (id != 0 && other.id != 0 ? id == other.id : (block == other.block && flatNumber == other.flatNumber));

  @override
  int get hashCode => id != 0 ? id.hashCode : Object.hash(block, flatNumber);
}
