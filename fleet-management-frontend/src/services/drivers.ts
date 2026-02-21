import api from './api';
import { Driver, DriverListResponse } from '../types/driver';
import { toast } from 'react-hot-toast';

export const driverService = {
  // Get all drivers
  async getDrivers(params?: any): Promise<DriverListResponse> {
    try {
      const response = await api.get('/drivers/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching drivers:', error);
      throw error;
    }
  },

  // Get available drivers (may 403 for some roles)
  async getAvailableDrivers(): Promise<Driver[]> {
    try {
      const response = await api.get('/drivers/available/');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 403) {
        console.log('Available drivers endpoint not accessible for this role');
        return []; // Return empty array for 403
      }
      console.error('Error fetching available drivers:', error);
      throw error;
    }
  },

  // Create driver
  async createDriver(data: Partial<Driver>): Promise<Driver> {
    try {
      const response = await api.post('/drivers/', data);
      toast.success('Driver created successfully');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create driver';
      toast.error(message);
      throw error;
    }
  },

  // Get single driver
  async getDriver(id: number): Promise<Driver> {
    try {
      const response = await api.get(`/drivers/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching driver:', error);
      throw error;
    }
  },

  // Update driver
  async updateDriver(id: number, data: Partial<Driver>): Promise<Driver> {
    try {
      const response = await api.patch(`/drivers/${id}/`, data);
      toast.success('Driver updated successfully');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update driver';
      toast.error(message);
      throw error;
    }
  },

  // Delete driver
  async deleteDriver(id: number): Promise<void> {
    try {
      await api.delete(`/drivers/${id}/`);
      toast.success('Driver deleted successfully');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete driver';
      toast.error(message);
      throw error;
    }
  },
};