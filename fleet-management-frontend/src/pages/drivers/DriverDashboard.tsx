import React, { useEffect, useState, useCallback } from 'react'; // Add useCallback
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { driverService } from '../../services/drivers';
import { tripService } from '../../services/trips';
import { Driver } from '../../types/driver';
import { Trip } from '../../types/trip';
import { toast } from 'react-hot-toast';
import { 
  TruckIcon, 
  MapIcon, 
  ClockIcon,
  CheckCircleIcon
  // Remove XCircleIcon if not used
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const DriverDashboard: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [myTrips, setMyTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Wrap loadDriverData in useCallback
const loadDriverData = useCallback(async () => {
  try {
    setIsLoading(true);
    
    // Find driver by user_id (now linked)
    const drivers = await driverService.getDrivers({ user_id: user?.id });
    const currentDriver = (drivers.results || drivers)[0];
    
    if (currentDriver) {
      setDriver(currentDriver);
      
      // Load trips assigned to this driver
      const trips = await tripService.getTrips({ driver: currentDriver.id });
      setMyTrips(trips.results || trips);
    }
  } catch (error) {
    console.error('Error loading driver data:', error);
    toast.error('Failed to load driver data');
  } finally {
    setIsLoading(false);
  }
}, [user?.id]);
  useEffect(() => {
    loadDriverData();
  }, [loadDriverData]); // Now includes loadDriverData

  // ... rest of the component remains the same
  const handleTripAction = async (tripId: number, action: 'accept' | 'complete' | 'cancel') => {
    try {
      if (action === 'accept') {
        // Driver accepts the trip
        await tripService.updateTrip(tripId, { status: 'dispatched' });
        toast.success('Trip accepted!');
      } else if (action === 'complete') {
        await tripService.completeTrip(tripId);
        toast.success('Trip completed!');
      } else if (action === 'cancel') {
        await tripService.cancelTrip(tripId);
        toast.success('Trip cancelled');
      }
      loadDriverData(); // Reload data
    } catch (error) {
      toast.error(`Failed to ${action} trip`);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <TruckIcon className="h-12 w-12 mx-auto text-yellow-500 mb-3" />
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">Driver Profile Not Found</h2>
          <p className="text-yellow-600">
            Please contact your manager to set up your driver profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white mb-6">
        <h1 className="text-2xl font-bold">Welcome, {driver.full_name}!</h1>
        <p className="text-blue-100 mt-1">Driver Dashboard</p>
        <div className="mt-4 grid grid-cols-2 gap-4 max-w-md">
          <div>
            <p className="text-blue-100 text-sm">License</p>
            <p className="font-semibold">{driver.license_number}</p>
          </div>
          <div>
            <p className="text-blue-100 text-sm">Expiry</p>
            <p className="font-semibold">{format(new Date(driver.license_expiry), 'MMM dd, yyyy')}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Trips</p>
              <p className="text-2xl font-bold">{myTrips.length}</p>
            </div>
            <MapIcon className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {myTrips.filter(t => t.status === 'completed').length}
              </p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {myTrips.filter(t => t.status === 'dispatched').length}
              </p>
            </div>
            <ClockIcon className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* My Trips Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">My Assigned Trips</h2>
        </div>
        <div className="p-6">
          {myTrips.length === 0 ? (
            <div className="text-center py-8">
              <TruckIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500">No trips assigned yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myTrips.map((trip) => (
                <div key={trip.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(trip.status)}`}>
                          {trip.status_display}
                        </span>
                        <span className="text-sm text-gray-500">
                          {format(new Date(trip.scheduled_date), 'MMM dd, yyyy')}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">From</p>
                          <p className="font-medium">{trip.origin}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">To</p>
                          <p className="font-medium">{trip.destination}</p>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Cargo:</span> {trip.cargo_description || 'N/A'} 
                        ({trip.cargo_weight_kg} kg)
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {trip.status === 'draft' && (
                        <button
                          onClick={() => handleTripAction(trip.id, 'accept')}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                        >
                          Accept
                        </button>
                      )}
                      {trip.status === 'dispatched' && (
                        <>
                          <button
                            onClick={() => handleTripAction(trip.id, 'complete')}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                          >
                            Complete
                          </button>
                          <button
                            onClick={() => handleTripAction(trip.id, 'cancel')}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;