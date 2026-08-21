import { PaymentMode } from '../../collections/types';

export const DEFAULT_EXPENSE_CATEGORIES = [
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

export interface Expense {
  id: number;
  expenseDate: string;
  category: string;
  description: string;
  amount: number;
  paymentMode: PaymentMode;
  paidToVendor?: string;
  billAttachmentUrl?: string;
  remarks?: string;
  recordedByUserId: string;
  recordedByName?: string;
  createdAt: string;
}

export interface CreateExpenseInput {
  expenseDate: string;
  category: string;
  description: string;
  amount: number;
  paymentMode: PaymentMode;
  paidToVendor?: string;
  billAttachmentUrl?: string;
  remarks?: string;
  recordedByUserId?: string;
  recordedByName?: string;
}

export interface UpdateExpenseInput {
  expenseDate: string;
  category: string;
  description: string;
  amount: number;
  paymentMode: PaymentMode;
  paidToVendor?: string;
  billAttachmentUrl?: string | null;
  remarks?: string;
}

export interface ExpenseFilterParams {
  category?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface ExpenseCategorySummary {
  category: string;
  totalAmount: number;
  count: number;
}
