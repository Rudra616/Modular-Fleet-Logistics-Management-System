import api from './api';
import { toast } from 'react-hot-toast';

export interface FuelLog {
  id: number;
  vehicle: number;
  vehicle_plate?: string;
  date: string;
  liters: number;
  price_per_liter: number;
  total_cost: number;
  odometer_km: number;
  fuel_station?: string;
  trip?: number | null;
  logged_by?: number;
  logged_by_name?: string;
  created_at: string;
}

export const fuelService = {
  // Get all fuel logs
  async getFuelLogs(params?: any) {
    try {
      const response = await api.get('/fuel/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching fuel logs:', error);
      throw error;
    }
  },

  // Create fuel log
  async createFuelLog(data: any) {
    try {
      const response = await api.post('/fuel/', data);
      toast.success('Fuel log created successfully');
      return response.data;
    } catch (error) {
      console.error('Error creating fuel log:', error);
      throw error;
    }
  },

  // Update fuel log
  async updateFuelLog(id: number, data: any) {
    try {
      const response = await api.patch(`/fuel/${id}/`, data);
      toast.success('Fuel log updated successfully');
      return response.data;
    } catch (error) {
      console.error('Error updating fuel log:', error);
      throw error;
    }
  },

  // Delete fuel log
  async deleteFuelLog(id: number) {
    try {
      await api.delete(`/fuel/${id}/`);
      toast.success('Fuel log deleted successfully');
    } catch (error) {
      console.error('Error deleting fuel log:', error);
      throw error;
    }
  },

  // Get fuel efficiency report
  async getFuelEfficiency() {
    try {
      const response = await api.get('/fuel/efficiency/');
      return response.data;
    } catch (error) {
      console.error('Error fetching fuel efficiency:', error);
      throw error;
    }
  },
};