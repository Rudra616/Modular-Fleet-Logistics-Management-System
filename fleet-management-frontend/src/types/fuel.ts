export interface FuelLog {
  id: number;
  vehicle: number;
  vehicle_plate: string;
  trip?: number;
  logged_by: number;
  logged_by_name: string;
  date: string;
  liters: number;
  price_per_liter: number;
  total_cost: number;
  odometer_km: number;
  fuel_station: string;
  created_at: string;
}

export interface FuelLogListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: FuelLog[];
}

export interface FuelEfficiency {
  vehicle: string;
  make_model: string;
  total_liters: number;
  total_fuel_cost: number;
  total_distance_km: number;
  km_per_liter: number;
}