export type DriverStatus = 'off_duty' | 'on_duty' | 'suspended';

export interface Driver {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  email: string;
  license_number: string;
  license_expiry: string;
  status: DriverStatus;
  status_display: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  
  // Computed properties
  is_license_expired: boolean;
  is_available: boolean;
  compliance_status: 'COMPLIANT' | 'SUSPENDED' | 'LICENSE EXPIRED';
}

export interface DriverListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Driver[];
}

export interface DriverCreate {
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  license_number: string;
  license_expiry: string;
  status?: DriverStatus;
  notes?: string;
}