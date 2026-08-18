import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetDashboardKpisQuery } from '../api/dashboardApiSlice';
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
  Building,
  Plus,
  FileSpreadsheet,
  Flame,
} from 'lucide-react';
import { exportFinancialStatementPDF } from '../../../utils/exportHelpers';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: kpis } = useGetDashboardKpisQuery();
  const { data: collections = [] as Collection[] } = useGetCollectionsQuery();
  const { data: expenses = [] } = useGetExpensesQuery();

  const totalCollected = useMemo(() => collections.reduce((s, c) => s + (c.amount || 0), 0), [collections]);
  const totalExpense = useMemo(() => expenses.reduce((s, e) => s + (e.amount || 0), 0), [expenses]);
  const netBalance = totalCollected - totalExpense;

  const cashInflow = useMemo(() => collections.filter((c) => c.mode === 'Cash').reduce((s, c) => s + (c.amount || 0), 0), [collections]);
  const cashOutflow = useMemo(() => expenses.filter((e) => e.paymentMode === 'Cash').reduce((s, e) => s + (e.amount || 0), 0), [expenses]);
  const cashInHand = cashInflow - cashOutflow;

  const recentCollections = useMemo(() => (collections as Collection[]).slice(0, 5), [collections]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Hero Welcome Banner: Deep Maroon + Saffron + Antique Gold */}
      <div className="relative overflow-hidden rounded-3xl border border-gold-500/40 bg-gradient-to-r from-[#4E0F19] via-[#631520] to-[#7C1F2E] p-6 sm:p-8 text-white shadow-xl">
        {/* Subtle Decorative Gold & Saffron Ambient Glows */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-gold-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 -mb-16 h-48 w-48 rounded-full bg-saffron-500/25 blur-3xl pointer-events-none" />

        {/* Subtle Mandala Watermark in Corner */}
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

      {/* 4 Essential Festive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Funds Collected"
          value={formatCurrency(totalCollected)}
          icon={TrendingUp}
          gradient="gold"
        />
        <StatCard
          title="Total Puja Expenses"
          value={formatCurrency(totalExpense)}
          icon={CreditCard}
          gradient="saffron"
        />
        <StatCard
          title="Net Cash in Treasury"
          value={formatCurrency(netBalance)}
          icon={Wallet}
          gradient="leaf"
        />
        <StatCard
          title="Cash In Hand"
          value={formatCurrency(cashInHand)}
          icon={Building}
          gradient="maroon"
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
                <tr className="border-b border-cream-border dark:border-charcoal-700 text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase">
                  <th className="py-3 px-3">Receipt #</th>
                  <th className="py-3 px-3">Flat / Source</th>
                  <th className="py-3 px-3">Resident / Donor</th>
                  <th className="py-3 px-3">Mode</th>
                  <th className="py-3 px-3">Date & Time</th>
                  <th className="py-3 px-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100 dark:divide-charcoal-700/60 text-xs">
                {recentCollections.map((entry) => (
                  <tr
                    key={entry.id}
                    className="hover:bg-cream-50/60 dark:hover:bg-charcoal-700/40 transition-colors"
                  >
                    <td className="py-3.5 px-3 font-mono font-bold text-saffron-700 dark:text-gold-400">
                      {entry.receiptNumber || `REC-${entry.id}`}
                    </td>

                    <td className="py-3.5 px-3 font-bold text-charcoal-900 dark:text-cream-50">
                      {entry.type === 'ResidentBlock'
                        ? `${entry.block} · Fl ${entry.floor} · Flat ${entry.flatNumber}`
                        : entry.category}
                    </td>

                    <td className="py-3.5 px-3 text-charcoal-800 dark:text-cream-200 font-medium">
                      {entry.donorResidentName || 'Resident'}
                    </td>

                    <td className="py-3.5 px-3">
                      <Badge
                        variant={
                          entry.mode === 'Cash'
                            ? 'cash'
                            : entry.mode === 'UPI'
                            ? 'upi'
                            : 'bank'
                        }
                        size="sm"
                      >
                        {entry.mode}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-3 font-mono text-charcoal-500 dark:text-charcoal-400 whitespace-nowrap">
                      {formatDateTime(entry.collectionDateTime)}
                    </td>

                    <td className="py-3.5 px-3 text-right font-extrabold text-leaf-700 dark:text-leaf-400 font-mono text-sm">
                      +{formatCurrency(entry.amount)}
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
