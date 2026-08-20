import React, { useState, useMemo } from 'react';
import {
  useGetCollectionsQuery,
  useUpdateCollectionMutation,
  useDeleteCollectionMutation,
} from '../api/collectionApiSlice';
import { useGetFlatsQuery } from '../../flats/api/flatApiSlice';
import { useGetCollectorsQuery } from '../../users/api/userApiSlice';
import { formatCurrency, formatDateTime, parseDateTime } from '../../../utils/formatters';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Modal } from '../../../components/ui/Modal';
import { DeleteConfirmModal } from '../../../components/ui/DeleteConfirmModal';
import {
  Search,
  FileSpreadsheet,
  Trash2,
  Receipt,
  Share2,
  Pencil,
  User,
  Smartphone,
  CreditCard,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { exportToExcel } from '../../../utils/exportHelpers';
import { Collection, PaymentMode, CollectionType } from '../types';
import {
  getSponsorshipCategories,
  getActiveBlocks,
} from '../../../utils/settingsHelper';

const QUICK_AMOUNTS = [500, 1000, 2000, 3000, 5000];

export const CollectionsPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterMode, setFilterMode] = useState('all');
  const [selectedReceipt, setSelectedReceipt] = useState<Collection | null>(null);
  const [collectionToDelete, setCollectionToDelete] = useState<Collection | null>(null);
  const [collectionToEdit, setCollectionToEdit] = useState<Collection | null>(null);

  // Edit Modal State
  const [editType, setEditType] = useState<CollectionType>('ResidentBlock');
  const [editBlock, setEditBlock] = useState('');
  const [editFloor, setEditFloor] = useState<number | ''>('');
  const [editFlat, setEditFlat] = useState<number | ''>('');
  const [editResidentName, setEditResidentName] = useState('');
  const [editOwnerPhone, setEditOwnerPhone] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editCustomCategory, setEditCustomCategory] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editMode, setEditMode] = useState<PaymentMode>('Cash');
  const [editReference, setEditReference] = useState('');
  const [editCollectedByName, setEditCollectedByName] = useState('Admin');
  const [editDate, setEditDate] = useState('');
  const [editRemarks, setEditRemarks] = useState('');
  const [editError, setEditError] = useState('');

  const { data: collections = [], isLoading } = useGetCollectionsQuery();
  const { data: flats = [] } = useGetFlatsQuery();
  const { data: collectors = [] } = useGetCollectorsQuery();
  const [updateCollection, { isLoading: isUpdating }] = useUpdateCollectionMutation();
  const [deleteCollection] = useDeleteCollectionMutation();

  const sponsorshipCategories = useMemo(() => getSponsorshipCategories(), []);

  // Filtered collections
  const filtered = collections.filter((e) => {
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
        !isResident ? e.category : '',
        e.collectedByName,
        e.remarks,
        e.transactionReference,
        e.mode,
        String(e.amount),
      ].filter(Boolean);
      return searchFields.some((field) => (field as string).toLowerCase().includes(q));
    }
    return true;
  });

  const sortedFiltered = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const timeA = parseDateTime(a.collectionDateTime || a.createdAt)?.getTime() || 0;
      const timeB = parseDateTime(b.collectionDateTime || b.createdAt)?.getTime() || 0;
      return timeB - timeA;
    });
  }, [filtered]);

  const totalFilteredAmount = useMemo(() => {
    return sortedFiltered.reduce((s, e) => s + (e.amount || 0), 0);
  }, [sortedFiltered]);

  // Available blocks from database flats
  const availableBlocks = useMemo(() => {
    const fromFlats = Array.from(new Set(flats.filter((f) => f.isActive).map((f) => f.block).filter(Boolean)));
    return getActiveBlocks(fromFlats);
  }, [flats]);

  // Available floors for selected block in edit modal
  const editBlockFlats = useMemo(() => {
    if (!editBlock) return [];
    return flats.filter((f) => f.block === editBlock && f.isActive);
  }, [flats, editBlock]);

  const editAvailableFloors = useMemo(() => {
    if (!editBlock) return [];
    if (editBlockFlats.length > 0) {
      const distinctFloors = Array.from(new Set(editBlockFlats.map((f) => f.floor))).sort((a, b) => a - b);
      return distinctFloors.map((fl) => ({ label: `Floor ${fl}`, value: String(fl) }));
    }
    return Array.from({ length: 18 }, (_, i) => ({ label: `Floor ${i + 1}`, value: String(i + 1) }));
  }, [editBlockFlats, editBlock]);

  const editAvailableFlatUnits = useMemo(() => {
    if (!editBlock || editFloor === '') return [];
    const floorFlats = editBlockFlats.filter((f) => f.floor === Number(editFloor));
    if (floorFlats.length > 0) {
      const unitNumbers = floorFlats.map((f) => {
        const num = parseInt(f.flatNumber, 10);
        return isNaN(num) ? f.flatNumber : (num % 100).toString();
      });
      const distinctUnits = Array.from(new Set(unitNumbers)).sort((a, b) => Number(a) - Number(b));
      return distinctUnits.map((u) => {
        const paddedUnit = Number(u) < 10 ? `0${u}` : u;
        const formattedFlatNum = `${editFloor}${paddedUnit}`;
        return { label: `Flat ${formattedFlatNum} (Unit ${u})`, value: u };
      });
    }
    return Array.from({ length: 9 }, (_, i) => {
      const u = (i + 1).toString();
      const paddedUnit = Number(u) < 10 ? `0${u}` : u;
      const formattedFlatNum = `${editFloor}${paddedUnit}`;
      return { label: `Flat ${formattedFlatNum} (Unit ${u})`, value: u };
    });
  }, [editBlock, editFloor, editBlockFlats]);

  // Matched flat in edit modal
  const editMatchedFlat = useMemo(() => {
    if (!editBlock || editFloor === '' || editFlat === '') return undefined;
    const paddedUnit = Number(editFlat) < 10 ? `0${editFlat}` : `${editFlat}`;
    const targetFlatNum = `${editFloor}${paddedUnit}`;
    return flats.find(
      (f) =>
        f.block === editBlock &&
        f.floor === Number(editFloor) &&
        (f.flatNumber === targetFlatNum ||
          f.flatNumber === `${editFlat}` ||
          parseInt(f.flatNumber, 10) === Number(targetFlatNum))
    );
  }, [flats, editBlock, editFloor, editFlat]);

  // Collector dropdown options
  const collectorOptions = useMemo(() => {
    const defaultOption = { label: '👑 Admin (System Admin & Treasurer)', value: 'Admin' };
    const collectorList = collectors.map((c) => {
      const name = c.fullName || `${c.firstName} ${c.lastName || ''}`.trim();
      return {
        label: `🧑‍💼 ${name} (${c.email})`,
        value: name,
      };
    });
    return [defaultOption, ...collectorList];
  }, [collectors]);

  // Open Edit Modal
  const handleOpenEditModal = (c: Collection) => {
    setCollectionToEdit(c);
    setEditType(c.type);
    setEditBlock(c.block || '');
    setEditFloor(c.floor ?? '');

    if (c.flatNumber) {
      const num = parseInt(c.flatNumber, 10);
      const unit = isNaN(num) ? '' : num % 100;
      setEditFlat(unit || '');
    } else {
      setEditFlat('');
    }

    setEditResidentName(c.donorResidentName || '');
    setEditOwnerPhone('');

    if (c.type === 'SponsorshipOther') {
      if (sponsorshipCategories.includes(c.category || '')) {
        setEditCategory(c.category || '');
        setEditCustomCategory('');
      } else {
        setEditCategory('Other');
        setEditCustomCategory(c.category || '');
      }
    } else {
      setEditCategory('');
      setEditCustomCategory('');
    }

    setEditAmount(String(c.amount));
    setEditMode(c.mode);
    setEditReference(c.transactionReference || '');
    setEditCollectedByName(c.collectedByName || 'Admin');

    if (c.collectionDateTime) {
      const d = new Date(c.collectionDateTime);
      setEditDate(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      );
    } else {
      const d = new Date();
      setEditDate(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      );
    }

    setEditRemarks(c.remarks || '');
    setEditError('');
  };

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectionToEdit) return;

    const amt = parseFloat(editAmount);
    if (isNaN(amt) || amt <= 0) {
      setEditError('Please specify a valid collection amount greater than 0.');
      return;
    }

    if (editType === 'ResidentBlock') {
      if (!editBlock || editFloor === '' || editFlat === '') {
        setEditError('Please select Block, Floor, and Flat unit.');
        return;
      }
    } else {
      const finalCat = editCategory === 'Other' ? editCustomCategory.trim() : editCategory.trim();
      if (!finalCat) {
        setEditError('Please select or specify a category / purpose.');
        return;
      }
    }

    try {
      const paddedUnit = Number(editFlat) < 10 ? `0${editFlat}` : `${editFlat}`;
      const finalFlatNumber = editFloor !== '' && editFlat !== '' ? `${editFloor}${paddedUnit}` : undefined;
      const finalCategory =
        editType === 'SponsorshipOther'
          ? editCategory === 'Other'
            ? editCustomCategory.trim()
            : editCategory.trim()
          : undefined;

      const matchedCollector = collectors.find(
        (col) =>
          col.fullName === editCollectedByName ||
          `${col.firstName} ${col.lastName || ''}`.trim() === editCollectedByName ||
          col.email === editCollectedByName
      );

      const [y, m, d] = editDate.split('-').map(Number);
      const collectionIso = new Date(Date.UTC(y, m - 1, d, 12, 0, 0)).toISOString();

      await updateCollection({
        id: collectionToEdit.id,
        type: editType,
        flatId: editMatchedFlat?.id || collectionToEdit.flatId,
        block: editType === 'ResidentBlock' ? editBlock : undefined,
        floor: editType === 'ResidentBlock' && editFloor !== '' ? Number(editFloor) : undefined,
        flatNumber: editType === 'ResidentBlock' ? finalFlatNumber : undefined,
        category: finalCategory,
        donorResidentName:
          editResidentName.trim() ||
          editMatchedFlat?.ownerName ||
          collectionToEdit.donorResidentName ||
          'Resident',
        amount: amt,
        mode: editMode,
        transactionReference: editReference.trim() || undefined,
        collectedByUserId: matchedCollector ? String(matchedCollector.id) : undefined,
        collectedByName: editCollectedByName,
        remarks: editRemarks.trim() || undefined,
        collectionDateTime: collectionIso,
        ownerPhone: editOwnerPhone.trim() || undefined,
      }).unwrap();

      setCollectionToEdit(null);
    } catch (err: any) {
      setEditError(err?.data?.detail || 'Failed to update collection entry. Please check connection.');
    }
  };

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
            Complete real-time transaction ledger with search, filtering, entry editing, and digital receipts.
          </p>
        </div>

        {/* Action Button */}
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<FileSpreadsheet size={15} />}
          onClick={handleExportExcel}
        >
          Export to Excel
        </Button>
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

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-xl border border-cream-border dark:border-charcoal-700 bg-white/95 dark:bg-charcoal-900 px-3 py-2 text-xs font-bold text-slate-900 dark:text-cream-50 outline-none"
          >
            <option value="all" className="text-slate-900 bg-white dark:bg-charcoal-900 dark:text-cream-50 font-semibold">All Collection Types</option>
            <option value="block" className="text-slate-900 bg-white dark:bg-charcoal-900 dark:text-cream-50 font-semibold">Resident / Block Only</option>
            <option value="other" className="text-slate-900 bg-white dark:bg-charcoal-900 dark:text-cream-50 font-semibold">Sponsorship & Donations</option>
          </select>

          {/* Payment Mode Filter */}
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
            className="rounded-xl border border-cream-border dark:border-charcoal-700 bg-white/95 dark:bg-charcoal-900 px-3 py-2 text-xs font-bold text-slate-900 dark:text-cream-50 outline-none"
          >
            <option value="all" className="text-slate-900 bg-white dark:bg-charcoal-900 dark:text-cream-50 font-semibold">All Payment Modes</option>
            <option value="UPI" className="text-slate-900 bg-white dark:bg-charcoal-900 dark:text-cream-50 font-semibold">UPI / Digital Only</option>
            <option value="Cash" className="text-slate-900 bg-white dark:bg-charcoal-900 dark:text-cream-50 font-semibold">Cash Only</option>
            <option value="BankTransfer" className="text-slate-900 bg-white dark:bg-charcoal-900 dark:text-cream-50 font-semibold">Bank Transfer</option>
            <option value="Cheque" className="text-slate-900 bg-white dark:bg-charcoal-900 dark:text-cream-50 font-semibold">Cheque</option>
          </select>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="border-b border-cream-border dark:border-charcoal-700 text-xs font-bold text-charcoal-500 dark:text-charcoal-400">
                <th className="py-3 px-3">Receipt #</th>
                <th className="py-3 px-3">Unit / Target</th>
                <th className="py-3 px-3">Donor / Resident</th>
                <th className="py-3 px-3">Mode</th>
                <th className="py-3 px-3">Collector & Date</th>
                <th className="py-3 px-3 text-right">Amount</th>
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
                          onClick={() => handleOpenEditModal(c)}
                          className="p-1.5 rounded-lg text-charcoal-500 hover:text-saffron-600 hover:bg-saffron-500/10 transition-colors"
                          title="Edit Collection Entry"
                        >
                          <Pencil size={15} />
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

      {/* Edit Collection Entry Modal */}
      {collectionToEdit && (
        <Modal
          isOpen={Boolean(collectionToEdit)}
          onClose={() => setCollectionToEdit(null)}
          title="Edit Collection Entry"
          subtitle={`Correct Receipt #${collectionToEdit.receiptNumber}`}
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
            {editError && (
              <div className="p-3 rounded-xl bg-maroon-500/10 border border-maroon-500/30 text-maroon-700 dark:text-rose-400 flex items-start gap-2 animate-in fade-in">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{editError}</span>
              </div>
            )}

            {/* Type Selector */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-cream-100 dark:bg-charcoal-900 rounded-xl border border-cream-border dark:border-charcoal-700">
              <button
                type="button"
                onClick={() => setEditType('ResidentBlock')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  editType === 'ResidentBlock'
                    ? 'bg-white dark:bg-charcoal-800 text-saffron-700 dark:text-gold-400 shadow-sm'
                    : 'text-charcoal-500 hover:text-charcoal-900 dark:hover:text-cream-50'
                }`}
              >
                🏢 Resident / Flat
              </button>
              <button
                type="button"
                onClick={() => setEditType('SponsorshipOther')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  editType === 'SponsorshipOther'
                    ? 'bg-white dark:bg-charcoal-800 text-saffron-700 dark:text-gold-400 shadow-sm'
                    : 'text-charcoal-500 hover:text-charcoal-900 dark:hover:text-cream-50'
                }`}
              >
                🤝 Sponsorship / Other
              </button>
            </div>

            {/* Resident Block Details */}
            {editType === 'ResidentBlock' ? (
              <div className="space-y-3 p-3.5 bg-cream-50 dark:bg-charcoal-900/60 rounded-2xl border border-cream-border dark:border-charcoal-700">
                <div className="grid grid-cols-3 gap-2">
                  <Select
                    label="Block *"
                    placeholder="Select Block"
                    value={editBlock}
                    onChange={(e) => {
                      setEditBlock(e.target.value);
                      setEditFloor('');
                      setEditFlat('');
                    }}
                    options={availableBlocks.map((b) => ({ label: `🏢 ${b}`, value: b }))}
                  />

                  <Select
                    label="Floor *"
                    placeholder={editBlock ? 'Select Floor' : 'Pick Block'}
                    value={editFloor === '' ? '' : String(editFloor)}
                    onChange={(e) => {
                      setEditFloor(e.target.value === '' ? '' : Number(e.target.value));
                      setEditFlat('');
                    }}
                    disabled={!editBlock}
                    options={editAvailableFloors}
                  />

                  <Select
                    label="Flat *"
                    placeholder={editFloor !== '' ? 'Select Flat' : 'Pick Floor'}
                    value={editFlat === '' ? '' : String(editFlat)}
                    onChange={(e) => setEditFlat(e.target.value === '' ? '' : Number(e.target.value))}
                    disabled={editFloor === ''}
                    options={editAvailableFlatUnits}
                  />
                </div>

                <Input
                  label="Resident / Payer Name"
                  placeholder="e.g. S. K. Mukherjee"
                  value={editResidentName}
                  onChange={(e) => setEditResidentName(e.target.value)}
                  icon={<User size={14} />}
                />

                <Input
                  label="Phone / WhatsApp Number"
                  placeholder="+91 9876543210"
                  value={editOwnerPhone}
                  onChange={(e) => setEditOwnerPhone(e.target.value)}
                  icon={<Smartphone size={14} />}
                />
              </div>
            ) : (
              <div className="space-y-3 p-3.5 bg-cream-50 dark:bg-charcoal-900/60 rounded-2xl border border-cream-border dark:border-charcoal-700">
                <Select
                  label="Purpose / Category *"
                  placeholder="Donating for..."
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  options={[
                    ...sponsorshipCategories.map((c) => ({ label: c, value: c })),
                    { label: 'Other Custom Purpose...', value: 'Other' },
                  ]}
                />

                {editCategory === 'Other' && (
                  <Input
                    label="Specify Purpose *"
                    required
                    placeholder="e.g. VIP Pass Contribution"
                    value={editCustomCategory}
                    onChange={(e) => setEditCustomCategory(e.target.value)}
                  />
                )}

                <Input
                  label="Donor / Sponsor Organization *"
                  required
                  placeholder="e.g. Apollo Pharmacy / Resident Name"
                  value={editResidentName}
                  onChange={(e) => setEditResidentName(e.target.value)}
                  icon={<User size={14} />}
                />
              </div>
            )}

            {/* Financial Details */}
            <div className="space-y-3">
              <div>
                <Input
                  label="Collection Amount (₹) *"
                  type="number"
                  required
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  icon={<span className="text-xs font-bold">₹</span>}
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {QUICK_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setEditAmount(String(amt))}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        editAmount === String(amt)
                          ? 'bg-saffron-600 text-white'
                          : 'bg-cream-100 dark:bg-charcoal-700 text-charcoal-700 dark:text-cream-200 hover:bg-cream-200 dark:hover:bg-charcoal-600'
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Mode Selector */}
              <div>
                <label className="block text-xs font-bold text-charcoal-700 dark:text-cream-200 mb-1.5">
                  Payment Mode *
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['UPI', 'Cash', 'BankTransfer', 'Cheque'] as PaymentMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setEditMode(mode)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        editMode === mode
                          ? 'border-saffron-500 bg-saffron-500/10 text-saffron-700 dark:text-gold-400 font-extrabold shadow-sm'
                          : 'border-cream-border dark:border-charcoal-700 text-charcoal-600 dark:text-charcoal-300 hover:bg-cream-50 dark:hover:bg-charcoal-700'
                      }`}
                    >
                      {mode === 'BankTransfer' ? 'Bank' : mode}
                    </button>
                  ))}
                </div>
              </div>

              {editMode !== 'Cash' && (
                <Input
                  label="Transaction Reference / UTR Number"
                  placeholder="e.g. UPI Ref / Cheque No"
                  value={editReference}
                  onChange={(e) => setEditReference(e.target.value)}
                  icon={<CreditCard size={14} />}
                />
              )}

              <div className="grid grid-cols-2 gap-2">
                <Select
                  label="Collected By"
                  value={editCollectedByName}
                  onChange={(e) => setEditCollectedByName(e.target.value)}
                  options={collectorOptions}
                />

                <Input
                  label="Collection Date"
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  icon={<Calendar size={14} />}
                />
              </div>

              <Input
                label="Remarks / Audit Notes (Optional)"
                placeholder="e.g. Corrected entry details"
                value={editRemarks}
                onChange={(e) => setEditRemarks(e.target.value)}
              />
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-cream-border dark:border-charcoal-700">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setCollectionToEdit(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isUpdating}
                className="shadow-gold px-5"
              >
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

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
                <Badge variant={selectedReceipt.mode === 'Cash' ? 'cash' : 'upi'} size="sm">
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
