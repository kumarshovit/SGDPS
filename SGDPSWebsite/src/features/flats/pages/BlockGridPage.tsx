import React, { useState, useMemo } from 'react';
import {
  useGetCollectionsQuery,
  useCreateCollectionMutation,
  useDeleteCollectionMutation,
} from '../../collections/api/collectionApiSlice';
import { formatCurrency, formatOrdinal } from '../../../utils/formatters';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Building2, Layers, CheckCircle2, AlertCircle, Plus, Trash2, IndianRupee } from 'lucide-react';
import { PaymentMode } from '../../collections/types';

const DEFAULT_BLOCKS = ['A-Block', 'B-Block', 'C-Block', 'D-Block'];
const NUM_FLOORS = 9;
const NUM_FLATS = 7;

export const BlockGridPage: React.FC = () => {
  const { data: collections = [], isLoading } = useGetCollectionsQuery();
  const [activeBlock, setActiveBlock] = useState('A-Block');
  const [selectedCell, setSelectedCell] = useState<{
    block: string;
    floor: number;
    flat: number;
  } | null>(null);

  // Quick collection modal state
  const [amount, setAmount] = useState('2500');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI');
  const [residentName, setResidentName] = useState('');
  const [collectorName, setCollectorName] = useState(
    localStorage.getItem('sgdps_collector_name') || 'Admin'
  );

  const [createCollection, { isLoading: isSaving }] = useCreateCollectionMutation();
  const [deleteCollection] = useDeleteCollectionMutation();

  // Grid aggregation: gridData[block][floor][flat] = totalAmount
  const gridData = useMemo(() => {
    const map: Record<string, Record<number, Record<number, number>>> = {};
    for (const c of collections) {
      if (c.type !== 'ResidentBlock') continue;
      const b = c.block || 'A-Block';
      const fl = c.floor || 1;
      let fNum = 1;
      if (c.flatNumber) {
        const lastDigit = parseInt(c.flatNumber.slice(-1));
        fNum = isNaN(lastDigit) ? 1 : lastDigit;
      }
      map[b] = map[b] || {};
      map[b][fl] = map[b][fl] || {};
      map[b][fl][fNum] = (map[b][fl][fNum] || 0) + (c.amount || 0);
    }
    return map;
  }, [collections]);

  const blockData = gridData[activeBlock] || {};
  const floors = Array.from({ length: NUM_FLOORS }, (_, i) => i + 1).reverse();
  const flats = Array.from({ length: NUM_FLATS }, (_, i) => i + 1);

  // Block Totals & Counts
  const { blockTotal, paidCount, totalUnits } = useMemo(() => {
    let sum = 0;
    let paid = 0;
    const total = NUM_FLOORS * NUM_FLATS;
    for (let f = 1; f <= NUM_FLOORS; f++) {
      for (let fl = 1; fl <= NUM_FLATS; fl++) {
        const amt = blockData[f]?.[fl] || 0;
        sum += amt;
        if (amt > 0) paid++;
      }
    }
    return { blockTotal: sum, paidCount: paid, totalUnits: total };
  }, [blockData]);

  // Entries for the selected cell in the modal
  const cellEntries = useMemo(() => {
    if (!selectedCell) return [];
    return collections.filter((c) => {
      if (c.type !== 'ResidentBlock') return false;
      const b = c.block || 'A-Block';
      const fl = c.floor || 1;
      let fNum = 1;
      if (c.flatNumber) {
        const lastDigit = parseInt(c.flatNumber.slice(-1));
        fNum = isNaN(lastDigit) ? 1 : lastDigit;
      }
      return (
        b === selectedCell.block &&
        fl === selectedCell.floor &&
        fNum === selectedCell.flat
      );
    });
  }, [collections, selectedCell]);

  const handleCellClick = (block: string, floor: number, flat: number) => {
    setSelectedCell({ block, floor, flat });
    setAmount('2500');
    setResidentName('');
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCell) return;
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;

    localStorage.setItem('sgdps_collector_name', collectorName.trim());

    try {
      await createCollection({
        type: 'ResidentBlock',
        block: selectedCell.block,
        floor: selectedCell.floor,
        flatNumber: `${selectedCell.floor}0${selectedCell.flat}`,
        donorResidentName: residentName.trim() || undefined,
        amount: amt,
        mode: paymentMode,
        collectedByName: collectorName.trim(),
        collectionDateTime: new Date().toISOString(),
      }).unwrap();

      setAmount('2500');
      setResidentName('');
    } catch (err: any) {
      alert(err?.data?.detail || 'Failed to record payment');
    }
  };

  const handleDeleteEntry = async (id: number) => {
    const pin = window.prompt('Enter PIN to delete collection record:');
    if (pin === null) return;
    const storedPin = localStorage.getItem('sgdps_delete_pin') || '2026';
    if (pin !== storedPin) {
      alert('Incorrect PIN — record preserved');
      return;
    }

    try {
      await deleteCollection(id).unwrap();
    } catch (err) {
      alert('Failed to delete entry');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-charcoal-900 dark:text-cream-50 font-display">
            Block Collection Matrix
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-500 dark:text-charcoal-300 mt-1">
            Visual floor-by-floor occupancy matrix with instant collection tracking.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs bg-white dark:bg-charcoal-800 border border-cream-border dark:border-charcoal-700 p-2.5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-md bg-leaf-600 shadow-glow-leaf" />
            <span className="font-bold text-charcoal-800 dark:text-cream-100">Collected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-md bg-cream-100 dark:bg-charcoal-900 border border-cream-border dark:border-charcoal-700" />
            <span className="font-bold text-charcoal-500 dark:text-charcoal-400">Pending</span>
          </div>
        </div>
      </div>

      {/* Tower Selector Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {DEFAULT_BLOCKS.map((b) => {
          const bData = gridData[b] || {};
          let sum = 0;
          let count = 0;
          for (let f = 1; f <= NUM_FLOORS; f++) {
            for (let fl = 1; fl <= NUM_FLATS; fl++) {
              const val = bData[f]?.[fl] || 0;
              sum += val;
              if (val > 0) count++;
            }
          }
          const pct = Math.round((count / (NUM_FLOORS * NUM_FLATS)) * 100);
          const isSelected = b === activeBlock;

          return (
            <button
              key={b}
              type="button"
              onClick={() => setActiveBlock(b)}
              className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
                isSelected
                  ? 'border-gold-500 bg-gold-500/15 text-gold-800 dark:text-gold-300 shadow-gold'
                  : 'border-cream-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-700 dark:text-cream-200 hover:border-gold-400'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-charcoal-900 dark:text-cream-50">{b}</span>
                <span className="text-xs font-bold text-saffron-600 dark:text-gold-400">{pct}%</span>
              </div>
              <div className="text-lg font-extrabold text-charcoal-900 dark:text-cream-50">
                {formatCurrency(sum)}
              </div>
              <p className="text-[11px] text-charcoal-500 dark:text-charcoal-400 mt-0.5 font-medium">
                {count} / {NUM_FLOORS * NUM_FLATS} Flats Paid
              </p>
              {/* Gold Progress bar */}
              <div className="w-full bg-cream-200 dark:bg-charcoal-900 h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-saffron-600 to-gold-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Interactive Matrix Grid Card */}
      <GlassCard
        title={`${activeBlock} Floor × Flat Grid`}
        subtitle={`Total Collected: ${formatCurrency(blockTotal)} (${paidCount} of ${totalUnits} Units Collected)`}
      >
        <div className="overflow-x-auto pb-2">
          <table className="w-full border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-cream-border dark:border-charcoal-700">
                <th className="py-2.5 px-3 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400">
                  Floor
                </th>
                {flats.map((f) => (
                  <th
                    key={f}
                    className="py-2.5 px-2 text-center text-xs font-bold text-charcoal-500 dark:text-charcoal-400"
                  >
                    Flat {f}
                  </th>
                ))}
                <th className="py-2.5 px-3 text-right text-xs font-bold text-charcoal-500 dark:text-charcoal-400">
                  Floor Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-100 dark:divide-charcoal-700/60">
              {floors.map((floor) => {
                const floorObj = blockData[floor] || {};
                const floorTotal = Object.values(floorObj).reduce((s, v) => s + v, 0);

                return (
                  <tr key={floor} className="hover:bg-cream-50/50 dark:hover:bg-charcoal-700/30 transition-colors">
                    <td className="py-2.5 px-3 text-xs font-bold text-charcoal-800 dark:text-cream-200 whitespace-nowrap">
                      {formatOrdinal(floor)} Floor
                    </td>
                    {flats.map((flat) => {
                      const amt = floorObj[flat] || 0;
                      const isPaid = amt > 0;

                      return (
                        <td key={flat} className="p-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleCellClick(activeBlock, floor, flat)}
                            className={`w-full py-2 px-1 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center border ${
                              isPaid
                                ? 'bg-leaf-500/15 border-leaf-500/40 text-leaf-800 dark:text-leaf-300 shadow-glow-leaf hover:bg-leaf-500/25'
                                : 'bg-cream-50/70 dark:bg-charcoal-900 border-cream-border dark:border-charcoal-700 text-charcoal-400 hover:border-gold-500/50 hover:bg-cream-100 dark:hover:bg-charcoal-700'
                            }`}
                          >
                            <span className="text-[10px] opacity-75 font-mono">
                              {floor}0{flat}
                            </span>
                            <span className="font-extrabold text-[11px]">
                              {isPaid ? formatCurrency(amt) : '—'}
                            </span>
                          </button>
                        </td>
                      );
                    })}
                    <td className="py-2.5 px-3 text-right text-xs font-extrabold text-charcoal-900 dark:text-cream-50 whitespace-nowrap">
                      {floorTotal > 0 ? formatCurrency(floorTotal) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Quick Collect & Cell Inspector Modal */}
      {selectedCell && (
        <Modal
          isOpen={Boolean(selectedCell)}
          onClose={() => setSelectedCell(null)}
          title={`${selectedCell.block} · Floor ${selectedCell.floor} · Flat ${selectedCell.floor}0${selectedCell.flat}`}
          subtitle="Review existing collections or record a new payment"
        >
          <div className="space-y-4">
            {/* Existing Payments for this flat */}
            {cellEntries.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-charcoal-600 dark:text-cream-300">
                  Recorded Payments ({cellEntries.length})
                </span>
                <div className="divide-y divide-cream-100 dark:divide-charcoal-700 rounded-xl border border-cream-border dark:border-charcoal-700 bg-cream-50 dark:bg-charcoal-900 p-2">
                  {cellEntries.map((e) => (
                    <div key={e.id} className="flex items-center justify-between py-2 px-2 text-xs">
                      <div>
                        <span className="font-bold text-charcoal-900 dark:text-cream-50">
                          {e.donorResidentName || 'Resident'}
                        </span>
                        <p className="text-[10px] text-charcoal-400">
                          {e.mode} · by {e.collectedByName || 'Admin'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-leaf-700 dark:text-leaf-400">
                          {formatCurrency(e.amount)}
                        </span>
                        <button
                          onClick={() => handleDeleteEntry(e.id)}
                          className="p-1 rounded text-maroon-600 hover:bg-maroon-500/10"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Add Form */}
            <form onSubmit={handleQuickAdd} className="space-y-3.5 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Amount (₹) *"
                  type="number"
                  min="1"
                  required
                  autoFocus
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="2500"
                  icon={<IndianRupee size={15} />}
                />
                <Input
                  label="Resident Name"
                  value={residentName}
                  onChange={(e) => setResidentName(e.target.value)}
                  placeholder="Resident name"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Payment Mode"
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                  options={[
                    { label: '📱 UPI', value: 'UPI' },
                    { label: '💵 Cash', value: 'Cash' },
                    { label: '🏦 Bank Transfer', value: 'BankTransfer' },
                    { label: '📑 Cheque', value: 'Cheque' },
                  ]}
                />
                <Input
                  label="Collector Name"
                  value={collectorName}
                  onChange={(e) => setCollectorName(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-cream-100 dark:border-charcoal-700">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setSelectedCell(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={isSaving}>
                  Add Collection
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
};
