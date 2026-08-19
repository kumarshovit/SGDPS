import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/constants/colors.dart';
import '../../models/collection_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/collection_provider.dart';
import '../../providers/flat_provider.dart';
import '../collection/add_collection_view.dart';
import '../collection/receipt_view.dart';
import '../reports/reports_view.dart';
import '../auth/login_view.dart';

enum DatePreset { today, yesterday, last7Days, thisMonth, allTime, custom }

class CollectorDashboardView extends StatefulWidget {
  const CollectorDashboardView({Key? key}) : super(key: key);

  @override
  State<CollectorDashboardView> createState() => _CollectorDashboardViewState();
}

class _CollectorDashboardViewState extends State<CollectorDashboardView> {
  // Unified Filter State for the entire Dashboard
  DatePreset _datePreset = DatePreset.today;
  DateTimeRange? _customDateRange;
  String _typeFilter = 'All'; // 'All', 'ResidentBlock', 'SponsorshipOther'

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  Future<void> _loadData() async {
    await Future.wait([
      Provider.of<CollectionProvider>(context, listen: false).fetchCollections(),
      Provider.of<FlatProvider>(context, listen: false).fetchFlats(),
    ]);
  }

  (DateTime?, DateTime?) _resolveDateRange(DatePreset preset, DateTimeRange? customRange) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);

    switch (preset) {
      case DatePreset.today:
        return (today, today);
      case DatePreset.yesterday:
        final y = today.subtract(const Duration(days: 1));
        return (y, y);
      case DatePreset.last7Days:
        return (today.subtract(const Duration(days: 6)), today);
      case DatePreset.thisMonth:
        return (DateTime(today.year, today.month, 1), today);
      case DatePreset.allTime:
        return (null, null);
      case DatePreset.custom:
        if (customRange != null) {
          return (
            DateTime(customRange.start.year, customRange.start.month, customRange.start.day),
            DateTime(customRange.end.year, customRange.end.month, customRange.end.day),
          );
        }
        return (today, today);
    }
  }

  String _getPresetLabel(DatePreset preset, DateTimeRange? customRange) {
    final now = DateTime.now();
    switch (preset) {
      case DatePreset.today:
        return 'Today (${DateFormat('dd MMM').format(now)})';
      case DatePreset.yesterday:
        final y = now.subtract(const Duration(days: 1));
        return 'Yesterday (${DateFormat('dd MMM').format(y)})';
      case DatePreset.last7Days:
        return 'Last 7 Days';
      case DatePreset.thisMonth:
        return 'This Month';
      case DatePreset.allTime:
        return 'All Time';
      case DatePreset.custom:
        if (customRange != null) {
          final df = DateFormat('dd MMM');
          return '${df.format(customRange.start)} - ${df.format(customRange.end)}';
        }
        return 'Custom';
    }
  }

  String _getHeroCardTitle() {
    final now = DateTime.now();
    switch (_datePreset) {
      case DatePreset.today:
        return "TODAY'S COLLECTION (${DateFormat('dd MMM').format(now).toUpperCase()})";
      case DatePreset.yesterday:
        final y = now.subtract(const Duration(days: 1));
        return "YESTERDAY'S COLLECTION (${DateFormat('dd MMM').format(y).toUpperCase()})";
      case DatePreset.last7Days:
        return "LAST 7 DAYS COLLECTION";
      case DatePreset.thisMonth:
        return "THIS MONTH'S COLLECTION";
      case DatePreset.allTime:
        return "ALL-TIME TOTAL COLLECTION";
      case DatePreset.custom:
        return "CUSTOM PERIOD COLLECTION";
    }
  }

  Future<void> _pickCustomDateRange() async {
    final now = DateTime.now();
    final picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2025, 1, 1),
      lastDate: DateTime(now.year, now.month, now.day + 30),
      initialDateRange: _customDateRange ??
          DateTimeRange(start: now.subtract(const Duration(days: 7)), end: now),
      builder: (context, child) {
        return Theme(
          data: ThemeData.light().copyWith(
            colorScheme: const ColorScheme.light(
              primary: AppColors.maroonDark,
              onPrimary: Colors.white,
              surface: AppColors.creamCard,
              onSurface: AppColors.ink,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() {
        _datePreset = DatePreset.custom;
        _customDateRange = picked;
      });
    }
  }

  void _showFilterOptionsModal() {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.creamCard,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        DatePreset tempPreset = _datePreset;
        String tempType = _typeFilter;

        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Filter Dashboard Data',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: AppColors.maroonDark,
                          fontFamily: 'serif',
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, size: 20),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ],
                  ),
                  const Divider(height: 1),
                  const SizedBox(height: 14),

                  const Text(
                    'DATE PERIOD',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: AppColors.inkMuted,
                      letterSpacing: 1,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: DatePreset.values.map((p) {
                      final isSelected = tempPreset == p;
                      return ChoiceChip(
                        label: Text(_getPresetLabel(p, _customDateRange)),
                        selected: isSelected,
                        selectedColor: AppColors.saffron,
                        labelStyle: TextStyle(
                          color: isSelected ? Colors.white : AppColors.ink,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                        backgroundColor: AppColors.cream,
                        side: BorderSide(
                          color: isSelected ? AppColors.saffron : AppColors.creamBorder,
                        ),
                        onSelected: (selected) {
                          if (selected) {
                            if (p == DatePreset.custom) {
                              Navigator.pop(context);
                              _pickCustomDateRange();
                            } else {
                              setModalState(() => tempPreset = p);
                            }
                          }
                        },
                      );
                    }).toList(),
                  ),

                  const SizedBox(height: 16),
                  const Text(
                    'COLLECTION TYPE',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: AppColors.inkMuted,
                      letterSpacing: 1,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: [
                      ('All', 'All Types'),
                      ('ResidentBlock', 'Resident / Flats'),
                      ('SponsorshipOther', 'Sponsorship / Other'),
                    ].map((entry) {
                      final isSelected = tempType == entry.$1;
                      return ChoiceChip(
                        label: Text(entry.$2),
                        selected: isSelected,
                        selectedColor: AppColors.maroonDark,
                        labelStyle: TextStyle(
                          color: isSelected ? Colors.white : AppColors.ink,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                        backgroundColor: AppColors.cream,
                        side: BorderSide(
                          color: isSelected ? AppColors.maroonDark : AppColors.creamBorder,
                        ),
                        onSelected: (selected) {
                          if (selected) {
                            setModalState(() => tempType = entry.$1);
                          }
                        },
                      );
                    }).toList(),
                  ),

                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    height: 46,
                    child: ElevatedButton(
                      onPressed: () {
                        setState(() {
                          _datePreset = tempPreset;
                          _typeFilter = tempType;
                        });
                        Navigator.pop(context);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.saffron,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text(
                        'Apply Filter to Dashboard',
                        style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                ],
              ),
            );
          },
        );
      },
    );
  }

  // Drill-down Modal Sheet when user clicks any of the 5 cards
  void _showModeCollectionsModal({
    required String title,
    required String icon,
    required List<CollectionModel> items,
    required double totalAmount,
  }) {
    final periodLabel = _getPresetLabel(_datePreset, _customDateRange);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.creamCard,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return DraggableScrollableSheet(
          initialChildSize: 0.8,
          minChildSize: 0.4,
          maxChildSize: 0.95,
          expand: false,
          builder: (_, scrollController) {
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      margin: const EdgeInsets.only(bottom: 12),
                      decoration: BoxDecoration(
                        color: AppColors.creamBorder,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: AppColors.goldSoft,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(icon, style: const TextStyle(fontSize: 20)),
                          ),
                          const SizedBox(width: 10),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '$title Collections',
                                style: const TextStyle(
                                  fontSize: 17,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.maroonDark,
                                  fontFamily: 'serif',
                                ),
                              ),
                              Text(
                                '$periodLabel · ${items.length} ${items.length == 1 ? "entry" : "entries"}',
                                style: const TextStyle(fontSize: 12, color: AppColors.inkMuted),
                              ),
                            ],
                          ),
                        ],
                      ),
                      Text(
                        '₹${totalAmount.toStringAsFixed(0)}',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppColors.forest,
                          fontFamily: 'serif',
                        ),
                      ),
                    ],
                  ),
                  const Divider(height: 18),
                  Expanded(
                    child: items.isEmpty
                        ? Center(
                            child: Padding(
                              padding: const EdgeInsets.all(24.0),
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.receipt_long_outlined, size: 48, color: AppColors.inkLight),
                                  const SizedBox(height: 10),
                                  Text(
                                    'No $title collections recorded for $periodLabel',
                                    textAlign: TextAlign.center,
                                    style: const TextStyle(color: AppColors.inkMuted, fontSize: 13),
                                  ),
                                ],
                              ),
                            ),
                          )
                        : ListView.separated(
                            controller: scrollController,
                            itemCount: items.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 8),
                            itemBuilder: (context, index) {
                              final item = items[index];
                              return _buildTransactionCard(item);
                            },
                          ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  void _showTop10Modal(List<CollectionModel> top10) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.creamCard,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return DraggableScrollableSheet(
          initialChildSize: 0.8,
          minChildSize: 0.4,
          maxChildSize: 0.95,
          expand: false,
          builder: (_, scrollController) {
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      margin: const EdgeInsets.only(bottom: 12),
                      decoration: BoxDecoration(
                        color: AppColors.creamBorder,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Recent Collections',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: AppColors.maroonDark,
                              fontFamily: 'serif',
                            ),
                          ),
                          Text(
                            'Showing ${top10.length} latest entries',
                            style: const TextStyle(fontSize: 12, color: AppColors.inkMuted),
                          ),
                        ],
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, size: 20, color: AppColors.inkMuted),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                  const Divider(height: 16),
                  Expanded(
                    child: top10.isEmpty
                        ? const Center(
                            child: Text('No collections recorded yet', style: TextStyle(color: AppColors.inkMuted)),
                          )
                        : ListView.separated(
                            controller: scrollController,
                            itemCount: top10.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 8),
                            itemBuilder: (context, index) {
                              final item = top10[index];
                              return _buildTransactionCard(item);
                            },
                          ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Future<void> _handleLogout() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.creamCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Confirm Logout', style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.maroonDark)),
        content: const Text('Are you sure you want to sign out of SGDPS Collector?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel', style: TextStyle(color: AppColors.inkMuted)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.maroonDark,
              foregroundColor: Colors.white,
            ),
            child: const Text('Sign Out'),
          ),
        ],
      ),
    );

    if (confirm == true && mounted) {
      final nav = Navigator.of(context);
      final auth = Provider.of<AuthProvider>(context, listen: false);
      await auth.logout();
      nav.pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const LoginView()),
        (route) => false,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final collectionProvider = Provider.of<CollectionProvider>(context);
    final flatProvider = Provider.of<FlatProvider>(context);

    final bool hasError = collectionProvider.errorMessage != null || flatProvider.errorMessage != null;
    final String? errorText = collectionProvider.errorMessage ?? flatProvider.errorMessage;

    // Resolve Unified Filtered Collections based on selected date preset & type filter
    final (filterStart, filterEnd) = _resolveDateRange(_datePreset, _customDateRange);
    final filteredList = collectionProvider.getFilteredCollections(
      startDate: filterStart,
      endDate: filterEnd,
      type: _typeFilter,
    );

    final double heroAmount = filteredList.fold(0.0, (sum, c) => sum + c.amount);
    final int heroCount = filteredList.length;

    // Mode-specific collections from the filtered set
    final cashItems = filteredList.where((c) => CollectionProvider.matchesMode(c.mode, 'Cash')).toList();
    final double cashAmount = cashItems.fold(0.0, (sum, c) => sum + c.amount);
    final int cashCount = cashItems.length;

    final upiItems = filteredList.where((c) => CollectionProvider.matchesMode(c.mode, 'UPI')).toList();
    final double upiAmount = upiItems.fold(0.0, (sum, c) => sum + c.amount);
    final int upiCount = upiItems.length;

    final bankItems = filteredList.where((c) => CollectionProvider.matchesMode(c.mode, 'BankTransfer')).toList();
    final double bankAmount = bankItems.fold(0.0, (sum, c) => sum + c.amount);
    final int bankCount = bankItems.length;

    final chequeItems = filteredList.where((c) => CollectionProvider.matchesMode(c.mode, 'Cheque')).toList();
    final double chequeAmount = chequeItems.fold(0.0, (sum, c) => sum + c.amount);
    final int chequeCount = chequeItems.length;

    final allItems = filteredList;
    final double allAmount = heroAmount;
    final int allCount = heroCount;

    // Latest single transaction to display on dashboard
    final latestItem = filteredList.isNotEmpty
        ? filteredList.first
        : collectionProvider.latestCollection;
    final top10Items = collectionProvider.top10Collections;

    return Scaffold(
      backgroundColor: AppColors.cream,
      appBar: AppBar(
        backgroundColor: AppColors.maroonDark,
        foregroundColor: AppColors.cream,
        elevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'SGDPS Collector',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, fontFamily: 'serif'),
            ),
            Text(
              'Namaste, ${auth.user?.fullName ?? "Collector"}',
              style: const TextStyle(fontSize: 11, color: AppColors.goldLight),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: AppColors.gold),
            tooltip: 'Refresh Data',
            onPressed: _loadData,
          ),
          IconButton(
            icon: const Icon(Icons.assessment_outlined, color: AppColors.gold),
            tooltip: 'Collection Reports',
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const ReportsView()),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.logout, color: AppColors.gold),
            tooltip: 'Logout',
            onPressed: _handleLogout,
          ),
        ],
      ),
      body: RefreshIndicator(
        color: AppColors.saffron,
        onRefresh: _loadData,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Error Banner with Retry button if any request failed
              if (hasError)
                Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.red.shade200),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline, color: Colors.red, size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          errorText ?? 'Failed to load data',
                          style: const TextStyle(fontSize: 12, color: Colors.red, fontWeight: FontWeight.w500),
                        ),
                      ),
                      TextButton(
                        onPressed: _loadData,
                        style: TextButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        child: const Text('Retry', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold, fontSize: 12)),
                      ),
                    ],
                  ),
                ),

              // QUICK DATE PRESET CHIPS BAR (Applies to all cards below)
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    DatePreset.today,
                    DatePreset.yesterday,
                    DatePreset.last7Days,
                    DatePreset.thisMonth,
                    DatePreset.allTime,
                  ].map((preset) {
                    final isSelected = _datePreset == preset;
                    return Padding(
                      padding: const EdgeInsets.only(right: 6.0),
                      child: ChoiceChip(
                        label: Text(preset == DatePreset.today
                            ? 'Today'
                            : (preset == DatePreset.yesterday
                                ? 'Yesterday'
                                : (preset == DatePreset.last7Days
                                    ? 'Last 7 Days'
                                    : (preset == DatePreset.thisMonth
                                        ? 'This Month'
                                        : 'All Time')))),
                        selected: isSelected,
                        selectedColor: AppColors.maroonDark,
                        labelStyle: TextStyle(
                          color: isSelected ? Colors.white : AppColors.ink,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                        backgroundColor: AppColors.creamCard,
                        side: BorderSide(
                          color: isSelected ? AppColors.maroonDark : AppColors.creamBorder,
                        ),
                        onSelected: (selected) {
                          if (selected) {
                            setState(() => _datePreset = preset);
                          }
                        },
                      ),
                    );
                  }).toList()
                    ..add(
                      Padding(
                        padding: const EdgeInsets.only(right: 6.0),
                        child: ActionChip(
                          avatar: const Icon(Icons.calendar_month, size: 14, color: AppColors.saffron),
                          label: Text(
                            _datePreset == DatePreset.custom && _customDateRange != null
                                ? _getPresetLabel(DatePreset.custom, _customDateRange)
                                : 'Custom 📅',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: _datePreset == DatePreset.custom ? AppColors.maroonDark : AppColors.ink,
                            ),
                          ),
                          backgroundColor: _datePreset == DatePreset.custom ? AppColors.goldSoft : AppColors.creamCard,
                          side: BorderSide(
                            color: _datePreset == DatePreset.custom ? AppColors.gold : AppColors.creamBorder,
                          ),
                          onPressed: _pickCustomDateRange,
                        ),
                      ),
                    ),
                ),
              ),

              const SizedBox(height: 12),

              // 1. HERO SUMMARY CARD (By Default: Today's Collection Only)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [AppColors.maroonDark, AppColors.maroon, Color(0xFF631520)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.gold.withOpacity(0.4), width: 1.5),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.maroon.withOpacity(0.35),
                      blurRadius: 16,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Top Row: Title + Filter Action Pill
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            _getHeroCardTitle(),
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1.1,
                              color: AppColors.goldLight,
                            ),
                          ),
                        ),
                        InkWell(
                          onTap: _showFilterOptionsModal,
                          borderRadius: BorderRadius.circular(12),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppColors.gold.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: AppColors.goldLight.withOpacity(0.6)),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.tune, color: AppColors.goldLight, size: 14),
                                const SizedBox(width: 4),
                                Text(
                                  _typeFilter == 'All' ? 'Filters' : (_typeFilter == 'ResidentBlock' ? 'Flats' : 'Sponsors'),
                                  style: const TextStyle(
                                    color: AppColors.goldLight,
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),

                    // Big Amount Display (Strictly filtered by selected preset)
                    Text(
                      '₹${heroAmount.toStringAsFixed(0)}',
                      style: const TextStyle(
                        fontSize: 34,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                        fontFamily: 'serif',
                      ),
                    ),
                    const SizedBox(height: 14),
                    const Divider(color: Colors.white24, height: 1),
                    const SizedBox(height: 10),

                    // Bottom Row: Entries count, Type filter indicator & All-time total
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _buildStatItem('Entries Logged', '$heroCount'),
                        if (_typeFilter != 'All')
                          _buildStatItem('Type', _typeFilter == 'ResidentBlock' ? 'Flats' : 'Sponsor')
                        else
                          _buildStatItem('Avg / Entry', heroCount > 0 ? '₹${(heroAmount / heroCount).toStringAsFixed(0)}' : '₹0'),
                        _buildStatItem('All-Time Total', '₹${collectionProvider.totalAmount.toStringAsFixed(0)}'),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 18),

              // 2. ACTION ROW: Compact "Record New Collection" shifted right
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Collection Action',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.ink, fontFamily: 'serif'),
                      ),
                      Text(
                        'Issue instant digital receipt',
                        style: TextStyle(fontSize: 11, color: AppColors.inkMuted),
                      ),
                    ],
                  ),
                  ElevatedButton.icon(
                    onPressed: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(builder: (_) => const AddCollectionView()),
                      );
                    },
                    icon: const Icon(Icons.add_circle, color: Colors.white, size: 18),
                    label: const Text(
                      'Record Collection',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.saffron,
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                      elevation: 2,
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 22),

              // 3. PAYMENT BREAKDOWN HEADER
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Payment Breakdown',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: AppColors.ink,
                      fontFamily: 'serif',
                    ),
                  ),
                  Text(
                    _getPresetLabel(_datePreset, _customDateRange),
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: AppColors.saffron,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              const Text(
                'Tap on any card to view detailed collections',
                style: TextStyle(fontSize: 11, color: AppColors.inkMuted),
              ),
              const SizedBox(height: 12),

              // 4. 5 PAYMENT MODE METRIC CARDS (Matching Color as Top Hero Card & Clickable to Drill Down)
              // Row 1: Cash & UPI
              Row(
                children: [
                  Expanded(
                    child: _buildMaroonModeCard(
                      title: 'Cash',
                      icon: '💵',
                      amount: cashAmount,
                      count: cashCount,
                      onTap: () => _showModeCollectionsModal(
                        title: 'Cash',
                        icon: '💵',
                        items: cashItems,
                        totalAmount: cashAmount,
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _buildMaroonModeCard(
                      title: 'UPI',
                      icon: '📱',
                      amount: upiAmount,
                      count: upiCount,
                      onTap: () => _showModeCollectionsModal(
                        title: 'UPI',
                        icon: '📱',
                        items: upiItems,
                        totalAmount: upiAmount,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),

              // Row 2: Bank Transfer & Cheque
              Row(
                children: [
                  Expanded(
                    child: _buildMaroonModeCard(
                      title: 'Bank Transfer',
                      icon: '🏦',
                      amount: bankAmount,
                      count: bankCount,
                      onTap: () => _showModeCollectionsModal(
                        title: 'Bank Transfer',
                        icon: '🏦',
                        items: bankItems,
                        totalAmount: bankAmount,
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _buildMaroonModeCard(
                      title: 'Cheque',
                      icon: '📑',
                      amount: chequeAmount,
                      count: chequeCount,
                      onTap: () => _showModeCollectionsModal(
                        title: 'Cheque',
                        icon: '📑',
                        items: chequeItems,
                        totalAmount: chequeAmount,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),

              // Row 3: All Transactions (Full Width Maroon Featured Card)
              _buildMaroonAllTransactionsCard(
                amount: allAmount,
                count: allCount,
                period: _getPresetLabel(_datePreset, _customDateRange),
                onTap: () => _showModeCollectionsModal(
                  title: 'All Transactions',
                  icon: '📊',
                  items: allItems,
                  totalAmount: allAmount,
                ),
              ),

              const SizedBox(height: 24),

              // 5. RECENT TRANSACTIONS SECTION (Latest 1 on Dashboard, Top 10 on "View Top 10")
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Latest Transaction',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: AppColors.ink,
                      fontFamily: 'serif',
                    ),
                  ),
                  InkWell(
                    onTap: () => _showTop10Modal(top10Items),
                    borderRadius: BorderRadius.circular(8),
                    child: const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            'View',
                            style: TextStyle(
                              color: AppColors.saffron,
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                            ),
                          ),
                          SizedBox(width: 4),
                          Icon(Icons.arrow_forward_ios, size: 12, color: AppColors.saffron),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),

              if (collectionProvider.isLoading)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(20.0),
                    child: CircularProgressIndicator(color: AppColors.saffron),
                  ),
                )
              else if (latestItem == null)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: AppColors.creamCard,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.creamBorder),
                  ),
                  child: const Column(
                    children: [
                      Icon(Icons.receipt_long_outlined, size: 36, color: AppColors.inkLight),
                      SizedBox(height: 6),
                      Text('No collections logged yet', style: TextStyle(color: AppColors.inkMuted, fontWeight: FontWeight.w500)),
                    ],
                  ),
                )
              else
                _buildTransactionCard(latestItem),

              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  // Maroon Payment Mode Card (Matching Top Hero Card Style)
  Widget _buildMaroonModeCard({
    required String title,
    required String icon,
    required double amount,
    required int count,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        splashColor: AppColors.gold.withOpacity(0.2),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [AppColors.maroonDark, AppColors.maroon, Color(0xFF631520)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: AppColors.gold.withOpacity(0.4), width: 1.3),
            boxShadow: [
              BoxShadow(
                color: AppColors.maroon.withOpacity(0.25),
                blurRadius: 8,
                offset: const Offset(0, 3),
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
                    title,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: AppColors.goldLight,
                      letterSpacing: 0.5,
                    ),
                  ),
                  Text(icon, style: const TextStyle(fontSize: 16)),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                '₹${amount.toStringAsFixed(0)}',
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                  fontFamily: 'serif',
                ),
              ),
              const SizedBox(height: 6),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.gold.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      '$count ${count == 1 ? "entry" : "entries"}',
                      style: const TextStyle(fontSize: 10, color: AppColors.goldLight, fontWeight: FontWeight.bold),
                    ),
                  ),
                  const Icon(Icons.arrow_forward_ios, size: 10, color: AppColors.goldLight),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  // Full-width Maroon All Transactions Card
  Widget _buildMaroonAllTransactionsCard({
    required double amount,
    required int count,
    required String period,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        splashColor: AppColors.gold.withOpacity(0.2),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [AppColors.maroonDark, AppColors.maroon, Color(0xFF631520)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: AppColors.gold.withOpacity(0.5), width: 1.5),
            boxShadow: [
              BoxShadow(
                color: AppColors.maroon.withOpacity(0.3),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                      color: AppColors.gold.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.gold.withOpacity(0.4)),
                    ),
                    child: const Center(
                      child: Text('📊', style: TextStyle(fontSize: 20)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'All Transactions',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                          fontFamily: 'serif',
                        ),
                      ),
                      Text(
                        '$period ($count entries)',
                        style: const TextStyle(fontSize: 11, color: AppColors.goldLight),
                      ),
                    ],
                  ),
                ],
              ),
              Row(
                children: [
                  Text(
                    '₹${amount.toStringAsFixed(0)}',
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: AppColors.goldLight,
                      fontFamily: 'serif',
                    ),
                  ),
                  const SizedBox(width: 6),
                  const Icon(Icons.arrow_forward_ios, size: 12, color: AppColors.goldLight),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTransactionCard(CollectionModel item) {
    final df = DateFormat('dd MMM yyyy, hh:mm a');
    final dateStr = df.format(item.collectionDateTime);

    return Card(
      color: AppColors.creamCard,
      elevation: 1,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: const BorderSide(color: AppColors.creamBorder),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        leading: Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: AppColors.goldSoft,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.gold.withOpacity(0.3)),
          ),
          child: Center(
            child: Text(
              item.type == 'ResidentBlock' ? (item.block?.substring(0, 1) ?? 'A') : 'S',
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                color: AppColors.maroonDark,
                fontSize: 16,
              ),
            ),
          ),
        ),
        title: Text(
          item.type == 'ResidentBlock' ? '${item.block} · Flat ${item.flatNumber}' : (item.category ?? 'Donation'),
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.ink),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 2),
            Text(
              '${item.donorResidentName ?? "Resident"} · ${item.mode}',
              style: const TextStyle(fontSize: 12, color: AppColors.inkMuted),
            ),
            const SizedBox(height: 2),
            Text(
              '#${item.receiptNumber} · $dateStr',
              style: const TextStyle(fontSize: 10, color: AppColors.inkLight),
            ),
          ],
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              '+₹${item.amount.toStringAsFixed(0)}',
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: AppColors.forest,
              ),
            ),
            InkWell(
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => ReceiptView(collection: item)),
                );
              },
              child: const Padding(
                padding: EdgeInsets.symmetric(vertical: 2.0),
                child: Text(
                  'Receipt >',
                  style: TextStyle(fontSize: 11, color: AppColors.saffron, fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 11, color: Colors.white70),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white),
        ),
      ],
    );
  }
}
