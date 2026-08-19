import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useGetCollectionsQuery,
  useCreateCollectionMutation,
  useDeleteCollectionMutation,
} from '../../collections/api/collectionApiSlice';
import { useGetFlatsQuery } from '../api/flatApiSlice';
import { useGetCollectorsQuery } from '../../users/api/userApiSlice';
import { formatCurrency, formatOrdinal } from '../../../utils/formatters';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { DeleteConfirmModal } from '../../../components/ui/DeleteConfirmModal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Badge } from '../../../components/ui/Badge';
import { Building2, Layers, Trash2, IndianRupee, Flame, Plus } from 'lucide-react';
import { PaymentMode, Collection } from '../../collections/types';
import { getActiveBlocks } from '../../../utils/settingsHelper';

export const BlockGridPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: collections = [], isLoading: isCollectionsLoading } = useGetCollectionsQuery();
  const { data: flatsData = [], isLoading: isFlatsLoading } = useGetFlatsQuery();
  const { data: collectors = [] } = useGetCollectorsQuery();
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
  const [entryToDelete, setEntryToDelete] = useState<Collection | null>(null);

  // Collector dropdown options
  const collectorOptions = useMemo(() => {
    const defaultOption = { label: '👑 Admin (System Admin & Treasurer)', value: 'Admin' };
    const collectorList = collectors.map((c) => {
      const name = c.fullName || `${c.firstName} ${c.lastName || ''}`.trim();
      return {
        label: `📱 ${name} (Collector)`,
        value: name,
      };
    });
    return [defaultOption, ...collectorList];
  }, [collectors]);

  const [activeBlocks, setActiveBlocks] = useState<string[]>(() => {
    const fromFlats = Array.from(new Set(flatsData.map((f) => f.block).filter(Boolean)));
    return getActiveBlocks(fromFlats);
  });

  // Keep active blocks in sync with database and settings
  useEffect(() => {
    const fromFlats = Array.from(new Set(flatsData.map((f) => f.block).filter(Boolean)));
    setActiveBlocks(getActiveBlocks(fromFlats));

    const handleSettingsUpdated = () => {
      setActiveBlocks(getActiveBlocks(fromFlats));
    };

    window.addEventListener('sgdps_settings_updated', handleSettingsUpdated);
    return () => window.removeEventListener('sgdps_settings_updated', handleSettingsUpdated);
  }, [flatsData]);

  const availableBlocks = activeBlocks;

  // Ensure activeBlock stays valid
  useEffect(() => {
    if (availableBlocks.length > 0 && !availableBlocks.includes(activeBlock)) {
      setActiveBlock(availableBlocks[0]);
    }
  }, [availableBlocks, activeBlock]);

  // All flats configured specifically for the active block
  const blockFlats = useMemo(() => {
    return flatsData.filter((f) => f.block === activeBlock);
  }, [flatsData, activeBlock]);

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

  // Compute floors with minimum 9 floors for every block, plus any higher floors
  const floors = useMemo(() => {
    const blockFloors = blockFlats.map((f) => f.floor).filter((f) => f > 0);
    const maxFloor = Math.max(9, ...blockFloors);
    return Array.from({ length: maxFloor }, (_, i) => i + 1).reverse();
  }, [blockFlats]);

  // Compute flat unit numbers (min 4 flats per floor, or max unit present)
  const flats = useMemo(() => {
    const units = blockFlats.map((f) => {
      const last = parseInt(f.flatNumber.slice(-1));
      return isNaN(last) ? 1 : last;
    });
    const maxUnit = Math.max(4, ...units);
    return Array.from({ length: maxUnit }, (_, i) => i + 1);
  }, [blockFlats]);

  // Block Totals & Counts
  const { blockTotal, paidCount, totalUnits, pct } = useMemo(() => {
    let sum = 0;
    let paid = 0;
    const total = floors.length * flats.length;
    for (const f of floors) {
      for (const fl of flats) {
        const amt = blockData[f]?.[fl] || 0;
        sum += amt;
        if (amt > 0) paid++;
      }
    }
    const percent = total > 0 ? Math.round((paid / total) * 100) : 0;
    return { blockTotal: sum, paidCount: paid, totalUnits: total, pct: percent };
  }, [blockData, floors, flats]);

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

    localStorage.setItem('sgdps_collector_name', collectorName);

    try {
      const flatNumStr = `${selectedCell.floor}0${selectedCell.flat}`;
      const matched = blockFlats.find(
        (f) => f.flatNumber === flatNumStr || f.flatNumber === String(selectedCell.flat)
      );

      const matchedCollector = collectors.find(
        (c) =>
          c.fullName === collectorName ||
          `${c.firstName} ${c.lastName || ''}`.trim() === collectorName ||
          c.firstName === collectorName ||
          c.email === collectorName
      );

      await createCollection({
        type: 'ResidentBlock',
        flatId: matched?.id,
        block: selectedCell.block,
        floor: selectedCell.floor,
        flatNumber: flatNumStr,
        donorResidentName: residentName.trim() || matched?.ownerName || undefined,
        amount: amt,
        mode: paymentMode,
        collectedByUserId: matchedCollector ? String(matchedCollector.id) : undefined,
        collectedByName: collectorName,
        collectionDateTime: new Date().toISOString(),
      }).unwrap();

      setSelectedCell(null);
      setAmount('2500');
      setResidentName('');
    } catch (err: any) {
      alert(err?.data?.detail || 'Failed to record payment');
    }
  };

  const handleConfirmDeleteEntry = async () => {
    if (!entryToDelete) return;
    await deleteCollection(entryToDelete.id).unwrap();
    setEntryToDelete(null);
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

      {/* Block Selector & Live Summary Bar */}
      <GlassCard className="p-5 bg-white dark:bg-charcoal-800">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Tower Selection Dropdown */}
          <div className="w-full lg:w-72">
            <Select
              label="Select Tower / Block"
              value={activeBlock}
              onChange={(e) => setActiveBlock(e.target.value)}
              options={availableBlocks.map((b) => ({
                label: `🏢 ${b}`,
                value: b,
              }))}
            />
          </div>

          {/* Selected Block Real-Time Statistics */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-4 items-center bg-cream-50/70 dark:bg-charcoal-900/60 p-4 rounded-2xl border border-cream-border dark:border-charcoal-700">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal-400">
                Active Tower
              </span>
              <div className="text-lg font-extrabold text-charcoal-900 dark:text-cream-50 font-display">
                {activeBlock}
              </div>
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal-400">
                Collected Total
              </span>
              <div className="text-lg font-extrabold text-saffron-700 dark:text-gold-400 font-mono">
                {formatCurrency(blockTotal)}
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-charcoal-600 dark:text-charcoal-300">
                  {paidCount} / {totalUnits} Units
                </span>
                <span className="text-saffron-600 dark:text-gold-400">{pct}%</span>
              </div>
              <div className="w-full bg-cream-200 dark:bg-charcoal-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-saffron-600 to-gold-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Interactive Matrix Grid Card */}
      <GlassCard
        title={`${activeBlock} Floor × Flat Grid`}
        subtitle={`Total Collected: ${formatCurrency(blockTotal)} (${paidCount} of ${totalUnits} Units Collected)`}
      >
        {floors.length === 0 || flats.length === 0 ? (
          <div className="py-12 text-center text-charcoal-400">
            <Building2 size={36} className="mx-auto mb-2 opacity-40 text-gold-500" />
            <p className="font-bold text-sm text-charcoal-700 dark:text-cream-200">
              No flats configured for {activeBlock} yet.
            </p>
            <p className="text-xs text-charcoal-400 mt-1 max-w-md mx-auto">
              Flats and floors added in &apos;Flats &amp; Residents&apos; for {activeBlock} will automatically appear in this grid matrix.
            </p>
            <Button
              variant="primary"
              size="sm"
              className="mt-4"
              onClick={() => navigate('/flats')}
              leftIcon={<Plus size={14} />}
            >
              Add Flats for {activeBlock}
            </Button>
          </div>
        ) : (
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
        )}
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
                        <div className="font-bold text-charcoal-800 dark:text-cream-100">
                          {formatCurrency(e.amount)} · <span className="font-normal">{e.donorResidentName || 'Resident'}</span>
                        </div>
                        <div className="text-[11px] text-charcoal-400">
                          {e.receiptNumber} · {e.mode} · by {e.collectedByName || 'Collector'}
                        </div>
                      </div>
                      <button
                        onClick={() => setEntryToDelete(e)}
                        className="text-charcoal-400 hover:text-maroon-700 p-1"
                        title="Delete entry"
                      >
                        <Trash2 size={14} />
                      </button>
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
                <Select
                  label="Collector"
                  value={collectorName}
                  onChange={(e) => setCollectorName(e.target.value)}
                  options={collectorOptions}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-cream-100 dark:border-charcoal-700">
                <Button type="button" variant="ghost" onClick={() => setSelectedCell(null)}>
                  Close
                </Button>
                <Button type="submit" variant="primary" isLoading={isSaving}>
                  Save Entry
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation PIN Modal */}
      {entryToDelete && (
        <DeleteConfirmModal
          isOpen={Boolean(entryToDelete)}
          onClose={() => setEntryToDelete(null)}
          onConfirm={handleConfirmDeleteEntry}
          title="Delete Collection Entry"
          itemName={`Receipt #${entryToDelete.receiptNumber}`}
          description={`This will permanently delete the recorded payment of ${formatCurrency(entryToDelete.amount)} for this unit.`}
        />
      )}
    </div>
  );
};
