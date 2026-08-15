export interface Job {
  id: string;
  name: string;
  minimumWorkMinutes: number;
  breakIsPaidByDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
