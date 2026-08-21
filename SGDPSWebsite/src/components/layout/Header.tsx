import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { logout, updateUser } from '../../features/auth/slices/authSlice';
import { useUpdateUserNameMutation } from '../../features/users/api/userApiSlice';
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
  Pencil,
  User as UserIcon,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useGetFlatsQuery, useGetBlocksQuery, useCreateBlockMutation, useToggleBlockStatusMutation } from '../../features/flats/api/flatApiSlice';
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

interface QueuedBlock {
  name: string;
  floors: number;
  flatsPerFloor: number;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const [updateUserName, { isLoading: isUpdatingName }] = useUpdateUserNameMutation();

  // Settings & Profile Modal State
  const [showSettings, setShowSettings] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [profileFirstName, setProfileFirstName] = useState('');
  const [profileLastName, setProfileLastName] = useState('');
  const [profileErrMsg, setProfileErrMsg] = useState('');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  const [deletePin, setDeletePin] = useState(getDeletePin());
  const [floorsPerBlock, setFloorsPerBlock] = useState<number>(getGlobalFloorsPerBlock());
  const [flatsPerFloor, setFlatsPerFloor] = useState<number>(getGlobalFlatsPerFloor());
  const [activeBlocksList, setActiveBlocksList] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>(getSponsorshipCategories());
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [newBlockInput, setNewBlockInput] = useState('');
  const [newBlockFloors, setNewBlockFloors] = useState<number>(18);
  const [newBlockFlatsPerFloor, setNewBlockFlatsPerFloor] = useState<number>(7);
  const [pendingNewBlocks, setPendingNewBlocks] = useState<QueuedBlock[]>([]);
  const [blockWarning, setBlockWarning] = useState<string>('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  const { data: dbBlocks = [] } = useGetBlocksQuery();
  const { data: flats = [] } = useGetFlatsQuery();
  const [createBlock] = useCreateBlockMutation();
  const [toggleBlockStatus] = useToggleBlockStatusMutation();

  // Sync settings whenever modal opens
  useEffect(() => {
    if (showSettings) {
      const activeFromDb = dbBlocks.filter((b) => b.isActive).map((b) => b.blockName);
      if (activeFromDb.length > 0) {
        setActiveBlocksList(activeFromDb);
      } else {
        const activeFromFlats = Array.from(new Set(flats.filter((f) => f.isActive).map((f) => f.block).filter(Boolean)));
        setActiveBlocksList(getActiveBlocks(activeFromFlats));
      }
      setDeletePin(getDeletePin());
      const currentFloors = getGlobalFloorsPerBlock();
      const currentFlats = getGlobalFlatsPerFloor();
      setFloorsPerBlock(currentFloors);
      setFlatsPerFloor(currentFlats);
      setCategories(getSponsorshipCategories());
      setPendingNewBlocks([]);
      setNewCategoryInput('');
      setNewBlockInput('');
      setNewBlockFloors(currentFloors || 18);
      setNewBlockFlatsPerFloor(currentFlats || 7);
      setBlockWarning('');
      setSaveSuccessMsg('');
    }
  }, [showSettings, dbBlocks, flats]);

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
    const allExisting = [...activeBlocksList, ...pendingNewBlocks.map((b) => b.name)];
    const isDuplicate = allExisting.some(
      (b) => b.toLowerCase() === formatted.toLowerCase() || b.toLowerCase() === raw.toLowerCase()
    );

    if (isDuplicate) {
      setBlockWarning(`Block "${formatted}" already exists in the system.`);
      return;
    }

    const floors = newBlockFloors > 0 ? newBlockFloors : (floorsPerBlock || 18);
    const units = newBlockFlatsPerFloor > 0 ? newBlockFlatsPerFloor : (flatsPerFloor || 7);

    setPendingNewBlocks((prev) => [...prev, { name: formatted, floors, flatsPerFloor: units }]);
    setNewBlockInput('');
    setBlockWarning('');
  };

  const handleRemoveExistingBlock = (blockToRemove: string) => {
    setActiveBlocksList((prev) => prev.filter((b) => b !== blockToRemove));
  };

  const handleRemovePendingBlock = (bName: string) => {
    setPendingNewBlocks((prev) => prev.filter((item) => item.name !== bName));
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
      const finalBlocks = Array.from(new Set([...activeBlocksList, ...pendingNewBlocks.map((b) => b.name)]));
      saveActiveBlocks(finalBlocks);

      // 2. Save PIN & Global dimension defaults
      saveDeletePin(deletePin);
      saveGlobalFloorsPerBlock(floorsPerBlock);
      saveGlobalFlatsPerFloor(flatsPerFloor);

      // 3. Save Sponsorship Categories
      saveSponsorshipCategories(categories);

      // 4. Synchronize block active/inactive status in central DB
      const allDbBlocks = dbBlocks.map((b) => b.blockName);

      // Deactivate any DB blocks not in finalBlocks
      const blocksToDeactivate = allDbBlocks.filter(
        (b) => !finalBlocks.some((fb) => fb.toLowerCase() === b.toLowerCase())
      );
      for (const blockName of blocksToDeactivate) {
        try {
          await toggleBlockStatus({ blockName, isActive: false }).unwrap();
        } catch {
          // continue
        }
      }

      // Sync dimensions & activate active blocks in DB
      for (const blockName of activeBlocksList) {
        const existing = dbBlocks.find((b) => b.blockName.toLowerCase() === blockName.toLowerCase());
        const targetFloors = floorsPerBlock > 0 ? floorsPerBlock : (existing?.floors || 18);
        const targetFlats = flatsPerFloor > 0 ? flatsPerFloor : (existing?.flatsPerFloor || 7);
        try {
          await createBlock({
            blockName,
            floors: targetFloors > 0 ? targetFloors : 18,
            flatsPerFloor: targetFlats > 0 ? targetFlats : 7,
            expectedAmount: 0,
          }).unwrap();
        } catch {
          // continue
        }
      }

      // Provision newly queued blocks with their specified dimensions
      for (const newBlock of pendingNewBlocks) {
        await createBlock({
          blockName: newBlock.name,
          floors: newBlock.floors,
          flatsPerFloor: newBlock.flatsPerFloor,
          expectedAmount: 0,
        }).unwrap();
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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profileFirstName.trim()) return;
    setProfileErrMsg('');
    setProfileSuccessMsg('');

    try {
      await updateUserName({
        id: user.id,
        firstName: profileFirstName.trim(),
        lastName: profileLastName.trim(),
      }).unwrap();

      dispatch(
        updateUser({
          firstName: profileFirstName.trim(),
          lastName: profileLastName.trim(),
        })
      );

      setProfileSuccessMsg('Profile name updated successfully!');
      setTimeout(() => {
        setShowEditProfileModal(false);
        setProfileSuccessMsg('');
      }, 1000);
    } catch (err: any) {
      setProfileErrMsg(err?.data?.detail || 'Failed to update profile name');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-cream-border dark:border-charcoal-700 bg-cream-50/80 dark:bg-charcoal-900/80 px-4 sm:px-6 backdrop-blur-md transition-colors duration-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-cream-border dark:border-charcoal-700 text-charcoal-700 dark:text-cream-200 hover:bg-cream-100 dark:hover:bg-charcoal-700 transition-colors lg:hidden"
            aria-label="Toggle Menu"
          >
            <Menu size={18} />
          </button>

          {/* Quick Breadcrumb / Page context */}
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-saffron-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-saffron-700 dark:text-gold-400">
              SGDPS Portal · 2026
            </span>
          </div>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Collection Action */}
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Plus size={15} />}
            onClick={() => navigate('/add')}
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
              <button
                onClick={() => {
                  setProfileFirstName(user.firstName || '');
                  setProfileLastName(user.lastName || '');
                  setProfileErrMsg('');
                  setProfileSuccessMsg('');
                  setShowEditProfileModal(true);
                }}
                className="flex items-center gap-2 group text-left cursor-pointer p-1 rounded-xl hover:bg-cream-100 dark:hover:bg-charcoal-700/60 transition-colors"
                title="Click to edit profile name"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-maroon-800 to-saffron-600 text-white font-bold text-xs shadow-gold group-hover:scale-105 transition-transform">
                  {user.firstName[0]}
                  {user.lastName?.[0] || ''}
                </div>
                <div className="hidden xl:flex flex-col text-left">
                  <span className="text-xs font-bold text-charcoal-900 dark:text-cream-50 leading-tight flex items-center gap-1">
                    {user.firstName} {user.lastName}
                    <Pencil size={11} className="text-charcoal-400 group-hover:text-gold-600 transition-colors" />
                  </span>
                  <span className="text-[10px] text-saffron-600 dark:text-gold-400 font-bold">
                    {user.roles?.[0] || 'Admin'}
                  </span>
                </div>
              </button>
              <button
                onClick={() => setShowLogoutConfirm(true)}
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
                    key={b.name}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-saffron-500/10 border border-saffron-500/30 text-saffron-700 dark:text-gold-400 animate-in fade-in shadow-sm"
                  >
                    ✨ {b.name} ({b.floors} fl × {b.flatsPerFloor} = {b.floors * b.flatsPerFloor} units)
                    <button
                      type="button"
                      onClick={() => handleRemovePendingBlock(b.name)}
                      className="hover:text-rose-600 transition-colors"
                      title="Remove"
                    >
                      <X size={13} />
                    </button>
                  </span>
                ))}
              </div>

              <p className="text-[11px] text-charcoal-500 dark:text-charcoal-400">
                💡 Removing a block deactivates it from the active grid matrix. All recorded financial collections remain permanently safe in the central database.
              </p>

              {/* Add New Block Input Box with Dimension Customization */}
              <div className="space-y-2 pt-2 border-t border-cream-border dark:border-charcoal-700">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-1">
                    <Input
                      label="Block / Tower Name"
                      placeholder="e.g. E, F, Tower-5"
                      value={newBlockInput}
                      onChange={(e) => {
                        setNewBlockInput(e.target.value);
                        if (blockWarning) setBlockWarning('');
                      }}
                      className="text-xs"
                    />
                  </div>
                  <div>
                    <Input
                      label="Floors (Default: 18)"
                      type="number"
                      min={1}
                      max={50}
                      value={newBlockFloors === 0 ? '' : newBlockFloors}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewBlockFloors(val === '' ? 0 : parseInt(val) || 0);
                      }}
                      onBlur={() => {
                        if (!newBlockFloors || newBlockFloors <= 0) setNewBlockFloors(18);
                      }}
                      className="text-xs"
                    />
                  </div>
                  <div>
                    <Input
                      label="Flats / Floor (Default: 7)"
                      type="number"
                      min={1}
                      max={20}
                      value={newBlockFlatsPerFloor === 0 ? '' : newBlockFlatsPerFloor}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewBlockFlatsPerFloor(val === '' ? 0 : parseInt(val) || 0);
                      }}
                      onBlur={() => {
                        if (!newBlockFlatsPerFloor || newBlockFlatsPerFloor <= 0) setNewBlockFlatsPerFloor(7);
                      }}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-charcoal-500 dark:text-charcoal-400">
                    ℹ️ Will provision <strong>{(newBlockFloors || 18) * (newBlockFlatsPerFloor || 7)} flat units</strong> ({newBlockFloors || 18} floors × {newBlockFlatsPerFloor || 7} flats/floor)
                  </span>
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
                  value={floorsPerBlock === 0 ? '' : floorsPerBlock}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFloorsPerBlock(val === '' ? 0 : parseInt(val) || 0);
                  }}
                  onBlur={() => {
                    if (!floorsPerBlock || floorsPerBlock <= 0) setFloorsPerBlock(18);
                  }}
                />
                <Input
                  label="Flats per floor"
                  type="number"
                  min={1}
                  max={20}
                  required
                  value={flatsPerFloor === 0 ? '' : flatsPerFloor}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFlatsPerFloor(val === '' ? 0 : parseInt(val) || 0);
                  }}
                  onBlur={() => {
                    if (!flatsPerFloor || flatsPerFloor <= 0) setFlatsPerFloor(7);
                  }}
                />
              </div>
              <p className="text-[11px] text-charcoal-500 dark:text-charcoal-400">
                New blocks will be initialized with {floorsPerBlock || 18} floors × {flatsPerFloor || 7} flats per floor ({(floorsPerBlock || 18) * (flatsPerFloor || 7)} total units).
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

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <Modal
          isOpen={showLogoutConfirm}
          onClose={() => setShowLogoutConfirm(false)}
          title="Confirm Logout"
          subtitle="Are you sure you want to sign out?"
          maxWidth="sm"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-300">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white shadow-md">
                <LogOut size={18} />
              </div>
              <p className="text-xs font-medium leading-relaxed">
                You are about to log out from <span className="font-bold text-charcoal-900 dark:text-cream-50">{user?.firstName} {user?.lastName || ''}</span> ({user?.roles?.[0] || 'Admin'}). You will need to sign in again to access the portal.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-cream-100 dark:border-charcoal-700">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                leftIcon={<LogOut size={15} />}
                onClick={() => {
                  setShowLogoutConfirm(false);
                  handleLogout();
                }}
              >
                Yes, Sign Out
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Admin Profile Modal */}
      {showEditProfileModal && user && (
        <Modal
          isOpen={showEditProfileModal}
          onClose={() => {
            setShowEditProfileModal(false);
            setProfileErrMsg('');
            setProfileSuccessMsg('');
          }}
          title="Edit Admin Profile"
          subtitle={`Update name for login ID: ${user.email}`}
          maxWidth="sm"
        >
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First Name *"
                required
                value={profileFirstName}
                onChange={(e) => setProfileFirstName(e.target.value)}
                placeholder="First Name"
                icon={<UserIcon size={15} />}
                autoFocus
              />
              <Input
                label="Last Name"
                value={profileLastName}
                onChange={(e) => setProfileLastName(e.target.value)}
                placeholder="Last Name"
              />
            </div>

            <div className="p-2.5 rounded-xl bg-gold-500/10 border border-gold-500/20 text-[11px] text-gold-800 dark:text-gold-300">
              👤 Updating your name will reflect immediately across your admin profile badge and society ledgers.
            </div>

            {profileErrMsg && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-400">
                {profileErrMsg}
              </div>
            )}

            {profileSuccessMsg && (
              <div className="p-2.5 rounded-xl bg-leaf-500/10 border border-leaf-500/20 text-xs font-bold text-leaf-700 dark:text-leaf-300 flex items-center gap-1.5">
                <CheckCircle2 size={14} />
                {profileSuccessMsg}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-cream-100 dark:border-charcoal-700">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowEditProfileModal(false);
                  setProfileErrMsg('');
                  setProfileSuccessMsg('');
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isUpdatingName}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
};
