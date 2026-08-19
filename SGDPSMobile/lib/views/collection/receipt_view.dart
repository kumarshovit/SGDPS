import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:share_plus/share_plus.dart';
import '../../core/constants/colors.dart';
import '../../models/collection_model.dart';
import '../dashboard/collector_dashboard_view.dart';

class ReceiptView extends StatelessWidget {
  final CollectionModel collection;

  const ReceiptView({Key? key, required this.collection}) : super(key: key);

  void _shareReceipt() {
    final formattedDate = DateFormat('dd MMM yyyy, hh:mm a').format(collection.collectionDateTime);
    final isSponsorship = collection.type == 'SponsorshipOther';

    final text = isSponsorship
        ? '''
✨ *SGDPS OFFICIAL SPONSORSHIP RECEIPT* ✨
━━━━━━━━━━━━━━━━━━━━
📄 *Receipt No:* ${collection.receiptNumber}
📅 *Date:* $formattedDate
🌟 *Category:* ${collection.category ?? 'General Sponsorship'}
👤 *Donor / Sponsor:* ${collection.donorResidentName ?? 'Devotee'}
💰 *Amount Contributed:* ₹${collection.amount.toStringAsFixed(0)}
💳 *Payment Mode:* ${collection.mode}
${collection.transactionReference != null && collection.transactionReference!.isNotEmpty ? '🔖 *Reference No:* ' + collection.transactionReference! : ''}
👮 *Collected By:* ${collection.collectedByName ?? 'Collector'}
━━━━━━━━━━━━━━━━━━━━
Thank you for your generous devotion & sponsorship towards Durga Puja 2026!
'''
        : '''
✨ *SGDPS OFFICIAL RESIDENT RECEIPT* ✨
━━━━━━━━━━━━━━━━━━━━
📄 *Receipt No:* ${collection.receiptNumber}
📅 *Date:* $formattedDate
🏢 *Flat Unit:* ${collection.block ?? ''} · Fl ${collection.floor ?? ''} · Flat ${collection.flatNumber ?? ''}
👤 *Received From:* ${collection.donorResidentName ?? 'Resident'}
💰 *Amount Received:* ₹${collection.amount.toStringAsFixed(0)}
💳 *Payment Mode:* ${collection.mode}
${collection.transactionReference != null && collection.transactionReference!.isNotEmpty ? '🔖 *Reference No:* ' + collection.transactionReference! : ''}
👮 *Collected By:* ${collection.collectedByName ?? 'Collector'}
━━━━━━━━━━━━━━━━━━━━
Thank you for your devotion & contribution!
''';

    Share.share(text.trim(), subject: 'SGDPS Collection Receipt');
  }

  @override
  Widget build(BuildContext context) {
    final formattedDate = DateFormat('dd MMM yyyy, hh:mm a').format(collection.collectionDateTime);
    final isSponsorship = collection.type == 'SponsorshipOther';

    return Scaffold(
      backgroundColor: AppColors.cream,
      appBar: AppBar(
        backgroundColor: AppColors.maroonDark,
        foregroundColor: Colors.white,
        title: Text(
          isSponsorship ? 'Sponsorship Receipt' : 'Official Receipt',
          style: const TextStyle(fontFamily: 'serif', fontWeight: FontWeight.bold),
        ),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () {
            Navigator.of(context).pushAndRemoveUntil(
              MaterialPageRoute(builder: (_) => const CollectorDashboardView()),
              (route) => false,
            );
          },
        ),
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Success Tick Circle
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.forestLight,
                  border: Border.all(color: AppColors.forest, width: 2),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.forest.withOpacity(0.2),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: const Icon(Icons.check, color: AppColors.forest, size: 38),
              ),
              const SizedBox(height: 12),
              Text(
                isSponsorship ? 'Sponsorship Logged Successfully!' : 'Payment Logged Successfully!',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.forest),
              ),
              const SizedBox(height: 16),

              // Physical Receipt Card Style with Gold Border
              Card(
                color: AppColors.creamCard,
                elevation: 4,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                  side: BorderSide(color: AppColors.gold.withOpacity(0.5), width: 1.5),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(20.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Center(
                        child: Column(
                          children: [
                            const Text(
                              'SGDPS Society & Puja Committee',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.maroonDark, fontFamily: 'serif'),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Receipt #${collection.receiptNumber}',
                              style: const TextStyle(fontSize: 11, color: AppColors.goldDark, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 4),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: isSponsorship ? AppColors.goldSoft : AppColors.creamBorder,
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                isSponsorship ? '🌟 SPONSORSHIP / DONATION' : '🏢 RESIDENTIAL COLLECTION',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: isSponsorship ? AppColors.maroonDark : AppColors.inkMuted,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 14),
                      const Divider(color: AppColors.creamBorder, thickness: 1),
                      const SizedBox(height: 10),

                      _buildReceiptRow('Date & Time', formattedDate),
                      
                      if (isSponsorship) ...[
                        if (collection.category != null)
                          _buildReceiptRow('Category', collection.category!),
                        _buildReceiptRow('Donor / Sponsor', collection.donorResidentName ?? 'Devotee'),
                      ] else ...[
                        _buildReceiptRow(
                          'Resident Unit',
                          '${collection.block ?? ""} - ${collection.flatNumber ?? ""}',
                        ),
                        _buildReceiptRow('Received From', collection.donorResidentName ?? 'Resident'),
                      ],

                      _buildReceiptRow('Payment Mode', collection.mode),
                      if (collection.transactionReference != null && collection.transactionReference!.isNotEmpty)
                        _buildReceiptRow('Reference No', collection.transactionReference!),
                      _buildReceiptRow('Collected By', collection.collectedByName ?? 'Collector'),

                      const SizedBox(height: 12),
                      const Divider(color: AppColors.creamBorder, thickness: 1),
                      const SizedBox(height: 12),

                      // Grand Amount Banner
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: AppColors.goldSoft,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.gold.withOpacity(0.3)),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Amount Contributed',
                              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.maroonDark),
                            ),
                            Text(
                              '₹${collection.amount.toStringAsFixed(0)}',
                              style: const TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.bold,
                                color: AppColors.maroonDark,
                                fontFamily: 'serif',
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 20),

              // WhatsApp / Share Button
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton.icon(
                  onPressed: _shareReceipt,
                  icon: const Icon(Icons.share, color: Colors.white, size: 20),
                  label: const Text('Share Receipt (WhatsApp / SMS)', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF25D366), // WhatsApp Green
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                ),
              ),

              const SizedBox(height: 12),

              // Done CTA
              SizedBox(
                width: double.infinity,
                height: 48,
                child: OutlinedButton(
                  onPressed: () {
                    Navigator.of(context).pushAndRemoveUntil(
                      MaterialPageRoute(builder: (_) => const CollectorDashboardView()),
                      (route) => false,
                    );
                  },
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.maroonDark,
                    side: const BorderSide(color: AppColors.creamBorder),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: const Text('Done · Return to Dashboard', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildReceiptRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 12, color: AppColors.inkMuted)),
          const SizedBox(width: 8),
          Flexible(
            child: Text(
              value,
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.ink),
              textAlign: TextAlign.right,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}
