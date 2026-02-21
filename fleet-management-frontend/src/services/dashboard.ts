import api from './api';
import { DashboardKPI } from '../types/dashboard';

export const dashboardService = {
  async getDashboardKPIs(): Promise<DashboardKPI> {
    const response = await api.get('/dashboard/');
    return response.data;
  },
};