import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateCollectionMutation } from '../api/collectionApiSlice';
import { useGetFlatsQuery } from '../../flats/api/flatApiSlice';
import { useGetCollectorsQuery } from '../../users/api/userApiSlice';
import { formatCurrency, formatOrdinal } from '../../../utils/formatters';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Badge } from '../../../components/ui/Badge';
import {
  Building2,
  Sparkles,
  CheckCircle2,
  IndianRupee,
  Calendar,
  User,
  ArrowRight,
  Flame,
  Check,
  X,
  Smartphone,
} from 'lucide-react';
import { PaymentMode } from '../types';

const DEFAULT_CATEGORIES = [
  'Sponsorship - Pratima',
  'Sponsorship - Decoration & Flowers',
  'Sponsorship - Bhog & Prasad',
  'Sponsorship - Bisarjan & Procession',
  'Sponsorship - Banners & Lighting',
  'Stall / Food Court Collection',
  'Cultural & Stage Sponsor',
  'Mata Ki Chowki Donation',
  'Anandomela Stall',
  'Interest Earned',
  'General Puja Donation',
];

const QUICK_AMOUNTS = [1000, 2100, 2500, 5000, 11000, 21000];

export const AddEntryPage: React.FC = () => {
  const navigate = useNavigate();
  const [entryType, setEntryType] = useState<'ResidentBlock' | 'SponsorshipOther'>('ResidentBlock');
  const [block, setBlock] = useState('A-Block');
  const [floor, setFloor] = useState(1);
  const [flat, setFlat] = useState(1);
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [residentName, setResidentName] = useState('');
  const [amount, setAmount] = useState('2500');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI');
  const [collectedByName, setCollectedByName] = useState(
    localStorage.getItem('sgdps_collector_name') || 'Admin'
  );
  const [referenceNo, setReferenceNo] = useState('');
  const [remarks, setRemarks] = useState('');
  const [collectionDate, setCollectionDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  // Custom Block & Floor State
  const [customBlocks, setCustomBlocks] = useState<string[]>([]);
  const [customFloors, setCustomFloors] = useState<number[]>([]);
  const [isAddingNewBlock, setIsAddingNewBlock] = useState(false);
  const [newBlockInput, setNewBlockInput] = useState('');
  const [isAddingNewFloor, setIsAddingNewFloor] = useState(false);
  const [newFloorInput, setNewFloorInput] = useState('');

  const [successReceipt, setSuccessReceipt] = useState<{
    receiptNo: string;
    amount: number;
    name: string;
    target: string;
  } | null>(null);

  const { data: flats = [] } = useGetFlatsQuery();
  const { data: collectors = [] } = useGetCollectorsQuery();
  const [createCollection, { isLoading: isSaving }] = useCreateCollectionMutation();

  // Collector dropdown options
  const collectorOptions = useMemo(() => {
    const defaultOption = { label: '👑 Admin (System Admin & Treasurer)', value: 'Admin' };
    const collectorList = collectors.map((c) => {
      const name = c.fullName || `${c.firstName} ${c.lastName || ''}`.trim();
      return {
        label: `📱 ${name} (Field Collector)`,
        value: name,
      };
    });
    return [defaultOption, ...collectorList];
  }, [collectors]);

  // Dynamic available blocks combining defaults, loaded flats, and user additions
  const availableBlocks = useMemo(() => {
    const defaults = ['A-Block', 'B-Block', 'C-Block', 'D-Block'];
    const fromFlats = flats.map((f) => f.block).filter(Boolean);
    return Array.from(new Set([...defaults, ...fromFlats, ...customBlocks]));
  }, [flats, customBlocks]);

  // Dynamic available floors
  const availableFloors = useMemo(() => {
    const defaults = Array.from({ length: 9 }, (_, i) => i + 1);
    const fromFlats = flats.map((f) => f.floor).filter((f) => f > 0);
    return Array.from(new Set([...defaults, ...fromFlats, ...customFloors])).sort((a, b) => a - b);
  }, [flats, customFloors]);

  // Match flat if exists
  const selectedFlatNumber = `${floor}0${flat}`;
  const matchedFlat = flats.find(
    (f) =>
      f.block === block &&
      (f.flatNumber === selectedFlatNumber || f.flatNumber === String(flat))
  );

  const handleBlockSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '__ADD_NEW_BLOCK__') {
      setIsAddingNewBlock(true);
      setNewBlockInput('');
    } else {
      setIsAddingNewBlock(false);
      setBlock(val);
    }
  };

  const handleSaveCustomBlock = () => {
    const trimmed = newBlockInput.trim();
    if (trimmed) {
      if (!customBlocks.includes(trimmed)) {
        setCustomBlocks((prev) => [...prev, trimmed]);
      }
      setBlock(trimmed);
      setIsAddingNewBlock(false);
      setNewBlockInput('');
    }
  };

  const handleFloorSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '__ADD_NEW_FLOOR__') {
      setIsAddingNewFloor(true);
      setNewFloorInput('');
    } else {
      setIsAddingNewFloor(false);
      setFloor(parseInt(val));
    }
  };

  const handleSaveCustomFloor = () => {
    const parsed = parseInt(newFloorInput.trim());
    if (!isNaN(parsed) && parsed > 0) {
      if (!customFloors.includes(parsed)) {
        setCustomFloors((prev) => [...prev, parsed]);
      }
      setFloor(parsed);
      setIsAddingNewFloor(false);
      setNewFloorInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;

    localStorage.setItem('sgdps_collector_name', collectedByName);

    const finalBlock = isAddingNewBlock && newBlockInput.trim() ? newBlockInput.trim() : block;
    const finalFloor = isAddingNewFloor && parseInt(newFloorInput.trim()) > 0 ? parseInt(newFloorInput.trim()) : floor;

    try {
      const finalCategory =
        category === 'Other' && customCategory.trim() ? customCategory.trim() : category;

      const result = await createCollection({
        type: entryType,
        flatId: matchedFlat?.id,
        block: entryType === 'ResidentBlock' ? finalBlock : undefined,
        floor: entryType === 'ResidentBlock' ? finalFloor : undefined,
        flatNumber: entryType === 'ResidentBlock' ? `${finalFloor}0${flat}` : undefined,
        category: entryType === 'SponsorshipOther' ? finalCategory : undefined,
        donorResidentName: residentName.trim() || matchedFlat?.ownerName || undefined,
        amount: amt,
        mode: paymentMode,
        transactionReference: referenceNo.trim() || undefined,
        collectedByName: collectedByName,
        remarks: remarks.trim() || undefined,
        collectionDateTime: new Date(collectionDate).toISOString(),
      }).unwrap();

      setSuccessReceipt({
        receiptNo: result.receiptNumber || 'REC-' + Date.now(),
        amount: amt,
        name: residentName.trim() || matchedFlat?.ownerName || 'Resident',
        target:
          entryType === 'ResidentBlock'
            ? `${finalBlock} · Flat ${finalFloor}0${flat}`
            : finalCategory,
      });
    } catch (err: any) {
      alert(err?.data?.detail || 'Failed to record collection. Please check your network.');
    }
  };

  const handleResetForm = () => {
    setSuccessReceipt(null);
    setAmount('2500');
    setResidentName('');
    setReferenceNo('');
    setRemarks('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-charcoal-900 dark:text-cream-50 font-display">
            Record New Collection
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-500 dark:text-charcoal-300 mt-1">
            Log resident flat contributions, sponsorships, or general donations with instant digital receipt generation.
          </p>
        </div>
      </div>

      {/* Success Celebration Card */}
      {successReceipt ? (
        <GlassCard className="text-center py-10 space-y-5 border-gold-500/40">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-leaf-500/15 border-2 border-leaf-500 text-leaf-600 shadow-glow-leaf">
            <CheckCircle2 size={36} />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-extrabold text-charcoal-900 dark:text-cream-50 font-display">
              Collection Recorded Successfully!
            </h2>
            <p className="text-xs text-charcoal-500 dark:text-charcoal-300">
              Receipt No: <strong className="text-saffron-600 dark:text-gold-400 font-mono">#{successReceipt.receiptNo}</strong>
            </p>
          </div>

          <div className="max-w-sm mx-auto p-4 rounded-2xl bg-cream-50 dark:bg-charcoal-900 border border-cream-border dark:border-charcoal-700 text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-charcoal-500 dark:text-charcoal-400">Target / Unit:</span>
              <strong className="text-charcoal-800 dark:text-cream-100">{successReceipt.target}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal-500 dark:text-charcoal-400">Paid By:</span>
              <strong className="text-charcoal-800 dark:text-cream-100">{successReceipt.name}</strong>
            </div>
            <div className="flex justify-between border-t border-cream-border dark:border-charcoal-700 pt-2 font-bold text-sm">
              <span className="text-charcoal-800 dark:text-cream-100">Amount Received:</span>
              <span className="text-leaf-600 dark:text-leaf-400">{formatCurrency(successReceipt.amount)}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <Button variant="secondary" onClick={handleResetForm}>
              + Record Another Entry
            </Button>
            <Button variant="primary" onClick={() => navigate('/collections')}>
              View All Collections
            </Button>
          </div>
        </GlassCard>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Top Switcher: Resident vs Sponsorship */}
          <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-cream-100 dark:bg-charcoal-900 border border-cream-border dark:border-charcoal-700">
            <button
              type="button"
              onClick={() => setEntryType('ResidentBlock')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                entryType === 'ResidentBlock'
                  ? 'bg-white dark:bg-charcoal-800 text-saffron-700 dark:text-gold-400 shadow-md border border-cream-border dark:border-charcoal-600'
                  : 'text-charcoal-600 dark:text-charcoal-300 hover:text-charcoal-900 dark:hover:text-cream-50'
              }`}
            >
              <Building2 size={18} />
              Resident Flat Collection
            </button>
            <button
              type="button"
              onClick={() => setEntryType('SponsorshipOther')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                entryType === 'SponsorshipOther'
                  ? 'bg-white dark:bg-charcoal-800 text-saffron-700 dark:text-gold-400 shadow-md border border-cream-border dark:border-charcoal-600'
                  : 'text-charcoal-600 dark:text-charcoal-300 hover:text-charcoal-900 dark:hover:text-cream-50'
              }`}
            >
              <Sparkles size={18} />
              Sponsorship / Donation / Stalls
            </button>
          </div>

          {/* Location & Unit Selection Card */}
          <GlassCard title="1. Unit & Donor Details">
            {entryType === 'ResidentBlock' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* TOWER / BLOCK */}
                  <div>
                    {!isAddingNewBlock ? (
                      <Select
                        label="Tower / Block"
                        value={block}
                        onChange={handleBlockSelectChange}
                        options={[
                          ...availableBlocks.map((b) => ({ label: b, value: b })),
                          { label: '+ Add Block', value: '__ADD_NEW_BLOCK__' },
                        ]}
                      />
                    ) : (
                      <div>
                        <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-200 mb-1.5">
                          New Block *
                        </label>
                        <div className="flex items-center gap-1.5">
                          <Input
                            autoFocus
                            placeholder="e.g. E-Block, Tower-5"
                            value={newBlockInput}
                            onChange={(e) => setNewBlockInput(e.target.value)}
                            className="text-xs"
                          />
                          <button
                            type="button"
                            onClick={handleSaveCustomBlock}
                            className="p-2.5 rounded-xl bg-saffron-600 text-white hover:bg-saffron-700 flex-shrink-0"
                            title="Save Block"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingNewBlock(false);
                              setNewBlockInput('');
                            }}
                            className="p-2.5 rounded-xl bg-cream-200 dark:bg-charcoal-700 text-charcoal-600 dark:text-charcoal-300"
                            title="Cancel"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* FLOOR LEVEL */}
                  <div>
                    {!isAddingNewFloor ? (
                      <Select
                        label="Floor Level"
                        value={floor}
                        onChange={handleFloorSelectChange}
                        options={[
                          ...availableFloors.map((f) => ({
                            label: `${formatOrdinal(f)} Floor`,
                            value: f,
                          })),
                          { label: '+ Add Floor', value: '__ADD_NEW_FLOOR__' },
                        ]}
                      />
                    ) : (
                      <div>
                        <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-200 mb-1.5">
                          New Floor Number *
                        </label>
                        <div className="flex items-center gap-1.5">
                          <Input
                            type="number"
                            min="1"
                            autoFocus
                            placeholder="e.g. 10, 11, 12"
                            value={newFloorInput}
                            onChange={(e) => setNewFloorInput(e.target.value)}
                            className="text-xs"
                          />
                          <button
                            type="button"
                            onClick={handleSaveCustomFloor}
                            className="p-2.5 rounded-xl bg-saffron-600 text-white hover:bg-saffron-700 flex-shrink-0"
                            title="Add Floor"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingNewFloor(false);
                              setNewFloorInput('');
                            }}
                            className="p-2.5 rounded-xl bg-cream-200 dark:bg-charcoal-700 text-charcoal-600 dark:text-charcoal-300"
                            title="Cancel"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* FLAT NUMBER */}
                  <Select
                    label="Flat Number"
                    value={flat}
                    onChange={(e) => setFlat(parseInt(e.target.value))}
                    options={Array.from({ length: 7 }, (_, i) => i + 1).map((fl) => ({
                      label: `Flat ${fl} (${floor}0${fl})`,
                      value: fl,
                    }))}
                  />
                </div>

                {/* Flat Status Preview Pill */}
                {matchedFlat && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-cream-50 dark:bg-charcoal-900 border border-cream-border dark:border-charcoal-700 text-xs">
                    <div>
                      <span className="text-charcoal-500 dark:text-charcoal-400">Registered Owner: </span>
                      <strong className="text-charcoal-900 dark:text-cream-50">{matchedFlat.ownerName}</strong>
                      {matchedFlat.ownerPhone && (
                        <span className="text-charcoal-400 ml-2">({matchedFlat.ownerPhone})</span>
                      )}
                    </div>
                    <Badge
                      variant={
                        matchedFlat.paymentStatus === 'Paid'
                          ? 'success'
                          : matchedFlat.paymentStatus === 'PartiallyPaid'
                          ? 'warning'
                          : 'danger'
                      }
                    >
                      Status: {matchedFlat.paymentStatus}
                    </Badge>
                  </div>
                )}

                <Input
                  label="Resident / Payer Name (Optional if matching registered owner)"
                  placeholder={matchedFlat?.ownerName || 'e.g. S. K. Mukherjee'}
                  value={residentName}
                  onChange={(e) => setResidentName(e.target.value)}
                  icon={<User size={16} />}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <Select
                  label="Category / Purpose *"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  options={[
                    ...DEFAULT_CATEGORIES.map((c) => ({ label: c, value: c })),
                    { label: 'Other Custom Purpose...', value: 'Other' },
                  ]}
                />

                {category === 'Other' && (
                  <Input
                    label="Specify Purpose *"
                    required
                    placeholder="e.g. VIP Pass Contribution"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                  />
                )}

                <Input
                  label="Donor / Sponsor Organization Name *"
                  required
                  placeholder="e.g. Apollo Pharmacy / Resident Name"
                  value={residentName}
                  onChange={(e) => setResidentName(e.target.value)}
                  icon={<User size={16} />}
                />
              </div>
            )}
          </GlassCard>

          {/* Payment & Amount Card */}
          <GlassCard title="2. Financial Details & Mode">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-200 mb-1.5">
                  Quick Amount Select (₹)
                </label>
                <div className="flex flex-wrap gap-2">
                  {QUICK_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAmount(String(amt))}
                      className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                        amount === String(amt)
                          ? 'bg-gradient-to-r from-saffron-600 to-gold-500 text-white shadow-gold scale-105'
                          : 'bg-cream-100 dark:bg-charcoal-900 border border-cream-border dark:border-charcoal-700 text-charcoal-700 dark:text-charcoal-300 hover:bg-cream-200'
                      }`}
                    >
                      ₹{amt.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Amount Collected (₹) *"
                  type="number"
                  required
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  icon={<IndianRupee size={16} />}
                />

                <div>
                  <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-200 mb-1.5">
                    Payment Mode *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Cash', 'UPI', 'BankTransfer'] as PaymentMode[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setPaymentMode(mode)}
                        className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all text-center ${
                          paymentMode === mode
                            ? 'bg-saffron-50 dark:bg-saffron-950/40 border-saffron-500 text-saffron-700 dark:text-gold-400 shadow-sm'
                            : 'bg-cream-50 dark:bg-charcoal-900 border-cream-border dark:border-charcoal-700 text-charcoal-600 dark:text-charcoal-300'
                        }`}
                      >
                        {mode === 'BankTransfer' ? 'Bank' : mode}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Transaction / Reference ID"
                  placeholder="e.g. UPI Ref / UTR / Cheque #"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                />

                <Input
                  label="Collection Date"
                  type="date"
                  value={collectionDate}
                  onChange={(e) => setCollectionDate(e.target.value)}
                  icon={<Calendar size={16} />}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Collected By (Collector / Admin) *"
                  value={collectedByName}
                  onChange={(e) => setCollectedByName(e.target.value)}
                  options={collectorOptions}
                />

                <Input
                  label="Remarks / Notes"
                  placeholder="Optional remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>
            </div>
          </GlassCard>

          {/* Submit Action */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/collections')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSaving}
              rightIcon={<ArrowRight size={16} />}
              className="px-6 py-3"
            >
              Save & Generate Receipt
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
