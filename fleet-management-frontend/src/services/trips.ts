import api from './api';
import { Trip, TripListResponse, TripCreate } from '../types/trip';
import { toast } from 'react-hot-toast';

export const tripService = {
  // Get all trips
  async getTrips(params?: any): Promise<TripListResponse> {
    try {
      const response = await api.get('/trips/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching trips:', error);
      throw error;
    }
  },

  // Get single trip
  async getTrip(id: number): Promise<Trip> {
    try {
      const response = await api.get(`/trips/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching trip:', error);
      throw error;
    }
  },

  // Create trip
  async createTrip(data: TripCreate): Promise<Trip> {
    try {
      const response = await api.post('/trips/', data);
      toast.success('Trip created successfully');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create trip';
      toast.error(message);
      throw error;
    }
  },

  // Update trip
  async updateTrip(id: number, data: Partial<Trip>): Promise<Trip> {
    try {
      const response = await api.patch(`/trips/${id}/`, data);
      toast.success('Trip updated successfully');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update trip';
      toast.error(message);
      throw error;
    }
  },

  // Delete trip
  async deleteTrip(id: number): Promise<void> {
    try {
      await api.delete(`/trips/${id}/`);
      toast.success('Trip deleted successfully');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete trip';
      toast.error(message);
      throw error;
    }
  },

  // Dispatch trip
  async dispatchTrip(id: number): Promise<any> {
    try {
      const response = await api.post(`/trips/${id}/dispatch/`);
      toast.success('Trip dispatched successfully');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to dispatch trip';
      toast.error(message);
      throw error;
    }
  },

  // Complete trip
  async completeTrip(id: number, data?: { distance_km?: number; revenue?: number }): Promise<any> {
    try {
      const response = await api.post(`/trips/${id}/complete/`, data);
      toast.success('Trip completed successfully');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to complete trip';
      toast.error(message);
      throw error;
    }
  },

  // Cancel trip
  async cancelTrip(id: number): Promise<any> {
    try {
      const response = await api.post(`/trips/${id}/cancel/`);
      toast.success('Trip cancelled successfully');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to cancel trip';
      toast.error(message);
      throw error;
    }
  },

  // Get trips by status
  async getTripsByStatus(status: string): Promise<Trip[]> {
    try {
      const response = await api.get('/trips/', { params: { status } });
      return response.data.results;
    } catch (error) {
      console.error('Error fetching trips by status:', error);
      throw error;
    }
  },

  // Get active trips (dispatched)
  async getActiveTrips(): Promise<Trip[]> {
    return this.getTripsByStatus('dispatched');
  },

  // Get completed trips
  async getCompletedTrips(): Promise<Trip[]> {
    return this.getTripsByStatus('completed');
  },
};