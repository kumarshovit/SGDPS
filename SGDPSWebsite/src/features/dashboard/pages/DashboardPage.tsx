import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetCollectionsQuery } from '../../collections/api/collectionApiSlice';
import { useGetExpensesQuery } from '../../expenses/api/expenseApiSlice';
import { Collection } from '../../collections/types';
import { formatCurrency, formatDateTime } from '../../../utils/formatters';
import { StatCard } from '../../../components/ui/StatCard';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import {
  Wallet,
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  Flame,
  Calendar,
  Filter,
} from 'lucide-react';

type DateFilterOption = 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: collections = [] as Collection[] } = useGetCollectionsQuery();
  const { data: expenses = [] } = useGetExpensesQuery();

  // Date Filter State
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('all');
  const [customFrom, setCustomFrom] = useState<string>('');
  const [customTo, setCustomTo] = useState<string>('');

  // Date Range Matching Function
  const isDateInRange = (dateStr?: string) => {
    if (!dateStr) return false;
    if (dateFilter === 'all') return true;

    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return true;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (dateFilter === 'today') {
      return d >= todayStart && d <= todayEnd;
    }
    if (dateFilter === 'yesterday') {
      const yStart = new Date(todayStart);
      yStart.setDate(yStart.getDate() - 1);
      const yEnd = new Date(todayEnd);
      yEnd.setDate(yEnd.getDate() - 1);
      return d >= yStart && d <= yEnd;
    }
    if (dateFilter === 'week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const weekStart = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
      return d >= weekStart && d <= todayEnd;
    }
    if (dateFilter === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      return d >= monthStart && d <= todayEnd;
    }
    if (dateFilter === 'custom') {
      if (customFrom && d < new Date(customFrom + 'T00:00:00')) return false;
      if (customTo && d > new Date(customTo + 'T23:59:59')) return false;
      return true;
    }
    return true;
  };

  // Filtered Collections & Expenses based on Date Range
  const filteredCollections = useMemo(() => {
    return collections.filter((c) => isDateInRange(c.collectionDateTime || c.createdAt));
  }, [collections, dateFilter, customFrom, customTo]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => isDateInRange(e.expenseDate || e.createdAt));
  }, [expenses, dateFilter, customFrom, customTo]);

  // KPI Calculations
  const totalCollected = useMemo(
    () => filteredCollections.reduce((s, c) => s + (c.amount || 0), 0),
    [filteredCollections]
  );
  const totalExpense = useMemo(
    () => filteredExpenses.reduce((s, e) => s + (e.amount || 0), 0),
    [filteredExpenses]
  );
  const netBalance = totalCollected - totalExpense;

  // Recent Collections remains overall latest 5 across the ledger
  const recentCollections = useMemo(
    () => (collections as Collection[]).slice(0, 5),
    [collections]
  );

  const filterLabel = useMemo(() => {
    switch (dateFilter) {
      case 'today':
        return 'Today';
      case 'yesterday':
        return 'Yesterday';
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      case 'custom':
        return customFrom || customTo ? `${customFrom || 'Start'} to ${customTo || 'Now'}` : 'Custom Range';
      default:
        return 'All Time';
    }
  }, [dateFilter, customFrom, customTo]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Hero Welcome Banner: Deep Maroon + Saffron + Antique Gold */}
      <div className="relative overflow-hidden rounded-3xl border border-gold-500/40 bg-gradient-to-r from-[#4E0F19] via-[#631520] to-[#7C1F2E] p-6 sm:p-8 text-white shadow-xl">
        {/* Subtle Decorative Gold & Saffron Ambient Glows */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-gold-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 -mb-16 h-48 w-48 rounded-full bg-saffron-500/25 blur-3xl pointer-events-none" />

        {/* Subtle Mandala Watermark */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none hidden md:block">
          <svg width="220" height="220" viewBox="0 0 100 100" fill="none" stroke="#E8A33D" strokeWidth="0.8">
            <circle cx="50" cy="50" r="45" />
            <circle cx="50" cy="50" r="35" />
            <circle cx="50" cy="50" r="25" />
            <circle cx="50" cy="50" r="15" />
            <path d="M50 5 L50 95 M5 50 L95 50 M18 18 L82 82 M18 82 L82 18" />
            <polygon points="50,10 60,40 90,50 60,60 50,90 40,60 10,50 40,40" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="max-w-xl space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-black/20 backdrop-blur-md px-3.5 py-1 text-xs font-bold text-gold-300 border border-gold-500/30">
              <Flame size={14} className="text-saffron-400" />
              Durga Puja Committee Ledger 2026
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-cream-50 font-display">
              Puja Collection & Finance Overview
            </h1>
            <p className="text-sm text-cream-200/90">
              Track society subscriptions, donations, cash reserves, and festive operational expenditures in real-time.
            </p>
          </div>
        </div>
      </div>

      {/* Date Range Filter Bar for Metric Cards */}
      <GlassCard className="p-3 sm:p-4 bg-white/80 dark:bg-charcoal-800/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-charcoal-800 dark:text-cream-100">
            <Filter size={15} className="text-saffron-600 dark:text-gold-400" />
            <span>Timeframe Filter:</span>
            <span className="px-2 py-0.5 rounded-lg bg-saffron-500/10 text-saffron-700 dark:text-gold-400 font-extrabold text-[11px]">
              {filterLabel}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {[
              { label: 'All Time', value: 'all' },
              { label: 'Today', value: 'today' },
              { label: 'Yesterday', value: 'yesterday' },
              { label: 'This Week', value: 'week' },
              { label: 'This Month', value: 'month' },
              { label: 'Custom Range', value: 'custom' },
            ].map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setDateFilter(tab.value as DateFilterOption)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  dateFilter === tab.value
                    ? 'bg-gradient-to-r from-saffron-600 to-gold-500 text-white shadow-gold'
                    : 'bg-cream-100 dark:bg-charcoal-900 text-charcoal-700 dark:text-charcoal-300 hover:bg-cream-200 dark:hover:bg-charcoal-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Pickers when 'custom' is active */}
        {dateFilter === 'custom' && (
          <div className="mt-3 pt-3 border-t border-cream-border dark:border-charcoal-700 flex flex-wrap items-center gap-3 animate-in fade-in text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-charcoal-500 dark:text-charcoal-400 font-medium">From:</span>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-cream-border dark:border-charcoal-700 bg-white dark:bg-charcoal-900 text-charcoal-900 dark:text-cream-100 text-xs outline-none focus:ring-2 focus:ring-gold-500/50"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-charcoal-500 dark:text-charcoal-400 font-medium">To:</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-cream-border dark:border-charcoal-700 bg-white dark:bg-charcoal-900 text-charcoal-900 dark:text-cream-100 text-xs outline-none focus:ring-2 focus:ring-gold-500/50"
              />
            </div>
            {(customFrom || customTo) && (
              <button
                type="button"
                onClick={() => {
                  setCustomFrom('');
                  setCustomTo('');
                }}
                className="text-xs text-saffron-600 dark:text-gold-400 underline font-semibold hover:opacity-80"
              >
                Reset Dates
              </button>
            )}
          </div>
        )}
      </GlassCard>

      {/* 3 Essential Festive KPI Cards (Calculated on active Date Filter) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <StatCard
          title={`Total Funds Collected (${filterLabel})`}
          value={formatCurrency(totalCollected)}
          icon={TrendingUp}
          gradient="gold"
        />
        <StatCard
          title={`Total Puja Expenses (${filterLabel})`}
          value={formatCurrency(totalExpense)}
          icon={CreditCard}
          gradient="saffron"
        />
        <StatCard
          title={`Net Cash in Treasury (${filterLabel})`}
          value={formatCurrency(netBalance)}
          icon={Wallet}
          gradient="leaf"
        />
      </div>

      {/* Top 5 Recent Collections Table */}
      <GlassCard
        title="Top 5 Recent Collections"
        subtitle="Latest payment receipts logged across society and puja counters"
        action={
          <Button
            size="sm"
            variant="ghost"
            rightIcon={<ArrowUpRight size={14} />}
            onClick={() => navigate('/collections')}
          >
            View Full Ledger
          </Button>
        }
      >
        {recentCollections.length === 0 ? (
          <div className="text-xs text-charcoal-400 py-12 text-center">
            No collections logged yet. Click <strong>+ Record Collection</strong> to record a contribution.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="border-b border-cream-border dark:border-charcoal-700 text-xs font-bold text-charcoal-500 dark:text-charcoal-400">
                  <th className="py-3 px-3">Receipt #</th>
                  <th className="py-3 px-3">Flat / Source</th>
                  <th className="py-3 px-3">Resident / Donor</th>
                  <th className="py-3 px-3">Mode</th>
                  <th className="py-3 px-3">Date & Time</th>
                  <th className="py-3 px-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100 dark:divide-charcoal-700/60 text-xs">
                {recentCollections.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-cream-50/80 dark:hover:bg-charcoal-700/40 transition-colors"
                  >
                    <td className="py-3.5 px-3 font-mono font-bold text-saffron-700 dark:text-gold-400">
                      {c.receiptNumber}
                    </td>
                    <td className="py-3.5 px-3 font-medium text-charcoal-900 dark:text-cream-100">
                      {c.type === 'ResidentBlock'
                        ? `${c.block} · Fl ${c.floor} · Flat ${c.flatNumber}`
                        : c.category || 'Donation / Other'}
                    </td>
                    <td className="py-3.5 px-3 font-medium text-charcoal-800 dark:text-cream-200">
                      {c.donorResidentName || '—'}
                    </td>
                    <td className="py-3.5 px-3">
                      <Badge variant="upi" size="sm">
                        {c.mode}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-3 text-charcoal-500 dark:text-charcoal-400">
                      {formatDateTime(c.collectionDateTime || c.createdAt)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-bold text-leaf-700 dark:text-leaf-400 font-mono">
                      +{formatCurrency(c.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
