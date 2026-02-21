export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export const USER_ROLES = {
  MANAGER: 'manager',
  DISPATCHER: 'dispatcher',
  SAFETY_OFFICER: 'safety_officer',
  ANALYST: 'analyst',
} as const;

export const VEHICLE_STATUS = {
  AVAILABLE: 'available',
  ON_TRIP: 'on_trip',
  IN_SHOP: 'in_shop',
  RETIRED: 'retired',
} as const;