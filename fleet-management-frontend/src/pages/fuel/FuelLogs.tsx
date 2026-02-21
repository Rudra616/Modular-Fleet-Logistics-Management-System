import React, { useEffect, useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, BeakerIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { fuelService, FuelLog } from '../../services/fuel';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

const FuelLogs: React.FC = () => {
  const navigate = useNavigate();
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadFuelLogs();
  }, []);

  const loadFuelLogs = async () => {
    try {
      setIsLoading(true);
      const data = await fuelService.getFuelLogs();
      console.log('Fuel logs data:', data); // Debug log
      
      // Handle both paginated and non-paginated responses
      const logs = data.results || data || [];
      
      // Convert string numbers to actual numbers
// Convert string numbers to actual numbers
const processedLogs = logs.map((log: any) => ({
  ...log,
  liters: Number(log.liters) || 0,  // "50" → 50
  price_per_liter: Number(log.price_per_liter) || 0,  // "1.2" → 1.2
  total_cost: Number(log.total_cost) || 0,
  odometer_km: Number(log.odometer_km) || 0,
}));
      
      setFuelLogs(processedLogs);
    } catch (error) {
      console.error('Error loading fuel logs:', error);
      toast.error('Failed to load fuel logs');
      setFuelLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this fuel log?')) return;
    
    try {
      await fuelService.deleteFuelLog(id);
      toast.success('Fuel log deleted successfully');
      loadFuelLogs();
    } catch (error) {
      toast.error('Failed to delete fuel log');
    }
  };

  // Safe filtering with null checks
  const filteredLogs = fuelLogs.filter(log => 
    (log?.vehicle_plate || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log?.fuel_station || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Safe calculations with default values
  const totalCost = fuelLogs.reduce((sum, log) => sum + (log?.total_cost || 0), 0);
  const totalLiters = fuelLogs.reduce((sum, log) => sum + (log?.liters || 0), 0);

  // Helper function to safely format numbers
  const formatNumber = (value: any, decimals: number = 2): string => {
    if (value === undefined || value === null) return '0.00';
    const num = Number(value);
    return isNaN(num) ? '0.00' : num.toFixed(decimals);
  };

  // Helper function to safely format currency
  const formatCurrency = (value: any): string => {
    if (value === undefined || value === null) return '$0.00';
    const num = Number(value);
    return isNaN(num) ? '$0.00' : `$${num.toFixed(2)}`;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fuel Logs</h1>
          <p className="text-gray-600 mt-1">Track fuel consumption and costs</p>
        </div>
        <button
          onClick={() => navigate('/fuel/create')}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Add Fuel Log
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Entries</p>
              <p className="text-2xl font-bold">{fuelLogs.length}</p>
            </div>
            <BeakerIcon className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Fuel</p>
          <p className="text-2xl font-bold text-green-600">
            {formatNumber(totalLiters)} L
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Cost</p>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(totalCost)}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by vehicle or fuel station..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Fuel Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Liters</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price/L</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Cost</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Odometer</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  {fuelLogs.length === 0 ? (
                    <div className="py-8">
                      <BeakerIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                      <p className="text-gray-500 mb-2">No fuel logs found</p>
                      <button
                        onClick={() => navigate('/fuel/create')}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Add your first fuel log
                      </button>
                    </div>
                  ) : (
                    'No fuel logs match your search'
                  )}
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log?.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      {log?.vehicle_plate || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log?.date ? format(new Date(log.date), 'MMM dd, yyyy') : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatNumber(log?.liters)} L
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${formatNumber(log?.price_per_liter)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                    {formatCurrency(log?.total_cost)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatNumber(log?.odometer_km, 0)} km
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => navigate(`/fuel/${log?.id}/edit`)}
                      className="text-yellow-600 hover:text-yellow-900 mr-3"
                      title="Edit"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(log?.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FuelLogs;