export interface DefaulterFlat {
  flatId: number;
  block: string;
  floor: number;
  flatNumber: string;
  ownerName: string;
  ownerPhone: string;
  expectedAmount: number;
  paidAmount: number;
  pendingAmount: number;
}

export interface DateWiseSummary {
  date: string;
  collectionsAmount: number;
  collectionsCount: number;
  expensesAmount: number;
  expensesCount: number;
  netChange: number;
}
