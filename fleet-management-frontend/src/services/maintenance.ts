import api from './api';
import { Maintenance, MaintenanceListResponse } from '../types/maintenance';
import { toast } from 'react-hot-toast';

export const maintenanceService = {
  // Get all maintenance records
  async getMaintenance(params?: any): Promise<MaintenanceListResponse> {
    const response = await api.get('/maintenance/', { params });
    return response.data;
  },
  
  // Get single maintenance
  async getMaintenanceRecord(id: number): Promise<Maintenance> {
    const response = await api.get(`/maintenance/${id}/`);
    return response.data;
  },
  
  // Create maintenance
  async createMaintenance(data: Partial<Maintenance>): Promise<Maintenance> {
    const response = await api.post('/maintenance/', data);
    toast.success('Maintenance record created');
    return response.data;
  },
  
  // Update maintenance
  async updateMaintenance(id: number, data: Partial<Maintenance>): Promise<Maintenance> {
    const response = await api.patch(`/maintenance/${id}/`, data);
    toast.success('Maintenance updated');
    return response.data;
  },
  
  // Complete maintenance
  async completeMaintenance(id: number): Promise<Maintenance> {
    const response = await api.post(`/maintenance/${id}/complete/`);
    toast.success('Maintenance completed');
    return response.data;
  },
  
  // Delete maintenance
  async deleteMaintenance(id: number): Promise<void> {
    await api.delete(`/maintenance/${id}/`);
    toast.success('Maintenance deleted');
  },
};