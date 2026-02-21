export type TripStatus = 'draft' | 'dispatched' | 'completed' | 'cancelled';

export interface Trip {
  id: number;
  vehicle: number;
  vehicle_plate: string;
  vehicle_info?: {
    license_plate: string;
    make: string;
    model: string;
  };
  driver: number;
  driver_name: string;
  driver_info?: {
    first_name: string;
    last_name: string;
    full_name: string;
  };
  origin: string;
  destination: string;
  scheduled_date: string;
  completed_date?: string;
  cargo_description: string;
  cargo_weight_kg: number;
  revenue: number;
  distance_km: number;
  status: TripStatus;
  status_display: string;
  notes?: string;
  created_by?: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
  total_expenses: number;
}

export interface TripListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Trip[];
}

export interface TripCreate {
  vehicle: number;
  driver: number;
  origin: string;
  destination: string;
  scheduled_date: string;
  cargo_description?: string;
  cargo_weight_kg: number;
  revenue?: number;
  distance_km?: number;
  notes?: string;
}

export interface TripUpdate extends Partial<TripCreate> {
  status?: TripStatus;
  completed_date?: string;
}