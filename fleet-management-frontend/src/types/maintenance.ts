export type MaintenanceType = 'oil_change' | 'tire_rotation' | 'brake_service' | 
                             'engine_repair' | 'scheduled' | 'accident' | 
                             'inspection' | 'other';
export type MaintenanceStatus = 'pending' | 'in_progress' | 'completed';

export interface Maintenance {
  id: number;
  vehicle: number;
  vehicle_plate: string;
  logged_by: number;
  logged_by_name: string;
  maintenance_type: MaintenanceType;
  type_display: string;
  description: string;
  status: MaintenanceStatus;
  status_display: string;
  start_date: string;
  completed_date: string | null;
  cost: number;
  vendor: string;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Maintenance[];
}