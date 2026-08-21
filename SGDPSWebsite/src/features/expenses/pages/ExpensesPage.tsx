import React, { useState, useMemo } from 'react';
import {
  useGetExpensesQuery,
  useLazyGetExpenseAttachmentQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
} from '../api/expenseApiSlice';
import { Expense } from '../types';
import { formatCurrency, formatDateTime } from '../../../utils/formatters';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { DeleteConfirmModal } from '../../../components/ui/DeleteConfirmModal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import {
  Plus,
  Search,
  FileSpreadsheet,
  Trash2,
  Edit2,
  Tag,
  Download,
  UploadCloud,
  X,
  FileText,
  Receipt,
  Calendar,
  Loader2,
} from 'lucide-react';
import { exportExpensesToExcel } from '../../../utils/exportHelpers';
import { PaymentMode } from '../../collections/types';
import { SortableHeader } from '../../../components/ui/SortableHeader';
import { useTableSort } from '../../../hooks/useTableSort';

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
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  // Edit Expense State
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editCategory, setEditCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [editAmount, setEditAmount] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [editPaymentMode, setEditPaymentMode] = useState<PaymentMode>('Cash');
  const [editPaidToVendor, setEditPaidToVendor] = useState<string>('');
  const [editRemarks, setEditRemarks] = useState<string>('');
  const [editExpenseDate, setEditExpenseDate] = useState<string>('');
  const [editBillAttachmentUrl, setEditBillAttachmentUrl] = useState<string>('');
  const [editFileName, setEditFileName] = useState<string>('');

  // Form State
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Cash');
  const [paidToVendor, setPaidToVendor] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [billAttachmentUrl, setBillAttachmentUrl] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const { data: expenses = [], isLoading } = useGetExpensesQuery();
  const [getExpenseAttachment] = useLazyGetExpenseAttachmentQuery();
  const [createExpense, { isLoading: isCreating }] = useCreateExpenseMutation();
  const [updateExpense, { isLoading: isUpdating }] = useUpdateExpenseMutation();
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

  const { sortKey, sortDirection, handleSort, sortData } = useTableSort<Expense>();

  const expenseSortGetters: Record<string, (item: Expense) => string | number | boolean | null | undefined> = useMemo(() => ({
    category: (e) => e.category,
    description: (e) => e.description,
    paidToVendor: (e) => e.paidToVendor || '',
    paymentMode: (e) => e.paymentMode,
    expenseDate: (e) => e.expenseDate,
    amount: (e) => e.amount,
  }), []);

  const sortedExpenses = sortData(filteredExpenses, expenseSortGetters);

  const totalExpenseAmount = sortedExpenses.reduce((sum, e) => sum + e.amount, 0);

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

  // Client-side image compression helper (compresses large camera photos to ~100-150KB)
  const compressImageFile = async (file: File): Promise<string> => {
    if (file.type === 'application/pdf') {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(reader.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.75);
          resolve(compressed);
        };
        img.onerror = () => resolve(reader.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle local bill/receipt image upload with instant compression
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit. Please upload a smaller image.');
      return;
    }

    setFileName(file.name);
    try {
      const compressedDataUrl = await compressImageFile(file);
      setBillAttachmentUrl(compressedDataUrl);
    } catch {
      alert('Failed to process attachment file.');
    }
  };

  const handleRemoveFile = () => {
    setBillAttachmentUrl('');
    setFileName('');
  };

  const handleOpenEditModal = async (exp: Expense) => {
    setEditingExpense(exp);
    setEditCategory(exp.category || EXPENSE_CATEGORIES[0]);
    setEditAmount(String(exp.amount));
    setEditDescription(exp.description || '');
    setEditPaymentMode(exp.paymentMode || 'Cash');
    setEditPaidToVendor(exp.paidToVendor || '');
    setEditRemarks(exp.remarks || '');
    setEditExpenseDate(exp.expenseDate ? exp.expenseDate.split('T')[0] : new Date().toISOString().split('T')[0]);
    setEditBillAttachmentUrl(exp.billAttachmentUrl || '');
    setEditFileName(exp.billAttachmentUrl ? 'Attached_Bill.png' : '');
    setIsEditModalOpen(true);

    // Fetch full attachment on-demand for edit preview if needed
    if (exp.billAttachmentUrl && !exp.billAttachmentUrl.startsWith('data:')) {
      try {
        const res = await getExpenseAttachment(exp.id).unwrap();
        if (res?.billAttachmentUrl) {
          setEditBillAttachmentUrl(res.billAttachmentUrl);
          const ext = getAttachmentExtension(res.billAttachmentUrl);
          setEditFileName(`Attached_Bill.${ext}`);
        }
      } catch (err) {
        console.error('Failed to load attachment for preview:', err);
      }
    }
  };

  const handleEditFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit. Please upload a smaller image.');
      return;
    }

    setEditFileName(file.name);
    try {
      const compressedDataUrl = await compressImageFile(file);
      setEditBillAttachmentUrl(compressedDataUrl);
    } catch {
      alert('Failed to process attachment file.');
    }
  };

  const handleRemoveEditFile = () => {
    setEditBillAttachmentUrl('');
    setEditFileName('');
  };

  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense || !editAmount || parseFloat(editAmount) <= 0) return;

    try {
      const now = new Date();
      let expenseIso = now.toISOString();
      if (editExpenseDate) {
        const [y, m, d] = editExpenseDate.split('-').map(Number);
        const entryDate = new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds());
        expenseIso = entryDate.toISOString();
      }

      await updateExpense({
        id: editingExpense.id,
        data: {
          expenseDate: expenseIso,
          category: editCategory,
          amount: parseFloat(editAmount),
          description: editDescription.trim(),
          paymentMode: editPaymentMode,
          paidToVendor: editPaidToVendor.trim() || undefined,
          billAttachmentUrl: editBillAttachmentUrl.trim() ? editBillAttachmentUrl.trim() : null,
          remarks: editRemarks.trim() || undefined,
        },
      }).unwrap();

      setIsEditModalOpen(false);
      setEditingExpense(null);
    } catch (err: any) {
      alert(err?.data?.detail || 'Failed to update expense');
    }
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

  const handleConfirmDelete = async () => {
    if (!expenseToDelete) return;
    await deleteExpense(expenseToDelete.id).unwrap();
    setExpenseToDelete(null);
  };

  // Helper to detect attachment extension from Data URL or link
  const getAttachmentExtension = (dataUrl: string): string => {
    if (dataUrl.startsWith('data:application/pdf')) return 'pdf';
    if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) return 'jpg';
    if (dataUrl.startsWith('data:image/png')) return 'png';
    if (dataUrl.startsWith('data:image/webp')) return 'webp';
    if (dataUrl.startsWith('data:image/svg')) return 'svg';
    if (dataUrl.toLowerCase().includes('.pdf')) return 'pdf';
    if (dataUrl.toLowerCase().includes('.jpg') || dataUrl.toLowerCase().includes('.jpeg')) return 'jpg';
    if (dataUrl.toLowerCase().includes('.webp')) return 'webp';
    return 'png';
  };

  // Direct download receipt helper with on-demand retrieval
  const handleDownloadReceipt = async (exp: Expense) => {
    if (!exp.billAttachmentUrl) return;
    let dataUrl = exp.billAttachmentUrl;

    if (!dataUrl.startsWith('data:')) {
      try {
        setDownloadingId(exp.id);
        const res = await getExpenseAttachment(exp.id).unwrap();
        if (res?.billAttachmentUrl) {
          dataUrl = res.billAttachmentUrl;
        } else {
          alert('Could not retrieve receipt attachment.');
          return;
        }
      } catch (err) {
        console.error('Failed to download attachment:', err);
        alert('Failed to download receipt.');
        return;
      } finally {
        setDownloadingId(null);
      }
    }

    const ext = getAttachmentExtension(dataUrl);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `Bill_Receipt_${exp.id}_${(exp.category || 'expense').replace(/[^a-zA-Z0-9]/g, '_')}.${ext}`;
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

      {/* Expenses Table GlassCard */}
      <GlassCard
        title={`Expenses List (${filteredExpenses.length})`}
        subtitle={`Total Outflow: ${formatCurrency(totalExpenseAmount)}`}
      >
        <div className="mb-4 flex flex-col sm:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full flex items-center">
            <Search size={16} className="absolute left-3 text-gold-600 dark:text-gold-400" />
            <input
              type="text"
              placeholder="Search vendor, description, remarks, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-cream-border dark:border-charcoal-700 bg-cream-50/70 dark:bg-charcoal-900 text-xs sm:text-sm text-charcoal-900 dark:text-cream-50 outline-none focus:ring-2 focus:ring-gold-500/50"
            />
          </div>

          {/* Category Dropdown Filter */}
          <div className="w-full sm:w-72">
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              options={[
                { label: `All Categories (${expenses.length})`, value: 'All' },
                ...Array.from(
                  new Set([...EXPENSE_CATEGORIES, ...expenses.map((e) => e.category).filter(Boolean)])
                ).map((c) => ({
                  label: c,
                  value: c,
                })),
              ]}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="border-b border-cream-border dark:border-charcoal-700 text-xs font-bold text-charcoal-500 dark:text-charcoal-400">
                <SortableHeader label="Category" sortKey="category" currentSortKey={sortKey} currentSortDir={sortDirection} onSort={handleSort} />
                <SortableHeader label="Description / Purpose" sortKey="description" currentSortKey={sortKey} currentSortDir={sortDirection} onSort={handleSort} />
                <SortableHeader label="Vendor / Recipient" sortKey="paidToVendor" currentSortKey={sortKey} currentSortDir={sortDirection} onSort={handleSort} />
                <SortableHeader label="Mode" sortKey="paymentMode" currentSortKey={sortKey} currentSortDir={sortDirection} onSort={handleSort} />
                <SortableHeader label="Date" sortKey="expenseDate" currentSortKey={sortKey} currentSortDir={sortDirection} onSort={handleSort} />
                <SortableHeader label="Amount" sortKey="amount" currentSortKey={sortKey} currentSortDir={sortDirection} onSort={handleSort} className="text-right" />
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
              ) : sortedExpenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-charcoal-400">
                    No expense records found.
                  </td>
                </tr>
              ) : (
                sortedExpenses.map((exp) => (
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

                    {/* Receipt Status & Direct Download */}
                    <td className="py-3.5 px-3 text-center">
                      {exp.billAttachmentUrl ? (
                        <button
                          onClick={() => handleDownloadReceipt(exp)}
                          disabled={downloadingId === exp.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-leaf-500/15 border border-leaf-500/30 text-leaf-700 dark:text-leaf-300 font-bold text-xs hover:bg-leaf-500/25 transition-all disabled:opacity-50"
                          title="Download Receipt"
                        >
                          {downloadingId === exp.id ? (
                            <Loader2 size={12} className="animate-spin text-leaf-600" />
                          ) : (
                            <Download size={12} />
                          )}
                          {downloadingId === exp.id ? 'Downloading...' : 'Download'}
                        </button>
                      ) : (
                        <span className="text-charcoal-400 text-xs italic">None</span>
                      )}
                    </td>

                    {/* Action Column */}
                    <td className="py-3.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(exp)}
                          className="p-1 rounded-lg text-charcoal-400 hover:text-gold-600 dark:hover:text-gold-400 transition-colors"
                          title="Edit expense"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => setExpenseToDelete(exp)}
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
              placeholder="Bill or invoice reference"
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
                    {billAttachmentUrl.startsWith('data:application/pdf') || (fileName && fileName.toLowerCase().endsWith('.pdf')) ? (
                      <div className="h-12 w-12 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-700 dark:text-rose-400 border border-rose-500/30">
                        <FileText size={22} />
                      </div>
                    ) : (
                      <img
                        src={billAttachmentUrl}
                        alt="Receipt preview"
                        className="h-12 w-12 rounded-xl object-cover border border-gold-500/30"
                      />
                    )}
                    <div>
                      <p className="text-xs font-bold text-charcoal-900 dark:text-cream-50 truncate max-w-[200px]">
                        {fileName || 'Receipt_Attachment.png'}
                      </p>
                      <p className="text-[11px] text-leaf-600 dark:text-leaf-400 font-semibold">
                        ✓ Attachment attached & ready to save
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

      {/* Edit Expense Modal */}
      {isEditModalOpen && editingExpense && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingExpense(null);
          }}
          title="Edit Expense Record"
          subtitle={`Update details for expense #${editingExpense.id} (${editingExpense.category})`}
        >
          <form onSubmit={handleUpdateExpense} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Expense Category *"
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                options={EXPENSE_CATEGORIES.map((c) => ({ label: c, value: c }))}
              />

              <Input
                label="Amount (₹) *"
                type="number"
                min="1"
                required
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                placeholder="5000"
              />
            </div>

            <Input
              label="Description / Purpose *"
              required
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="e.g. Stage Decoration & Flowers Day 1"
            />

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Payment Mode *"
                value={editPaymentMode}
                onChange={(e) => setEditPaymentMode(e.target.value as PaymentMode)}
                options={[
                  { label: '💵 Cash', value: 'Cash' },
                  { label: '📱 UPI', value: 'UPI' },
                  { label: '🏦 Bank Transfer', value: 'BankTransfer' },
                  { label: '📑 Cheque', value: 'Cheque' },
                ]}
              />

              <Input
                label="Paid to Vendor / Recipient"
                value={editPaidToVendor}
                onChange={(e) => setEditPaidToVendor(e.target.value)}
                placeholder="e.g. Ramesh Electricals"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Expense Date"
                type="date"
                value={editExpenseDate}
                onChange={(e) => setEditExpenseDate(e.target.value)}
                icon={<Calendar size={15} />}
              />

              <Input
                label="Bill No / Remarks"
                value={editRemarks}
                onChange={(e) => setEditRemarks(e.target.value)}
                placeholder="Bill or invoice reference"
              />
            </div>

            {/* Bill / Receipt Attachment Management */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-charcoal-700 dark:text-cream-200 uppercase tracking-wider">
                Bill / Receipt Attachment
              </label>

              {!editBillAttachmentUrl ? (
                <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-cream-border dark:border-charcoal-600 hover:border-gold-500 rounded-2xl cursor-pointer bg-cream-50/50 dark:bg-charcoal-900/60 hover:bg-gold-50/20 transition-all">
                  <UploadCloud size={24} className="text-gold-600 dark:text-gold-400 mb-1" />
                  <span className="text-xs font-bold text-charcoal-800 dark:text-cream-100">
                    Click to attach Bill or Receipt image
                  </span>
                  <span className="text-[11px] text-charcoal-400 mt-0.5">
                    Supports JPG, PNG, WEBP (Max 5MB)
                  </span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleEditFileChange}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="flex items-center justify-between p-3 rounded-2xl border border-gold-500/40 bg-gold-500/10">
                  <div className="flex items-center gap-3">
                    {editBillAttachmentUrl.startsWith('data:application/pdf') || (editFileName && editFileName.toLowerCase().endsWith('.pdf')) ? (
                      <div className="h-12 w-12 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-700 dark:text-rose-400 border border-rose-500/30">
                        <FileText size={22} />
                      </div>
                    ) : editBillAttachmentUrl.startsWith('data:image') || editBillAttachmentUrl.startsWith('http') ? (
                      <img
                        src={editBillAttachmentUrl}
                        alt="Receipt preview"
                        className="h-12 w-12 rounded-xl object-cover border border-gold-500/30"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-xl bg-gold-500/20 flex items-center justify-center text-gold-700 dark:text-gold-300">
                        <FileText size={20} />
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold text-charcoal-900 dark:text-cream-50 truncate max-w-[200px]">
                        {editFileName || 'Attached_Receipt.png'}
                      </p>
                      <p className="text-[11px] text-leaf-600 dark:text-leaf-400 font-semibold">
                        ✓ Attachment attached
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-[11px] font-bold text-saffron-600 dark:text-gold-400 hover:underline cursor-pointer">
                      Replace
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleEditFileChange}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={handleRemoveEditFile}
                      className="p-1.5 rounded-xl hover:bg-maroon-500/10 text-rose-600 dark:text-rose-400 transition-colors"
                      title="Remove attachment"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-cream-100 dark:border-charcoal-700">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingExpense(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isUpdating}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation PIN Modal */}
      {expenseToDelete && (
        <DeleteConfirmModal
          isOpen={Boolean(expenseToDelete)}
          onClose={() => setExpenseToDelete(null)}
          onConfirm={handleConfirmDelete}
          title="Delete Expense Record"
          itemName={`Expense of ${formatCurrency(expenseToDelete.amount)} (${expenseToDelete.category})`}
          description={`This will permanently delete this expense record and update treasury accounts.`}
        />
      )}
    </div>
  );
};
