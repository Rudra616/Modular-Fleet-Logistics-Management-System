import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { tripService } from '../../services/trips';
import { vehicleService } from '../../services/vehicles';
import { driverService } from '../../services/drivers';
import { Vehicle } from '../../types/vehicle';
import { Driver } from '../../types/driver';
import { toast } from 'react-hot-toast';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const schema = yup.object({
  vehicle: yup.number()
    .required('Please select a vehicle')
    .positive('Invalid vehicle'),
  driver: yup.number()
    .required('Please select a driver')
    .positive('Invalid driver'),
  origin: yup.string()
    .required('Origin is required')
    .min(3, 'Origin too short'),
  destination: yup.string()
    .required('Destination is required')
    .min(3, 'Destination too short'),
  scheduled_date: yup.string()
    .required('Scheduled date is required')
    .test('future', 'Scheduled date must be today or later', function(value) {
      return new Date(value) >= new Date(new Date().setHours(0, 0, 0, 0));
    }),
  cargo_description: yup.string().optional(),
  cargo_weight_kg: yup.number()
    .required('Cargo weight is required')
    .positive('Weight must be positive')
    .test('max-weight', 'Weight exceeds vehicle capacity', function(value) {
      const vehicleId = this.parent.vehicle;
      const vehicles = (this as any).options?.context?.vehicles;
      if (vehicleId && vehicles) {
        const vehicle = vehicles.find((v: Vehicle) => v.id === vehicleId);
        if (vehicle && value > vehicle.capacity_kg) {
          return false;
        }
      }
      return true;
    }),
  revenue: yup.number()
    .optional()
    .min(0, 'Revenue cannot be negative'),
  distance_km: yup.number()
    .optional()
    .min(0, 'Distance cannot be negative'),
  notes: yup.string().optional(),
});

type TripForm = yup.InferType<typeof schema>;

const CreateTrip: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [loadingDrivers, setLoadingDrivers] = useState(false);

  // SINGLE useForm declaration - THIS IS THE ONLY ONE
  const { register, handleSubmit, watch, formState: { errors }, trigger } = useForm<any>({
    resolver: yupResolver(schema) as any,
    context: { vehicles },
    defaultValues: {
      scheduled_date: new Date().toISOString().split('T')[0],
      cargo_description: '',
      revenue: 0,
      distance_km: 0,
      notes: '',
    },
  });

  const selectedVehicleId = watch('vehicle');
  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

  useEffect(() => {
    loadVehicles();
    loadDrivers();
  }, []);

  useEffect(() => {
    if (selectedVehicleId) {
      trigger('cargo_weight_kg');
    }
  }, [selectedVehicleId, trigger]);

  const loadVehicles = async () => {
    try {
      setLoadingVehicles(true);
      const data = await vehicleService.getAvailableVehicles();
      setVehicles(data);
    } catch (error) {
      console.error('Error loading vehicles:', error);
      toast.error('Failed to load vehicles');
    } finally {
      setLoadingVehicles(false);
    }
  };

const loadDrivers = async () => {
  try {
    setLoadingDrivers(true);
    
    // METHOD 1: Try to get available drivers (will 403 for dispatchers)
    try {
      console.log('Attempting to fetch available drivers...');
      const data = await driverService.getAvailableDrivers();
      console.log('Available drivers from API:', data);
      
      if (data && data.length > 0) {
        setDrivers(data);
        setLoadingDrivers(false);
        return;
      }
    } catch (error: any) {
      console.log('Available drivers endpoint not accessible (expected for dispatcher)');
    }
    
    // METHOD 2: Get all drivers and filter
    console.log('Fetching all drivers as fallback...');
    const response = await driverService.getDrivers();
    const allDrivers = response.results || response || [];
    console.log('All drivers from API:', allDrivers);
    
    if (allDrivers.length === 0) {
      console.log('No drivers found in database!');
      toast.error('No drivers found. Please add drivers first.');
      setDrivers([]);
      return;
    }
    
    // Filter for available drivers
    const today = new Date();
    const availableDrivers = allDrivers.filter((d: Driver) => {
      const licenseExpiry = new Date(d.license_expiry);
      const isAvailable = d.status === 'off_duty' && licenseExpiry >= today;
      
      console.log(`Driver ${d.full_name}: status=${d.status}, license_expiry=${d.license_expiry}, available=${isAvailable}`);
      
      return isAvailable;
    });
    
    console.log('Filtered available drivers:', availableDrivers);
    
    if (availableDrivers.length === 0) {
      console.log('No available drivers found. Showing all drivers for debugging:');
      console.log(allDrivers.map((d: Driver) => ({
        name: d.full_name,
        status: d.status,
        license_expiry: d.license_expiry,
        is_expired: new Date(d.license_expiry) < today
      })));
      
      // TEMPORARY: Show all drivers for debugging (remove after fixing)
      // setDrivers(allDrivers);
      toast.error('No available drivers. Please check driver status.');
      setDrivers([]);
    } else {
      setDrivers(availableDrivers);
    }
    
  } catch (error) {
    console.error('Error loading drivers:', error);
    toast.error('Failed to load drivers');
    setDrivers([]);
  } finally {
    setLoadingDrivers(false);
  }
};
  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      // Convert form data to match API expected format
      const tripData = {
        vehicle: Number(data.vehicle),
        driver: Number(data.driver),
        origin: data.origin,
        destination: data.destination,
        scheduled_date: data.scheduled_date,
        cargo_description: data.cargo_description || '',
        cargo_weight_kg: Number(data.cargo_weight_kg),
        revenue: data.revenue ? Number(data.revenue) : 0,
        distance_km: data.distance_km ? Number(data.distance_km) : 0,
        notes: data.notes || '',
      };
      
      await tripService.createTrip(tripData);
      toast.success('Trip created successfully');
      navigate('/trips');
    } catch (error: any) {
      console.error('Error creating trip:', error);
      if (error.response?.data) {
        Object.keys(error.response.data).forEach(key => {
          const messages = error.response.data[key];
          if (Array.isArray(messages)) {
            toast.error(`${key}: ${messages[0]}`);
          } else {
            toast.error(`${key}: ${messages}`);
          }
        });
      } else {
        toast.error('Failed to create trip');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header with back button */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/trips')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Create New Trip</h1>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-md p-6 space-y-4">
        {/* Vehicle and Driver Selection */}
        <div className="grid grid-cols-2 gap-4">
          {/* Vehicle Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Select Vehicle <span className="text-red-500">*</span>
            </label>
            <select
              {...register('vehicle')}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a vehicle</option>
              {loadingVehicles ? (
                <option disabled>Loading vehicles...</option>
              ) : (
                vehicles.map(vehicle => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.license_plate} - {vehicle.make} {vehicle.model} ({vehicle.capacity_kg}kg)
                  </option>
                ))
              )}
            </select>
            {errors.vehicle && (
              <p className="mt-1 text-xs text-red-600">{String(errors.vehicle.message)}</p>
            )}
          </div>

          {/* Driver Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Select Driver <span className="text-red-500">*</span>
            </label>
            <select
              {...register('driver')}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a driver</option>
              {loadingDrivers ? (
                <option disabled>Loading drivers...</option>
              ) : (
                drivers.map(driver => (
                  <option key={driver.id} value={driver.id}>
                    {driver.full_name} - {driver.license_number}
                  </option>
                ))
              )}
            </select>
            {errors.driver && (
              <p className="mt-1 text-xs text-red-600">{String(errors.driver.message)}</p>
            )}
          </div>
        </div>

        {/* Origin and Destination */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Origin <span className="text-red-500">*</span>
            </label>
            <input
              {...register('origin')}
              type="text"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="New York, NY"
            />
            {errors.origin && (
              <p className="mt-1 text-xs text-red-600">{String(errors.origin.message)}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Destination <span className="text-red-500">*</span>
            </label>
            <input
              {...register('destination')}
              type="text"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Boston, MA"
            />
            {errors.destination && (
              <p className="mt-1 text-xs text-red-600">{String(errors.destination.message)}</p>
            )}
          </div>
        </div>

        {/* Scheduled Date and Cargo */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Scheduled Date <span className="text-red-500">*</span>
            </label>
            <input
              {...register('scheduled_date')}
              type="date"
              min={new Date().toISOString().split('T')[0]}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.scheduled_date && (
              <p className="mt-1 text-xs text-red-600">{String(errors.scheduled_date.message)}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Cargo Description
            </label>
            <input
              {...register('cargo_description')}
              type="text"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Electronics, Furniture, etc."
            />
          </div>
        </div>

        {/* Cargo Weight and Vehicle Capacity Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Cargo Weight (kg) <span className="text-red-500">*</span>
            </label>
            <input
              {...register('cargo_weight_kg')}
              type="number"
              step="0.01"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="500"
            />
            {errors.cargo_weight_kg && (
              <p className="mt-1 text-xs text-red-600">{String(errors.cargo_weight_kg.message)}</p>
            )}
          </div>

          {selectedVehicle && (
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Vehicle Capacity:</span> {selectedVehicle.capacity_kg} kg
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Max load: {selectedVehicle.capacity_kg} kg
              </p>
            </div>
          )}
        </div>

        {/* Revenue and Distance */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Expected Revenue ($)
            </label>
            <input
              {...register('revenue')}
              type="number"
              step="0.01"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="2500"
            />
            {errors.revenue && (
              <p className="mt-1 text-xs text-red-600">{String(errors.revenue.message)}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Distance (km)
            </label>
            <input
              {...register('distance_km')}
              type="number"
              step="0.01"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="215"
            />
            {errors.distance_km && (
              <p className="mt-1 text-xs text-red-600">{String(errors.distance_km.message)}</p>
            )}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Additional Notes</label>
          <textarea
            {...register('notes')}
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Any special instructions or notes..."
          />
        </div>

        {/* Summary if vehicle and driver selected */}
        {selectedVehicleId && drivers.find(d => d.id === watch('driver')) && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <h3 className="text-sm font-semibold text-green-800 mb-2">Trip Summary</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-green-700">Vehicle:</span>
                <p className="font-medium">{selectedVehicle?.make} {selectedVehicle?.model} - {selectedVehicle?.license_plate}</p>
              </div>
              <div>
                <span className="text-green-700">Driver:</span>
                <p className="font-medium">{drivers.find(d => d.id === watch('driver'))?.full_name}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => navigate('/trips')}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Creating...
              </>
            ) : (
              'Create Trip'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateTrip;