export interface Flat {
  id: number;
  block: string;
  floor: number;
  flatNumber: string;
  ownerName: string;
  ownerPhone: string;
  email?: string;
  expectedAmount?: number;
  totalCollected: number;
  pendingAmount?: number;
  paymentStatus: 'Paid' | 'Unpaid' | 'Pending';
  isActive: boolean;
  createdAt: string;
}

export interface FlatGridCell {
  flatId?: number;
  block: string;
  floor: number;
  flatNumber: string;
  ownerName: string;
  expectedAmount?: number;
  collectedAmount: number;
  status: 'Paid' | 'Unpaid' | 'Pending';
}

export interface BlockGridSummary {
  block: string;
  blockTotalCollected: number;
  blockTotalExpected: number;
  totalFlats: number;
  paidFlatsCount: number;
  floorFlats: Record<number, FlatGridCell[]>;
}

export interface CreateFlatInput {
  block: string;
  floor: number;
  flatNumber: string;
  ownerName: string;
  ownerPhone: string;
  email?: string;
  expectedAmount?: number;
}

export interface UpdateFlatInput extends CreateFlatInput {
  id: number;
  isActive: boolean;
}
