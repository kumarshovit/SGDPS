import React, { useState, useMemo } from 'react';
import {
  useGetFlatsQuery,
  useCreateBlockMutation,
  useUpdateFlatMutation,
  useDeleteFlatMutation,
} from '../api/flatApiSlice';
import { formatCurrency, formatOrdinal } from '../../../utils/formatters';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { DeleteConfirmModal } from '../../../components/ui/DeleteConfirmModal';
import { Input } from '../../../components/ui/Input';
import {
  Plus,
  Search,
  FileSpreadsheet,
  Edit2,
  Trash2,
  Building2,
  Sparkles,
} from 'lucide-react';
import { Flat } from '../types';
import { exportFlatsToExcel } from '../../../utils/exportHelpers';
import { formatBlockName } from '../../../utils/settingsHelper';

export const FlatMasterPage: React.FC = () => {
  const [selectedBlock, setSelectedBlock] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Add Block Modal State
  const [isAddBlockModalOpen, setIsAddBlockModalOpen] = useState<boolean>(false);
  const [blockNameToCreate, setBlockNameToCreate] = useState<string>('');
  const [blockError, setBlockError] = useState<string>('');

  // Edit Flat Modal State
  const [editingFlat, setEditingFlat] = useState<Flat | null>(null);
  const [editOwnerName, setEditOwnerName] = useState<string>('');
  const [editOwnerPhone, setEditOwnerPhone] = useState<string>('');
  const [editFlatNumber, setEditFlatNumber] = useState<string>('');
  const [flatToDelete, setFlatToDelete] = useState<Flat | null>(null);

  const { data: flats = [], isLoading } = useGetFlatsQuery();
  const [createBlock, { isLoading: isCreatingBlock }] = useCreateBlockMutation();
  const [updateFlat, { isLoading: isUpdating }] = useUpdateFlatMutation();
  const [deleteFlat] = useDeleteFlatMutation();

  // Dynamic available blocks strictly from existing flat records
  const availableBlocks = useMemo(() => {
    const fromFlats = Array.from(new Set(flats.map((f) => f.block).filter(Boolean)));
    if (fromFlats.length > 0) return fromFlats;
    return ['A-Block', 'B-Block', 'C-Block', 'D-Block'];
  }, [flats]);

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
  const paidFlats = flats.filter((f) => f.paymentStatus === 'Paid' || (f.totalCollected || 0) > 0).length;
  const unpaidFlats = flats.filter((f) => f.paymentStatus !== 'Paid' && (f.totalCollected || 0) === 0).length;
  const totalCollectedFromFlats = flats.reduce((s, f) => s + (f.totalCollected || 0), 0);

  const handleOpenAddBlockModal = () => {
    setBlockNameToCreate('');
    setBlockError('');
    setIsAddBlockModalOpen(true);
  };

  const handleCreateBlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBlockError('');
    const raw = blockNameToCreate.trim();
    if (!raw) return;

    const formatted = formatBlockName(raw);

    const isDuplicate = availableBlocks.some(
      (b) => b.toLowerCase() === formatted.toLowerCase() || b.toLowerCase() === raw.toLowerCase()
    );

    if (isDuplicate) {
      setBlockError(`Block "${formatted}" already exists in society.`);
      return;
    }

    try {
      await createBlock({
        blockName: formatted,
        floors: 9,
        flatsPerFloor: 7,
      }).unwrap();

      setIsAddBlockModalOpen(false);
      setBlockNameToCreate('');
      setSelectedBlock(formatted);
    } catch (err: any) {
      setBlockError(err?.data?.detail || 'Failed to create block');
    }
  };

  const handleOpenEditModal = (flat: Flat) => {
    setEditingFlat(flat);
    setEditFlatNumber(flat.flatNumber);
    setEditOwnerName(flat.ownerName);
    setEditOwnerPhone(flat.ownerPhone || '');
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFlat || !editFlatNumber.trim() || !editOwnerName.trim()) return;

    try {
      await updateFlat({
        id: editingFlat.id,
        block: editingFlat.block,
        floor: editingFlat.floor,
        flatNumber: editFlatNumber.trim(),
        ownerName: editOwnerName.trim(),
        ownerPhone: editOwnerPhone.trim(),
        expectedAmount: editingFlat.expectedAmount || 0,
        isActive: editingFlat.isActive,
      }).unwrap();

      setEditingFlat(null);
    } catch (err: any) {
      alert(err?.data?.detail || 'Failed to update flat');
    }
  };

  const handleConfirmDeleteFlat = async () => {
    if (!flatToDelete) return;
    await deleteFlat(flatToDelete.id).unwrap();
    setFlatToDelete(null);
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
            Directory of resident flats and real-time payment statuses.
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
            onClick={handleOpenAddBlockModal}
          >
            Add Block
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
          <div className="text-xs text-leaf-600 dark:text-leaf-400 font-bold uppercase tracking-wider">Paid Units</div>
          <div className="text-2xl font-bold text-leaf-700 dark:text-leaf-300 mt-1 font-display">{paidFlats}</div>
        </GlassCard>
        <GlassCard className="p-4 bg-white dark:bg-charcoal-800">
          <div className="text-xs text-maroon-600 dark:text-maroon-400 font-bold uppercase tracking-wider">Unpaid Units</div>
          <div className="text-2xl font-bold text-maroon-700 dark:text-rose-400 mt-1 font-display">{unpaidFlats}</div>
        </GlassCard>
        <GlassCard className="p-4 bg-white dark:bg-charcoal-800">
          <div className="text-xs text-gold-600 dark:text-gold-400 font-bold uppercase tracking-wider">Total Collected</div>
          <div className="text-2xl font-bold text-saffron-700 dark:text-gold-300 mt-1 font-display">{formatCurrency(totalCollectedFromFlats)}</div>
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
                <th className="py-3.5 px-4">Paid (₹)</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-border dark:divide-charcoal-700/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-charcoal-400">
                    Loading resident flats...
                  </td>
                </tr>
              ) : filteredFlats.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-charcoal-400">
                    No resident flats found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredFlats.map((flat) => {
                  const isPaid = flat.paymentStatus === 'Paid' || (flat.totalCollected || 0) > 0;
                  return (
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
                      <td className="py-3.5 px-4 font-bold text-leaf-700 dark:text-leaf-400 font-mono">
                        {formatCurrency(flat.totalCollected || 0)}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={isPaid ? 'success' : 'danger'}>
                          {isPaid ? 'Paid' : 'Unpaid'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(flat)}
                            className="p-1.5 rounded-lg hover:bg-cream-200 dark:hover:bg-charcoal-600 text-charcoal-600 dark:text-charcoal-300 transition-colors"
                            title="Edit Resident Info"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => setFlatToDelete(flat)}
                            className="p-1.5 rounded-lg hover:bg-maroon-100 dark:hover:bg-maroon-900/40 text-maroon-700 dark:text-rose-400 transition-colors"
                            title="Delete Flat"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Add Block Modal */}
      {isAddBlockModalOpen && (
        <Modal
          isOpen={isAddBlockModalOpen}
          onClose={() => setIsAddBlockModalOpen(false)}
          title="Register New Block / Tower"
          subtitle="Automatically generates 9 floors × 7 flats (63 units) for this block"
        >
          <form onSubmit={handleCreateBlockSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Input
                label="Block / Tower (Letter or Name) *"
                required
                autoFocus
                value={blockNameToCreate}
                onChange={(e) => {
                  setBlockNameToCreate(e.target.value);
                  if (blockError) setBlockError('');
                }}
                placeholder="Enter letter (e.g. E, F, G, H) or block name"
                icon={<Building2 size={16} />}
              />
              {blockError && (
                <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 animate-in fade-in">
                  ⚠️ {blockError}
                </p>
              )}
            </div>

            <div className="p-3.5 rounded-2xl bg-gold-500/10 border border-gold-500/30 flex items-start gap-2.5 text-xs text-charcoal-800 dark:text-cream-100">
              <Sparkles size={18} className="text-gold-600 dark:text-gold-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Automatic 63-Unit Initialization:</strong>
                <p className="text-[11px] text-charcoal-500 dark:text-charcoal-300 mt-0.5">
                  Creating this block will automatically provision Floors 1 to 9 with 7 flats per floor (e.g. 101 to 907) ready for instant collection tracking.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-cream-100 dark:border-charcoal-700">
              <Button type="button" variant="ghost" onClick={() => setIsAddBlockModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isCreatingBlock}>
                Create Block & 63 Flats
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Resident Flat Modal */}
      {editingFlat && (
        <Modal
          isOpen={Boolean(editingFlat)}
          onClose={() => setEditingFlat(null)}
          title={`Edit ${editingFlat.block} · Flat ${editingFlat.flatNumber}`}
          subtitle="Update resident name and contact information"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <Input
              label="Flat Number *"
              required
              value={editFlatNumber}
              onChange={(e) => setEditFlatNumber(e.target.value)}
              placeholder="101"
            />

            <Input
              label="Resident / Owner Name *"
              required
              value={editOwnerName}
              onChange={(e) => setEditOwnerName(e.target.value)}
              placeholder="Full resident name"
            />

            <Input
              label="Phone / WhatsApp Number"
              value={editOwnerPhone}
              onChange={(e) => setEditOwnerPhone(e.target.value)}
              placeholder="+91 9876543210"
            />

            <div className="flex justify-end gap-2 pt-3 border-t border-cream-100 dark:border-charcoal-700">
              <Button type="button" variant="ghost" onClick={() => setEditingFlat(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isUpdating}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Flat Confirmation Modal */}
      {flatToDelete && (
        <DeleteConfirmModal
          isOpen={Boolean(flatToDelete)}
          onClose={() => setFlatToDelete(null)}
          onConfirm={handleConfirmDeleteFlat}
          title="Delete Resident Flat"
          itemName={`${flatToDelete.block} · Flat ${flatToDelete.flatNumber}`}
          description={`This will permanently remove Flat ${flatToDelete.flatNumber} (${flatToDelete.ownerName}) from ${flatToDelete.block}.`}
        />
      )}
    </div>
  );
};
