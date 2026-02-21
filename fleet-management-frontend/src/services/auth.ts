import api from './api';
import { LoginCredentials, AuthResponse, User, RegisterData } from '../types/user';
import { toast } from 'react-hot-toast';

export const authService = {
  /**
   * Register a new user
   */
async register(data: any): Promise<{ message: string; user: User }> {
  try {
    const response = await api.post('/auth/register/', data);
    toast.success(response.data.message || 'Registration successful!');
    return response.data;
  } catch (error: any) {
    console.error('Registration error:', error);
    if (error.response?.data) {
      const errors = error.response.data;
      // Show each error message
      Object.keys(errors).forEach(key => {
        const value = errors[key];
        if (Array.isArray(value)) {
          toast.error(`${key}: ${value[0]}`);
        } else if (typeof value === 'string') {
          toast.error(`${key}: ${value}`);
        } else if (typeof value === 'object') {
          toast.error(`${key}: Invalid value`);
        }
      });
    } else {
      toast.error('Registration failed. Please try again.');
    }
    throw error;
  }
},

  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // Clear any existing tokens first
      localStorage.removeItem('fleet_access_token');
      localStorage.removeItem('fleet_refresh_token');
      localStorage.removeItem('fleet_user');
      
      const response = await api.post('/auth/login/', credentials);
      
      // Store tokens
      if (response.data.access) {
        localStorage.setItem('fleet_access_token', response.data.access);
      }
      if (response.data.refresh) {
        localStorage.setItem('fleet_refresh_token', response.data.refresh);
      }
      
      // Store user data
      if (response.data.user) {
        localStorage.setItem('fleet_user', JSON.stringify(response.data.user));
      }
      
      toast.success(`Welcome back, ${response.data.user?.full_name || 'User'}!`);
      
      return response.data;
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.response?.status === 401) {
        toast.error('Invalid username or password');
      } else if (error.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Login failed. Please check your credentials.');
      }
      
      throw error;
    }
  },

  /**
   * Logout user
   */
  async logout(refreshToken?: string): Promise<void> {
    try {
      const token = refreshToken || localStorage.getItem('fleet_refresh_token');
      
      if (token) {
        await api.post('/auth/logout/', { refresh: token });
      }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      localStorage.removeItem('fleet_access_token');
      localStorage.removeItem('fleet_refresh_token');
      localStorage.removeItem('fleet_user');
      
      toast.success('Logged out successfully');
    }
  },

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await api.get('/auth/me/');
      
      localStorage.setItem('fleet_user', JSON.stringify(response.data));
      
      return response.data;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  },

  /**
   * Update current user profile
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    try {
      const response = await api.patch('/auth/me/', data);
      
      const currentUser = this.getStoredUser();
      if (currentUser) {
        localStorage.setItem('fleet_user', JSON.stringify({ ...currentUser, ...response.data }));
      }
      
      toast.success('Profile updated successfully');
      
      return response.data;
    } catch (error: any) {
      console.error('Update profile error:', error);
      
      if (error.response?.data) {
        const errors = error.response.data;
        Object.keys(errors).forEach(key => {
          if (Array.isArray(errors[key])) {
            toast.error(`${key}: ${errors[key][0]}`);
          }
        });
      }
      
      throw error;
    }
  },

  /**
   * Change password
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    try {
      await api.post('/auth/change-password/', {
        old_password: oldPassword,
        new_password: newPassword,
      });
      
      toast.success('Password changed successfully');
    } catch (error: any) {
      console.error('Change password error:', error);
      
      if (error.response?.data) {
        const errors = error.response.data;
        if (errors.old_password) {
          toast.error(errors.old_password[0] || 'Current password is incorrect');
        } else if (errors.new_password) {
          toast.error(errors.new_password[0] || 'Invalid new password');
        } else if (errors.error) {
          toast.error(errors.error);
        }
      }
      
      throw error;
    }
  },

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{ access: string }> {
    try {
      const response = await api.post('/auth/token/refresh/', {
        refresh: refreshToken,
      });
      
      if (response.data.access) {
        localStorage.setItem('fleet_access_token', response.data.access);
      }
      
      return response.data;
    } catch (error) {
      console.error('Refresh token error:', error);
      throw error;
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('fleet_access_token');
  },

  /**
   * Get stored user data
   */
  getStoredUser(): User | null {
    const userStr = localStorage.getItem('fleet_user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  },

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem('fleet_access_token');
  },

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem('fleet_refresh_token');
  },

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    const user = this.getStoredUser();
    return user?.role === role;
  },

  /**
   * Check if user has any of the allowed roles
   */
  hasAnyRole(allowedRoles: string[]): boolean {
    const user = this.getStoredUser();
    return user ? allowedRoles.includes(user.role) : false;
  },
};