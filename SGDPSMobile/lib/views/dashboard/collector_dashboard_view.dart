import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/colors.dart';
import '../../providers/auth_provider.dart';
import '../../providers/collection_provider.dart';
import '../../providers/flat_provider.dart';
import '../collection/add_collection_view.dart';
import '../history/collection_history_view.dart';
import '../auth/login_view.dart';

class CollectorDashboardView extends StatefulWidget {
  const CollectorDashboardView({Key? key}) : super(key: key);

  @override
  State<CollectorDashboardView> createState() => _CollectorDashboardViewState();
}

class _CollectorDashboardViewState extends State<CollectorDashboardView> {
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

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final collectionProvider = Provider.of<CollectionProvider>(context);
    final flatProvider = Provider.of<FlatProvider>(context);

    final bool hasError = collectionProvider.errorMessage != null || flatProvider.errorMessage != null;
    final String? errorText = collectionProvider.errorMessage ?? flatProvider.errorMessage;

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
            icon: const Icon(Icons.history, color: AppColors.gold),
            tooltip: 'Collection History',
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const CollectionHistoryView()),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.logout, color: AppColors.gold),
            tooltip: 'Logout',
            onPressed: () async {
              await auth.logout();
              if (mounted) {
                Navigator.of(context).pushReplacement(
                  MaterialPageRoute(builder: (_) => const LoginView()),
                );
              }
            },
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

              // Hero Summary Card: Deep Maroon + Saffron + Gold
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
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
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'TODAY\'S COLLECTION',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1.2,
                            color: AppColors.goldLight,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppColors.forest.withOpacity(0.25),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppColors.forestLight.withOpacity(0.4)),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.circle, color: Color(0xFF4ADE80), size: 8),
                              SizedBox(width: 4),
                              Text(
                                'Live GPS Sync',
                                style: TextStyle(color: Color(0xFF4ADE80), fontSize: 10, fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      '₹${collectionProvider.todayTotalAmount.toStringAsFixed(0)}',
                      style: const TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                        fontFamily: 'serif',
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Divider(color: Colors.white24, height: 1),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _buildStatItem('Entries Logged', '${collectionProvider.todayCollectionsCount}'),
                        _buildStatItem('All-Time Total', '₹${collectionProvider.totalAmount.toStringAsFixed(0)}'),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // Action CTA: Add Collection
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton.icon(
                  onPressed: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const AddCollectionView()),
                    );
                  },
                  icon: const Icon(Icons.add_circle, color: Colors.white, size: 22),
                  label: const Text(
                    'Record New Collection',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.saffron,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    elevation: 3,
                  ),
                ),
              ),

              const SizedBox(height: 24),

              // Recent Collections Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Recent Collections',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: AppColors.ink,
                      fontFamily: 'serif',
                    ),
                  ),
                  TextButton(
                    onPressed: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(builder: (_) => const CollectionHistoryView()),
                      );
                    },
                    child: const Text('View All', style: TextStyle(color: AppColors.saffron, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),

              const SizedBox(height: 8),

              // Recent List
              if (collectionProvider.isLoading)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(24.0),
                    child: CircularProgressIndicator(color: AppColors.saffron),
                  ),
                )
              else if (collectionProvider.collections.isEmpty)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: AppColors.creamCard,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.creamBorder),
                  ),
                  child: const Column(
                    children: [
                      Icon(Icons.receipt_long_outlined, size: 40, color: AppColors.inkLight),
                      SizedBox(height: 8),
                      Text('No collections logged yet', style: TextStyle(color: AppColors.inkMuted, fontWeight: FontWeight.w500)),
                    ],
                  ),
                )
              else
                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: collectionProvider.collections.take(5).length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final item = collectionProvider.collections[index];
                    return Card(
                      color: AppColors.creamCard,
                      elevation: 1,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                        side: const BorderSide(color: AppColors.creamBorder),
                      ),
                      child: ListTile(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
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
                          item.type == 'ResidentBlock'
                              ? '${item.block} · Flat ${item.flatNumber}'
                              : (item.category ?? 'Donation'),
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.ink),
                        ),
                        subtitle: Text(
                          '${item.donorResidentName ?? "Resident"} · ${item.mode}',
                          style: const TextStyle(fontSize: 12, color: AppColors.inkMuted),
                        ),
                        trailing: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              '+₹${item.amount.toStringAsFixed(0)}',
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                                color: AppColors.forest,
                              ),
                            ),
                            Text(
                              '#${item.receiptNumber}',
                              style: const TextStyle(fontSize: 10, color: AppColors.inkLight),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
            ],
          ),
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
          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white),
        ),
      ],
    );
  }
}
