// src/types/user.ts
export type UserRole = 'manager' | 'dispatcher' | 'safety_officer' | 'analyst' | 'driver'; // Add 'driver'

// For public registration - excludes manager
export type PublicRegisterRole = Exclude<UserRole, 'manager'>;

export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  email: string;
  role: UserRole;
  role_display: string;
  phone: string;
  is_active: boolean;
  date_joined: string;
}

export interface RegisterData {
  username: string;
  password: string;
  confirm_password: string;
  email: string;
  first_name: string;
  last_name: string;
  role?: PublicRegisterRole;
  phone?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface UserListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: User[];
}

export const getUserFullName = (user: User): string => {
  return user.full_name || `${user.first_name} ${user.last_name}`.trim() || user.username;
};