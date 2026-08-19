import React, { useState, useMemo } from 'react';
import {
  useGetDefaultersQuery,
  useGetDateWiseReportQuery,
} from '../api/reportApiSlice';
import { useGetCollectionsQuery } from '../../collections/api/collectionApiSlice';
import { useGetExpensesQuery } from '../../expenses/api/expenseApiSlice';
import { useGetFlatsQuery } from '../../flats/api/flatApiSlice';
import { formatCurrency, formatPdfCurrency, formatDateTime, formatDate, parseDateTime } from '../../../utils/formatters';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import {
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  TrendingUp,
  CreditCard,
  Wallet,
  Calendar,
  Building,
  Printer,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import {
  exportToExcel,
  exportToPdf,
  exportDefaultersToExcel,
  exportFinancialStatementPDF,
  exportCategoryExpensesToExcel,
  exportDateWiseReportToExcel,
  exportExpensesToExcel,
} from '../../../utils/exportHelpers';

type DateFilterPreset = 'all_time' | 'today' | 'this_week' | 'this_month' | 'custom';
type ReportType =
  | 'collection_vs_expense'
  | 'category_expenses'
  | 'date_wise_expenses'
  | 'collections_register'
  | 'defaulters';

export const ReportsPage: React.FC = () => {
  // Report Configuration State
  const [reportType, setReportType] = useState<ReportType>('collection_vs_expense');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel'>('pdf');
  const [datePreset, setDatePreset] = useState<DateFilterPreset>('all_time');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState('ALL');
  const [selectedBlock, setSelectedBlock] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Queries
  const { data: defaulters = [], isLoading: isDefaultersLoading } = useGetDefaultersQuery();
  const { data: dailyReports = [], isLoading: isDailyLoading } = useGetDateWiseReportQuery();
  const { data: collections = [], isLoading: isCollectionsLoading } = useGetCollectionsQuery();
  const { data: expenses = [], isLoading: isExpensesLoading } = useGetExpensesQuery();
  const { data: flats = [] } = useGetFlatsQuery();

  // Helper to determine if a date string falls inside the selected date preset / custom range
  const isDateInRange = (dateStr?: string | null): boolean => {
    if (!dateStr) return true;
    if (datePreset === 'all_time') return true;

    const target = parseDateTime(dateStr);
    if (!target) return true;

    const now = new Date();

    if (datePreset === 'today') {
      return (
        target.getFullYear() === now.getFullYear() &&
        target.getMonth() === now.getMonth() &&
        target.getDate() === now.getDate()
      );
    }

    if (datePreset === 'this_week') {
      const startOfWeek = new Date(now);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      return target >= startOfWeek && target <= endOfWeek;
    }

    if (datePreset === 'this_month') {
      return (
        target.getFullYear() === now.getFullYear() &&
        target.getMonth() === now.getMonth()
      );
    }

    if (datePreset === 'custom') {
      if (fromDate) {
        const start = new Date(fromDate);
        start.setHours(0, 0, 0, 0);
        if (target < start) return false;
      }
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        if (target > end) return false;
      }
      return true;
    }

    return true;
  };

  // Filtered Collections
  const filteredCollections = useMemo(() => {
    return collections.filter((c) => {
      if (!isDateInRange(c.collectionDateTime)) return false;
      if (selectedPaymentMode !== 'ALL' && c.mode !== selectedPaymentMode) return false;
      if (selectedBlock !== 'ALL' && c.block !== selectedBlock) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const donor = (c.donorResidentName || '').toLowerCase();
        const blk = (c.block || '').toLowerCase();
        const rec = (c.receiptNumber || '').toLowerCase();
        const flatNo = (c.flatNumber || '').toLowerCase();
        if (!donor.includes(q) && !blk.includes(q) && !rec.includes(q) && !flatNo.includes(q)) return false;
      }
      return true;
    });
  }, [collections, datePreset, fromDate, toDate, selectedPaymentMode, selectedBlock, searchQuery]);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (!isDateInRange(e.expenseDate)) return false;
      if (selectedCategory !== 'ALL' && e.category !== selectedCategory) return false;
      if (selectedPaymentMode !== 'ALL' && e.paymentMode !== selectedPaymentMode) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const desc = (e.description || '').toLowerCase();
        const vendor = (e.paidToVendor || '').toLowerCase();
        const cat = (e.category || '').toLowerCase();
        if (!desc.includes(q) && !vendor.includes(q) && !cat.includes(q)) return false;
      }
      return true;
    });
  }, [expenses, datePreset, fromDate, toDate, selectedCategory, selectedPaymentMode, searchQuery]);

  // Filtered Flats for Paid & Unpaid Status Report
  const filteredDefaulters = useMemo(() => {
    return flats.filter((d) => {
      if (selectedBlock !== 'ALL' && d.block !== selectedBlock) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = (d.ownerName || '').toLowerCase();
        const blk = (d.block || '').toLowerCase();
        const flatNo = String(d.flatNumber || '').toLowerCase();
        const phone = (d.ownerPhone || '').toLowerCase();
        const isPaid = d.paymentStatus === 'Paid' || (d.totalCollected || 0) > 0;
        const status = isPaid ? 'paid' : 'unpaid';
        if (!name.includes(q) && !blk.includes(q) && !flatNo.includes(q) && !phone.includes(q) && !status.includes(q)) return false;
      }
      return true;
    });
  }, [flats, selectedBlock, searchQuery]);

  const flatsPaidCount = useMemo(
    () => filteredDefaulters.filter((f) => f.paymentStatus === 'Paid' || (f.totalCollected || 0) > 0).length,
    [filteredDefaulters]
  );
  const flatsUnpaidCount = useMemo(
    () => filteredDefaulters.length - flatsPaidCount,
    [filteredDefaulters, flatsPaidCount]
  );
  const flatsTotalCollected = useMemo(
    () => filteredDefaulters.reduce((s, f) => s + (f.totalCollected || 0), 0),
    [filteredDefaulters]
  );

  // Financial Metrics (Calculated dynamically on Filtered Period)
  const periodCollectionTotal = useMemo(
    () => filteredCollections.reduce((s, c) => s + (c.amount || 0), 0),
    [filteredCollections]
  );
  const periodExpenseTotal = useMemo(
    () => filteredExpenses.reduce((s, e) => s + (e.amount || 0), 0),
    [filteredExpenses]
  );
  const periodNetBalance = periodCollectionTotal - periodExpenseTotal;

  // Category-wise summary on filtered expenses
  const categoryStats = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    for (const e of filteredExpenses) {
      const cat = e.category || 'General Operations';
      if (!map[cat]) map[cat] = { count: 0, total: 0 };
      map[cat].count += 1;
      map[cat].total += e.amount || 0;
    }

    return Object.entries(map)
      .map(([category, stats]) => ({
        category,
        count: stats.count,
        total: stats.total,
        percentage: periodExpenseTotal > 0 ? Math.round((stats.total / periodExpenseTotal) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredExpenses, periodExpenseTotal]);

  // Unique Lists for Dropdown Options
  const availableCategories = useMemo(() => {
    const set = new Set(expenses.map((e) => e.category).filter(Boolean));
    return ['ALL', ...Array.from(set)];
  }, [expenses]);

  const availableBlocks = useMemo(() => {
    const defaults = ['A-Block', 'B-Block', 'C-Block', 'D-Block'];
    const fromFlats = flats.map((f) => f.block).filter(Boolean);
    return ['ALL', ...Array.from(new Set([...defaults, ...fromFlats]))];
  }, [flats]);

  // Text label of active period filter
  const activePeriodLabel = useMemo(() => {
    if (datePreset === 'today') return 'Today';
    if (datePreset === 'this_week') return 'This Week';
    if (datePreset === 'this_month') return 'This Month';
    if (datePreset === 'custom') return `${fromDate || 'Start'} to ${toDate || 'End'}`;
    return 'All Time';
  }, [datePreset, fromDate, toDate]);

  // Export Action Dispatcher
  const handleExecuteExport = () => {
    const dateLabel = activePeriodLabel;

    if (exportFormat === 'pdf') {
      if (reportType === 'collection_vs_expense') {
        const rows = [
          ['Total Period Collections (Inflows)', formatPdfCurrency(periodCollectionTotal)],
          ['Total Period Expenses (Outflows)', formatPdfCurrency(periodExpenseTotal)],
          ['Net Available Period Balance', formatPdfCurrency(periodNetBalance)],
          ['Collection Entries Logged', `${filteredCollections.length} entries`],
          ['Expenses Logged', `${filteredExpenses.length} records`],
          ['Report Filter Period', dateLabel],
        ];
        exportToPdf(
          `Total Collection vs. Total Expenses Statement (${dateLabel})`,
          ['Audit Line Item', 'Amount / Value'],
          rows,
          `SGDPS_Total_Collection_vs_Expenses_${datePreset}`
        );
      } else if (reportType === 'category_expenses') {
        const rows = categoryStats.map((c) => [
          c.category,
          formatPdfCurrency(c.total),
          `${c.percentage}%`,
        ]);
        const footRows = [
          [
            { content: 'Total Outflows', styles: { halign: 'left', fontStyle: 'bold' } },
            { content: formatPdfCurrency(periodExpenseTotal), styles: { halign: 'right', fontStyle: 'bold' } },
            { content: '100%', styles: { halign: 'right', fontStyle: 'bold' } },
          ],
        ];
        exportToPdf(
          `Category-wise Expense Breakdown (${dateLabel})`,
          ['Category', 'Total Amount (Rs.)', 'Expense Share'],
          rows,
          `SGDPS_Category_Expenses_${datePreset}`,
          `Total Expenses: ${formatPdfCurrency(periodExpenseTotal)} across ${categoryStats.length} Categories`,
          footRows
        );
      } else if (reportType === 'date_wise_expenses') {
        const rows = filteredExpenses.map((e) => [
          formatDateTime(e.expenseDate),
          e.category,
          e.description,
          e.paidToVendor || '—',
          e.paymentMode,
          formatPdfCurrency(e.amount),
        ]);
        const footRows = [
          [
            { content: 'Total Expenses', colSpan: 3, styles: { halign: 'left', fontStyle: 'bold' } },
            { content: `${filteredExpenses.length} records`, colSpan: 2, styles: { halign: 'center', fontStyle: 'bold' } },
            { content: `-${formatPdfCurrency(periodExpenseTotal)}`, styles: { halign: 'right', fontStyle: 'bold' } },
          ],
        ];
        exportToPdf(
          `Expenses Ledger (${dateLabel})`,
          ['Date', 'Category', 'Description', 'Vendor', 'Mode', 'Amount (Rs.)'],
          rows,
          `SGDPS_Expenses_Ledger_${datePreset}`,
          `Total Filtered Expenses: ${formatPdfCurrency(periodExpenseTotal)} (${filteredExpenses.length} entries)`,
          footRows
        );
      } else if (reportType === 'collections_register') {
        const rows = filteredCollections.map((c) => [
          c.receiptNumber || `REC-${c.id}`,
          formatDateTime(c.collectionDateTime),
          c.donorResidentName || 'Resident',
          c.type === 'ResidentBlock' ? `${c.block} - ${c.flatNumber}` : (c.category || 'Donation'),
          c.mode,
          formatPdfCurrency(c.amount),
        ]);
        const footRows = [
          [
            { content: 'Total Collection', colSpan: 3, styles: { halign: 'left', fontStyle: 'bold' } },
            { content: `${filteredCollections.length} entries`, colSpan: 2, styles: { halign: 'center', fontStyle: 'bold' } },
            { content: `+${formatPdfCurrency(periodCollectionTotal)}`, styles: { halign: 'right', fontStyle: 'bold' } },
          ],
        ];
        exportToPdf(
          `Collections & Inflows Register (${dateLabel})`,
          ['Receipt #', 'Date', 'Donor / Resident', 'Flat / Source', 'Mode', 'Amount (Rs.)'],
          rows,
          `SGDPS_Collections_Register_${datePreset}`,
          `Total Filtered Collection: ${formatPdfCurrency(periodCollectionTotal)} (${filteredCollections.length} entries)`,
          footRows
        );
      } else if (reportType === 'defaulters') {
        const rows = filteredDefaulters.map((d) => {
          const isPaid = d.paymentStatus === 'Paid' || (d.totalCollected || 0) > 0;
          return [
            `${d.block} · Fl ${d.floor} · Flat ${d.flatNumber}`,
            d.ownerName,
            d.ownerPhone || '—',
            formatPdfCurrency(d.totalCollected || 0),
            isPaid ? 'Paid' : 'Unpaid',
          ];
        });
        const footRows = [
          [
            { content: 'Total Units Summary', colSpan: 3, styles: { halign: 'left', fontStyle: 'bold' } },
            { content: `+${formatPdfCurrency(flatsTotalCollected)}`, styles: { halign: 'right', fontStyle: 'bold' } },
            { content: `Paid: ${flatsPaidCount} | Unpaid: ${flatsUnpaidCount}`, styles: { halign: 'center', fontStyle: 'bold' } },
          ],
        ];
        exportToPdf(
          `Flats Collection Status (Paid & Unpaid) Statement (${dateLabel})`,
          ['Flat & Tower', 'Resident / Owner', 'Phone', 'Collected (Rs.)', 'Status'],
          rows,
          `SGDPS_Flats_Paid_Unpaid_Statement`,
          `Total: ${filteredDefaulters.length} Units | Paid: ${flatsPaidCount} | Unpaid: ${flatsUnpaidCount} | Collected: ${formatPdfCurrency(flatsTotalCollected)}`,
          footRows
        );
      }
    } else {
      // Excel Export
      if (reportType === 'category_expenses') {
        exportCategoryExpensesToExcel(categoryStats);
      } else if (reportType === 'date_wise_expenses') {
        const data: any[] = filteredExpenses.map((e) => ({
          Date: formatDateTime(e.expenseDate),
          Category: e.category,
          Description: e.description,
          'Amount (Rs)': e.amount,
          'Payment Mode': e.paymentMode,
          Vendor: e.paidToVendor || '',
          Remarks: e.remarks || '',
        }));
        data.push({
          Date: 'TOTAL EXPENSES',
          Category: '',
          Description: `${filteredExpenses.length} entries`,
          'Amount (Rs)': periodExpenseTotal,
          'Payment Mode': '',
          Vendor: '',
          Remarks: '',
        });
        exportToExcel(data, `SGDPS_Expenses_${datePreset}`);
      } else if (reportType === 'defaulters') {
        exportDefaultersToExcel(filteredDefaulters);
      } else if (reportType === 'collections_register') {
        const data: any[] = filteredCollections.map((c) => ({
          'Receipt No': c.receiptNumber || `REC-${c.id}`,
          Date: formatDateTime(c.collectionDateTime),
          'Resident / Donor': c.donorResidentName,
          'Flat / Source': c.type === 'ResidentBlock' ? `${c.block} - ${c.flatNumber}` : c.category,
          'Amount (Rs)': c.amount,
          'Payment Mode': c.mode,
          'Collected By': c.collectedByName,
          'Txn Reference': c.transactionReference || '',
        }));
        data.push({
          'Receipt No': 'TOTAL COLLECTION',
          Date: '',
          'Resident / Donor': '',
          'Flat / Source': `${filteredCollections.length} entries`,
          'Amount (Rs)': periodCollectionTotal,
          'Payment Mode': '',
          'Collected By': '',
          'Txn Reference': '',
        });
        exportToExcel(data, `SGDPS_Collections_${datePreset}`);
      } else {
        const data = [
          { 'Metric': 'Total Collections (Inflows)', 'Amount (Rs)': periodCollectionTotal, 'Count': filteredCollections.length },
          { 'Metric': 'Total Expenses (Outflows)', 'Amount (Rs)': periodExpenseTotal, 'Count': filteredExpenses.length },
          { 'Metric': 'Net Treasury Balance', 'Amount (Rs)': periodNetBalance, 'Count': '-' },
          { 'Metric': 'Filter Period', 'Amount (Rs)': dateLabel, 'Count': '-' },
        ];
        exportToExcel(data, `SGDPS_Balance_Statement_${datePreset}`);
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Sonora-Style Executive Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-charcoal-800 p-5 rounded-2xl border border-cream-border dark:border-charcoal-700 shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-charcoal-900 dark:text-cream-50 font-display">
            Reports & Statement
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-500 dark:text-charcoal-300 mt-1">
            Filter, inspect and export date-wise, category-wise, and financial balance reports.
          </p>
        </div>

        {/* Sonora Format Selector & Action Button */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Format Radio Selection */}
          <div className="flex items-center gap-3 bg-cream-100 dark:bg-charcoal-900 px-3.5 py-2 rounded-xl border border-cream-border dark:border-charcoal-700">
            <label className="flex items-center gap-1.5 text-xs font-bold text-charcoal-800 dark:text-cream-100 cursor-pointer">
              <input
                type="radio"
                name="exportFormat"
                value="pdf"
                checked={exportFormat === 'pdf'}
                onChange={() => setExportFormat('pdf')}
                className="text-saffron-600 focus:ring-saffron-500"
              />
              <FileText size={14} className="text-rose-600" />
              PDF
            </label>

            <label className="flex items-center gap-1.5 text-xs font-bold text-charcoal-800 dark:text-cream-100 cursor-pointer">
              <input
                type="radio"
                name="exportFormat"
                value="excel"
                checked={exportFormat === 'excel'}
                onChange={() => setExportFormat('excel')}
                className="text-saffron-600 focus:ring-saffron-500"
              />
              <FileSpreadsheet size={14} className="text-leaf-600" />
              Excel
            </label>
          </div>

          {/* Generate / Export Button */}
          <Button
            variant="primary"
            size="md"
            leftIcon={exportFormat === 'pdf' ? <Download size={16} /> : <FileSpreadsheet size={16} />}
            onClick={handleExecuteExport}
            className="shadow-gold px-5 py-2.5 font-bold"
          >
            Export Report ({exportFormat.toUpperCase()})
          </Button>
        </div>
      </div>


      {/* Sonora-Style Filter Form Card */}
      <GlassCard title="Report Criteria & Filter Options" className="p-5 bg-white dark:bg-charcoal-800">
        <div className="space-y-4">
          {/* Main Report Selection */}
          <div>
            <Select
              label="Select a Report *"
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
              options={[
                { label: '📊 1. Total Collection vs. Total Expenses Statement', value: 'collection_vs_expense' },
                { label: '🏷️ 2. Category-wise Expenses Breakdown', value: 'category_expenses' },
                { label: '📅 3. Date / Month-wise Expenses Ledger', value: 'date_wise_expenses' },
                { label: '📥 4. Payment & Collection Entries Register', value: 'collections_register' },
                { label: '🏢 5. All Flats Paid & Unpaid Status Report', value: 'defaulters' },
              ]}
            />
          </div>

          {/* Filter Grid: Date Preset, Custom Range, Category, Mode, Block, Search */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end pt-2 border-t border-cream-100 dark:border-charcoal-700">
            {/* 1. Date Preset Filter */}
            <div>
              <Select
                label="Date Period Filter"
                value={datePreset}
                onChange={(e) => setDatePreset(e.target.value as DateFilterPreset)}
                options={[
                  { label: '🌐 All Time (Full History)', value: 'all_time' },
                  { label: '⚡ Today', value: 'today' },
                  { label: '📆 This Week', value: 'this_week' },
                  { label: '📅 This Month', value: 'this_month' },
                  { label: '🗓️ Custom Date Range...', value: 'custom' },
                ]}
              />
            </div>

            {/* 2. Custom Date Range Pickers (Visible when 'custom' is selected) */}
            {datePreset === 'custom' ? (
              <>
                <Input
                  label="From Date (Start)"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  icon={<Calendar size={15} />}
                />
                <Input
                  label="To Date (End)"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  icon={<Calendar size={15} />}
                />
              </>
            ) : (
              <>
                {/* 3. Category Filter (for expense reports) */}
                <div>
                  <Select
                    label="Expense Category"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    disabled={reportType === 'defaulters' || reportType === 'collections_register'}
                    options={availableCategories.map((c) => ({
                      label: c === 'ALL' ? 'All Categories' : c,
                      value: c,
                    }))}
                  />
                </div>

                {/* 4. Payment Mode Filter */}
                <div>
                  <Select
                    label="Payment Mode"
                    value={selectedPaymentMode}
                    onChange={(e) => setSelectedPaymentMode(e.target.value)}
                    disabled={reportType === 'defaulters'}
                    options={[
                      { label: 'All Payment Modes', value: 'ALL' },
                      { label: '📱 UPI', value: 'UPI' },
                      { label: '💵 Cash', value: 'Cash' },
                      { label: '🏦 Bank Transfer', value: 'BankTransfer' },
                      { label: '📑 Cheque', value: 'Cheque' },
                    ]}
                  />
                </div>
              </>
            )}

            {/* 5. Tower / Block Filter */}
            <div>
              <Select
                label="Tower / Block"
                value={selectedBlock}
                onChange={(e) => setSelectedBlock(e.target.value)}
                options={availableBlocks.map((b) => ({
                  label: b === 'ALL' ? 'All Towers / Blocks' : `🏢 ${b}`,
                  value: b,
                }))}
              />
            </div>

            {/* 6. Keyword Search Input (When not taking custom date space) */}
            {datePreset === 'custom' && (
              <div>
                <Select
                  label="Expense Category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  disabled={reportType === 'defaulters' || reportType === 'collections_register'}
                  options={availableCategories.map((c) => ({
                    label: c === 'ALL' ? 'All Categories' : c,
                    value: c,
                  }))}
                />
              </div>
            )}
          </div>

          {/* Quick Search bar below filters */}
          <div className="pt-2">
            <Input
              placeholder="Search keyword (resident name, description, vendor, receipt #)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search size={15} />}
            />
          </div>
        </div>
      </GlassCard>

      {/* Dynamic Data Table Output */}

      {/* REPORT 1: Total Collection vs Total Expenses & Balance Sheet */}
      {reportType === 'collection_vs_expense' && (
        <GlassCard
          title={`Total Collection vs. Total Expenses Statement (${activePeriodLabel})`}
          subtitle="Audit summary of income inflows, expense outflows, and net treasury balance"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-cream-100 dark:bg-charcoal-900 border-b border-cream-border dark:border-charcoal-700 text-charcoal-700 dark:text-charcoal-300 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Financial Ledger Stream</th>
                  <th className="py-3.5 px-4">Matching Entries</th>
                  <th className="py-3.5 px-4 text-right">Amount (₹)</th>
                  <th className="py-3.5 px-4 text-right">Transaction Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-border dark:divide-charcoal-700/60">
                <tr className="hover:bg-cream-50/50 dark:hover:bg-charcoal-700/30">
                  <td className="py-3.5 px-4 font-bold text-charcoal-900 dark:text-cream-50">
                    Total Funds Collected (Flats, Sponsors, Stalls, Donations)
                  </td>
                  <td className="py-3.5 px-4 text-charcoal-600 dark:text-charcoal-300 font-medium">
                    {filteredCollections.length} entries
                  </td>
                  <td className="py-3.5 px-4 text-right font-extrabold text-leaf-700 dark:text-leaf-400 font-mono text-base">
                    +{formatCurrency(periodCollectionTotal)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Badge variant="success" size="sm">Credit / Inflow</Badge>
                  </td>
                </tr>

                <tr className="hover:bg-cream-50/50 dark:hover:bg-charcoal-700/30">
                  <td className="py-3.5 px-4 font-bold text-charcoal-900 dark:text-cream-50">
                    Total Society & Puja Expenses (Payouts)
                  </td>
                  <td className="py-3.5 px-4 text-charcoal-600 dark:text-charcoal-300 font-medium">
                    {filteredExpenses.length} records
                  </td>
                  <td className="py-3.5 px-4 text-right font-extrabold text-maroon-700 dark:text-rose-400 font-mono text-base">
                    -{formatCurrency(periodExpenseTotal)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Badge variant="danger" size="sm">Debit / Outflow</Badge>
                  </td>
                </tr>

                <tr className="bg-cream-50/80 dark:bg-charcoal-900 font-bold border-t-2 border-cream-border dark:border-charcoal-700">
                  <td className="py-4 px-4 text-charcoal-900 dark:text-cream-50 font-display text-sm">
                    Net Available Period Treasury Balance
                  </td>
                  <td className="py-4 px-4 text-charcoal-600 dark:text-charcoal-300 font-normal">
                    Period: {activePeriodLabel}
                  </td>
                  <td className="py-4 px-4 text-right font-extrabold text-lg font-mono text-charcoal-900 dark:text-cream-50">
                    {formatCurrency(periodNetBalance)}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <Badge variant={periodNetBalance >= 0 ? 'success' : 'danger'} size="sm">
                      {periodNetBalance >= 0 ? 'Surplus Balance' : 'Deficit'}
                    </Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* REPORT 2: Category-wise Expenses Breakdown */}
      {reportType === 'category_expenses' && (
        <GlassCard
          title={`Category-wise Expense Distribution (${activePeriodLabel})`}
          subtitle={`Total Outflows: ${formatCurrency(periodExpenseTotal)} across ${categoryStats.length} Categories`}
        >
          {isExpensesLoading ? (
            <div className="text-xs text-charcoal-400 py-12 text-center">Loading category expenses…</div>
          ) : categoryStats.length === 0 ? (
            <div className="text-xs text-charcoal-400 py-12 text-center">No expense records found for this period.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-cream-border dark:border-charcoal-700 text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase">
                    <th className="py-3 px-3">Expense Category</th>
                    <th className="py-3 px-3 text-right">Total Amount (₹)</th>
                    <th className="py-3 px-3 text-right">Expense Share (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-100 dark:divide-charcoal-700/60 text-xs">
                  {categoryStats.map((c) => (
                    <tr
                      key={c.category}
                      className="hover:bg-cream-50/60 dark:hover:bg-charcoal-700/40 transition-colors"
                    >
                      <td className="py-3.5 px-3 font-bold text-charcoal-900 dark:text-cream-50 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-saffron-600" />
                        {c.category}
                      </td>

                      <td className="py-3.5 px-3 text-right font-extrabold text-charcoal-900 dark:text-cream-50 font-mono text-sm">
                        {formatCurrency(c.total)}
                      </td>

                      <td className="py-3.5 px-3 text-right font-bold text-saffron-700 dark:text-gold-400">
                        {c.percentage}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      )}

      {/* REPORT 3: Date / Month-wise Expenses Ledger */}
      {reportType === 'date_wise_expenses' && (
        <GlassCard
          title={`Detailed Expense Ledger (${activePeriodLabel})`}
          subtitle={`Showing ${filteredExpenses.length} entries (Total: ${formatCurrency(periodExpenseTotal)})`}
        >
          {isExpensesLoading ? (
            <div className="text-xs text-charcoal-400 py-12 text-center">Loading expenses…</div>
          ) : filteredExpenses.length === 0 ? (
            <div className="text-xs text-charcoal-400 py-12 text-center">No matching expenses found for this filter.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-cream-border dark:border-charcoal-700 text-xs font-bold text-charcoal-500 dark:text-charcoal-400">
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Description & Remarks</th>
                    <th className="py-3 px-3">Paid To / Vendor</th>
                    <th className="py-3 px-3">Mode</th>
                    <th className="py-3 px-3 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-100 dark:divide-charcoal-700/60 text-xs">
                  {filteredExpenses.map((e) => (
                    <tr
                      key={e.id}
                      className="hover:bg-cream-50/60 dark:hover:bg-charcoal-700/40 transition-colors"
                    >
                      <td className="py-3.5 px-3 font-mono text-charcoal-600 dark:text-charcoal-300 whitespace-nowrap">
                        {formatDateTime(e.expenseDate)}
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="font-bold text-saffron-700 dark:text-gold-400 bg-saffron-50 dark:bg-saffron-950/40 px-2 py-0.5 rounded-lg border border-saffron-500/20">
                          {e.category}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 font-bold text-charcoal-900 dark:text-cream-50">
                        {e.description}
                        {e.remarks && (
                          <span className="block text-[11px] text-charcoal-400 font-normal mt-0.5">
                            {e.remarks}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-charcoal-700 dark:text-charcoal-300">
                        {e.paidToVendor || '—'}
                      </td>

                      <td className="py-3.5 px-3">
                        <Badge variant="neutral" size="sm">{e.paymentMode}</Badge>
                      </td>

                      <td className="py-3.5 px-3 text-right font-extrabold text-maroon-700 dark:text-rose-400 font-mono text-sm">
                        {formatCurrency(e.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-cream-50/80 dark:bg-charcoal-900/80 font-bold border-t-2 border-cream-border dark:border-charcoal-700">
                    <td colSpan={5} className="py-3 px-3 text-charcoal-900 dark:text-cream-50 font-bold">
                      Total Expenses ({filteredExpenses.length} entries)
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-maroon-700 dark:text-rose-400 font-mono text-sm">
                      -{formatCurrency(periodExpenseTotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </GlassCard>
      )}

      {/* REPORT 4: Collection Entries Register */}
      {reportType === 'collections_register' && (
        <GlassCard
          title={`Payment & Collections Register (${activePeriodLabel})`}
          subtitle={`Showing ${filteredCollections.length} entries (Total: ${formatCurrency(periodCollectionTotal)})`}
        >
          {isCollectionsLoading ? (
            <div className="text-xs text-charcoal-400 py-12 text-center">Loading collections…</div>
          ) : filteredCollections.length === 0 ? (
            <div className="text-xs text-charcoal-400 py-12 text-center">No matching collections found for this filter.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-cream-border dark:border-charcoal-700 text-xs font-bold text-charcoal-500 dark:text-charcoal-400">
                    <th className="py-3 px-3">Receipt #</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Donor / Resident</th>
                    <th className="py-3 px-3">Flat / Category</th>
                    <th className="py-3 px-3">Mode</th>
                    <th className="py-3 px-3 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-100 dark:divide-charcoal-700/60 text-xs">
                  {filteredCollections.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-cream-50/60 dark:hover:bg-charcoal-700/40 transition-colors"
                    >
                      <td className="py-3.5 px-3 font-mono font-bold text-saffron-700 dark:text-gold-400">
                        {c.receiptNumber || `REC-${c.id}`}
                      </td>

                      <td className="py-3.5 px-3 font-mono text-charcoal-600 dark:text-charcoal-300 whitespace-nowrap">
                        {formatDateTime(c.collectionDateTime)}
                      </td>

                      <td className="py-3.5 px-3 font-bold text-charcoal-900 dark:text-cream-50">
                        {c.donorResidentName || 'Resident'}
                      </td>

                      <td className="py-3.5 px-3 text-charcoal-700 dark:text-charcoal-300">
                        {c.type === 'ResidentBlock' ? `${c.block} - ${c.flatNumber}` : (c.category || 'Donation')}
                      </td>

                      <td className="py-3.5 px-3">
                        <Badge variant="neutral" size="sm">{c.mode}</Badge>
                      </td>

                      <td className="py-3.5 px-3 text-right font-extrabold text-leaf-700 dark:text-leaf-400 font-mono text-sm">
                        {formatCurrency(c.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-cream-50/80 dark:bg-charcoal-900/80 font-bold border-t-2 border-cream-border dark:border-charcoal-700">
                    <td colSpan={5} className="py-3 px-3 text-charcoal-900 dark:text-cream-50 font-bold">
                      Total Collections ({filteredCollections.length} entries)
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-leaf-700 dark:text-leaf-400 font-mono text-sm">
                      +{formatCurrency(periodCollectionTotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </GlassCard>
      )}

      {/* REPORT 5: All Flats Paid & Unpaid Status Statement */}
      {reportType === 'defaulters' && (
        <GlassCard
          title={`All Flats Paid & Unpaid Status Statement (${filteredDefaulters.length} Units)`}
          subtitle={`Comprehensive directory of all residential units with live collection amount and payment status`}
        >
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 p-3 rounded-2xl bg-cream-50 dark:bg-charcoal-900 border border-cream-border dark:border-charcoal-700 text-xs">
            <div>
              <span className="text-charcoal-400 font-medium">Total Units:</span>
              <div className="text-base font-extrabold text-charcoal-900 dark:text-cream-50">{filteredDefaulters.length}</div>
            </div>
            <div>
              <span className="text-leaf-600 dark:text-leaf-400 font-medium">Paid Units:</span>
              <div className="text-base font-extrabold text-leaf-600 dark:text-leaf-400">{flatsPaidCount}</div>
            </div>
            <div>
              <span className="text-rose-600 dark:text-rose-400 font-medium">Unpaid Units:</span>
              <div className="text-base font-extrabold text-rose-600 dark:text-rose-400">{flatsUnpaidCount}</div>
            </div>
            <div>
              <span className="text-gold-600 dark:text-gold-400 font-medium">Total Collected:</span>
              <div className="text-base font-extrabold text-saffron-700 dark:text-gold-400">{formatCurrency(flatsTotalCollected)}</div>
            </div>
          </div>

          {filteredDefaulters.length === 0 ? (
            <div className="py-12 text-center text-xs text-charcoal-400">
              No flats match your filter criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[650px]">
                <thead>
                  <tr className="border-b border-cream-border dark:border-charcoal-700 text-xs font-bold text-charcoal-500 dark:text-charcoal-400">
                    <th className="py-3 px-3">Flat & Tower</th>
                    <th className="py-3 px-3">Resident / Owner</th>
                    <th className="py-3 px-3">Phone</th>
                    <th className="py-3 px-3 text-right">Collected (₹)</th>
                    <th className="py-3 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-100 dark:divide-charcoal-700/60 text-xs">
                  {filteredDefaulters.map((d) => {
                    const isPaid = d.paymentStatus === 'Paid' || (d.totalCollected || 0) > 0;
                    return (
                      <tr
                        key={d.id}
                        className="hover:bg-cream-50/60 dark:hover:bg-charcoal-700/40 transition-colors"
                      >
                        <td className="py-3.5 px-3 font-bold text-charcoal-900 dark:text-cream-50">
                          {d.block} · Fl {d.floor} · Flat {d.flatNumber}
                        </td>

                        <td className="py-3.5 px-3 font-medium text-charcoal-800 dark:text-cream-200">
                          {d.ownerName}
                        </td>

                        <td className="py-3.5 px-3 text-charcoal-500 dark:text-charcoal-400 font-mono">
                          {d.ownerPhone || '—'}
                        </td>

                        <td className="py-3.5 px-3 text-right font-bold font-mono text-leaf-700 dark:text-leaf-400">
                          {formatCurrency(d.totalCollected || 0)}
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <Badge variant={isPaid ? 'success' : 'danger'} size="sm">
                            {isPaid ? 'Paid' : 'Unpaid'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      )}
    </div>
  );
};
