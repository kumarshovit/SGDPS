import React, { useState } from 'react';
import {
  useGetExpensesQuery,
  useCreateExpenseMutation,
  useDeleteExpenseMutation,
} from '../api/expenseApiSlice';
import { Expense } from '../types';
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
  Eye,
  Download,
  UploadCloud,
  X,
  FileText,
  Receipt,
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
  const [previewExpense, setPreviewExpense] = useState<Expense | null>(null);

  // Form State
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Cash');
  const [paidToVendor, setPaidToVendor] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [billAttachmentUrl, setBillAttachmentUrl] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');

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

  // Handle local bill/receipt image upload and convert to Base64 data URL
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit. Please upload a smaller image.');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setBillAttachmentUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setBillAttachmentUrl('');
    setFileName('');
  };

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
        billAttachmentUrl: billAttachmentUrl || undefined,
        remarks: remarks || undefined,
      }).unwrap();

      setIsAddModalOpen(false);
      setAmount('');
      setDescription('');
      setPaidToVendor('');
      setRemarks('');
      setBillAttachmentUrl('');
      setFileName('');
    } catch (err: any) {
      alert(err?.data?.detail || 'Failed to record expense');
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
      alert('Could not delete expense record');
    }
  };

  // Direct download receipt helper
  const handleDownloadReceipt = (exp: Expense) => {
    if (!exp.billAttachmentUrl) return;
    const link = document.createElement('a');
    link.href = exp.billAttachmentUrl;
    link.download = `Bill_Receipt_${exp.id}_${exp.category.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-charcoal-900 dark:text-cream-50 font-display">
            Expenses Ledger
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
            Record Expense
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
        title={`Expenses List (${filteredExpenses.length})`}
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
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="border-b border-cream-border dark:border-charcoal-700 text-xs font-bold text-charcoal-500 dark:text-charcoal-400">
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Description / Purpose</th>
                <th className="py-3 px-3">Vendor / Recipient</th>
                <th className="py-3 px-3">Mode</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3 text-right">Amount</th>
                <th className="py-3 px-3 text-center">Receipt</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-100 dark:divide-charcoal-700/60 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-charcoal-400">
                    Loading expenses…
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-charcoal-400">
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
                      {exp.remarks && (
                        <span className="block text-[11px] text-charcoal-400 font-normal">
                          {exp.remarks}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-charcoal-600 dark:text-charcoal-300">
                      {exp.paidToVendor || '—'}
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

                    <td className="py-3.5 px-3 font-mono text-charcoal-600 dark:text-charcoal-300">
                      {formatDateTime(exp.expenseDate)}
                    </td>

                    <td className="py-3.5 px-3 text-right font-extrabold text-maroon-700 dark:text-rose-400 font-mono text-sm">
                      -{formatCurrency(exp.amount)}
                    </td>

                    {/* Receipt Status & Quick View */}
                    <td className="py-3.5 px-3 text-center">
                      {exp.billAttachmentUrl ? (
                        <button
                          onClick={() => setPreviewExpense(exp)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gold-500/15 border border-gold-500/30 text-gold-700 dark:text-gold-300 font-bold text-[11px] hover:bg-gold-500/25 transition-all"
                          title="View Receipt"
                        >
                          <Receipt size={12} />
                          Bill
                        </button>
                      ) : (
                        <span className="text-charcoal-400 text-[11px] italic">None</span>
                      )}
                    </td>

                    {/* Action Column */}
                    <td className="py-3.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {exp.billAttachmentUrl && (
                          <>
                            <button
                              onClick={() => setPreviewExpense(exp)}
                              className="p-1 rounded-lg text-charcoal-500 hover:text-gold-600 dark:hover:text-gold-400 transition-colors"
                              title="View Receipt"
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              onClick={() => handleDownloadReceipt(exp)}
                              className="p-1 rounded-lg text-charcoal-500 hover:text-leaf-600 dark:hover:text-leaf-400 transition-colors"
                              title="Download Receipt"
                            >
                              <Download size={15} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(exp.id)}
                          className="p-1 rounded-lg text-charcoal-400 hover:text-maroon-700 dark:hover:text-rose-400 transition-colors"
                          title="Delete expense"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
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
          title="Record Expense"
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

            {/* Bill / Receipt Image Upload from Local System */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-charcoal-700 dark:text-cream-200 uppercase tracking-wider">
                Attach Bill / Receipt Image (Optional)
              </label>

              {!billAttachmentUrl ? (
                <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-cream-border dark:border-charcoal-600 hover:border-gold-500 rounded-2xl cursor-pointer bg-cream-50/50 dark:bg-charcoal-900/60 hover:bg-gold-50/20 transition-all">
                  <UploadCloud size={24} className="text-gold-600 dark:text-gold-400 mb-1" />
                  <span className="text-xs font-bold text-charcoal-800 dark:text-cream-100">
                    Click to select Bill or Receipt image
                  </span>
                  <span className="text-[11px] text-charcoal-400 mt-0.5">
                    Supports JPG, PNG, WEBP (Max 5MB)
                  </span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="flex items-center justify-between p-3 rounded-2xl border border-gold-500/40 bg-gold-500/10">
                  <div className="flex items-center gap-3">
                    <img
                      src={billAttachmentUrl}
                      alt="Receipt preview"
                      className="h-12 w-12 rounded-xl object-cover border border-gold-500/30"
                    />
                    <div>
                      <p className="text-xs font-bold text-charcoal-900 dark:text-cream-50 truncate max-w-[200px]">
                        {fileName || 'Receipt_Attachment.png'}
                      </p>
                      <p className="text-[11px] text-leaf-600 dark:text-leaf-400 font-semibold">
                        ✓ Image attached & ready to save
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="p-1.5 rounded-xl hover:bg-maroon-500/10 text-charcoal-400 hover:text-maroon-600 transition-colors"
                    title="Remove attachment"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-cream-100 dark:border-charcoal-700">
              <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isCreating}>
                Save Expense
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Bill / Receipt Preview Modal */}
      {previewExpense && (
        <Modal
          isOpen={!!previewExpense}
          onClose={() => setPreviewExpense(null)}
          title={`Bill Receipt: ${previewExpense.category}`}
          subtitle={`Amount: ${formatCurrency(previewExpense.amount)} · ${formatDateTime(previewExpense.expenseDate)}`}
        >
          <div className="space-y-4">
            <div className="max-h-[65vh] overflow-auto rounded-2xl border border-cream-border dark:border-charcoal-700 bg-cream-50 dark:bg-charcoal-900 p-2 flex items-center justify-center">
              {previewExpense.billAttachmentUrl ? (
                <img
                  src={previewExpense.billAttachmentUrl}
                  alt={`Bill receipt for ${previewExpense.description}`}
                  className="max-h-[60vh] w-auto rounded-xl object-contain shadow-md"
                />
              ) : (
                <div className="text-xs text-charcoal-400 py-12 text-center">
                  No receipt image available.
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-cream-100 dark:border-charcoal-700">
              <div className="text-xs text-charcoal-600 dark:text-charcoal-300">
                <strong>Vendor:</strong> {previewExpense.paidToVendor || '—'} · <strong>Mode:</strong> {previewExpense.paymentMode}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  leftIcon={<Download size={14} />}
                  onClick={() => handleDownloadReceipt(previewExpense)}
                >
                  Download Receipt
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => setPreviewExpense(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
