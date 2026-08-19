import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/colors.dart';
import '../../models/flat_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/collection_provider.dart';
import '../../providers/flat_provider.dart';
import 'receipt_view.dart';

class AddCollectionView extends StatefulWidget {
  const AddCollectionView({Key? key}) : super(key: key);

  @override
  State<AddCollectionView> createState() => _AddCollectionViewState();
}

class _AddCollectionViewState extends State<AddCollectionView> {
  final _formKey = GlobalKey<FormState>();
  FlatModel? _selectedFlat;
  final _amountController = TextEditingController();
  final _referenceController = TextEditingController();
  final _remarksController = TextEditingController();
  String _paymentMode = 'Cash';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final flatProvider = Provider.of<FlatProvider>(context, listen: false);
      if (flatProvider.flats.isEmpty) {
        await flatProvider.fetchFlats();
      }
      if (flatProvider.flats.isNotEmpty && mounted) {
        setState(() {
          _selectedFlat = flatProvider.flats.first;
          _amountController.text = _selectedFlat!.expectedAmount > 0
              ? _selectedFlat!.expectedAmount.toStringAsFixed(0)
              : '2500';
        });
      }
    });
  }

  @override
  void dispose() {
    _amountController.dispose();
    _referenceController.dispose();
    _remarksController.dispose();
    super.dispose();
  }

  void _onFlatSelected(FlatModel flat) {
    setState(() {
      _selectedFlat = flat;
      _amountController.text = flat.expectedAmount > 0
          ? flat.expectedAmount.toStringAsFixed(0)
          : '2500';
    });
  }

  void _handleSubmit() async {
    if (!_formKey.currentState!.validate() || _selectedFlat == null) return;

    final auth = Provider.of<AuthProvider>(context, listen: false);
    final collectionProvider = Provider.of<CollectionProvider>(context, listen: false);

    final amount = double.tryParse(_amountController.text) ?? 0.0;
    if (amount <= 0) return;

    final receipt = await collectionProvider.submitCollection(
      flat: _selectedFlat!,
      amount: amount,
      mode: _paymentMode,
      collectorName: auth.user?.fullName ?? 'Collector',
      collectorUserId: auth.user?.id?.toString(),
      referenceNo: _referenceController.text.trim().isNotEmpty ? _referenceController.text.trim() : null,
      remarks: _remarksController.text.trim().isNotEmpty ? _remarksController.text.trim() : null,
    );

    if (receipt != null && mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => ReceiptView(collection: receipt)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final flatProvider = Provider.of<FlatProvider>(context);
    final collectionProvider = Provider.of<CollectionProvider>(context);

    return Scaffold(
      backgroundColor: AppColors.cream,
      appBar: AppBar(
        backgroundColor: AppColors.maroonDark,
        foregroundColor: Colors.white,
        title: const Text('Record Collection', style: TextStyle(fontFamily: 'serif', fontWeight: FontWeight.bold)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Resident Info Card
              if (_selectedFlat != null)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: AppColors.creamCard,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.gold.withOpacity(0.3)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.04),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            '${_selectedFlat!.block} · Flat ${_selectedFlat!.flatNumber}',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: AppColors.maroonDark,
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: _selectedFlat!.paymentStatus == 'Paid'
                                  ? AppColors.forestLight
                                  : AppColors.goldSoft,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              _selectedFlat!.paymentStatus,
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: _selectedFlat!.paymentStatus == 'Paid'
                                    ? AppColors.forest
                                    : AppColors.goldDark,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Owner: ${_selectedFlat!.ownerName}',
                        style: const TextStyle(fontSize: 13, color: AppColors.inkMuted),
                      ),
                      if (_selectedFlat!.ownerPhone.isNotEmpty)
                        Text(
                          'Phone: ${_selectedFlat!.ownerPhone}',
                          style: const TextStyle(fontSize: 12, color: AppColors.inkLight),
                        ),
                    ],
                  ),
                ),

              // Flat Selector Dropdown
              const Text(
                'SELECT RESIDENTIAL UNIT',
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.1, color: AppColors.inkMuted),
              ),
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14),
                decoration: BoxDecoration(
                  color: AppColors.creamCard,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.creamBorder),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<FlatModel>(
                    value: _selectedFlat,
                    isExpanded: true,
                    icon: const Icon(Icons.arrow_drop_down, color: AppColors.goldDark),
                    hint: const Text('Choose Flat'),
                    items: flatProvider.flats.map((flat) {
                      return DropdownMenuItem<FlatModel>(
                        value: flat,
                        child: Text(
                          '${flat.block} - ${flat.flatNumber} (${flat.ownerName})',
                          style: const TextStyle(fontSize: 13, color: AppColors.ink),
                        ),
                      );
                    }).toList(),
                    onChanged: (flat) {
                      if (flat != null) _onFlatSelected(flat);
                    },
                  ),
                ),
              ),

              const SizedBox(height: 20),

              // Quick Amount Presets
              const Text(
                'AMOUNT (₹) *',
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.1, color: AppColors.inkMuted),
              ),
              const SizedBox(height: 6),
              Wrap(
                spacing: 8,
                children: [1000, 2100, 2500, 5000, 11000].map((amt) {
                  final isSelected = _amountController.text == amt.toString();
                  return ChoiceChip(
                    label: Text('₹$amt'),
                    selected: isSelected,
                    selectedColor: AppColors.saffron,
                    labelStyle: TextStyle(
                      color: isSelected ? Colors.white : AppColors.ink,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                    backgroundColor: AppColors.creamCard,
                    side: BorderSide(
                      color: isSelected ? AppColors.saffron : AppColors.creamBorder,
                    ),
                    onSelected: (selected) {
                      if (selected) {
                        setState(() {
                          _amountController.text = amt.toString();
                        });
                      }
                    },
                  );
                }).toList(),
              ),

              const SizedBox(height: 10),

              // Amount Input Field
              TextFormField(
                controller: _amountController,
                keyboardType: TextInputType.number,
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.saffron),
                decoration: InputDecoration(
                  prefixText: '₹ ',
                  prefixStyle: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.saffron),
                  filled: true,
                  fillColor: AppColors.creamCard,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: AppColors.creamBorder),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: AppColors.gold, width: 2),
                  ),
                ),
                validator: (v) {
                  if (v == null || v.isEmpty) return 'Enter amount';
                  final val = double.tryParse(v);
                  if (val == null || val <= 0) return 'Invalid amount';
                  return null;
                },
              ),

              const SizedBox(height: 20),

              // Payment Mode Selector
              const Text(
                'PAYMENT MODE *',
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.1, color: AppColors.inkMuted),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  ('Cash', '💵', 'Cash'),
                  ('UPI', '📱', 'UPI'),
                  ('BankTransfer', '🏦', 'Bank'),
                  ('Cheque', '📑', 'Cheque'),
                ].map((item) {
                  final modeKey = item.$1;
                  final modeEmoji = item.$2;
                  final modeLabel = item.$3;
                  final isSelected = _paymentMode == modeKey;

                  return Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 3.0),
                      child: InkWell(
                        onTap: () => setState(() => _paymentMode = modeKey),
                        borderRadius: BorderRadius.circular(12),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          decoration: BoxDecoration(
                            color: isSelected ? AppColors.gold.withOpacity(0.15) : AppColors.creamCard,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: isSelected ? AppColors.gold : AppColors.creamBorder,
                              width: isSelected ? 2 : 1,
                            ),
                          ),
                          child: Column(
                            children: [
                              Text(
                                modeEmoji,
                                style: const TextStyle(fontSize: 18),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                modeLabel,
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: isSelected ? AppColors.maroonDark : AppColors.inkMuted,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),

              const SizedBox(height: 16),

              // Reference No
              TextFormField(
                controller: _referenceController,
                cursorColor: AppColors.saffron,
                showCursor: true,
                enabled: true,
                readOnly: false,
                enableInteractiveSelection: true,
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF1C1310)),
                keyboardType: TextInputType.text,
                textInputAction: TextInputAction.next,
                decoration: InputDecoration(
                  labelText: _paymentMode == 'Cheque'
                      ? 'Cheque No. / Bank Name (Optional)'
                      : (_paymentMode == 'Cash'
                          ? 'Receipt / Reference (Optional)'
                          : 'Transaction / UTR Reference (Optional)'),
                  labelStyle: const TextStyle(fontSize: 12, color: AppColors.inkMuted),
                  filled: true,
                  fillColor: AppColors.creamCard,
                  isDense: true,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: AppColors.creamBorder),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: AppColors.gold, width: 2),
                  ),
                ),
              ),

              const SizedBox(height: 12),

              // Remarks
              TextFormField(
                controller: _remarksController,
                cursorColor: AppColors.saffron,
                showCursor: true,
                enabled: true,
                readOnly: false,
                enableInteractiveSelection: true,
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF1C1310)),
                keyboardType: TextInputType.text,
                textInputAction: TextInputAction.done,
                maxLines: 2,
                decoration: InputDecoration(
                  labelText: 'Remarks / Notes (Optional)',
                  labelStyle: const TextStyle(fontSize: 12, color: AppColors.inkMuted),
                  filled: true,
                  fillColor: AppColors.creamCard,
                  isDense: true,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: AppColors.creamBorder),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: AppColors.gold, width: 2),
                  ),
                ),
              ),

              const SizedBox(height: 24),

              // Submit Button
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: collectionProvider.isLoading ? null : _handleSubmit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.saffron,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    elevation: 3,
                  ),
                  child: collectionProvider.isLoading
                      ? const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
                      : const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.check_circle_outline, size: 20),
                            SizedBox(width: 8),
                            Text(
                              'Save & Generate Receipt',
                              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
