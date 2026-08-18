import React, { useState } from 'react';
import {
  useGetExpensesQuery,
  useCreateExpenseMutation,
  useDeleteExpenseMutation,
} from '../api/expenseApiSlice';
import { formatCurrency, formatDateTime } from '../../../utils/formatters';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import {
  Plus,
  Search,
  FileSpreadsheet,
  Trash2,
  Tag,
} from 'lucide-react';
import { exportExpensesToExcel } from '../../../utils/exportHelpers';
import { PaymentMode } from '../../collections/types';

const EXPENSE_CATEGORIES = [
  'Decoration & Pandal',
  'Puja Materials & Samagri',
  'Bhog, Prasad & Catering',
  'Electricity & Sound System',
  'Security & Guards',
  'Sanitation & Cleaning',
  'Priest Dakshina',
  'Printing & Banners',
  'Cultural Events & Stage',
  'Maintenance & Repairs',
  'Miscellaneous',
];

export const ExpensesPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // Form State
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Cash');
  const [paidToVendor, setPaidToVendor] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  const { data: expenses = [], isLoading } = useGetExpensesQuery();
  const [createExpense, { isLoading: isCreating }] = useCreateExpenseMutation();
  const [deleteExpense] = useDeleteExpenseMutation();

  const filteredExpenses = expenses.filter((e) => {
    const matchesCategory = selectedCategory === 'All' || e.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.paidToVendor && e.paidToVendor.toLowerCase().includes(searchQuery.toLowerCase())) ||
      e.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalExpenseAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Category Aggregation
  const categorySummary = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const exp of expenses) {
      map[exp.category] = (map[exp.category] || 0) + exp.amount;
    }
    return Object.entries(map).map(([cat, total]) => ({
      category: cat,
      totalAmount: total,
    }));
  }, [expenses]);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    try {
      await createExpense({
        expenseDate: new Date().toISOString(),
        category,
        amount: parseFloat(amount),
        description,
        paymentMode,
        paidToVendor: paidToVendor || undefined,
        remarks: remarks || undefined,
      }).unwrap();

      setIsAddModalOpen(false);
      setAmount('');
      setDescription('');
      setPaidToVendor('');
      setRemarks('');
    } catch (err: any) {
      alert(err?.data?.detail || 'Failed to record expense voucher');
    }
  };

  const handleDelete = async (id: number) => {
    const pin = window.prompt('Enter PIN to delete this expense record:');
    if (pin === null) return;
    const storedPin = localStorage.getItem('sgdps_delete_pin') || '2026';
    if (pin !== storedPin) {
      alert('Incorrect PIN — expense preserved');
      return;
    }

    try {
      await deleteExpense(id).unwrap();
    } catch (err) {
      alert('Could not delete expense voucher');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-charcoal-900 dark:text-cream-50 font-display">
            Expense Vouchers & Treasury Burn
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-500 dark:text-charcoal-300 mt-1">
            Track pandal, catering, electrical, and maintenance bills with instant category accounting.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<FileSpreadsheet size={15} />}
            onClick={() => exportExpensesToExcel(expenses)}
          >
            Export Excel
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={15} />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Record Voucher
          </Button>
        </div>
      </div>

      {/* Category Distribution Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          type="button"
          onClick={() => setSelectedCategory('All')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            selectedCategory === 'All'
              ? 'bg-gradient-to-r from-saffron-600 to-gold-600 text-white shadow-gold'
              : 'bg-white dark:bg-charcoal-800 text-charcoal-700 dark:text-cream-200 border border-cream-border dark:border-charcoal-700 hover:bg-cream-100 dark:hover:bg-charcoal-700'
          }`}
        >
          All Expenses ({expenses.length})
        </button>
        {categorySummary.map((cat) => (
          <button
            key={cat.category}
            type="button"
            onClick={() => setSelectedCategory(cat.category)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat.category
                ? 'bg-gradient-to-r from-saffron-600 to-gold-600 text-white shadow-gold'
                : 'bg-white dark:bg-charcoal-800 text-charcoal-700 dark:text-cream-200 border border-cream-border dark:border-charcoal-700 hover:bg-cream-100 dark:hover:bg-charcoal-700'
            }`}
          >
            {cat.category}: {formatCurrency(cat.totalAmount)}
          </button>
        ))}
      </div>

      {/* Expenses Table GlassCard */}
      <GlassCard
        title={`Vouchers List (${filteredExpenses.length})`}
        subtitle={`Total Outflow: ${formatCurrency(totalExpenseAmount)}`}
      >
        <div className="mb-4">
          <div className="relative flex items-center">
            <Search size={16} className="absolute left-3 text-gold-600 dark:text-gold-400" />
            <input
              type="text"
              placeholder="Search vendor, description, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-cream-border dark:border-charcoal-700 bg-cream-50/70 dark:bg-charcoal-900 text-xs sm:text-sm text-charcoal-900 dark:text-cream-50 outline-none focus:ring-2 focus:ring-gold-500/50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-cream-border dark:border-charcoal-700 text-xs font-bold text-charcoal-500 dark:text-charcoal-400">
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Description / Purpose</th>
                <th className="py-3 px-3">Vendor / Recipient</th>
                <th className="py-3 px-3">Mode</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3 text-right">Amount</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-100 dark:divide-charcoal-700/60 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-charcoal-400">
                    Loading expense vouchers…
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-charcoal-400">
                    No expense records found.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr
                    key={exp.id}
                    className="hover:bg-cream-50/60 dark:hover:bg-charcoal-700/40 transition-colors"
                  >
                    <td className="py-3.5 px-3">
                      <span className="inline-flex items-center gap-1 font-bold text-charcoal-900 dark:text-cream-50">
                        <Tag size={13} className="text-saffron-600 dark:text-gold-400" />
                        {exp.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-charcoal-800 dark:text-cream-200 font-bold">
                      {exp.description}
                    </td>

                    <td className="py-3.5 px-3 text-charcoal-500 dark:text-charcoal-400">
                      {exp.paidToVendor || 'Direct / Vendor'}
                    </td>

                    <td className="py-3.5 px-3">
                      <Badge
                        variant={
                          exp.paymentMode === 'Cash'
                            ? 'cash'
                            : exp.paymentMode === 'UPI'
                            ? 'upi'
                            : 'bank'
                        }
                        size="sm"
                      >
                        {exp.paymentMode}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-3 text-charcoal-500 dark:text-charcoal-400">
                      {formatDateTime(exp.expenseDate)}
                    </td>

                    <td className="py-3.5 px-3 text-right font-extrabold text-maroon-700 dark:text-rose-400 text-sm">
                      -{formatCurrency(exp.amount)}
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <button
                        onClick={() => handleDelete(exp.id)}
                        className="p-1.5 rounded-lg text-charcoal-500 hover:text-maroon-700 hover:bg-maroon-500/10 transition-colors"
                        title="Delete Voucher"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Record Expense Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Record Expense Voucher"
          subtitle="Log cash/digital payouts with vendor receipts"
        >
          <form onSubmit={handleCreateExpense} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Expense Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                options={EXPENSE_CATEGORIES.map((c) => ({ label: c, value: c }))}
              />

              <Input
                label="Amount (₹) *"
                type="number"
                min="1"
                required
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="5000"
              />
            </div>

            <Input
              label="Description / Purpose *"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Stage Decoration & Flowers Day 1"
            />

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Payment Mode"
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                options={[
                  { label: '💵 Cash', value: 'Cash' },
                  { label: '📱 UPI', value: 'UPI' },
                  { label: '🏦 Bank Transfer', value: 'BankTransfer' },
                  { label: '📑 Cheque', value: 'Cheque' },
                ]}
              />

              <Input
                label="Paid to Vendor / Recipient"
                value={paidToVendor}
                onChange={(e) => setPaidToVendor(e.target.value)}
                placeholder="e.g. Ramesh Electricals"
              />
            </div>

            <Input
              label="Bill No / Remarks (Optional)"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Voucher or invoice reference"
            />

            <div className="flex justify-end gap-2 pt-3 border-t border-cream-100 dark:border-charcoal-700">
              <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isCreating}>
                Save Expense Voucher
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
