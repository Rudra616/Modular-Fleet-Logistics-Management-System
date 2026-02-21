export type ExpenseCategory = 'fuel' | 'maintenance' | 'toll' | 'parking' | 
                             'insurance' | 'salary' | 'other';

export interface Expense {
  id: number;
  vehicle: number | null;
  vehicle_plate?: string;
  trip: number | null;
  logged_by: number;
  logged_by_name: string;
  category: ExpenseCategory;
  category_display: string;
  description: string;
  amount: number;
  date: string;
  receipt_photo: string | null;
  created_at: string;
}

export interface ExpenseListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Expense[];
}