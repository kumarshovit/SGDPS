import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  Grid3X3,
  ReceiptText,
  Building2,
  WalletCards,
  BarChart3,
  Users2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { clsx } from 'clsx';

export interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  isMobileOpen,
  onMobileClose,
}) => {
  const navigate = useNavigate();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/add', label: 'Add Collection', icon: PlusCircle, end: false, highlight: true },
    { to: '/grid', label: 'Block Grid Matrix', icon: Grid3X3, end: false },
    { to: '/collections', label: 'All Entries Ledger', icon: ReceiptText, end: false },
    { to: '/expenses', label: 'Expenses', icon: WalletCards, end: false },
    { to: '/reports', label: 'Reports & Defaulters', icon: BarChart3, end: false },
    { to: '/users', label: 'Field Collectors', icon: Users2, end: false },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-charcoal-950/70 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={clsx(
          'fixed top-0 left-0 z-40 h-screen border-r border-cream-border/90 dark:border-charcoal-700 bg-[#221612] dark:bg-[#120B08] text-cream-100 transition-all duration-300 ease-in-out flex flex-col justify-between shadow-xl',
          // Mobile state
          isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0',
          // Desktop collapsed/expanded state
          isOpen ? 'lg:w-64' : 'lg:w-20'
        )}
      >
        {/* Top Header / Branding */}
        <div>
          <div className="flex h-16 items-center justify-between px-4 border-b border-cream-border/20 dark:border-charcoal-700/80">
            <div
              className="flex items-center gap-3 cursor-pointer overflow-hidden"
              onClick={() => navigate('/')}
            >
              <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-maroon-800 via-saffron-600 to-gold-500 shadow-glow-saffron text-white">
                <Flame size={20} className="animate-pulse" />
              </div>
              {(isOpen || isMobileOpen) && (
                <div className="flex flex-col">
                  <span className="font-extrabold text-sm tracking-tight text-cream-50 font-display">
                    SGDPS Tracker
                  </span>
                  <span className="text-[10px] font-bold text-gold-400">
                    Puja & Society Ledger
                  </span>
                </div>
              )}
            </div>

            {/* Desktop Collapse Button */}
            <button
              onClick={onToggle}
              type="button"
              className="hidden lg:flex h-7 w-7 items-center justify-center rounded-lg text-cream-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onMobileClose}
                  className={({ isActive }) =>
                    clsx(
                      'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200 select-none',
                      isActive
                        ? 'bg-gradient-to-r from-saffron-600/30 to-gold-600/20 text-gold-300 font-bold border border-gold-500/40 shadow-gold'
                        : 'text-cream-200/80 hover:bg-white/5 hover:text-white',
                      item.highlight && !isActive && 'text-saffron-400 font-bold'
                    )
                  }
                >
                  <Icon
                    size={19}
                    className={clsx(
                      'flex-shrink-0 transition-transform duration-200 group-hover:scale-110 text-gold-400'
                    )}
                  />
                  {(isOpen || isMobileOpen) && (
                    <span className="truncate">{item.label}</span>
                  )}
                  {item.highlight && (isOpen || isMobileOpen) && (
                    <span className="ml-auto rounded-full bg-saffron-500/30 px-2 py-0.5 text-[9px] font-bold text-saffron-300 border border-saffron-500/40">
                      NEW
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Card / System Status */}
        {(isOpen || isMobileOpen) ? (
          <div className="p-4 border-t border-cream-border/20 dark:border-charcoal-700/80">
            <div className="rounded-xl bg-charcoal-900/60 p-3 border border-gold-500/20">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-leaf-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-leaf-500"></span>
                </span>
                <span className="text-[11px] font-bold text-cream-100">
                  Central Single Database
                </span>
              </div>
              <p className="text-[10px] text-cream-300/70 mt-1">
                RTK Query Live Sync Active
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3 border-t border-cream-border/20 dark:border-charcoal-700/80 flex justify-center">
            <div className="h-2 w-2 rounded-full bg-leaf-500 animate-pulse" title="Connected" />
          </div>
        )}
      </aside>
    </>
  );
};
