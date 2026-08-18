import { PaymentMode } from '../../collections/types';

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
