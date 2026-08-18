import React from 'react';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { logout } from '../../features/auth/slices/authSlice';
import { LogOut, User as UserIcon, Shield } from 'lucide-react';
import { Button } from '../ui/Button';

export const Navbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <header className="bg-maroon text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between flex-wrap gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full border-2 border-gold flex items-center justify-center bg-maroon-dark shadow-inner">
            <svg viewBox="0 0 40 40" className="w-6 h-6">
              <circle cx="20" cy="20" r="18" fill="none" stroke="#E8A33D" strokeWidth="2" strokeDasharray="2 4" />
              <circle cx="20" cy="20" r="8" fill="#E8A33D" />
            </svg>
          </div>
          <div>
            <h1 className="font-serif font-bold text-xl tracking-tight text-white flex items-center gap-2">
              SGDPS Tracker
              <span className="text-[10px] font-sans font-semibold uppercase bg-gold text-maroon-dark px-2 py-0.5 rounded-full">
                Live Central DB
              </span>
            </h1>
            <p className="text-xs text-white/70">Society & Puja Collection Ledger · Admin Portal</p>
          </div>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3 bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/15">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gold text-maroon font-bold flex items-center justify-center text-xs">
                  {user.firstName[0]}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-semibold leading-tight">{user.firstName} {user.lastName}</div>
                  <div className="text-[10px] text-gold-light flex items-center gap-1">
                    <Shield size={10} />
                    {user.roles?.length ? user.roles.join(', ') : 'Admin'}
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-white/80 hover:text-gold transition-colors p-1 rounded-md"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Button size="sm" variant="gradient" onClick={() => window.location.href = '/login'}>
              <UserIcon size={14} />
              Sign In
            </Button>
          )}
        </div>
      </div>

      {/* Cultural Alpona decorative border */}
      <div className="alpona-strip" />
    </header>
  );
};
