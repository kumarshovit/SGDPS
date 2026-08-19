import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/colors.dart';
import '../../models/flat_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/collection_provider.dart';
import '../../providers/flat_provider.dart';
import 'receipt_view.dart';

class AddCollectionView extends StatefulWidget {
  final FlatModel? initialFlat;

  const AddCollectionView({Key? key, this.initialFlat}) : super(key: key);

  @override
  State<AddCollectionView> createState() => _AddCollectionViewState();
}

class _AddCollectionViewState extends State<AddCollectionView> {
  final _formKey = GlobalKey<FormState>();

  // Collection Type: 'ResidentBlock' or 'SponsorshipOther'
  String _collectionType = 'ResidentBlock';

  // Resident Cascading Selection
  String? _selectedBlock;
  int? _selectedFloor;
  FlatModel? _selectedFlat;

  // Sponsorship Selection
  String _selectedCategory = 'Sponsorship - Pratima';

  // Text Controllers
  final _amountController = TextEditingController(text: '2500');
  final _residentNameController = TextEditingController();
  final _donorNameController = TextEditingController();
  final _otherCategoryController = TextEditingController();
  final _phoneController = TextEditingController();
  final _collectedByController = TextEditingController();
  final _referenceController = TextEditingController();
  final _remarksController = TextEditingController();

  String _paymentMode = 'Cash';

  final List<String> _sponsorshipCategories = [
    'Sponsorship - Pratima',
    'Sponsorship - Decoration',
    'Sponsorship - Bhog',
    'Sponsorship - Bisarjan',
    'Sponsorship - Banners',
    'Sponsorship - Rice',
    'Stall Collection',
    'Cultural',
    'Mata Ki Chowki',
    'Anandomela',
    'Interest Earned',
    'Other',
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      if (_collectedByController.text.isEmpty) {
        _collectedByController.text = auth.user?.fullName ?? 'Collector';
      }

      final flatProvider = Provider.of<FlatProvider>(context, listen: false);
      if (flatProvider.flats.isEmpty) {
        await flatProvider.fetchFlats();
      }

      if (mounted) {
        if (widget.initialFlat != null) {
          _applySelectedFlat(widget.initialFlat!);
        } else if (flatProvider.flats.isNotEmpty) {
          _applySelectedFlat(flatProvider.flats.first);
        }
      }
    });
  }

  @override
  void dispose() {
    _amountController.dispose();
    _residentNameController.dispose();
    _donorNameController.dispose();
    _otherCategoryController.dispose();
    _phoneController.dispose();
    _collectedByController.dispose();
    _referenceController.dispose();
    _remarksController.dispose();
    super.dispose();
  }

  void _applySelectedFlat(FlatModel flat) {
    setState(() {
      _selectedBlock = flat.block;
      _selectedFloor = flat.floor;
      _selectedFlat = flat;
      _residentNameController.text = flat.ownerName;
      _phoneController.text = flat.ownerPhone;
      _amountController.text = flat.expectedAmount > 0
          ? flat.expectedAmount.toStringAsFixed(0)
          : '2500';
    });
  }

  void _onBlockChanged(String? newBlock, List<FlatModel> flats) {
    if (newBlock == null) return;
    setState(() {
      _selectedBlock = newBlock;
      final floors = flats.where((f) => f.block == newBlock).map((f) => f.floor).toSet().toList()..sort();
      _selectedFloor = floors.isNotEmpty ? floors.first : null;
      
      final matchingFlats = flats.where((f) => f.block == newBlock && f.floor == _selectedFloor).toList();
      if (matchingFlats.isNotEmpty) {
        _applySelectedFlat(matchingFlats.first);
      } else {
        _selectedFlat = null;
      }
    });
  }

  void _onFloorChanged(int? newFloor, List<FlatModel> flats) {
    if (newFloor == null || _selectedBlock == null) return;
    setState(() {
      _selectedFloor = newFloor;
      final matchingFlats = flats.where((f) => f.block == _selectedBlock && f.floor == newFloor).toList();
      if (matchingFlats.isNotEmpty) {
        _applySelectedFlat(matchingFlats.first);
      } else {
        _selectedFlat = null;
      }
    });
  }

  void _onFlatChanged(FlatModel? flat) {
    if (flat != null) {
      _applySelectedFlat(flat);
    }
  }

  void _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    if (_collectionType == 'ResidentBlock' && _selectedFlat == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a resident unit')),
      );
      return;
    }

    final auth = Provider.of<AuthProvider>(context, listen: false);
    final collectionProvider = Provider.of<CollectionProvider>(context, listen: false);

    final amount = double.tryParse(_amountController.text) ?? 0.0;
    if (amount <= 0) return;

    final collectorName = _collectedByController.text.trim().isNotEmpty
        ? _collectedByController.text.trim()
        : (auth.user?.fullName ?? 'Collector');

    final String? finalCategory = _collectionType == 'SponsorshipOther'
        ? (_selectedCategory == 'Other'
            ? (_otherCategoryController.text.trim().isNotEmpty
                ? _otherCategoryController.text.trim()
                : 'Other Sponsorship')
            : _selectedCategory)
        : null;

    final receipt = await collectionProvider.submitCollection(
      type: _collectionType,
      flat: _collectionType == 'ResidentBlock' ? _selectedFlat : null,
      block: _collectionType == 'ResidentBlock' ? _selectedBlock : null,
      floor: _collectionType == 'ResidentBlock' ? _selectedFloor : null,
      flatNumber: _collectionType == 'ResidentBlock' ? _selectedFlat?.flatNumber : null,
      category: finalCategory,
      donorResidentName: _collectionType == 'ResidentBlock'
          ? (_residentNameController.text.trim().isNotEmpty ? _residentNameController.text.trim() : _selectedFlat?.ownerName)
          : _donorNameController.text.trim(),
      ownerPhone: _phoneController.text.trim().isNotEmpty ? _phoneController.text.trim() : null,
      amount: amount,
      mode: _paymentMode,
      collectorName: collectorName,
      collectorUserId: auth.user?.id.toString(),
      referenceNo: _referenceController.text.trim().isNotEmpty ? _referenceController.text.trim() : null,
      remarks: _remarksController.text.trim().isNotEmpty ? _remarksController.text.trim() : null,
    );

    if (receipt != null && mounted) {
      // Refresh flat list in the background so payment statuses update immediately
      Provider.of<FlatProvider>(context, listen: false).fetchFlats();

      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => ReceiptView(collection: receipt)),
      );
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(collectionProvider.errorMessage ?? 'Failed to record collection. Please check connection.'),
          backgroundColor: Colors.red.shade700,
          duration: const Duration(seconds: 4),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final flatProvider = Provider.of<FlatProvider>(context);
    final collectionProvider = Provider.of<CollectionProvider>(context);
    final flats = flatProvider.flats;

    // Derived lists for cascading dropdowns
    final availableBlocks = flats.map((f) => f.block).toSet().toList()..sort();
    final availableFloors = _selectedBlock != null
        ? (flats.where((f) => f.block == _selectedBlock).map((f) => f.floor).toSet().toList()..sort())
        : <int>[];
    final availableFlats = (_selectedBlock != null && _selectedFloor != null)
        ? flats.where((f) => f.block == _selectedBlock && f.floor == _selectedFloor).toList()
        : <FlatModel>[];

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
              // 1. Collection Type Segmented Switcher
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: AppColors.creamDark,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.creamBorder),
                ),
                child: Row(
                  children: [
                    _buildTypeTab(
                      typeKey: 'ResidentBlock',
                      label: 'Resident Unit',
                      icon: Icons.home_work_outlined,
                    ),
                    const SizedBox(width: 4),
                    _buildTypeTab(
                      typeKey: 'SponsorshipOther',
                      label: 'Sponsorship / Donation',
                      icon: Icons.volunteer_activism_outlined,
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // ==========================================
              // SECTION A: RESIDENT UNIT SELECTION
              // ==========================================
              if (_collectionType == 'ResidentBlock') ...[
                // Resident Summary Card if flat is selected
                if (_selectedFlat != null)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(14),
                    margin: const EdgeInsets.only(bottom: 14),
                    decoration: BoxDecoration(
                      color: AppColors.creamCard,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppColors.gold.withOpacity(0.35)),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.03),
                          blurRadius: 8,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '${_selectedFlat!.block} · Floor ${_selectedFlat!.floor} · Flat ${_selectedFlat!.flatNumber}',
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                                color: AppColors.maroonDark,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Expected: ₹${_selectedFlat!.expectedAmount.toStringAsFixed(0)} · Paid: ₹${_selectedFlat!.totalCollected.toStringAsFixed(0)}',
                              style: const TextStyle(fontSize: 12, color: AppColors.inkMuted),
                            ),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: _selectedFlat!.paymentStatus == 'Paid' ? AppColors.forestLight : AppColors.goldSoft,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            _selectedFlat!.paymentStatus == 'Paid' ? 'PAID' : 'UNPAID',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: _selectedFlat!.paymentStatus == 'Paid' ? AppColors.forest : AppColors.goldDark,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                // Cascading Dropdowns: Block, Floor, Flat #
                const Text(
                  'SELECT RESIDENTIAL LOCATION *',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1, color: AppColors.inkMuted),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    // Block Dropdown
                    Expanded(
                      flex: 4,
                      child: _buildDropdownContainer(
                        label: 'Block',
                        child: DropdownButton<String>(
                          value: _selectedBlock != null && availableBlocks.contains(_selectedBlock) ? _selectedBlock : null,
                          isExpanded: true,
                          underline: const SizedBox(),
                          icon: const Icon(Icons.arrow_drop_down, color: AppColors.goldDark),
                          hint: const Text('Block', style: TextStyle(fontSize: 12)),
                          items: availableBlocks.map((b) {
                            return DropdownMenuItem<String>(
                              value: b,
                              child: Text(b, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.ink)),
                            );
                          }).toList(),
                          onChanged: (b) => _onBlockChanged(b, flats),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),

                    // Floor Dropdown
                    Expanded(
                      flex: 3,
                      child: _buildDropdownContainer(
                        label: 'Floor',
                        child: DropdownButton<int>(
                          value: _selectedFloor != null && availableFloors.contains(_selectedFloor) ? _selectedFloor : null,
                          isExpanded: true,
                          underline: const SizedBox(),
                          icon: const Icon(Icons.arrow_drop_down, color: AppColors.goldDark),
                          hint: const Text('Floor', style: TextStyle(fontSize: 12)),
                          items: availableFloors.map((f) {
                            return DropdownMenuItem<int>(
                              value: f,
                              child: Text('Fl $f', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.ink)),
                            );
                          }).toList(),
                          onChanged: (f) => _onFloorChanged(f, flats),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),

                    // Flat Dropdown
                    Expanded(
                      flex: 4,
                      child: _buildDropdownContainer(
                        label: 'Flat #',
                        child: DropdownButton<FlatModel>(
                          value: _selectedFlat != null && availableFlats.contains(_selectedFlat) ? _selectedFlat : null,
                          isExpanded: true,
                          underline: const SizedBox(),
                          icon: const Icon(Icons.arrow_drop_down, color: AppColors.goldDark),
                          hint: const Text('Flat #', style: TextStyle(fontSize: 12)),
                          items: availableFlats.map((flat) {
                            return DropdownMenuItem<FlatModel>(
                              value: flat,
                              child: Text(flat.flatNumber, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.ink)),
                            );
                          }).toList(),
                          onChanged: _onFlatChanged,
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 12),

                // Resident Name (Optional)
                TextFormField(
                  controller: _residentNameController,
                  cursorColor: AppColors.saffron,
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF1C1310)),
                  decoration: _buildInputDecoration(
                    label: 'Resident / Contributor Name (Optional)',
                    icon: Icons.person_outline,
                  ),
                ),
              ],

              // ==========================================
              // SECTION B: SPONSORSHIP / DONATION
              // ==========================================
              if (_collectionType == 'SponsorshipOther') ...[
                const Text(
                  'SPONSORSHIP DETAILS *',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1, color: AppColors.inkMuted),
                ),
                const SizedBox(height: 8),

                // Category Dropdown
                _buildDropdownContainer(
                  label: 'Sponsorship / Donation Category *',
                  child: DropdownButton<String>(
                    value: _selectedCategory,
                    isExpanded: true,
                    underline: const SizedBox(),
                    icon: const Icon(Icons.arrow_drop_down, color: AppColors.goldDark),
                    items: _sponsorshipCategories.map((cat) {
                      return DropdownMenuItem<String>(
                        value: cat,
                        child: Text(cat, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.ink)),
                      );
                    }).toList(),
                    onChanged: (cat) {
                      if (cat != null) setState(() => _selectedCategory = cat);
                    },
                  ),
                ),

                if (_selectedCategory == 'Other') ...[
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _otherCategoryController,
                    cursorColor: AppColors.saffron,
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF1C1310)),
                    decoration: _buildInputDecoration(
                      label: 'Specify Category / Purpose *',
                      icon: Icons.edit_note_outlined,
                    ),
                    validator: (v) {
                      if (_collectionType == 'SponsorshipOther' && _selectedCategory == 'Other' && (v == null || v.trim().isEmpty)) {
                        return 'Please specify the category or purpose';
                      }
                      return null;
                    },
                  ),
                ],

                const SizedBox(height: 12),

                // Donor / Sponsor Name (Required)
                TextFormField(
                  controller: _donorNameController,
                  cursorColor: AppColors.saffron,
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF1C1310)),
                  decoration: _buildInputDecoration(
                    label: 'Donor / Sponsor / Organization Name *',
                    icon: Icons.storefront_outlined,
                  ),
                  validator: (v) {
                    if (_collectionType == 'SponsorshipOther' && (v == null || v.trim().isEmpty)) {
                      return 'Enter donor / sponsor name';
                    }
                    return null;
                  },
                ),
              ],

              const SizedBox(height: 12),

              // Phone Number Field (For Both)
              TextFormField(
                controller: _phoneController,
                cursorColor: AppColors.saffron,
                keyboardType: TextInputType.phone,
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF1C1310)),
                decoration: _buildInputDecoration(
                  label: 'Contact Phone Number (Optional)',
                  icon: Icons.phone_outlined,
                ),
              ),

              const SizedBox(height: 12),

              // Collected By Field (For Both)
              TextFormField(
                controller: _collectedByController,
                cursorColor: AppColors.saffron,
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF1C1310)),
                decoration: _buildInputDecoration(
                  label: 'Collected By (Collector / Volunteer Name)',
                  icon: Icons.badge_outlined,
                ),
              ),

              const SizedBox(height: 18),

              // ==========================================
              // SECTION C: AMOUNT & PAYMENT MODE
              // ==========================================
              const Text(
                'AMOUNT (₹) *',
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1, color: AppColors.inkMuted),
              ),
              const SizedBox(height: 6),

              // Quick Amount Chips
              Wrap(
                spacing: 8,
                children: (_collectionType == 'ResidentBlock'
                        ? [1000, 2100, 2500, 5000, 11000]
                        : [2100, 5000, 11000, 21000, 51000, 100000])
                    .map((amt) {
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

              const SizedBox(height: 8),

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
                validator: (v) {
                  if (v == null || v.isEmpty) return 'Enter amount';
                  final val = double.tryParse(v);
                  if (val == null || val <= 0) return 'Invalid amount';
                  return null;
                },
              ),

              const SizedBox(height: 18),

              // Payment Mode Selector
              const Text(
                'PAYMENT MODE *',
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1, color: AppColors.inkMuted),
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
                              Text(modeEmoji, style: const TextStyle(fontSize: 18)),
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
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF1C1310)),
                keyboardType: TextInputType.text,
                textInputAction: TextInputAction.next,
                decoration: _buildInputDecoration(
                  label: _paymentMode == 'Cheque'
                      ? 'Cheque No. / Bank Name (Optional)'
                      : (_paymentMode == 'Cash'
                          ? 'Receipt / Voucher Reference (Optional)'
                          : 'Transaction / UTR Reference (Optional)'),
                  icon: Icons.receipt_long_outlined,
                ),
              ),

              const SizedBox(height: 12),

              // Remarks
              TextFormField(
                controller: _remarksController,
                cursorColor: AppColors.saffron,
                showCursor: true,
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF1C1310)),
                keyboardType: TextInputType.text,
                textInputAction: TextInputAction.done,
                maxLines: 2,
                decoration: _buildInputDecoration(
                  label: 'Remarks / Notes (Optional)',
                  icon: Icons.note_outlined,
                ),
              ),

              const SizedBox(height: 24),

              // Submit Button
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: collectionProvider.isSubmitting ? null : _handleSubmit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.saffron,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    elevation: 3,
                  ),
                  child: collectionProvider.isSubmitting
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

  Widget _buildTypeTab({
    required String typeKey,
    required String label,
    required IconData icon,
  }) {
    final isSelected = _collectionType == typeKey;

    return Expanded(
      child: InkWell(
        onTap: () {
          setState(() {
            _collectionType = typeKey;
            if (typeKey == 'SponsorshipOther') {
              _amountController.text = '5000';
            } else {
              _amountController.text = _selectedFlat?.expectedAmount != null && _selectedFlat!.expectedAmount > 0
                  ? _selectedFlat!.expectedAmount.toStringAsFixed(0)
                  : '2500';
            }
          });
        },
        borderRadius: BorderRadius.circular(10),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.maroonDark : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: AppColors.maroonDark.withOpacity(0.3),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    ),
                  ]
                : null,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                size: 16,
                color: isSelected ? AppColors.gold : AppColors.inkMuted,
              ),
              const SizedBox(width: 6),
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: isSelected ? Colors.white : AppColors.inkMuted,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDropdownContainer({required String label, required Widget child}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.creamCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.creamBorder),
      ),
      child: child,
    );
  }

  InputDecoration _buildInputDecoration({required String label, required IconData icon}) {
    return InputDecoration(
      labelText: label,
      labelStyle: const TextStyle(fontSize: 12, color: AppColors.inkMuted),
      prefixIcon: Icon(icon, size: 18, color: AppColors.goldDark),
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
    );
  }
}
