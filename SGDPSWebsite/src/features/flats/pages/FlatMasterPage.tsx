import React, { useState, useMemo } from 'react';
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
  Check,
  X,
  Building,
  Layers,
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

  // Custom Block & Floor State
  const [customBlocks, setCustomBlocks] = useState<string[]>([]);
  const [customFloors, setCustomFloors] = useState<number[]>([]);
  const [isAddingNewBlock, setIsAddingNewBlock] = useState<boolean>(false);
  const [newBlockInput, setNewBlockInput] = useState<string>('');
  const [isAddingNewFloor, setIsAddingNewFloor] = useState<boolean>(false);
  const [newFloorInput, setNewFloorInput] = useState<string>('');

  const { data: flats = [], isLoading } = useGetFlatsQuery();
  const [createFlat, { isLoading: isCreating }] = useCreateFlatMutation();
  const [updateFlat, { isLoading: isUpdating }] = useUpdateFlatMutation();
  const [deleteFlat] = useDeleteFlatMutation();

  // Dynamic available blocks combining default blocks, existing flat records, and custom additions
  const availableBlocks = useMemo(() => {
    const defaults = ['A-Block', 'B-Block', 'C-Block', 'D-Block'];
    const fromFlats = flats.map((f) => f.block).filter(Boolean);
    return Array.from(new Set([...defaults, ...fromFlats, ...customBlocks]));
  }, [flats, customBlocks]);

  // Dynamic available floors combining 1-9, existing flat records, and custom additions
  const availableFloors = useMemo(() => {
    const defaults = Array.from({ length: 9 }, (_, i) => i + 1);
    const fromFlats = flats.map((f) => f.floor).filter((f) => f > 0);
    return Array.from(new Set([...defaults, ...fromFlats, ...customFloors])).sort((a, b) => a - b);
  }, [flats, customFloors]);

  // Filter options with dynamic blocks
  const filterBlocks = useMemo(() => {
    return ['All', ...availableBlocks];
  }, [availableBlocks]);

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
    setBlock(availableBlocks[0] || 'A-Block');
    setFloor(availableFloors[0] || 1);
    setFlatNumber('');
    setOwnerName('');
    setOwnerPhone('');
    setExpectedAmount('2500');
    setIsAddingNewBlock(false);
    setNewBlockInput('');
    setIsAddingNewFloor(false);
    setNewFloorInput('');
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
    setIsAddingNewBlock(false);
    setNewBlockInput('');
    setIsAddingNewFloor(false);
    setNewFloorInput('');
    setIsModalOpen(true);
  };

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
    if (!flatNumber.trim() || !ownerName.trim()) return;

    // Apply any in-progress custom block or floor input
    const finalBlock = isAddingNewBlock && newBlockInput.trim() ? newBlockInput.trim() : block;
    const finalFloor = isAddingNewFloor && parseInt(newFloorInput.trim()) > 0 ? parseInt(newFloorInput.trim()) : floor;

    try {
      if (editingFlat) {
        await updateFlat({
          id: editingFlat.id,
          block: finalBlock,
          floor: finalFloor,
          flatNumber: flatNumber.trim(),
          ownerName: ownerName.trim(),
          ownerPhone: ownerPhone.trim(),
          expectedAmount: parseFloat(expectedAmount) || 0,
          isActive: true,
        }).unwrap();
      } else {
        await createFlat({
          block: finalBlock,
          floor: finalFloor,
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

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <GlassCard className="p-4 bg-white dark:bg-charcoal-800">
          <div className="text-xs text-charcoal-500 dark:text-charcoal-400 font-bold uppercase tracking-wider">Total Units</div>
          <div className="text-2xl font-bold text-charcoal-900 dark:text-cream-50 mt-1 font-display">{totalFlats}</div>
        </GlassCard>
        <GlassCard className="p-4 bg-white dark:bg-charcoal-800">
          <div className="text-xs text-leaf-600 dark:text-leaf-400 font-bold uppercase tracking-wider">Full Paid</div>
          <div className="text-2xl font-bold text-leaf-700 dark:text-leaf-300 mt-1 font-display">{paidFlats}</div>
        </GlassCard>
        <GlassCard className="p-4 bg-white dark:bg-charcoal-800">
          <div className="text-xs text-gold-600 dark:text-gold-400 font-bold uppercase tracking-wider">Partially Paid</div>
          <div className="text-2xl font-bold text-gold-700 dark:text-gold-300 mt-1 font-display">{partialFlats}</div>
        </GlassCard>
        <GlassCard className="p-4 bg-white dark:bg-charcoal-800">
          <div className="text-xs text-maroon-600 dark:text-maroon-400 font-bold uppercase tracking-wider">Pending Units</div>
          <div className="text-2xl font-bold text-maroon-700 dark:text-rose-400 mt-1 font-display">{pendingFlats}</div>
        </GlassCard>
      </div>

      {/* Filter and Search Bar */}
      <GlassCard className="p-4 bg-white dark:bg-charcoal-800">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Dynamic Block Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-thin">
            {filterBlocks.map((b) => (
              <button
                key={b}
                onClick={() => setSelectedBlock(b)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
                  selectedBlock === b
                    ? 'bg-gradient-to-r from-saffron-600 to-gold-500 text-white shadow-gold'
                    : 'bg-cream-100 dark:bg-charcoal-900 text-charcoal-700 dark:text-charcoal-300 hover:bg-cream-200 dark:hover:bg-charcoal-700'
                }`}
              >
                {b}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="w-full md:w-72">
            <Input
              placeholder="Search resident, flat, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search size={16} />}
            />
          </div>
        </div>
      </GlassCard>

      {/* Flats Table */}
      <GlassCard className="overflow-hidden bg-white dark:bg-charcoal-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-cream-100 dark:bg-charcoal-900 border-b border-cream-border dark:border-charcoal-700 text-charcoal-700 dark:text-charcoal-300 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Unit Details</th>
                <th className="py-3.5 px-4">Resident Name</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Target (₹)</th>
                <th className="py-3.5 px-4">Paid (₹)</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-border dark:divide-charcoal-700/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-charcoal-400">
                    Loading resident flats...
                  </td>
                </tr>
              ) : filteredFlats.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-charcoal-400">
                    No resident flats found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredFlats.map((flat) => (
                  <tr
                    key={flat.id}
                    className="hover:bg-cream-50/80 dark:hover:bg-charcoal-700/40 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-charcoal-900 dark:text-cream-50 font-display">
                        {flat.block} · Flat {flat.flatNumber}
                      </div>
                      <div className="text-[11px] text-charcoal-400">{formatOrdinal(flat.floor)} Floor</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-charcoal-800 dark:text-cream-100">
                      {flat.ownerName}
                    </td>
                    <td className="py-3.5 px-4 text-charcoal-500 dark:text-charcoal-400 font-mono text-xs">
                      {flat.ownerPhone || '—'}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-charcoal-800 dark:text-cream-100 font-mono">
                      {formatCurrency(flat.expectedAmount)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-leaf-700 dark:text-leaf-400 font-mono">
                      {formatCurrency(flat.totalCollected || 0)}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          flat.paymentStatus === 'Paid'
                            ? 'success'
                            : flat.paymentStatus === 'PartiallyPaid'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {flat.paymentStatus === 'PartiallyPaid'
                          ? 'Partial'
                          : flat.paymentStatus}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(flat)}
                          className="p-1.5 rounded-lg hover:bg-cream-200 dark:hover:bg-charcoal-600 text-charcoal-600 dark:text-charcoal-300 transition-colors"
                          title="Edit Flat"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(flat.id)}
                          className="p-1.5 rounded-lg hover:bg-maroon-100 dark:hover:bg-maroon-900/40 text-maroon-700 dark:text-rose-400 transition-colors"
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
              {/* TOWER / BLOCK SELECTOR */}
              <div>
                {!isAddingNewBlock ? (
                  <Select
                    label="Tower / Block"
                    value={block}
                    onChange={handleBlockSelectChange}
                    options={[
                      ...availableBlocks.map((b) => ({
                        label: b,
                        value: b,
                      })),
                      {
                        label: '+ Add Block',
                        value: '__ADD_NEW_BLOCK__',
                      },
                    ]}
                  />
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-200 mb-1.5">
                      New Block Name *
                    </label>
                    <div className="flex items-center gap-1.5">
                      <Input
                        autoFocus
                        placeholder="e.g. E-Block, Tower-5, Wing-C"
                        value={newBlockInput}
                        onChange={(e) => setNewBlockInput(e.target.value)}
                        className="text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleSaveCustomBlock}
                        className="p-2.5 rounded-xl bg-saffron-600 text-white hover:bg-saffron-700 flex-shrink-0 transition-all shadow-sm"
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
                        className="p-2.5 rounded-xl bg-cream-200 dark:bg-charcoal-700 text-charcoal-600 dark:text-charcoal-300 hover:bg-cream-300 flex-shrink-0 transition-all"
                        title="Cancel"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* FLOOR LEVEL SELECTOR */}
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
                      {
                        label: '+ Add Floor',
                        value: '__ADD_NEW_FLOOR__',
                      },
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
                        placeholder="e.g. 10, 11, 12, 15"
                        value={newFloorInput}
                        onChange={(e) => setNewFloorInput(e.target.value)}
                        className="text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleSaveCustomFloor}
                        className="p-2.5 rounded-xl bg-saffron-600 text-white hover:bg-saffron-700 flex-shrink-0 transition-all shadow-sm"
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
                        className="p-2.5 rounded-xl bg-cream-200 dark:bg-charcoal-700 text-charcoal-600 dark:text-charcoal-300 hover:bg-cream-300 flex-shrink-0 transition-all"
                        title="Cancel"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
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
