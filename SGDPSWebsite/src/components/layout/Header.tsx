import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { logout } from '../../features/auth/slices/authSlice';
import { ThemeToggle } from '../ui/ThemeToggle';
import {
  Menu,
  Plus,
  LogOut,
  Settings,
  Building2,
  Layers,
  Sparkles,
  Lock,
  Tag,
  X,
  CheckCircle2,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useGetFlatsQuery, useCreateBlockMutation } from '../../features/flats/api/flatApiSlice';
import {
  getSponsorshipCategories,
  saveSponsorshipCategories,
  getDeletePin,
  saveDeletePin,
  getGlobalFloorsPerBlock,
  saveGlobalFloorsPerBlock,
  getGlobalFlatsPerFloor,
  saveGlobalFlatsPerFloor,
  formatBlockName,
  getActiveBlocks,
  saveActiveBlocks,
} from '../../utils/settingsHelper';

export interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);

  // Settings Modal State
  const [showSettings, setShowSettings] = useState(false);
  const [deletePin, setDeletePin] = useState(getDeletePin());
  const [floorsPerBlock, setFloorsPerBlock] = useState<number>(getGlobalFloorsPerBlock());
  const [flatsPerFloor, setFlatsPerFloor] = useState<number>(getGlobalFlatsPerFloor());
  const [activeBlocksList, setActiveBlocksList] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>(getSponsorshipCategories());
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [newBlockInput, setNewBlockInput] = useState('');
  const [pendingNewBlocks, setPendingNewBlocks] = useState<string[]>([]);
  const [blockWarning, setBlockWarning] = useState<string>('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  const { data: flats = [] } = useGetFlatsQuery();
  const [createBlock] = useCreateBlockMutation();

  // Existing blocks from DB
  const existingBlocks = useMemo(() => {
    const fromFlats = Array.from(new Set(flats.map((f) => f.block).filter(Boolean)));
    if (fromFlats.length > 0) return fromFlats;
    return ['A-Block', 'B-Block', 'C-Block', 'D-Block'];
  }, [flats]);

  // Sync settings whenever modal opens
  useEffect(() => {
    if (showSettings) {
      const fromFlats = Array.from(new Set(flats.map((f) => f.block).filter(Boolean)));
      setActiveBlocksList(getActiveBlocks(fromFlats));
      setDeletePin(getDeletePin());
      setFloorsPerBlock(getGlobalFloorsPerBlock());
      setFlatsPerFloor(getGlobalFlatsPerFloor());
      setCategories(getSponsorshipCategories());
      setPendingNewBlocks([]);
      setNewCategoryInput('');
      setNewBlockInput('');
      setBlockWarning('');
      setSaveSuccessMsg('');
    }
  }, [showSettings, flats]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleAddBlockToQueue = () => {
    setBlockWarning('');
    const raw = newBlockInput.trim();
    if (!raw) return;

    const formatted = formatBlockName(raw);

    // Case-insensitive duplicate check against existing and pending blocks
    const allBlocks = [...activeBlocksList, ...pendingNewBlocks];
    const isDuplicate = allBlocks.some(
      (b) => b.toLowerCase() === formatted.toLowerCase() || b.toLowerCase() === raw.toLowerCase()
    );

    if (isDuplicate) {
      setBlockWarning(`Block "${formatted}" already exists in the system.`);
      return;
    }

    setPendingNewBlocks((prev) => [...prev, formatted]);
    setNewBlockInput('');
    setBlockWarning('');
  };

  const handleRemoveExistingBlock = (blockToRemove: string) => {
    setActiveBlocksList((prev) => prev.filter((b) => b !== blockToRemove));
  };

  const handleRemovePendingBlock = (b: string) => {
    setPendingNewBlocks((prev) => prev.filter((item) => item !== b));
  };

  const handleAddCategory = () => {
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;
    if (categories.includes(trimmed)) {
      alert(`Category "${trimmed}" already exists.`);
      return;
    }
    setCategories((prev) => [...prev, trimmed]);
    setNewCategoryInput('');
  };

  const handleRemoveCategory = (catToRemove: string) => {
    setCategories((prev) => prev.filter((c) => c !== catToRemove));
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      // 1. Save Active Blocks (remaining active blocks + newly added blocks)
      const finalBlocks = Array.from(new Set([...activeBlocksList, ...pendingNewBlocks]));
      saveActiveBlocks(finalBlocks);

      // 2. Save PIN & Global dimension defaults
      saveDeletePin(deletePin);
      saveGlobalFloorsPerBlock(floorsPerBlock);
      saveGlobalFlatsPerFloor(flatsPerFloor);

      // 3. Save Sponsorship Categories
      saveSponsorshipCategories(categories);

      // 4. Provision any newly queued blocks into the backend DB
      if (pendingNewBlocks.length > 0) {
        for (const blockName of pendingNewBlocks) {
          await createBlock({
            blockName,
            floors: floorsPerBlock > 0 ? floorsPerBlock : 9,
            flatsPerFloor: flatsPerFloor > 0 ? flatsPerFloor : 7,
          }).unwrap();
        }
      }

      setSaveSuccessMsg('Settings updated successfully!');
      setTimeout(() => {
        setIsSavingSettings(false);
        setShowSettings(false);
      }, 700);
    } catch (err: any) {
      alert(err?.data?.detail || 'Failed to save some settings.');
      setIsSavingSettings(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between px-4 lg:px-8 glass-header">
        {/* Left Side: Mobile Menu Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            type="button"
            className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-cream-border dark:border-charcoal-700 text-charcoal-700 dark:text-cream-200 hover:bg-cream-100 dark:hover:bg-charcoal-700"
          >
            <Menu size={20} />
          </button>
        </div>

        {/* Right Side: Action, Theme Switcher, Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Saffron-to-Gold Add Collection CTA */}
          <Button
            size="sm"
            variant="primary"
            onClick={() => navigate('/add')}
            leftIcon={<Plus size={15} />}
            className="hidden sm:inline-flex"
          >
            Add Collection
          </Button>

          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-cream-border dark:border-charcoal-700 text-charcoal-700 dark:text-cream-200 hover:bg-cream-100 dark:hover:bg-charcoal-700 transition-colors"
            title="System Settings"
          >
            <Settings size={17} />
          </button>

          {/* Dark / Light Mode Switcher */}
          <ThemeToggle />

          {/* User Profile */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-cream-border dark:border-charcoal-700">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-maroon-800 to-saffron-600 text-white font-bold text-xs shadow-gold">
                {user.firstName[0]}
                {user.lastName?.[0] || ''}
              </div>
              <div className="hidden xl:flex flex-col text-left">
                <span className="text-xs font-bold text-charcoal-900 dark:text-cream-50 leading-tight">
                  {user.firstName} {user.lastName}
                </span>
                <span className="text-[10px] text-saffron-600 dark:text-gold-400 font-bold">
                  {user.roles?.[0] || 'Admin'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-charcoal-400 hover:text-maroon-700 dark:hover:text-rose-400 hover:bg-maroon-50 dark:hover:bg-maroon-950/50 transition-colors ml-1"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={() => navigate('/login')}>
              Sign In
            </Button>
          )}
        </div>
      </header>

      {/* Advanced System Settings Modal */}
      {showSettings && (
        <Modal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          title="System Settings"
          subtitle="Configure society blocks, floor layout, sponsorship categories, and security PIN"
          maxWidth="lg"
        >
          <form onSubmit={handleSaveSettings} className="space-y-5">
            {/* 1. Blocks / Towers Section */}
            <div className="space-y-2.5 p-4 rounded-2xl bg-cream-50/70 dark:bg-charcoal-900/60 border border-cream-border dark:border-charcoal-700">
              <div className="flex items-center gap-2 text-xs font-bold text-charcoal-800 dark:text-cream-100">
                <Building2 size={16} className="text-saffron-600 dark:text-gold-400" />
                <span>Society Blocks & Towers</span>
              </div>

              {/* Active & Pending Blocks Pills */}
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                {activeBlocksList.map((b) => (
                  <span
                    key={b}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-white dark:bg-charcoal-800 border border-cream-border dark:border-charcoal-700 text-charcoal-800 dark:text-cream-200 shadow-sm"
                  >
                    {b}
                    <button
                      type="button"
                      onClick={() => handleRemoveExistingBlock(b)}
                      className="text-charcoal-400 hover:text-rose-600 transition-colors"
                      title={`Remove ${b} from Block Grid Matrix`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
                {pendingNewBlocks.map((b) => (
                  <span
                    key={b}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-saffron-500/10 border border-saffron-500/30 text-saffron-700 dark:text-gold-400 animate-in fade-in shadow-sm"
                  >
                    ✨ {b} (New)
                    <button
                      type="button"
                      onClick={() => handleRemovePendingBlock(b)}
                      className="hover:text-rose-600 transition-colors"
                      title="Remove"
                    >
                      <X size={13} />
                    </button>
                  </span>
                ))}
              </div>

              <p className="text-[11px] text-charcoal-500 dark:text-charcoal-400">
                💡 Removing a block only removes it from the Block Grid Matrix. All recorded financial collections remain permanently safe in the central database.
              </p>

              {/* Add New Block Input Box with Button */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Enter letter (e.g. E, F, G, H) or block name"
                    value={newBlockInput}
                    onChange={(e) => {
                      setNewBlockInput(e.target.value);
                      if (blockWarning) setBlockWarning('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddBlockToQueue();
                      }
                    }}
                    className="text-xs"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    leftIcon={<Plus size={14} />}
                    onClick={handleAddBlockToQueue}
                  >
                    Add Block
                  </Button>
                </div>
                {blockWarning && (
                  <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 animate-in fade-in">
                    ⚠️ {blockWarning}
                  </p>
                )}
              </div>
            </div>

            {/* 2. Floors & Flats Configuration per Block */}
            <div className="p-4 rounded-2xl bg-cream-50/70 dark:bg-charcoal-900/60 border border-cream-border dark:border-charcoal-700 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-charcoal-800 dark:text-cream-100">
                <Layers size={16} className="text-saffron-600 dark:text-gold-400" />
                <span>Default Block Dimensions</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Floors per block"
                  type="number"
                  min={1}
                  max={50}
                  required
                  value={floorsPerBlock}
                  onChange={(e) => setFloorsPerBlock(parseInt(e.target.value) || 9)}
                />
                <Input
                  label="Flats per floor"
                  type="number"
                  min={1}
                  max={20}
                  required
                  value={flatsPerFloor}
                  onChange={(e) => setFlatsPerFloor(parseInt(e.target.value) || 7)}
                />
              </div>
              <p className="text-[11px] text-charcoal-500 dark:text-charcoal-400">
                New blocks will be initialized with {floorsPerBlock} floors × {flatsPerFloor} flats per floor ({floorsPerBlock * flatsPerFloor} total units).
              </p>
            </div>

            {/* 3. Sponsorship & Other Categories Section */}
            <div className="space-y-2.5 p-4 rounded-2xl bg-cream-50/70 dark:bg-charcoal-900/60 border border-cream-border dark:border-charcoal-700">
              <div className="flex items-center gap-2 text-xs font-bold text-charcoal-800 dark:text-cream-100">
                <Tag size={16} className="text-saffron-600 dark:text-gold-400" />
                <span>Sponsorship / Other Categories</span>
              </div>

              {/* Categories Pills */}
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                {categories.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium bg-white dark:bg-charcoal-800 border border-cream-border dark:border-charcoal-700 text-charcoal-800 dark:text-cream-200 shadow-sm"
                  >
                    {c}
                    <button
                      type="button"
                      onClick={() => handleRemoveCategory(c)}
                      className="text-charcoal-400 hover:text-rose-600 transition-colors"
                      title="Remove category"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>

              {/* Add Category Input Box with Button */}
              <div className="flex items-center gap-2 pt-1">
                <Input
                  placeholder="e.g. Sponsorship - VIP Lounge"
                  value={newCategoryInput}
                  onChange={(e) => setNewCategoryInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCategory();
                    }
                  }}
                  className="text-xs"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  leftIcon={<Plus size={14} />}
                  onClick={handleAddCategory}
                >
                  Add
                </Button>
              </div>
            </div>

            {/* 4. Delete Security PIN */}
            <div className="p-4 rounded-2xl bg-cream-50/70 dark:bg-charcoal-900/60 border border-cream-border dark:border-charcoal-700 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-charcoal-800 dark:text-cream-100">
                <Lock size={16} className="text-saffron-600 dark:text-gold-400" />
                <span>Delete Protection PIN</span>
              </div>
              <Input
                type="password"
                maxLength={8}
                required
                value={deletePin}
                onChange={(e) => setDeletePin(e.target.value)}
                placeholder="2026"
              />
              <p className="text-[11px] text-charcoal-500 dark:text-charcoal-400">
                Required authorization PIN to delete payment collections, flats, or expense records across the system.
              </p>
            </div>

            {saveSuccessMsg && (
              <div className="p-3 rounded-xl bg-leaf-500/10 border border-leaf-500/30 text-leaf-700 dark:text-leaf-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 size={16} />
                {saveSuccessMsg}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-cream-100 dark:border-charcoal-700">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowSettings(false)}
                disabled={isSavingSettings}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isSavingSettings}
                leftIcon={<Sparkles size={14} />}
              >
                Save Settings
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
};
