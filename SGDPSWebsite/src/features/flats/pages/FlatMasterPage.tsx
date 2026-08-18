import React, { useState } from 'react';
import {
  useGetFlatsQuery,
  useCreateFlatMutation,
  useUpdateFlatMutation,
  useDeleteFlatMutation,
} from '../api/flatApiSlice';
import { formatCurrency, formatOrdinal } from '../../../utils/formatters';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import {
  Plus,
  Search,
  FileSpreadsheet,
  Edit2,
  Trash2,
} from 'lucide-react';
import { Flat } from '../types';
import { exportFlatsToExcel } from '../../../utils/exportHelpers';

export const FlatMasterPage: React.FC = () => {
  const [selectedBlock, setSelectedBlock] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingFlat, setEditingFlat] = useState<Flat | null>(null);

  // Form State
  const [block, setBlock] = useState<string>('A-Block');
  const [floor, setFloor] = useState<number>(1);
  const [flatNumber, setFlatNumber] = useState<string>('');
  const [ownerName, setOwnerName] = useState<string>('');
  const [ownerPhone, setOwnerPhone] = useState<string>('');
  const [expectedAmount, setExpectedAmount] = useState<string>('2500');

  const { data: flats = [], isLoading } = useGetFlatsQuery();
  const [createFlat, { isLoading: isCreating }] = useCreateFlatMutation();
  const [updateFlat, { isLoading: isUpdating }] = useUpdateFlatMutation();
  const [deleteFlat] = useDeleteFlatMutation();

  const blocks = ['All', 'A-Block', 'B-Block', 'C-Block', 'D-Block'];

  const filteredFlats = flats.filter((f) => {
    const matchesBlock = selectedBlock === 'All' || f.block === selectedBlock;
    const matchesSearch =
      searchQuery === '' ||
      f.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.flatNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.ownerPhone && f.ownerPhone.includes(searchQuery));
    return matchesBlock && matchesSearch;
  });

  // Flat Statistics
  const totalFlats = flats.length;
  const paidFlats = flats.filter((f) => f.paymentStatus === 'Paid').length;
  const partialFlats = flats.filter((f) => f.paymentStatus === 'PartiallyPaid').length;
  const pendingFlats = flats.filter((f) => f.paymentStatus === 'Pending').length;

  const handleOpenAddModal = () => {
    setEditingFlat(null);
    setBlock('A-Block');
    setFloor(1);
    setFlatNumber('');
    setOwnerName('');
    setOwnerPhone('');
    setExpectedAmount('2500');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (flat: Flat) => {
    setEditingFlat(flat);
    setBlock(flat.block);
    setFloor(flat.floor);
    setFlatNumber(flat.flatNumber);
    setOwnerName(flat.ownerName);
    setOwnerPhone(flat.ownerPhone || '');
    setExpectedAmount(flat.expectedAmount.toString());
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flatNumber.trim() || !ownerName.trim()) return;

    try {
      if (editingFlat) {
        await updateFlat({
          id: editingFlat.id,
          block,
          floor,
          flatNumber: flatNumber.trim(),
          ownerName: ownerName.trim(),
          ownerPhone: ownerPhone.trim(),
          expectedAmount: parseFloat(expectedAmount) || 0,
          isActive: true,
        }).unwrap();
      } else {
        await createFlat({
          block,
          floor,
          flatNumber: flatNumber.trim(),
          ownerName: ownerName.trim(),
          ownerPhone: ownerPhone.trim(),
          expectedAmount: parseFloat(expectedAmount) || 0,
        }).unwrap();
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err?.data?.detail || 'Failed to save flat record');
    }
  };

  const handleDelete = async (id: number) => {
    const pin = window.prompt('Enter PIN to delete this flat record:');
    if (pin === null) return;
    const storedPin = localStorage.getItem('sgdps_delete_pin') || '2026';
    if (pin !== storedPin) {
      alert('Incorrect PIN — record preserved');
      return;
    }

    try {
      await deleteFlat(id).unwrap();
    } catch (err) {
      alert('Could not delete flat');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-charcoal-900 dark:text-cream-50 font-display">
            Flats & Resident Master
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-500 dark:text-charcoal-300 mt-1">
            Directory of resident flats, contribution targets, and real-time payment statuses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<FileSpreadsheet size={15} />}
            onClick={() => exportFlatsToExcel(flats)}
          >
            Export Excel
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={15} />}
            onClick={handleOpenAddModal}
          >
            Add Flat
          </Button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-charcoal-800 border border-cream-border dark:border-charcoal-700 shadow-festive dark:shadow-festive-dark">
          <span className="text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase">Total Units</span>
          <div className="text-2xl font-extrabold text-charcoal-900 dark:text-cream-50 mt-1">{totalFlats}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-charcoal-800 border border-cream-border dark:border-charcoal-700 shadow-festive dark:shadow-festive-dark">
          <span className="text-xs font-bold text-leaf-700 dark:text-leaf-400 uppercase">Cleared / Paid</span>
          <div className="text-2xl font-extrabold text-leaf-700 dark:text-leaf-400 mt-1">{paidFlats}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-charcoal-800 border border-cream-border dark:border-charcoal-700 shadow-festive dark:shadow-festive-dark">
          <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase">Partially Paid</span>
          <div className="text-2xl font-extrabold text-amber-700 dark:text-amber-400 mt-1">{partialFlats}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-charcoal-800 border border-cream-border dark:border-charcoal-700 shadow-festive dark:shadow-festive-dark">
          <span className="text-xs font-bold text-maroon-700 dark:text-rose-400 uppercase">Pending</span>
          <div className="text-2xl font-extrabold text-maroon-700 dark:text-rose-400 mt-1">{pendingFlats}</div>
        </div>
      </div>

      {/* Flats Data Table */}
      <GlassCard title={`Resident Directory (${filteredFlats.length})`}>
        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="flex-1 min-w-[240px] relative flex items-center">
            <Search size={16} className="absolute left-3 text-gold-600 dark:text-gold-400" />
            <input
              type="text"
              placeholder="Search resident name, flat #, contact..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-cream-border dark:border-charcoal-700 bg-cream-50/70 dark:bg-charcoal-900 text-xs sm:text-sm text-charcoal-900 dark:text-cream-50 outline-none focus:ring-2 focus:ring-gold-500/50"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto">
            {blocks.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setSelectedBlock(b)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedBlock === b
                    ? 'bg-gradient-to-r from-saffron-600 to-gold-600 text-white shadow-gold'
                    : 'bg-cream-100 dark:bg-charcoal-700 text-charcoal-700 dark:text-cream-200 hover:bg-cream-200 dark:hover:bg-charcoal-600'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* Directory Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-cream-border dark:border-charcoal-700 text-xs font-bold text-charcoal-500 dark:text-charcoal-400">
                <th className="py-3 px-3">Unit / Flat</th>
                <th className="py-3 px-3">Resident / Owner</th>
                <th className="py-3 px-3">Contact</th>
                <th className="py-3 px-3 text-right">Target</th>
                <th className="py-3 px-3 text-right">Paid</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-100 dark:divide-charcoal-700/60 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-charcoal-400">
                    Loading resident directory…
                  </td>
                </tr>
              ) : filteredFlats.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-charcoal-400">
                    No resident flats match your search.
                  </td>
                </tr>
              ) : (
                filteredFlats.map((f) => (
                  <tr
                    key={f.id}
                    className="hover:bg-cream-50/60 dark:hover:bg-charcoal-700/40 transition-colors"
                  >
                    <td className="py-3.5 px-3 font-bold text-charcoal-900 dark:text-cream-50">
                      {f.block} · Fl {f.floor} · Flat {f.flatNumber}
                    </td>

                    <td className="py-3.5 px-3 font-bold text-charcoal-800 dark:text-cream-200">
                      {f.ownerName}
                    </td>

                    <td className="py-3.5 px-3 text-charcoal-500 dark:text-charcoal-400">
                      {f.ownerPhone || 'N/A'}
                    </td>

                    <td className="py-3.5 px-3 text-right font-medium text-charcoal-600 dark:text-charcoal-400">
                      {formatCurrency(f.expectedAmount)}
                    </td>

                    <td className="py-3.5 px-3 text-right font-bold text-leaf-700 dark:text-leaf-400">
                      {formatCurrency(f.totalCollected)}
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <Badge
                        variant={
                          f.paymentStatus === 'Paid'
                            ? 'success'
                            : f.paymentStatus === 'PartiallyPaid'
                            ? 'warning'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {f.paymentStatus}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(f)}
                          className="p-1.5 rounded-lg text-charcoal-500 hover:text-gold-600 hover:bg-gold-500/10 transition-colors"
                          title="Edit Flat"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(f.id)}
                          className="p-1.5 rounded-lg text-charcoal-500 hover:text-maroon-700 hover:bg-maroon-500/10 transition-colors"
                          title="Delete Flat"
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

      {/* Add / Edit Flat Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingFlat ? 'Edit Resident Flat' : 'Register New Resident Flat'}
          subtitle="Configure unit details and target contribution"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Tower / Block"
                value={block}
                onChange={(e) => setBlock(e.target.value)}
                options={['A-Block', 'B-Block', 'C-Block', 'D-Block'].map((b) => ({
                  label: b,
                  value: b,
                }))}
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
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Flat Number *"
                required
                value={flatNumber}
                onChange={(e) => setFlatNumber(e.target.value)}
                placeholder="101"
              />

              <Input
                label="Target Amount (₹)"
                type="number"
                min="0"
                value={expectedAmount}
                onChange={(e) => setExpectedAmount(e.target.value)}
              />
            </div>

            <Input
              label="Resident / Owner Name *"
              required
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="Full resident name"
            />

            <Input
              label="Phone / WhatsApp Number"
              value={ownerPhone}
              onChange={(e) => setOwnerPhone(e.target.value)}
              placeholder="+91 9876543210"
            />

            <div className="flex justify-end gap-2 pt-3 border-t border-cream-100 dark:border-charcoal-700">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isCreating || isUpdating}>
                {editingFlat ? 'Update Flat' : 'Create Flat'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
