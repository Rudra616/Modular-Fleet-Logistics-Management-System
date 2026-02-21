import api from './api';
import { Expense, ExpenseListResponse } from '../types/expense';
import { toast } from 'react-hot-toast';

export const expenseService = {
  // Get all expenses
  async getExpenses(params?: any): Promise<ExpenseListResponse> {
    const response = await api.get('/expenses/', { params });
    return response.data;
  },
  
  // Get single expense
  async getExpense(id: number): Promise<Expense> {
    const response = await api.get(`/expenses/${id}/`);
    return response.data;
  },
  
  // Create expense
  async createExpense(data: Partial<Expense>): Promise<Expense> {
    const response = await api.post('/expenses/', data);
    toast.success('Expense added successfully');
    return response.data;
  },
  
  // Update expense
  async updateExpense(id: number, data: Partial<Expense>): Promise<Expense> {
    const response = await api.patch(`/expenses/${id}/`, data);
    toast.success('Expense updated');
    return response.data;
  },
  
  // Delete expense
  async deleteExpense(id: number): Promise<void> {
    await api.delete(`/expenses/${id}/`);
    toast.success('Expense deleted');
  },
};