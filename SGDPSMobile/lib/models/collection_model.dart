class CollectionModel {
  final int id;
  final String type;
  final int? flatId;
  final String? block;
  final int? floor;
  final String? flatNumber;
  final String? category;
  final String? donorResidentName;
  final double amount;
  final String mode;
  final String receiptNumber;
  final String? transactionReference;
  final DateTime collectionDateTime;
  final double? latitude;
  final double? longitude;
  final String collectedByUserId;
  final String? collectedByName;
  final String? remarks;

  CollectionModel({
    required this.id,
    required this.type,
    this.flatId,
    this.block,
    this.floor,
    this.flatNumber,
    this.category,
    this.donorResidentName,
    required this.amount,
    required this.mode,
    required this.receiptNumber,
    this.transactionReference,
    required this.collectionDateTime,
    this.latitude,
    this.longitude,
    required this.collectedByUserId,
    this.collectedByName,
    this.remarks,
  });

  factory CollectionModel.fromJson(Map<String, dynamic> json) {
    return CollectionModel(
      id: json['id'] as int? ?? 0,
      type: json['type'] as String? ?? 'ResidentBlock',
      flatId: json['flatId'] as int?,
      block: json['block'] as String?,
      floor: json['floor'] as int?,
      flatNumber: json['flatNumber'] as String?,
      category: json['category'] as String?,
      donorResidentName: json['donorResidentName'] as String?,
      amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
      mode: json['mode'] as String? ?? 'Cash',
      receiptNumber: json['receiptNumber'] as String? ?? '',
      transactionReference: json['transactionReference'] as String?,
      collectionDateTime: DateTime.tryParse(json['collectionDateTime'] as String? ?? '') ?? DateTime.now(),
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      collectedByUserId: json['collectedByUserId'] as String? ?? '',
      collectedByName: json['collectedByName'] as String?,
      remarks: json['remarks'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
    'type': type,
    'flatId': flatId,
    'block': block,
    'floor': floor,
    'flatNumber': flatNumber,
    'category': category,
    'donorResidentName': donorResidentName,
    'amount': amount,
    'mode': mode,
    'transactionReference': transactionReference,
    'latitude': latitude,
    'longitude': longitude,
    'collectedByUserId': collectedByUserId,
    'collectedByName': collectedByName,
    'remarks': remarks,
  };
}
