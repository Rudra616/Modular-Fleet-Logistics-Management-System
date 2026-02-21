import api from './api';
import { User, RegisterData, UserListResponse } from '../types/user';

export const userService = {
  // Get all users (Manager only)
  async getUsers(params?: any): Promise<UserListResponse> {
    try {
      const response = await api.get('/users/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  // Get single user
  async getUser(id: number): Promise<User> {
    try {
      const response = await api.get(`/users/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  },

  // Create user (Manager only)
  async createUser(data: RegisterData): Promise<User> {
    try {
      const response = await api.post('/users/', data);
      return response.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  // Update user (Manager only)
  async updateUser(id: number, data: Partial<User>): Promise<User> {
    try {
      const response = await api.patch(`/users/${id}/`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  // Delete user (Manager only)
  async deleteUser(id: number): Promise<void> {
    try {
      await api.delete(`/users/${id}/`);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },
};