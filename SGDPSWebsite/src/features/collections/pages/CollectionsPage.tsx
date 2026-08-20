import React, { useState, useMemo } from 'react';
import {
  useGetCollectionsQuery,
  useDeleteCollectionMutation,
} from '../api/collectionApiSlice';
import { useGetFlatsQuery } from '../../flats/api/flatApiSlice';
import { getActiveBlocks } from '../../../utils/settingsHelper';
import { formatCurrency, formatDateTime, parseDateTime } from '../../../utils/formatters';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { DeleteConfirmModal } from '../../../components/ui/DeleteConfirmModal';
import { SortableHeader } from '../../../components/ui/SortableHeader';
import { useTableSort } from '../../../hooks/useTableSort';
import {
  Search,
  FileSpreadsheet,
  Trash2,
  Receipt,
  MapPin,
  Share2,
  Calendar,
} from 'lucide-react';
import { exportToExcel } from '../../../utils/exportHelpers';
import { Collection } from '../types';

type DatePreset = 'all' | 'today' | 'yesterday' | 'this_week' | 'this_month' | 'custom';

export const CollectionsPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [filterBlock, setFilterBlock] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterMode, setFilterMode] = useState('all');
  const [selectedReceipt, setSelectedReceipt] = useState<Collection | null>(null);
  const [collectionToDelete, setCollectionToDelete] = useState<Collection | null>(null);

  const { data: collections = [], isLoading } = useGetCollectionsQuery();
  const { data: flats = [] } = useGetFlatsQuery();
  const [deleteCollection] = useDeleteCollectionMutation();

  const availableBlocks = useMemo(() => {
    const set = new Set<string>();
    flats.filter((f) => f.isActive).forEach((f) => {
      if (f.block) set.add(f.block);
    });
    getActiveBlocks().forEach((b) => set.add(b));
    collections.forEach((c) => {
      if (c.block) set.add(c.block);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [flats, collections]);

  const isDateInRange = (dateStr?: string | null): boolean => {
    if (!dateStr) return true;
    if (datePreset === 'all') return true;

    const target = parseDateTime(dateStr);
    if (!target) return true;

    const now = new Date();

    if (datePreset === 'today') {
      return (
        target.getFullYear() === now.getFullYear() &&
        target.getMonth() === now.getMonth() &&
        target.getDate() === now.getDate()
      );
    }

    if (datePreset === 'yesterday') {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return (
        target.getFullYear() === yesterday.getFullYear() &&
        target.getMonth() === yesterday.getMonth() &&
        target.getDate() === yesterday.getDate()
      );
    }

    if (datePreset === 'this_week') {
      const startOfWeek = new Date(now);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      return target >= startOfWeek && target <= endOfWeek;
    }

    if (datePreset === 'this_month') {
      return (
        target.getFullYear() === now.getFullYear() &&
        target.getMonth() === now.getMonth()
      );
    }

    if (datePreset === 'custom') {
      if (fromDate) {
        const start = new Date(fromDate);
        start.setHours(0, 0, 0, 0);
        if (target < start) return false;
      }
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        if (target > end) return false;
      }
      return true;
    }

    return true;
  };

  const filtered = collections.filter((e) => {
    if (!isDateInRange(e.collectionDateTime || e.createdAt)) return false;
    if (filterBlock !== 'all' && e.block !== filterBlock) return false;
    if (filterType !== 'all') {
      if (filterType === 'block' && e.type !== 'ResidentBlock') return false;
      if (filterType === 'other' && e.type !== 'SponsorshipOther') return false;
    }
    if (filterMode !== 'all' && e.mode !== filterMode) return false;
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      const isResident = e.type === 'ResidentBlock';
      
      const searchFields = [
        e.receiptNumber,
        e.donorResidentName,
        isResident ? e.block : '',
        isResident ? `block ${e.block}` : '',
        isResident ? e.flatNumber : '',
        isResident ? `flat ${e.flatNumber}` : '',
        isResident && e.floor ? `floor ${e.floor}` : '',
        isResident && e.floor ? `fl ${e.floor}` : '',
        isResident ? `${e.block} ${e.flatNumber}` : '',
        isResident ? `${e.block} flat ${e.flatNumber}` : '',
        isResident ? `${e.block} - ${e.flatNumber}` : '',
        isResident ? `${e.block} · fl ${e.floor} · flat ${e.flatNumber}` : '',
        isResident ? `${e.block} - fl ${e.floor} - flat ${e.flatNumber}` : '',
        !isResident ? e.category : '',
        e.collectedByName,
        e.remarks,
        e.transactionReference,
        e.mode,
        String(e.amount),
      ].filter(Boolean);

      const matches = searchFields.some((field) =>
        (field as string).toLowerCase().includes(q)
      );
      if (!matches) return false;
    }
    return true;
  });

  const { sortKey, sortDirection, handleSort, sortData } = useTableSort<Collection>();

  const collectionSortGetters: Record<string, (item: Collection) => string | number | boolean | null | undefined> = useMemo(() => ({
    receiptNumber: (c) => c.receiptNumber,
    unit: (c) => c.type === 'ResidentBlock' ? `${c.block} ${c.flatNumber}` : (c.category || ''),
    donorResidentName: (c) => c.donorResidentName || '',
    mode: (c) => c.mode,
    collectedByName: (c) => c.collectedByName || 'Admin',
    amount: (c) => c.amount,
  }), []);

  const defaultSorted = [...filtered].sort((a, b) => {
    const timeA = parseDateTime(a.collectionDateTime || a.createdAt)?.getTime() || 0;
    const timeB = parseDateTime(b.collectionDateTime || b.createdAt)?.getTime() || 0;
    return timeB - timeA;
  });

  const sortedFiltered = sortData(defaultSorted, collectionSortGetters);

  const totalFilteredAmount = sortedFiltered.reduce((s, e) => s + (e.amount || 0), 0);

  const handleExportExcel = () => {
    const data = sortedFiltered.map((c) => ({
      'Receipt No': c.receiptNumber,
      Type: c.type,
      'Block / Unit': c.type === 'ResidentBlock' ? `${c.block} - ${c.flatNumber}` : c.category,
      'Resident / Donor': c.donorResidentName || '',
      'Amount (Rs)': c.amount,
      'Payment Mode': c.mode,
      'Reference No': c.transactionReference || '',
      'Collected By': c.collectedByName || '',
      'Date & Time': formatDateTime(c.collectionDateTime),
      Remarks: c.remarks || '',
    }));
    exportToExcel(data, 'SGDPS_Collections_Ledger');
  };

  const handleConfirmDelete = async () => {
    if (!collectionToDelete) return;
    await deleteCollection(collectionToDelete.id).unwrap();
    setCollectionToDelete(null);
  };

  const handleWhatsAppShare = (c: Collection) => {
    const text = encodeURIComponent(
      `✨ *SGDPS OFFICIAL COLLECTION RECEIPT*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `📄 *Receipt No:* ${c.receiptNumber}\n` +
        `📅 *Date:* ${formatDateTime(c.collectionDateTime)}\n` +
        `🏢 *Target:* ${c.type === 'ResidentBlock' ? `${c.block} · Flat ${c.flatNumber}` : c.category}\n` +
        `👤 *Received From:* ${c.donorResidentName || 'Resident'}\n` +
        `💰 *Amount:* ₹${c.amount}\n` +
        `💳 *Mode:* ${c.mode}\n` +
        `👮 *Collected By:* ${c.collectedByName || 'Collector'}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `Thank you for your generous contribution!`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-charcoal-900 dark:text-cream-50 font-display">
            Collections Ledger
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-500 dark:text-charcoal-300 mt-1">
            Complete real-time transaction ledger with search, filtering, and instant digital receipts.
          </p>
        </div>

        {/* Action Button & Date Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Custom Date Range Pickers (shown when 'custom' is selected) */}
          {datePreset === 'custom' && (
            <div className="flex items-center gap-1.5 bg-cream-50/70 dark:bg-charcoal-900 border border-cream-border dark:border-charcoal-700 rounded-xl px-2.5 py-1.5 text-xs text-charcoal-700 dark:text-cream-200">
              <Calendar size={13} className="text-gold-600 dark:text-gold-400 flex-shrink-0" />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-transparent text-charcoal-900 dark:text-cream-50 text-xs outline-none cursor-pointer"
                title="From Date"
              />
              <span className="text-charcoal-400 font-bold text-xs">–</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-transparent text-charcoal-900 dark:text-cream-50 text-xs outline-none cursor-pointer"
                title="To Date"
              />
            </div>
          )}

          {/* Date Filter Dropdown */}
          <select
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value as DatePreset)}
            className="rounded-xl border border-cream-border dark:border-charcoal-700 bg-cream-50/70 dark:bg-charcoal-900 px-3 py-2 text-xs font-bold text-charcoal-700 dark:text-cream-200 outline-none cursor-pointer hover:border-gold-500/50 transition-colors"
          >
            <option value="all">📅 All Dates</option>
            <option value="today">⚡ Today</option>
            <option value="yesterday">⏪ Yesterday</option>
            <option value="this_week">📆 This Week</option>
            <option value="this_month">🗓️ This Month</option>
            <option value="custom">🔍 Custom Range...</option>
          </select>

          {/* Export to Excel Button */}
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<FileSpreadsheet size={15} />}
            onClick={handleExportExcel}
          >
            Export to Excel
          </Button>
        </div>
      </div>

      {/* Ledger Table GlassCard */}
      <GlassCard
        title={`All Collection Entries (${filtered.length})`}
        subtitle={`Cumulative Total: ${formatCurrency(totalFilteredAmount)}`}
      >
        {/* Search & Multi-Filters Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          {/* Search Box */}
          <div className="flex-1 min-w-[240px] relative flex items-center">
            <Search size={16} className="absolute left-3 text-gold-600 dark:text-gold-400" />
            <input
              type="text"
              placeholder="Search resident, flat, category, receipt #..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-cream-border dark:border-charcoal-700 bg-cream-50/70 dark:bg-charcoal-900 text-xs sm:text-sm text-charcoal-900 dark:text-cream-50 outline-none focus:ring-2 focus:ring-gold-500/50"
            />
          </div>

          {/* Block Filter */}
          <select
            value={filterBlock}
            onChange={(e) => setFilterBlock(e.target.value)}
            className="rounded-xl border border-cream-border dark:border-charcoal-700 bg-cream-50/70 dark:bg-charcoal-900 px-3 py-2 text-xs font-bold text-charcoal-700 dark:text-cream-200 outline-none"
          >
            <option value="all">All Blocks</option>
            {availableBlocks.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-xl border border-cream-border dark:border-charcoal-700 bg-cream-50/70 dark:bg-charcoal-900 px-3 py-2 text-xs font-bold text-charcoal-700 dark:text-cream-200 outline-none"
          >
            <option value="all">All Collection Types</option>
            <option value="block">Resident / Block Only</option>
            <option value="other">Sponsorship & Donations</option>
          </select>

          {/* Payment Mode Filter */}
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
            className="rounded-xl border border-cream-border dark:border-charcoal-700 bg-cream-50/70 dark:bg-charcoal-900 px-3 py-2 text-xs font-bold text-charcoal-700 dark:text-cream-200 outline-none"
          >
            <option value="all">All Payment Modes</option>
            <option value="UPI">UPI / Digital Only</option>
            <option value="Cash">Cash Only</option>
            <option value="BankTransfer">Bank Transfer</option>
            <option value="Cheque">Cheque</option>
          </select>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="border-b border-cream-border dark:border-charcoal-700 text-xs font-bold text-charcoal-500 dark:text-charcoal-400">
                <SortableHeader label="Receipt #" sortKey="receiptNumber" currentSortKey={sortKey} currentSortDir={sortDirection} onSort={handleSort} />
                <SortableHeader label="Unit / Target" sortKey="unit" currentSortKey={sortKey} currentSortDir={sortDirection} onSort={handleSort} />
                <SortableHeader label="Donor / Resident" sortKey="donorResidentName" currentSortKey={sortKey} currentSortDir={sortDirection} onSort={handleSort} />
                <SortableHeader label="Mode" sortKey="mode" currentSortKey={sortKey} currentSortDir={sortDirection} onSort={handleSort} />
                <SortableHeader label="Collector" sortKey="collectedByName" currentSortKey={sortKey} currentSortDir={sortDirection} onSort={handleSort} />
                <SortableHeader label="Amount" sortKey="amount" currentSortKey={sortKey} currentSortDir={sortDirection} onSort={handleSort} className="text-right" />
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-100 dark:divide-charcoal-700/60 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-charcoal-400">
                    Loading collections ledger…
                  </td>
                </tr>
              ) : sortedFiltered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-charcoal-400">
                    No collection entries match your filters.
                  </td>
                </tr>
              ) : (
                sortedFiltered.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-cream-50/60 dark:hover:bg-charcoal-700/40 transition-colors"
                  >
                    <td className="py-3.5 px-3 font-mono font-bold text-saffron-700 dark:text-gold-400">
                      #{c.receiptNumber}
                    </td>

                    <td className="py-3.5 px-3 font-bold text-charcoal-900 dark:text-cream-50">
                      {c.type === 'ResidentBlock'
                        ? `${c.block} · Fl ${c.floor} · Flat ${c.flatNumber}`
                        : c.category}
                    </td>

                    <td className="py-3.5 px-3 text-charcoal-800 dark:text-cream-200">
                      {c.donorResidentName || 'Resident'}
                    </td>

                    <td className="py-3.5 px-3">
                      <Badge
                        variant={
                          c.mode === 'Cash'
                            ? 'cash'
                            : c.mode === 'UPI'
                            ? 'upi'
                            : 'bank'
                        }
                        size="sm"
                      >
                        {c.mode}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-3 text-charcoal-500 dark:text-charcoal-400">
                      <div>by {c.collectedByName || 'Admin'}</div>
                      <div className="text-[10px] text-charcoal-400">
                        {formatDateTime(c.collectionDateTime)}
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-right font-extrabold text-leaf-700 dark:text-leaf-400 text-sm">
                      +{formatCurrency(c.amount)}
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedReceipt(c)}
                          className="p-1.5 rounded-lg text-charcoal-500 hover:text-gold-600 hover:bg-gold-500/10 transition-colors"
                          title="View Digital Receipt"
                        >
                          <Receipt size={15} />
                        </button>
                        <button
                          onClick={() => handleWhatsAppShare(c)}
                          className="p-1.5 rounded-lg text-charcoal-500 hover:text-leaf-600 hover:bg-leaf-500/10 transition-colors"
                          title="Share on WhatsApp"
                        >
                          <Share2 size={15} />
                        </button>
                        <button
                          onClick={() => setCollectionToDelete(c)}
                          className="p-1.5 rounded-lg text-charcoal-500 hover:text-maroon-700 hover:bg-maroon-500/10 transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Digital Receipt Modal */}
      {selectedReceipt && (
        <Modal
          isOpen={Boolean(selectedReceipt)}
          onClose={() => setSelectedReceipt(null)}
          title="Digital Collection Receipt"
          subtitle={`Receipt #${selectedReceipt.receiptNumber}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-cream-50 dark:bg-charcoal-900 border border-cream-border dark:border-charcoal-700 space-y-2.5">
              <div className="flex justify-between">
                <span className="text-charcoal-500">Receipt No:</span>
                <span className="font-mono font-bold text-saffron-700 dark:text-gold-400">
                  {selectedReceipt.receiptNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-500">Target / Unit:</span>
                <span className="font-bold text-charcoal-900 dark:text-cream-50">
                  {selectedReceipt.type === 'ResidentBlock'
                    ? `${selectedReceipt.block} · Floor ${selectedReceipt.floor} · Flat ${selectedReceipt.flatNumber}`
                    : selectedReceipt.category}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-500">Received From:</span>
                <span className="font-bold text-charcoal-900 dark:text-cream-50">
                  {selectedReceipt.donorResidentName || 'Resident'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-500">Payment Mode:</span>
                <Badge variant="upi" size="sm">
                  {selectedReceipt.mode}
                </Badge>
              </div>
              {selectedReceipt.transactionReference && (
                <div className="flex justify-between">
                  <span className="text-charcoal-500">Reference / UTR:</span>
                  <span className="font-mono text-charcoal-700 dark:text-cream-200">
                    {selectedReceipt.transactionReference}
                  </span>
                </div>
              )}
              {selectedReceipt.latitude && (
                <div className="flex justify-between items-center text-leaf-700 dark:text-leaf-400">
                  <span className="flex items-center gap-1">
                    <MapPin size={13} /> GPS Tagged:
                  </span>
                  <span>
                    {selectedReceipt.latitude.toFixed(4)}, {selectedReceipt.longitude?.toFixed(4)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-charcoal-500">Date & Time:</span>
                <span className="text-charcoal-700 dark:text-cream-200">
                  {formatDateTime(selectedReceipt.collectionDateTime)}
                </span>
              </div>
              <div className="flex justify-between border-t border-cream-border dark:border-charcoal-700 pt-2">
                <span className="font-bold text-charcoal-900 dark:text-cream-50 text-sm">Amount:</span>
                <span className="font-extrabold text-leaf-700 dark:text-leaf-400 text-lg">
                  {formatCurrency(selectedReceipt.amount)}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                leftIcon={<Share2 size={14} />}
                onClick={() => handleWhatsAppShare(selectedReceipt)}
              >
                Share via WhatsApp
              </Button>
              <Button variant="primary" onClick={() => setSelectedReceipt(null)}>
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation PIN Modal */}
      {collectionToDelete && (
        <DeleteConfirmModal
          isOpen={Boolean(collectionToDelete)}
          onClose={() => setCollectionToDelete(null)}
          onConfirm={handleConfirmDelete}
          title="Delete Collection Receipt"
          itemName={`Receipt #${collectionToDelete.receiptNumber}`}
          description={`This will permanently delete the collection entry of ${formatCurrency(collectionToDelete.amount)} for ${collectionToDelete.donorResidentName || 'Resident'}.`}
        />
      )}
    </div>
  );
};
