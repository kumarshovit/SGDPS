import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetDashboardKpisQuery } from '../api/dashboardApiSlice';
import { useGetCollectionsQuery } from '../../collections/api/collectionApiSlice';
import { useGetExpensesQuery } from '../../expenses/api/expenseApiSlice';
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
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { exportFinancialStatementPDF } from '../../../utils/exportHelpers';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: kpis, isLoading: isKpisLoading } = useGetDashboardKpisQuery();
  const { data: collections = [] } = useGetCollectionsQuery();
  const { data: expenses = [] } = useGetExpensesQuery();

  const totalCollected = kpis?.totalCollection || 0;
  const totalExpense = kpis?.totalExpenses || 0;
  const netBalance = kpis?.currentBalance ?? totalCollected - totalExpense;
  const cashAmount = kpis?.cashCollection || 0;
  const upiAmount = (kpis?.upiCollection || 0) + (kpis?.bankCollection || 0);
  const totalEntries = kpis?.totalCollectionsCount || 0;

  // Chart 1: Payment Method Breakdown Data (Saffron for UPI, Leaf Green for Cash)
  const paymentModeData = [
    { name: 'UPI & Digital', value: upiAmount || (totalCollected ? 0 : 65), color: '#EA580C' },
    { name: 'Cash In Hand', value: cashAmount || (totalCollected ? 0 : 35), color: '#16A34A' },
  ];

  // Chart 2: Block-wise Collection Data
  const blockChartData = (kpis?.collectionsByBlock || []).map((b) => ({
    name: b.block,
    amount: b.amount,
  }));

  // Chart 3: Collection Timeline (computed from collections)
  const timelineData = React.useMemo(() => {
    if (!collections.length) {
      return [
        { date: 'Day 1', amount: 1500 },
        { date: 'Day 2', amount: 3200 },
        { date: 'Day 3', amount: 5800 },
        { date: 'Day 4', amount: 9400 },
        { date: 'Day 5', amount: 14200 },
      ];
    }
    const map: Record<string, number> = {};
    const sorted = [...collections].sort(
      (a, b) => new Date(a.collectionDateTime).getTime() - new Date(b.collectionDateTime).getTime()
    );
    let running = 0;
    for (const c of sorted) {
      const d = new Date(c.collectionDateTime).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
      });
      running += c.amount;
      map[d] = running;
    }
    return Object.entries(map).map(([date, amount]) => ({ date, amount }));
  }, [collections]);

  const recentCollections = collections.slice(0, 6);

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
              Track resident contributions, sponsorships, expense vouchers, and real-time treasury balances with complete transparency.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus size={16} />}
              onClick={() => navigate('/add')}
            >
              Add Collection
            </Button>
            <Button
              variant="secondary"
              size="md"
              leftIcon={<FileSpreadsheet size={16} />}
              onClick={() => exportFinancialStatementPDF(collections, expenses)}
            >
              Export PDF Audit
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Total Collections"
          value={formatCurrency(totalCollected)}
          subtitle={`${totalEntries} contributions`}
          trend="+18.4%"
          trendUp={true}
          icon={Wallet}
          gradient="gold"
        />

        <StatCard
          title="Net Available Balance"
          value={formatCurrency(netBalance)}
          subtitle={`Expenses: ${formatCurrency(totalExpense)}`}
          trend="+12.1%"
          trendUp={true}
          icon={TrendingUp}
          gradient="leaf"
        />

        <StatCard
          title="Digital / UPI Collections"
          value={formatCurrency(upiAmount)}
          subtitle={`${totalCollected ? Math.round((upiAmount / totalCollected) * 100) : 0}% of total`}
          trend="UPI & Bank"
          trendUp={true}
          icon={CreditCard}
          gradient="saffron"
        />

        <StatCard
          title="Cash Collections"
          value={formatCurrency(cashAmount)}
          subtitle={`${totalCollected ? Math.round((cashAmount / totalCollected) * 100) : 0}% in hand`}
          trend="Cash In Hand"
          trendUp={true}
          icon={Building}
          gradient="maroon"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Collection Trend Area Chart (2 Cols) */}
        <GlassCard
          className="lg:col-span-2"
          title="Collection Growth Trend"
          subtitle="Cumulative funds accumulated over time"
          action={
            <Badge variant="gold" size="sm">
              Live Real-Time
            </Badge>
          }
        >
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAmountFestive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E8A33D" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#EA580C" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  stroke="#AFA49C"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#AFA49C"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1C1310',
                    border: '1px solid #E8A33D',
                    borderRadius: '12px',
                    color: '#FAF5E8',
                    fontSize: '12px',
                  }}
                  formatter={(value: any) => [formatCurrency(Number(value)), 'Total Collected']}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#E8A33D"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorAmountFestive)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Payment Method Donut Chart (1 Col) */}
        <GlassCard
          title="Payment Distribution"
          subtitle="Cash vs UPI / Digital share"
        >
          <div className="h-56 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentModeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {paymentModeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1C1310',
                    border: '1px solid #E8A33D',
                    borderRadius: '12px',
                    color: '#FAF5E8',
                    fontSize: '12px',
                  }}
                  formatter={(value: any) => [formatCurrency(Number(value)), 'Amount']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs text-charcoal-400 font-bold uppercase">Total</span>
              <span className="text-base font-extrabold text-charcoal-900 dark:text-cream-50">
                {formatCurrency(totalCollected)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-cream-100 dark:border-charcoal-700">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-saffron-600" />
              <div className="text-xs">
                <p className="text-charcoal-500 dark:text-charcoal-300 font-medium">UPI / Digital</p>
                <p className="font-bold text-charcoal-900 dark:text-cream-50">{formatCurrency(upiAmount)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-leaf-600" />
              <div className="text-xs">
                <p className="text-charcoal-500 dark:text-charcoal-300 font-medium">Cash In Hand</p>
                <p className="font-bold text-charcoal-900 dark:text-cream-50">{formatCurrency(cashAmount)}</p>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Block Progress & Recent Entries Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tower Breakdown Bar Chart (1 Col) */}
        <GlassCard
          title="Tower / Block Collections"
          subtitle="Breakdown per residential block"
        >
          {blockChartData.length === 0 ? (
            <div className="text-xs text-charcoal-400 py-12 text-center">No block collections recorded yet.</div>
          ) : (
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={blockChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="name"
                    stroke="#AFA49C"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#AFA49C"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1C1310',
                      border: '1px solid #E8A33D',
                      borderRadius: '12px',
                      color: '#FAF5E8',
                      fontSize: '12px',
                    }}
                    formatter={(value: any) => [formatCurrency(Number(value)), 'Total']}
                  />
                  <Bar dataKey="amount" fill="#7C1F2E" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </GlassCard>

        {/* Live Recent Transactions Feed (2 Cols) */}
        <GlassCard
          className="lg:col-span-2"
          title="Recent Transactions Stream"
          subtitle="Live collection entries logged across society"
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
              No collections logged yet. Click <strong>+ Add Collection</strong> to record a contribution.
            </div>
          ) : (
            <div className="divide-y divide-cream-100 dark:divide-charcoal-700">
              {recentCollections.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between py-3.5 hover:bg-cream-50/60 dark:hover:bg-charcoal-700/40 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-maroon-800/10 dark:bg-maroon-800/30 text-maroon-800 dark:text-gold-400 border border-maroon-800/20 font-bold text-xs">
                      {entry.type === 'ResidentBlock'
                        ? entry.block?.slice(0, 1) || 'A'
                        : 'S'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-charcoal-900 dark:text-cream-50">
                          {entry.type === 'ResidentBlock'
                            ? `${entry.block} · Floor ${entry.floor} · Flat ${entry.flatNumber}`
                            : entry.category}
                        </span>
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
                      </div>
                      <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-0.5 font-medium">
                        {entry.donorResidentName || 'Resident'} · {formatDateTime(entry.collectionDateTime)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-extrabold text-leaf-700 dark:text-leaf-400">
                      +{formatCurrency(entry.amount)}
                    </span>
                    <p className="text-[10px] text-charcoal-400 dark:text-charcoal-400 font-mono">
                      #{entry.receiptNumber}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
};
