import api from './api';
import { Vehicle, VehicleListResponse } from '../types/vehicle';

export const vehicleService = {
  async getVehicles(params?: any): Promise<VehicleListResponse> {
    const response = await api.get('/vehicles/', { params });
    return response.data;
  },
  
  async getVehicle(id: number): Promise<Vehicle> {
    const response = await api.get(`/vehicles/${id}/`);
    return response.data;
  },
  
  async createVehicle(data: Partial<Vehicle>): Promise<Vehicle> {
    const response = await api.post('/vehicles/', data);
    return response.data;
  },
  
  async updateVehicle(id: number, data: Partial<Vehicle>): Promise<Vehicle> {
    const response = await api.patch(`/vehicles/${id}/`, data);
    return response.data;
  },
  
  async deleteVehicle(id: number): Promise<void> {
    await api.delete(`/vehicles/${id}/`);
  },
  
  async getAvailableVehicles(): Promise<Vehicle[]> {
    const response = await api.get('/vehicles/available/');
    return response.data;
  },
  
  async getVehicleROI(id: number): Promise<any> {
    const response = await api.get(`/vehicles/${id}/roi/`);
    return response.data;
  },
};