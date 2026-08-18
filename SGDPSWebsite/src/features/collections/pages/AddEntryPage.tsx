import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateCollectionMutation } from '../api/collectionApiSlice';
import { useGetFlatsQuery } from '../../flats/api/flatApiSlice';
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

  const [successReceipt, setSuccessReceipt] = useState<{
    receiptNo: string;
    amount: number;
    name: string;
    target: string;
  } | null>(null);

  const { data: flats = [] } = useGetFlatsQuery();
  const [createCollection, { isLoading: isSaving }] = useCreateCollectionMutation();

  const blocks = ['A-Block', 'B-Block', 'C-Block', 'D-Block'];

  // Match flat if exists
  const selectedFlatNumber = `${floor}0${flat}`;
  const matchedFlat = flats.find(
    (f) =>
      f.block === block &&
      (f.flatNumber === selectedFlatNumber || f.flatNumber === String(flat))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;

    localStorage.setItem('sgdps_collector_name', collectedByName.trim());

    try {
      const finalCategory =
        category === 'Other' && customCategory.trim() ? customCategory.trim() : category;

      const result = await createCollection({
        type: entryType,
        flatId: matchedFlat?.id,
        block: entryType === 'ResidentBlock' ? block : undefined,
        floor: entryType === 'ResidentBlock' ? floor : undefined,
        flatNumber: entryType === 'ResidentBlock' ? selectedFlatNumber : undefined,
        category: entryType === 'SponsorshipOther' ? finalCategory : undefined,
        donorResidentName: residentName.trim() || matchedFlat?.ownerName || undefined,
        amount: amt,
        mode: paymentMode,
        transactionReference: referenceNo.trim() || undefined,
        collectedByName: collectedByName.trim(),
        remarks: remarks.trim() || undefined,
        collectionDateTime: new Date(collectionDate).toISOString(),
      }).unwrap();

      setSuccessReceipt({
        receiptNo: result.receiptNumber || 'REC-' + Date.now(),
        amount: amt,
        name: residentName.trim() || matchedFlat?.ownerName || 'Resident',
        target:
          entryType === 'ResidentBlock'
            ? `${block} · Flat ${selectedFlatNumber}`
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
              <span className="font-bold text-charcoal-900 dark:text-cream-50">{successReceipt.target}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal-500 dark:text-charcoal-400">Received From:</span>
              <span className="font-bold text-charcoal-900 dark:text-cream-50">{successReceipt.name}</span>
            </div>
            <div className="flex justify-between border-t border-cream-border dark:border-charcoal-700 pt-2">
              <span className="font-bold text-charcoal-700 dark:text-cream-200">Amount Received:</span>
              <span className="font-extrabold text-leaf-700 dark:text-leaf-400 text-sm">
                {formatCurrency(successReceipt.amount)}
              </span>
            </div>
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <Button variant="secondary" onClick={() => navigate('/collections')}>
              View in Ledger
            </Button>
            <Button variant="primary" onClick={handleResetForm}>
              Record Another Entry
            </Button>
          </div>
        </GlassCard>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Segmented Entry Type Toggle */}
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
                  <Select
                    label="Tower / Block"
                    value={block}
                    onChange={(e) => setBlock(e.target.value)}
                    options={blocks.map((b) => ({ label: b, value: b }))}
                  />

                  <Select
                    label="Floor Level"
                    value={floor}
                    onChange={(e) => setFloor(parseInt(e.target.value))}
                    options={Array.from({ length: 9 }, (_, i) => i + 1).map((f) => ({
                      label: `${formatOrdinal(f)} Floor`,
                      value: f,
                    }))}
                  />

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
                          : 'brand'
                      }
                    >
                      {matchedFlat.paymentStatus} · Paid {formatCurrency(matchedFlat.totalCollected)} / {formatCurrency(matchedFlat.expectedAmount)}
                    </Badge>
                  </div>
                )}

                <Input
                  label="Resident / Payer Name (Optional override)"
                  placeholder={matchedFlat?.ownerName || 'Resident full name'}
                  value={residentName}
                  onChange={(e) => setResidentName(e.target.value)}
                  icon={<User size={16} />}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Sponsorship / Collection Category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  options={DEFAULT_CATEGORIES.map((c) => ({ label: c, value: c }))}
                />
                <Input
                  label="Donor / Sponsor / Vendor Name"
                  placeholder="e.g. Ramesh Chandra / Krishna Sweets"
                  value={residentName}
                  onChange={(e) => setResidentName(e.target.value)}
                  icon={<User size={16} />}
                />
              </div>
            )}
          </GlassCard>

          {/* Amount & Payment Method Card */}
          <GlassCard title="2. Contribution & Payment Mode">
            <div className="space-y-5">
              {/* Quick Amount Chips */}
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 dark:text-cream-200 mb-2">
                  Quick Amount Presets
                </span>
                <div className="flex flex-wrap gap-2">
                  {QUICK_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAmount(String(amt))}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        amount === String(amt)
                          ? 'bg-gradient-to-r from-saffron-600 to-gold-600 text-white shadow-gold'
                          : 'bg-cream-100 dark:bg-charcoal-700 text-charcoal-700 dark:text-cream-200 hover:bg-cream-200 dark:hover:bg-charcoal-600 border border-cream-border dark:border-charcoal-600'
                      }`}
                    >
                      {formatCurrency(amt)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Collected Amount (₹) *"
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="2500"
                  icon={<IndianRupee size={16} />}
                  className="text-lg font-bold text-saffron-700 dark:text-gold-400"
                />

                <Input
                  label="Collection Date"
                  type="date"
                  value={collectionDate}
                  onChange={(e) => setCollectionDate(e.target.value)}
                  icon={<Calendar size={16} />}
                />
              </div>

              {/* Payment Mode Selector Cards */}
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 dark:text-cream-200 mb-2">
                  Payment Mode *
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { mode: 'UPI' as PaymentMode, label: 'UPI / QR Code', icon: '📱' },
                    { mode: 'Cash' as PaymentMode, label: 'Cash In Hand', icon: '💵' },
                    { mode: 'BankTransfer' as PaymentMode, label: 'Bank Transfer', icon: '🏦' },
                    { mode: 'Cheque' as PaymentMode, label: 'Cheque', icon: '📑' },
                  ].map((item) => (
                    <button
                      key={item.mode}
                      type="button"
                      onClick={() => setPaymentMode(item.mode)}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between h-20 ${
                        paymentMode === item.mode
                          ? 'border-gold-500 bg-gold-500/15 text-gold-800 dark:text-gold-300 shadow-gold font-bold'
                          : 'border-cream-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-700 dark:text-cream-200 hover:border-gold-400'
                      }`}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span className="text-xs font-bold">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Collector & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Collected By (Collector Name) *"
                  required
                  value={collectedByName}
                  onChange={(e) => setCollectedByName(e.target.value)}
                  placeholder="Admin / Collector name"
                />
                <Input
                  label="Reference / UTR / Cheque Number (Optional)"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  placeholder="e.g. UPI Ref #429812903"
                />
              </div>

              <Input
                label="Remarks / Notes (Optional)"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Any special acknowledgement or receipt remark"
              />
            </div>
          </GlassCard>

          {/* Submit Action */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSaving}
              rightIcon={<ArrowRight size={18} />}
            >
              Submit & Issue Receipt
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
