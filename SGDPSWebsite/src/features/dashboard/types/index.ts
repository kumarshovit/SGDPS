import { Collection } from '../../collections/types';
import { Expense } from '../../expenses/types';

export interface BlockBreakdown {
  block: string;
  amount: number;
  flatCount: number;
}

export interface CategoryBreakdown {
  name: string;
  amount: number;
  count: number;
}

export interface DashboardKpis {
  totalCollection: number;
  cashCollection: number;
  upiCollection: number;
  bankCollection: number;
  chequeCollection: number;
  totalExpenses: number;
  currentBalance: number;
  totalCollectionsCount: number;
  totalExpensesCount: number;
  totalFlatsCount: number;
  paidFlatsCount: number;
  collectionsByBlock: BlockBreakdown[];
  collectionsByCategory: CategoryBreakdown[];
  expensesByCategory: CategoryBreakdown[];
  recentCollections: Collection[];
  recentExpenses: Expense[];
}
