import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/constants/colors.dart';
import '../../models/collection_model.dart';
import '../../models/flat_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/collection_provider.dart';
import '../../providers/flat_provider.dart';
import '../collection/add_collection_view.dart';
import '../collection/receipt_view.dart';

enum ReportPeriod { overall, thisMonth, lastMonth, customMonth }

class ReportsView extends StatefulWidget {
  const ReportsView({Key? key}) : super(key: key);

  @override
  State<ReportsView> createState() => _ReportsViewState();
}

class _ReportsViewState extends State<ReportsView> with WidgetsBindingObserver {
  ReportPeriod _period = ReportPeriod.overall;
  DateTime _customMonthDate = DateTime.now();

  String _selectedStatus = 'All'; // 'All', 'Paid', 'Unpaid', 'Sponsorship'
  String _selectedBlock = 'All';
  String _selectedCategory = 'All'; // 'All' or specific category
  String _searchQuery = '';

  final List<String> _allCategoryOptions = [
    'All',
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
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed && mounted) {
      _loadData();
    }
  }

  Future<void> _loadData() async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final isActive = await auth.verifyAccountStatus();
    if (!isActive || !mounted) return;

    await Future.wait([
      Provider.of<FlatProvider>(context, listen: false).fetchFlats(),
      Provider.of<CollectionProvider>(context, listen: false)
          .fetchCollections(),
    ]);
  }

  DateTime _getTargetMonthDate() {
    final now = DateTime.now();
    switch (_period) {
      case ReportPeriod.overall:
        return now;
      case ReportPeriod.thisMonth:
        return DateTime(now.year, now.month, 1);
      case ReportPeriod.lastMonth:
        return DateTime(now.year, now.month - 1, 1);
      case ReportPeriod.customMonth:
        return _customMonthDate;
    }
  }

  String _getPeriodLabel() {
    final now = DateTime.now();
    switch (_period) {
      case ReportPeriod.overall:
        return 'Overall (Puja Cycle)';
      case ReportPeriod.thisMonth:
        return DateFormat('MMMM yyyy').format(now);
      case ReportPeriod.lastMonth:
        return DateFormat('MMMM yyyy')
            .format(DateTime(now.year, now.month - 1, 1));
      case ReportPeriod.customMonth:
        return DateFormat('MMMM yyyy').format(_customMonthDate);
    }
  }

  Future<void> _pickCustomMonth() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _customMonthDate,
      firstDate: DateTime(now.year - 2),
      lastDate: DateTime(now.year + 2),
      helpText: 'SELECT MONTH & YEAR',
      initialDatePickerMode: DatePickerMode.year,
    );

    if (picked != null) {
      setState(() {
        _customMonthDate = DateTime(picked.year, picked.month, 1);
        _period = ReportPeriod.customMonth;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final flatProvider = Provider.of<FlatProvider>(context);
    final collectionProvider = Provider.of<CollectionProvider>(context);

    final flats = flatProvider.activeFlats;
    final allCollections = collectionProvider.collections;
    final isLoading = flatProvider.isLoading || collectionProvider.isLoading;

    final targetMonth = _getTargetMonthDate();
    final isMonthly = _period != ReportPeriod.overall;

    // Filter collections by target month if monthly view
    final List<CollectionModel> periodCollections = isMonthly
        ? allCollections.where((c) {
            final dt = c.collectionDateTime;
            return dt.year == targetMonth.year && dt.month == targetMonth.month;
          }).toList()
        : allCollections;

    // Sponsorship collections in this period
    final periodSponsorships =
        periodCollections.where((c) => c.type == 'SponsorshipOther').toList();
    final double totalSponsorshipAmount =
        periodSponsorships.fold(0.0, (sum, c) => sum + c.amount);

    // Category breakdown for sponsorships
    final Map<String, double> sponsorshipCategoryTotals = {};
    for (final s in periodSponsorships) {
      final cat = s.category ?? 'Other';
      sponsorshipCategoryTotals[cat] =
          (sponsorshipCategoryTotals[cat] ?? 0.0) + s.amount;
    }

    // Map flatId to collection total in this period
    final Map<int, double> flatPeriodCollections = {};
    for (final c in periodCollections) {
      if (c.flatId != null) {
        flatPeriodCollections[c.flatId!] =
            (flatPeriodCollections[c.flatId!] ?? 0.0) + c.amount;
      }
    }

    // Monthly Payment Modes Breakdown
    double monthlyCash = 0;
    double monthlyUpi = 0;
    double monthlyBank = 0;
    double monthlyCheque = 0;
    for (final c in periodCollections) {
      final mode = c.mode.toLowerCase().replaceAll(' ', '').replaceAll('_', '');
      if (mode.contains('cash')) {
        monthlyCash += c.amount;
      } else if (mode.contains('upi')) {
        monthlyUpi += c.amount;
      } else if (mode.contains('bank')) {
        monthlyBank += c.amount;
      } else if (mode.contains('cheque')) {
        monthlyCheque += c.amount;
      }
    }

    // Aggregate Resident Metrics
    final int totalFlats = flats.length;
    int paidCount = 0;
    int unpaidCount = 0;
    double totalCollected = 0.0;
    double totalUnpaid = 0.0;

    if (!isMonthly) {
      // Overall Puja Target
      paidCount =
          flats.where((f) => f.paymentStatus.toLowerCase() == 'paid').length;
      unpaidCount =
          flats.where((f) => f.paymentStatus.toLowerCase() != 'paid').length;
      totalCollected = flats.fold(0.0, (sum, f) => sum + f.totalCollected);
      totalUnpaid = flats.fold(0.0, (sum, f) => sum + f.pendingAmount);
    } else {
      // Monthly Specific
      paidCount =
          flats.where((f) => (flatPeriodCollections[f.id] ?? 0.0) > 0).length;
      unpaidCount = totalFlats - paidCount;
      totalCollected = periodCollections
          .where((c) => c.type != 'SponsorshipOther')
          .fold(0.0, (sum, c) => sum + c.amount);
      totalUnpaid = flats.fold(0.0, (sum, f) {
        final paidInMonth = flatPeriodCollections[f.id] ?? 0.0;
        return sum + (paidInMonth > 0 ? 0 : f.expectedAmount);
      });
    }

    final double completionPercentage =
        totalFlats > 0 ? (paidCount / totalFlats) * 100 : 0.0;

    // Distinct Blocks
    final blocks = [
      'All',
      ...flats.map((f) => f.block).toSet().toList()..sort()
    ];

    // Filtered Flats List
    final filteredFlats = flats.where((flat) {
      final bool flatIsPaid = !isMonthly
          ? (flat.paymentStatus.toLowerCase() == 'paid')
          : ((flatPeriodCollections[flat.id] ?? 0.0) > 0);

      // Status Filter
      if (_selectedStatus == 'Paid' && !flatIsPaid) {
        return false;
      }
      if (_selectedStatus == 'Unpaid' && flatIsPaid) {
        return false;
      }

      // Block Filter
      if (_selectedBlock != 'All' && flat.block != _selectedBlock) {
        return false;
      }

      // Search Query Filter
      if (_searchQuery.isNotEmpty) {
        final q = _searchQuery.toLowerCase();
        final match = flat.flatNumber.toLowerCase().contains(q) ||
            flat.ownerName.toLowerCase().contains(q) ||
            flat.block.toLowerCase().contains(q) ||
            flat.ownerPhone.toLowerCase().contains(q);
        if (!match) return false;
      }

      return true;
    }).toList();

    // Filtered Sponsorships List with Category Filter
    final filteredSponsorships = periodSponsorships.where((s) {
      // Category Filter
      if (_selectedCategory != 'All') {
        final cat = s.category ?? 'Other';
        if (_selectedCategory == 'Other') {
          final isStandard = _allCategoryOptions
              .sublist(1, _allCategoryOptions.length - 1)
              .contains(cat);
          if (isStandard) return false;
        } else if (cat != _selectedCategory) {
          return false;
        }
      }

      // Search Query Filter
      if (_searchQuery.isNotEmpty) {
        final q = _searchQuery.toLowerCase();
        final match =
            (s.donorResidentName?.toLowerCase().contains(q) ?? false) ||
                (s.category?.toLowerCase().contains(q) ?? false) ||
                (s.receiptNumber.toLowerCase().contains(q)) ||
                (s.collectedByName?.toLowerCase().contains(q) ?? false);
        if (!match) return false;
      }

      return true;
    }).toList();

    final double filteredSponsorshipTotal =
        filteredSponsorships.fold(0.0, (sum, s) => sum + s.amount);

    return Scaffold(
      backgroundColor: AppColors.cream,
      appBar: AppBar(
        backgroundColor: AppColors.maroonDark,
        foregroundColor: Colors.white,
        elevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Collection Reports',
              style: TextStyle(
                  fontFamily: 'serif',
                  fontWeight: FontWeight.bold,
                  fontSize: 18),
            ),
            Text(
              '${_getPeriodLabel()} · Paid vs Unpaid',
              style: const TextStyle(fontSize: 11, color: AppColors.goldLight),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: AppColors.gold),
            tooltip: 'Refresh Status',
            onPressed: _loadData,
          ),
        ],
      ),
      body: isLoading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.saffron),
            )
          : RefreshIndicator(
              color: AppColors.saffron,
              onRefresh: _loadData,
              child: Column(
                children: [
                  // 1. Period Selector Chips
                  Container(
                    color: AppColors.maroonDark,
                    padding: const EdgeInsets.fromLTRB(14, 0, 14, 10),
                    child: SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          _buildPeriodChip(
                            label: 'Overall Puja Cycle',
                            isSelected: _period == ReportPeriod.overall,
                            onTap: () =>
                                setState(() => _period = ReportPeriod.overall),
                          ),
                          const SizedBox(width: 6),
                          _buildPeriodChip(
                            label: 'This Month',
                            isSelected: _period == ReportPeriod.thisMonth,
                            onTap: () => setState(
                                () => _period = ReportPeriod.thisMonth),
                          ),
                          const SizedBox(width: 6),
                          _buildPeriodChip(
                            label: 'Last Month',
                            isSelected: _period == ReportPeriod.lastMonth,
                            onTap: () => setState(
                                () => _period = ReportPeriod.lastMonth),
                          ),
                          const SizedBox(width: 6),
                          _buildPeriodChip(
                            label: _period == ReportPeriod.customMonth
                                ? DateFormat('MMM yyyy')
                                    .format(_customMonthDate)
                                : 'Select Month 📅',
                            isSelected: _period == ReportPeriod.customMonth,
                            onTap: _pickCustomMonth,
                          ),
                        ],
                      ),
                    ),
                  ),

                  // 2. KPI Metrics Header
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [
                          AppColors.maroonDark,
                          AppColors.maroon,
                          Color(0xFF631520)
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.maroon.withOpacity(0.3),
                          blurRadius: 8,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Progress bar & label
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              isMonthly
                                  ? '${_getPeriodLabel().toUpperCase()} RESIDENT COVERAGE'
                                  : 'PUJA CYCLE TARGET COMPLETION',
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: AppColors.goldLight,
                                letterSpacing: 0.8,
                              ),
                            ),
                            Text(
                              '${completionPercentage.toStringAsFixed(1)}%',
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(6),
                          child: LinearProgressIndicator(
                            value:
                                totalFlats > 0 ? (paidCount / totalFlats) : 0,
                            minHeight: 7,
                            backgroundColor: Colors.white24,
                            valueColor: const AlwaysStoppedAnimation<Color>(
                                AppColors.forest),
                          ),
                        ),
                        const SizedBox(height: 12),

                        // Metric Stat Columns
                        Row(
                          children: [
                            Expanded(
                              child: _buildHeaderMetric(
                                label:
                                    isMonthly ? 'Paid in Month' : 'Paid Units',
                                count: '$paidCount / $totalFlats units',
                                amount: '₹${totalCollected.toStringAsFixed(0)}',
                                textColor: AppColors.forestLight,
                              ),
                            ),
                            Container(
                                width: 1, height: 36, color: Colors.white24),
                            Expanded(
                              child: _buildHeaderMetric(
                                label: isMonthly
                                    ? 'Unpaid in Month'
                                    : 'Unpaid Units',
                                count: '$unpaidCount / $totalFlats units',
                                amount: isMonthly
                                    ? '${periodCollections.length} total txns'
                                    : '₹${totalUnpaid.toStringAsFixed(0)}',
                                textColor: AppColors.goldLight,
                              ),
                            ),
                            Container(
                                width: 1, height: 36, color: Colors.white24),
                            Expanded(
                              child: _buildHeaderMetric(
                                label: 'Sponsorships',
                                count: '${periodSponsorships.length} donors',
                                amount:
                                    '₹${totalSponsorshipAmount.toStringAsFixed(0)}',
                                textColor: AppColors.gold,
                              ),
                            ),
                          ],
                        ),

                        // Monthly Mode summary row if monthly view
                        if (isMonthly && periodCollections.isNotEmpty) ...[
                          const SizedBox(height: 10),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 6),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.08),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceAround,
                              children: [
                                _buildModePill('💵 Cash', monthlyCash),
                                _buildModePill('📱 UPI', monthlyUpi),
                                _buildModePill('🏦 Bank', monthlyBank),
                                _buildModePill('📑 Cheque', monthlyCheque),
                              ],
                            ),
                          )
                        ],
                      ],
                    ),
                  ),

                  // 3. Status Segment Tabs (All, Paid, Unpaid, Sponsorship)
                  Container(
                    color: AppColors.creamCard,
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    child: SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          _buildStatusTab('All', 'All (${flats.length})',
                              AppColors.maroonDark),
                          const SizedBox(width: 6),
                          _buildStatusTab(
                              'Paid', 'Paid ($paidCount)', AppColors.forest),
                          const SizedBox(width: 6),
                          _buildStatusTab('Unpaid', 'Unpaid ($unpaidCount)',
                              AppColors.goldDark),
                          const SizedBox(width: 6),
                          _buildStatusTab(
                              'Sponsorship',
                              '🌟 Sponsorships (${periodSponsorships.length})',
                              const Color(0xFF6B1826)),
                        ],
                      ),
                    ),
                  ),

                  // 4. Search & Filter Bar (Blocks for flats, Categories for sponsorships)
                  Container(
                    color: AppColors.creamCard,
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
                    child: Column(
                      children: [
                        TextField(
                          onChanged: (v) => setState(() => _searchQuery = v),
                          cursorColor: AppColors.saffron,
                          style: const TextStyle(
                              fontSize: 13, color: Color(0xFF1C1310)),
                          decoration: InputDecoration(
                            hintText: _selectedStatus == 'Sponsorship'
                                ? 'Search donor name, category, receipt...'
                                : 'Search by flat #, owner name, block...',
                            hintStyle: const TextStyle(
                                fontSize: 12, color: AppColors.inkMuted),
                            prefixIcon: const Icon(Icons.search,
                                size: 18, color: AppColors.inkMuted),
                            filled: true,
                            fillColor: AppColors.cream,
                            isDense: true,
                            contentPadding: const EdgeInsets.symmetric(
                                vertical: 10, horizontal: 12),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(10),
                              borderSide: const BorderSide(
                                  color: AppColors.creamBorder),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(10),
                              borderSide: const BorderSide(
                                  color: AppColors.gold, width: 1.5),
                            ),
                          ),
                        ),

                        // If Sponsorships: Show Category Filter Chips
                        if (_selectedStatus == 'Sponsorship') ...[
                          const SizedBox(height: 8),
                          SingleChildScrollView(
                            scrollDirection: Axis.horizontal,
                            child: Row(
                              children: _allCategoryOptions.map((cat) {
                                final isSelected = _selectedCategory == cat;
                                final count = cat == 'All'
                                    ? periodSponsorships.length
                                    : periodSponsorships.where((s) {
                                        final scat = s.category ?? 'Other';
                                        if (cat == 'Other') {
                                          return !_allCategoryOptions
                                              .sublist(
                                                  1,
                                                  _allCategoryOptions.length -
                                                      1)
                                              .contains(scat);
                                        }
                                        return scat == cat;
                                      }).length;

                                return Padding(
                                  padding: const EdgeInsets.only(right: 6.0),
                                  child: ChoiceChip(
                                    label: Text('$cat ($count)'),
                                    selected: isSelected,
                                    selectedColor: const Color(0xFF6B1826),
                                    labelStyle: TextStyle(
                                      color: isSelected
                                          ? Colors.white
                                          : AppColors.ink,
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                    ),
                                    backgroundColor: AppColors.cream,
                                    side: BorderSide(
                                      color: isSelected
                                          ? const Color(0xFF6B1826)
                                          : AppColors.creamBorder,
                                    ),
                                    onSelected: (sel) {
                                      if (sel)
                                        setState(() => _selectedCategory = cat);
                                    },
                                  ),
                                );
                              }).toList(),
                            ),
                          ),
                        ] else if (blocks.length > 2) ...[
                          // If Resident Flats: Show Block Filter Chips
                          const SizedBox(height: 8),
                          SingleChildScrollView(
                            scrollDirection: Axis.horizontal,
                            child: Row(
                              children: blocks.map((block) {
                                final isSelected = _selectedBlock == block;
                                return Padding(
                                  padding: const EdgeInsets.only(right: 6.0),
                                  child: ChoiceChip(
                                    label: Text(block),
                                    selected: isSelected,
                                    selectedColor: AppColors.maroonDark,
                                    labelStyle: TextStyle(
                                      color: isSelected
                                          ? Colors.white
                                          : AppColors.ink,
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                    ),
                                    backgroundColor: AppColors.cream,
                                    side: BorderSide(
                                      color: isSelected
                                          ? AppColors.maroonDark
                                          : AppColors.creamBorder,
                                    ),
                                    onSelected: (sel) {
                                      if (sel)
                                        setState(() => _selectedBlock = block);
                                    },
                                  ),
                                );
                              }).toList(),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),

                  const Divider(height: 1, color: AppColors.creamBorder),

                  // 5. Main List: Either Sponsorships or Flats
                  Expanded(
                    child: _selectedStatus == 'Sponsorship'
                        ? _buildSponsorshipSection(
                            filteredSponsorships,
                            filteredSponsorshipTotal,
                            sponsorshipCategoryTotals,
                          )
                        : _buildFlatSection(
                            filteredFlats,
                            isMonthly,
                            flatPeriodCollections,
                          ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildSponsorshipSection(
    List<CollectionModel> sponsorships,
    double totalAmount,
    Map<String, double> categoryTotals,
  ) {
    if (sponsorships.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.volunteer_activism_outlined,
                  size: 48, color: AppColors.inkLight),
              const SizedBox(height: 8),
              Text(
                _selectedCategory == 'All'
                    ? 'No sponsorships found in ${_getPeriodLabel()}'
                    : 'No $_selectedCategory donations found in ${_getPeriodLabel()}',
                style: const TextStyle(color: AppColors.inkMuted, fontSize: 14),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    return ListView(
      padding: const EdgeInsets.all(12),
      children: [
        // Category Breakdown Card (Tap any pill to filter)
        if (categoryTotals.isNotEmpty)
          Container(
            padding: const EdgeInsets.all(14),
            margin: const EdgeInsets.only(bottom: 12),
            decoration: BoxDecoration(
              color: AppColors.creamCard,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.gold.withOpacity(0.4)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Row(
                      children: [
                        Text('🌟', style: TextStyle(fontSize: 16)),
                        SizedBox(width: 6),
                        Text(
                          'Sponsorship Breakdown',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: AppColors.maroonDark,
                          ),
                        ),
                      ],
                    ),
                    if (_selectedCategory != 'All')
                      InkWell(
                        onTap: () => setState(() => _selectedCategory = 'All'),
                        child: const Text(
                          'Clear Filter',
                          style: TextStyle(
                              fontSize: 11,
                              color: AppColors.saffron,
                              fontWeight: FontWeight.bold),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: categoryTotals.entries.map((entry) {
                    final isCurrent = _selectedCategory == entry.key;
                    return InkWell(
                      onTap: () =>
                          setState(() => _selectedCategory = entry.key),
                      borderRadius: BorderRadius.circular(8),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: isCurrent
                              ? const Color(0xFF6B1826)
                              : AppColors.goldSoft,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: isCurrent
                                ? const Color(0xFF6B1826)
                                : AppColors.gold.withOpacity(0.3),
                          ),
                        ),
                        child: Text(
                          '${entry.key}: ₹${entry.value.toStringAsFixed(0)}',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color:
                                isCurrent ? Colors.white : AppColors.maroonDark,
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ],
            ),
          ),

        // List of Sponsorship Donation Cards
        ...sponsorships.map((item) => _buildSponsorshipCard(item)),
      ],
    );
  }

  Widget _buildSponsorshipCard(CollectionModel item) {
    final df = DateFormat('dd MMM yyyy, hh:mm a');
    final dateStr = df.format(item.collectionDateTime);

    return Card(
      color: AppColors.creamCard,
      elevation: 1,
      margin: const EdgeInsets.only(bottom: 8),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: BorderSide(color: AppColors.gold.withOpacity(0.35)),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        leading: Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: AppColors.gold.withOpacity(0.2),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.gold.withOpacity(0.5)),
          ),
          child: const Center(
            child: Text('🌟', style: TextStyle(fontSize: 20)),
          ),
        ),
        title: Text(
          item.donorResidentName ?? 'Devotee / Sponsor',
          style: const TextStyle(
              fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.ink),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 2),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: AppColors.goldSoft,
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                item.category ?? 'Other',
                style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: AppColors.maroonDark),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              '${item.mode}${item.collectedByName != null ? " · By " + item.collectedByName! : ""} · $dateStr',
              style: const TextStyle(fontSize: 11, color: AppColors.inkMuted),
            ),
          ],
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              '₹${item.amount.toStringAsFixed(0)}',
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: AppColors.forest,
                fontFamily: 'serif',
              ),
            ),
            const SizedBox(height: 4),
            InkWell(
              onTap: () async {
                await Navigator.of(context).push(
                  MaterialPageRoute(
                      builder: (_) => ReceiptView(collection: item)),
                );
                if (mounted) {
                  _loadData();
                }
              },
              child: const Text(
                'Receipt >',
                style: TextStyle(
                  fontSize: 11,
                  color: AppColors.saffron,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFlatSection(
    List<FlatModel> filteredFlats,
    bool isMonthly,
    Map<int, double> flatPeriodCollections,
  ) {
    if (filteredFlats.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.apartment_outlined,
                  size: 48, color: AppColors.inkLight),
              const SizedBox(height: 8),
              Text(
                'No ${_selectedStatus == "All" ? "" : _selectedStatus} units found in ${_getPeriodLabel()}',
                style: const TextStyle(color: AppColors.inkMuted, fontSize: 14),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(12),
      itemCount: filteredFlats.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (context, index) {
        final flat = filteredFlats[index];
        final paidInMonth = flatPeriodCollections[flat.id] ?? 0.0;
        return _buildFlatCard(flat, isMonthly, paidInMonth);
      },
    );
  }

  Widget _buildPeriodChip({
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.gold : Colors.white12,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? AppColors.goldLight : Colors.white24,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.bold,
            color: isSelected ? AppColors.maroonDark : Colors.white,
          ),
        ),
      ),
    );
  }

  // Widget _buildModePill(String label, double amount) {
  //   return Text(
  //     '$label: ₹${amount.toStringAsFixed(0)}',
  //     style: const TextStyle(
  //         fontSize: 10, color: Colors.white, fontWeight: FontWeight.w600),
  //   );
  // }
  Widget _buildModePill(String label, double amount) {
    return Expanded(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label,
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 9,
              color: Colors.white70,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 2),
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(
              '₹${amount.toStringAsFixed(0)}',
              maxLines: 1,
              style: const TextStyle(
                fontSize: 11,
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeaderMetric({
    required String label,
    required String count,
    required String amount,
    required Color textColor,
  }) {
    return Column(
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 10, color: Colors.white70),
        ),
        const SizedBox(height: 2),
        Text(
          count,
          style: TextStyle(
              fontSize: 11, fontWeight: FontWeight.bold, color: textColor),
        ),
        Text(
          amount,
          style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.bold,
              color: Colors.white,
              fontFamily: 'serif'),
        ),
      ],
    );
  }

  Widget _buildStatusTab(String statusKey, String label, Color activeColor) {
    final isSelected = _selectedStatus == statusKey;

    return InkWell(
      onTap: () {
        setState(() {
          _selectedStatus = statusKey;
          if (statusKey == 'Sponsorship') {
            _selectedCategory = 'All'; // default to all categories
          }
        });
      },
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? activeColor : AppColors.cream,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isSelected ? activeColor : AppColors.creamBorder,
          ),
        ),
        child: Text(
          label,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.bold,
            color: isSelected ? Colors.white : AppColors.ink,
          ),
        ),
      ),
    );
  }

  Widget _buildFlatCard(FlatModel flat, bool isMonthly, double paidInMonth) {
    final isPaid = !isMonthly
        ? (flat.paymentStatus.toLowerCase() == 'paid')
        : (paidInMonth > 0);

    return Card(
      color: AppColors.creamCard,
      elevation: 1,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: BorderSide(
          color: isPaid
              ? AppColors.forest.withOpacity(0.3)
              : AppColors.creamBorder,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        child: Row(
          children: [
            // Flat Block Badge
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: isPaid ? AppColors.forestLight : AppColors.goldSoft,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isPaid
                      ? AppColors.forest.withOpacity(0.3)
                      : AppColors.gold.withOpacity(0.3),
                ),
              ),
              child: Center(
                child: Text(
                  flat.flatNumber,
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: isPaid ? AppColors.forest : AppColors.maroonDark,
                    fontSize: 14,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),

            // Flat Details
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '${flat.block} · Floor ${flat.floor}',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: AppColors.ink,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: isPaid
                              ? AppColors.forestLight
                              : AppColors.goldSoft,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          isPaid
                              ? (isMonthly ? 'PAID IN MONTH' : 'PAID')
                              : (isMonthly ? 'UNPAID' : 'UNPAID'),
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color:
                                isPaid ? AppColors.forest : AppColors.goldDark,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    flat.ownerName,
                    style: const TextStyle(
                        fontSize: 12, color: AppColors.inkMuted),
                  ),
                  if (flat.ownerPhone.isNotEmpty)
                    Text(
                      '📞 ${flat.ownerPhone}',
                      style: const TextStyle(
                          fontSize: 10, color: AppColors.inkLight),
                    ),
                ],
              ),
            ),
            const SizedBox(width: 8),

            // Amount / Action
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  !isMonthly
                      ? (isPaid
                          ? '₹${flat.totalCollected.toStringAsFixed(0)}'
                          : '₹${flat.pendingAmount.toStringAsFixed(0)}')
                      : (isPaid
                          ? '₹${paidInMonth.toStringAsFixed(0)}'
                          : '₹${flat.expectedAmount.toStringAsFixed(0)}'),
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: isPaid ? AppColors.forest : AppColors.saffron,
                    fontFamily: 'serif',
                  ),
                ),
                const SizedBox(height: 4),
                if (!isPaid)
                  InkWell(
                    onTap: () async {
                      await Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => AddCollectionView(initialFlat: flat),
                        ),
                      );
                      if (mounted) {
                        _loadData();
                      }
                    },
                    borderRadius: BorderRadius.circular(6),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: AppColors.saffron,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Text(
                        'Collect >',
                        style: TextStyle(
                            fontSize: 11,
                            color: Colors.white,
                            fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
