export type PaymentMode = 'Cash' | 'UPI' | 'Cheque' | 'BankTransfer';
export type CollectionType = 'ResidentBlock' | 'SponsorshipOther';

export interface Collection {
  id: number;
  type: CollectionType;
  flatId?: number;
  block?: string;
  floor?: number;
  flatNumber?: string;
  category?: string;
  donorResidentName?: string;
  amount: number;
  mode: PaymentMode;
  receiptNumber: string;
  transactionReference?: string;
  collectionDateTime: string;
  latitude?: number;
  longitude?: number;
  collectedByUserId: string;
  collectedByName?: string;
  remarks?: string;
  createdAt: string;
}

export interface CreateCollectionInput {
  type: CollectionType;
  flatId?: number;
  block?: string;
  floor?: number;
  flatNumber?: string;
  category?: string;
  donorResidentName?: string;
  amount: number;
  mode: PaymentMode;
  transactionReference?: string;
  latitude?: number;
  longitude?: number;
  collectedByUserId?: string;
  collectedByName?: string;
  remarks?: string;
  collectionDateTime?: string;
}

export interface CollectionFilterParams {
  type?: string;
  block?: string;
  floor?: number;
  flatId?: number;
  mode?: string;
  category?: string;
  collectorId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}
