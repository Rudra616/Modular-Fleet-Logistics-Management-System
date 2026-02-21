import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tripService } from '../../services/trips';
import { Trip } from '../../types/trip';
import { toast } from 'react-hot-toast';
import { 
  EyeIcon,
  PlusIcon,
  TruckIcon,
  MapIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const Trips: React.FC = () => {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      setIsLoading(true);
      const data = await tripService.getTrips();
      setTrips(data.results || data);
    } catch (error) {
      console.error('Error loading trips:', error);
      toast.error('Failed to load trips');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      dispatched: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const handleStatusChange = async (id: number, action: 'dispatch' | 'complete' | 'cancel') => {
    try {
      if (action === 'dispatch') {
        await tripService.dispatchTrip(id);
        toast.success('Trip dispatched successfully');
      } else if (action === 'complete') {
        await tripService.completeTrip(id);
        toast.success('Trip completed successfully');
      } else if (action === 'cancel') {
        await tripService.cancelTrip(id);
        toast.success('Trip cancelled');
      }
      loadTrips();
    } catch (error) {
      toast.error(`Failed to ${action} trip`);
    }
  };

  const filteredTrips = statusFilter === 'all' 
    ? trips 
    : trips.filter(t => t.status === statusFilter);

  // Calculate stats
  const totalRevenue = trips
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + (t.revenue || 0), 0);
  
  const activeTrips = trips.filter(t => t.status === 'dispatched').length;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trips</h1>
          <p className="text-gray-600 mt-1">Manage and track all trips</p>
        </div>
        <button
          onClick={() => navigate('/trips/create')}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Create Trip
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Trips</p>
              <p className="text-2xl font-bold">{trips.length}</p>
            </div>
            <MapIcon className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Trips</p>
              <p className="text-2xl font-bold text-blue-600">{activeTrips}</p>
            </div>
            <TruckIcon className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {trips.filter(t => t.status === 'completed').length}
              </p>
            </div>
            <MapIcon className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">${totalRevenue.toLocaleString()}</p>
            </div>
            <CurrencyDollarIcon className="h-8 w-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Trips</option>
            <option value="draft">Draft</option>
            <option value="dispatched">Dispatched</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Trips Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle/Driver</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
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
            ) : filteredTrips.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No trips found
                </td>
              </tr>
            ) : (
              filteredTrips.map((trip) => (
                <tr key={trip.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">#{trip.id}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{trip.origin}</div>
                    <div className="text-sm text-gray-500">→ {trip.destination}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{trip.vehicle_plate}</div>
                    <div className="text-sm text-gray-500">{trip.driver_name}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {format(new Date(trip.scheduled_date), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(trip.status)}`}>
                      {trip.status_display}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    ${trip.revenue?.toLocaleString() || '0'}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => navigate(`/trips/${trip.id}`)}
                      className="text-blue-600 hover:text-blue-900"
                      title="View Details"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                    {trip.status === 'draft' && (
                      <button
                        onClick={() => handleStatusChange(trip.id, 'dispatch')}
                        className="text-green-600 hover:text-green-900 text-sm font-medium"
                      >
                        Dispatch
                      </button>
                    )}
                    {trip.status === 'dispatched' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(trip.id, 'complete')}
                          className="text-green-600 hover:text-green-900 text-sm font-medium"
                        >
                          Complete
                        </button>
                        <button
                          onClick={() => handleStatusChange(trip.id, 'cancel')}
                          className="text-red-600 hover:text-red-900 text-sm font-medium"
                        >
                          Cancel
                        </button>
                      </>
                    )}
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

export default Trips;