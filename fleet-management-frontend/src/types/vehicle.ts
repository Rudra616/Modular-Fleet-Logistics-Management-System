export type VehicleStatus = 'available' | 'on_trip' | 'in_shop' | 'retired';
export type VehicleType = 'truck' | 'van' | 'pickup' | 'tanker' | 'trailer';

export interface Vehicle {
  id: number;
  license_plate: string;
  make: string;
  model: string;
  year: number;
  vehicle_type: VehicleType;
  type_display: string;
  capacity_kg: number;
  odometer_km: number;
  status: VehicleStatus;
  status_display: string;
  acquisition_cost: number;
  acquisition_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  
  // Computed properties
  is_available: boolean;
  total_fuel_cost: number;
  total_maintenance_cost: number;
  total_revenue: number;
  roi: number;
}

export interface VehicleListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Vehicle[];
}