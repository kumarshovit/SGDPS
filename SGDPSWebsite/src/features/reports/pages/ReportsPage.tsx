import React, { useState } from 'react';
import {
  useGetDefaultersQuery,
  useGetDateWiseReportQuery,
} from '../api/reportApiSlice';
import { useGetCollectionsQuery } from '../../collections/api/collectionApiSlice';
import { useGetExpensesQuery } from '../../expenses/api/expenseApiSlice';
import { formatCurrency } from '../../../utils/formatters';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import {
  FileSpreadsheet,
  Download,
  Share2,
  CheckCircle2,
} from 'lucide-react';
import {
  exportDefaultersToExcel,
  exportFinancialStatementPDF,
} from '../../../utils/exportHelpers';

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'defaulters' | 'daily'>('defaulters');

  const { data: defaulters = [], isLoading: isDefaultersLoading } = useGetDefaultersQuery();
  const { data: dailyReports = [], isLoading: isDailyLoading } = useGetDateWiseReportQuery();
  const { data: collections = [] } = useGetCollectionsQuery();
  const { data: expenses = [] } = useGetExpensesQuery();

  const totalOutstanding = defaulters.reduce((sum, d) => sum + d.pendingAmount, 0);

  const handleWhatsAppReminder = (
    phone: string,
    name: string,
    pending: number,
    block: string,
    flat: string
  ) => {
    const text = encodeURIComponent(
      `🙏 *Namaste ${name} ji*,\n\n` +
        `This is a gentle reminder regarding the upcoming *Durga Puja Contribution 2026* for flat *${block}-${flat}*.\n\n` +
        `💰 *Outstanding Target:* ₹${pending}\n\n` +
        `You can make the payment via UPI to the committee or cash in hand to our authorized collector.\n` +
        `Thank you for your generous devotion and support!\n\n` +
        `— *Durga Puja Committee*`
    );
    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-charcoal-900 dark:text-cream-50 font-display">
            Reports & Defaulters Recovery
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-500 dark:text-charcoal-300 mt-1">
            Track outstanding dues, generate WhatsApp reminder links, and audit daily cash inflows vs outflows.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<FileSpreadsheet size={15} />}
            onClick={() => exportDefaultersToExcel(defaulters)}
          >
            Export Defaulters
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Download size={15} />}
            onClick={() => exportFinancialStatementPDF(collections, expenses)}
          >
            Export PDF Audit
          </Button>
        </div>
      </div>

      {/* Segmented Sub-Tab Switcher */}
      <div className="flex gap-2 p-1.5 rounded-2xl bg-cream-100 dark:bg-charcoal-900 border border-cream-border dark:border-charcoal-700 max-w-md">
        <button
          type="button"
          onClick={() => setActiveTab('defaulters')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'defaulters'
              ? 'bg-white dark:bg-charcoal-800 text-saffron-700 dark:text-gold-400 shadow-sm border border-cream-border dark:border-charcoal-600'
              : 'text-charcoal-600 dark:text-charcoal-300 hover:text-charcoal-900 dark:hover:text-cream-50'
          }`}
        >
          Outstanding Defaulters ({defaulters.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('daily')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'daily'
              ? 'bg-white dark:bg-charcoal-800 text-saffron-700 dark:text-gold-400 shadow-sm border border-cream-border dark:border-charcoal-600'
              : 'text-charcoal-600 dark:text-charcoal-300 hover:text-charcoal-900 dark:hover:text-cream-50'
          }`}
        >
          Daily Cashflow Ledger
        </button>
      </div>

      {/* Content Panels */}
      {activeTab === 'defaulters' ? (
        <GlassCard
          title={`Defaulters & Pending Recovery (${defaulters.length} Flats)`}
          subtitle={`Total Unpaid Balance: ${formatCurrency(totalOutstanding)}`}
        >
          {isDefaultersLoading ? (
            <div className="text-xs text-charcoal-400 py-12 text-center">Loading defaulters list…</div>
          ) : defaulters.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-leaf-500/15 text-leaf-600">
                <CheckCircle2 size={28} />
              </div>
              <p className="text-sm font-bold text-charcoal-900 dark:text-cream-50">
                All flat contributions are 100% cleared!
              </p>
              <p className="text-xs text-charcoal-400">Zero outstanding dues across all residential towers.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-cream-border dark:border-charcoal-700 text-xs font-bold text-charcoal-500 dark:text-charcoal-400">
                    <th className="py-3 px-3">Flat & Tower</th>
                    <th className="py-3 px-3">Resident / Owner</th>
                    <th className="py-3 px-3">Phone</th>
                    <th className="py-3 px-3 text-right">Target</th>
                    <th className="py-3 px-3 text-right">Paid</th>
                    <th className="py-3 px-3 text-right">Pending Due</th>
                    <th className="py-3 px-3 text-center">WhatsApp Reminder</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-100 dark:divide-charcoal-700/60 text-xs">
                  {defaulters.map((d) => (
                    <tr
                      key={d.flatId}
                      className="hover:bg-cream-50/60 dark:hover:bg-charcoal-700/40 transition-colors"
                    >
                      <td className="py-3.5 px-3 font-bold text-charcoal-900 dark:text-cream-50">
                        {d.block} · Fl {d.floor} · Flat {d.flatNumber}
                      </td>

                      <td className="py-3.5 px-3 font-bold text-charcoal-800 dark:text-cream-200">
                        {d.ownerName}
                      </td>

                      <td className="py-3.5 px-3 text-charcoal-500 dark:text-charcoal-400">
                        {d.ownerPhone || 'N/A'}
                      </td>

                      <td className="py-3.5 px-3 text-right text-charcoal-600 dark:text-charcoal-400 font-medium">
                        {formatCurrency(d.expectedAmount)}
                      </td>

                      <td className="py-3.5 px-3 text-right font-bold text-leaf-700 dark:text-leaf-400">
                        {formatCurrency(d.paidAmount)}
                      </td>

                      <td className="py-3.5 px-3 text-right font-extrabold text-maroon-700 dark:text-rose-400 text-sm">
                        {formatCurrency(d.pendingAmount)}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        {d.ownerPhone ? (
                          <Button
                            size="sm"
                            variant="outline"
                            leftIcon={<Share2 size={13} />}
                            className="text-leaf-700 border-leaf-500/30 hover:bg-leaf-500/10"
                            onClick={() =>
                              handleWhatsAppReminder(
                                d.ownerPhone,
                                d.ownerName,
                                d.pendingAmount,
                                d.block,
                                d.flatNumber
                              )
                            }
                          >
                            Send Reminder
                          </Button>
                        ) : (
                          <span className="text-[11px] text-charcoal-400 italic">No mobile</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      ) : (
        <GlassCard
          title="Daily Cashflow Statements"
          subtitle="Daily net summary of collections and expense payouts"
        >
          {isDailyLoading ? (
            <div className="text-xs text-charcoal-400 py-12 text-center">Loading daily statements…</div>
          ) : dailyReports.length === 0 ? (
            <div className="text-xs text-charcoal-400 py-12 text-center">No cashflow logs recorded.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[650px]">
                <thead>
                  <tr className="border-b border-cream-border dark:border-charcoal-700 text-xs font-bold text-charcoal-500 dark:text-charcoal-400">
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3 text-right">Collections Count</th>
                    <th className="py-3 px-3 text-right">Total Inflow (+)</th>
                    <th className="py-3 px-3 text-right">Expenses Outflow (-)</th>
                    <th className="py-3 px-3 text-right">Net Daily Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-100 dark:divide-charcoal-700/60 text-xs">
                  {dailyReports.map((row) => (
                    <tr
                      key={row.date}
                      className="hover:bg-cream-50/60 dark:hover:bg-charcoal-700/40 transition-colors"
                    >
                      <td className="py-3.5 px-3 font-bold text-charcoal-900 dark:text-cream-50">
                        {row.date}
                      </td>

                      <td className="py-3.5 px-3 text-right text-charcoal-600 dark:text-charcoal-400 font-medium">
                        {row.collectionsCount} entries
                      </td>

                      <td className="py-3.5 px-3 text-right font-bold text-leaf-700 dark:text-leaf-400">
                        +{formatCurrency(row.collectionsAmount)}
                      </td>

                      <td className="py-3.5 px-3 text-right font-bold text-maroon-700 dark:text-rose-400">
                        -{formatCurrency(row.expensesAmount)}
                      </td>

                      <td className="py-3.5 px-3 text-right font-extrabold text-sm">
                        <span
                          className={
                            row.netChange >= 0
                              ? 'text-leaf-700 dark:text-leaf-400'
                              : 'text-maroon-700 dark:text-rose-400'
                          }
                        >
                          {row.netChange >= 0 ? '+' : ''}
                          {formatCurrency(row.netChange)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      )}
    </div>
  );
};
