export interface Collector {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  isActive: boolean;
  totalCollected: number;
  collectionsCount: number;
  todayCollected: number;
  todayCount: number;
  createdOn: string;
}

export interface CreateCollectorInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}
