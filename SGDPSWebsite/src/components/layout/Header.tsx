import React, { useState } from 'react';
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
  Sparkles,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const [showSettings, setShowSettings] = useState(false);
  const [deletePin, setDeletePin] = useState(
    localStorage.getItem('sgdps_delete_pin') || '2026'
  );

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('sgdps_delete_pin', deletePin);
    setShowSettings(false);
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
            title="Settings & Delete PIN"
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

      {/* Settings Modal */}
      {showSettings && (
        <Modal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          title="System Settings"
          subtitle="Configure database parameters and safety PINs"
        >
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <Input
              label="Delete Protection PIN"
              type="password"
              maxLength={6}
              value={deletePin}
              onChange={(e) => setDeletePin(e.target.value)}
              placeholder="2026"
            />
            <p className="text-xs text-charcoal-500 dark:text-charcoal-400 -mt-2">
              PIN required before deleting financial records to prevent accidental loss.
            </p>

            <div className="pt-2">
              <span className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 dark:text-cream-200 mb-1.5">
                Connected Backend API
              </span>
              <div className="p-3 rounded-xl bg-cream-50 dark:bg-charcoal-900 border border-cream-border dark:border-charcoal-700 text-xs font-mono text-charcoal-800 dark:text-cream-100">
                https://localhost:7123 / /api (Central Single DB)
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-cream-100 dark:border-charcoal-700">
              <Button type="button" variant="ghost" onClick={() => setShowSettings(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save Preferences
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
};
