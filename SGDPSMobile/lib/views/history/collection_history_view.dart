import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/constants/colors.dart';
import '../../models/collection_model.dart';
import '../../providers/collection_provider.dart';
import '../collection/receipt_view.dart';

class CollectionHistoryView extends StatefulWidget {
  const CollectionHistoryView({Key? key}) : super(key: key);

  @override
  State<CollectionHistoryView> createState() => _CollectionHistoryViewState();
}

class _CollectionHistoryViewState extends State<CollectionHistoryView> {
  String _filterMode = 'All';
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<CollectionProvider>(context, listen: false).fetchCollections();
    });
  }

  @override
  Widget build(BuildContext context) {
    final collectionProvider = Provider.of<CollectionProvider>(context);

    final filtered = collectionProvider.collections.where((c) {
      if (_filterMode != 'All' && c.mode != _filterMode) return false;
      if (_searchQuery.isNotEmpty) {
        final query = _searchQuery.toLowerCase();
        final match = (c.donorResidentName?.toLowerCase().contains(query) ?? false) ||
            (c.block?.toLowerCase().contains(query) ?? false) ||
            (c.flatNumber?.toLowerCase().contains(query) ?? false) ||
            c.receiptNumber.toLowerCase().contains(query);
        if (!match) return false;
      }
      return true;
    }).toList();

    return Scaffold(
      backgroundColor: AppColors.cream,
      appBar: AppBar(
        backgroundColor: AppColors.maroonDark,
        foregroundColor: Colors.white,
        title: const Text('Collection History', style: TextStyle(fontFamily: 'serif', fontWeight: FontWeight.bold)),
      ),
      body: Column(
        children: [
          // Filter & Search Bar
          Container(
            padding: const EdgeInsets.all(12),
            color: AppColors.creamCard,
            child: Column(
              children: [
                TextField(
                  decoration: InputDecoration(
                    hintText: 'Search by Flat, Name, or Receipt #',
                    hintStyle: const TextStyle(fontSize: 13, color: AppColors.inkLight),
                    prefixIcon: const Icon(Icons.search, color: AppColors.goldDark, size: 20),
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: AppColors.creamBorder),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: AppColors.gold, width: 2),
                    ),
                    filled: true,
                    fillColor: AppColors.cream,
                  ),
                  onChanged: (v) => setState(() => _searchQuery = v),
                ),
                const SizedBox(height: 8),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: ['All', 'Cash', 'UPI', 'BankTransfer'].map((mode) {
                      final isSelected = _filterMode == mode;
                      return Padding(
                        padding: const EdgeInsets.only(right: 6.0),
                        child: ChoiceChip(
                          label: Text(mode),
                          selected: isSelected,
                          selectedColor: AppColors.saffron,
                          labelStyle: TextStyle(
                            color: isSelected ? Colors.white : AppColors.ink,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                          backgroundColor: AppColors.creamCard,
                          side: BorderSide(
                            color: isSelected ? AppColors.saffron : AppColors.creamBorder,
                          ),
                          onSelected: (selected) {
                            if (selected) setState(() => _filterMode = mode);
                          },
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ],
            ),
          ),

          // Total Filtered Bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Showing ${filtered.length} entries',
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.inkMuted),
                ),
                Text(
                  'Total: ₹${filtered.fold<double>(0, (sum, c) => sum + c.amount).toStringAsFixed(0)}',
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.maroonDark),
                ),
              ],
            ),
          ),

          // List
          Expanded(
            child: collectionProvider.isLoading
                ? const Center(child: CircularProgressIndicator(color: AppColors.saffron))
                : filtered.isEmpty
                    ? const Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.search_off, size: 48, color: AppColors.inkLight),
                            SizedBox(height: 8),
                            Text('No matching collections found', style: TextStyle(color: AppColors.inkMuted)),
                          ],
                        ),
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                        itemCount: filtered.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 8),
                        itemBuilder: (context, index) {
                          final c = filtered[index];
                          final dateStr = DateFormat('dd MMM yyyy, hh:mm a').format(c.collectionDateTime);

                          return Card(
                            color: AppColors.creamCard,
                            elevation: 1,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                              side: const BorderSide(color: AppColors.creamBorder),
                            ),
                            child: ListTile(
                              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                              title: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    c.type == 'ResidentBlock'
                                        ? '${c.block} · Flat ${c.flatNumber}'
                                        : (c.category ?? 'Donation'),
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.ink),
                                  ),
                                  Text(
                                    '+₹${c.amount.toStringAsFixed(0)}',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 15,
                                      color: AppColors.forest,
                                    ),
                                  ),
                                ],
                              ),
                              subtitle: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const SizedBox(height: 2),
                                  Text(
                                    '${c.donorResidentName ?? "Resident"} · ${c.mode} ${c.transactionReference != null ? "(" + c.transactionReference! + ")" : ""}',
                                    style: const TextStyle(fontSize: 12, color: AppColors.inkMuted),
                                  ),
                                  const SizedBox(height: 2),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        '#${c.receiptNumber}',
                                        style: const TextStyle(fontSize: 10, color: AppColors.goldDark, fontWeight: FontWeight.bold),
                                      ),
                                      Text(
                                        dateStr,
                                        style: const TextStyle(fontSize: 10, color: AppColors.inkLight),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                              trailing: IconButton(
                                icon: const Icon(Icons.receipt, color: AppColors.saffron, size: 20),
                                tooltip: 'View Receipt',
                                onPressed: () {
                                  Navigator.of(context).push(
                                    MaterialPageRoute(builder: (_) => ReceiptView(collection: c)),
                                  );
                                },
                              ),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}
