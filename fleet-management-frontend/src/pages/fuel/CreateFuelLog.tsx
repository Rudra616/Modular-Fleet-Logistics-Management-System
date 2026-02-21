import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { fuelService } from '../../services/fuel';
import { vehicleService } from '../../services/vehicles';
import { Vehicle } from '../../types/vehicle';
import { toast } from 'react-hot-toast';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const schema = yup.object({
  vehicle: yup.number()
    .required('Please select a vehicle')
    .positive('Invalid vehicle'),
  date: yup.string()
    .required('Date is required'),
  liters: yup.number()
    .required('Liters is required')
    .positive('Liters must be positive'),
  price_per_liter: yup.number()
    .required('Price per liter is required')
    .positive('Price must be positive'),
  odometer_km: yup.number()
    .required('Odometer reading is required')
    .min(0, 'Odometer cannot be negative'),
  fuel_station: yup.string().optional(),
  trip: yup.number().optional().nullable(),
});

type FuelLogForm = yup.InferType<typeof schema>;

const CreateFuelLog: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<any>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      setLoadingVehicles(true);
      const data = await vehicleService.getVehicles();
      setVehicles(data.results || data);
    } catch (error) {
      console.error('Error loading vehicles:', error);
      toast.error('Failed to load vehicles');
    } finally {
      setLoadingVehicles(false);
    }
  };

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const fuelData = {
        vehicle: parseInt(data.vehicle),
        date: data.date,
        liters: parseFloat(data.liters),
        price_per_liter: parseFloat(data.price_per_liter),
        odometer_km: parseFloat(data.odometer_km),
        fuel_station: data.fuel_station || '',
        trip: data.trip ? parseInt(data.trip) : null,
      };
      
      console.log('Sending fuel data:', fuelData);
      await fuelService.createFuelLog(fuelData);
      toast.success('Fuel log created successfully');
      navigate('/fuel');
    } catch (error: any) {
      console.error('Error creating fuel log:', error);
      if (error.response?.data) {
        Object.keys(error.response.data).forEach(key => {
          toast.error(`${key}: ${JSON.stringify(error.response.data[key])}`);
        });
      } else {
        toast.error('Failed to create fuel log');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/fuel')}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold">Add Fuel Log</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-md p-6 space-y-4">
        {/* Vehicle Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Vehicle <span className="text-red-500">*</span>
          </label>
          <select
            {...register('vehicle')}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Select a vehicle</option>
            {loadingVehicles ? (
              <option disabled>Loading...</option>
            ) : (
              vehicles.map(vehicle => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.license_plate} - {vehicle.make} {vehicle.model}
                </option>
              ))
            )}
          </select>
          {errors.vehicle && (
            <p className="mt-1 text-xs text-red-600">{String(errors.vehicle.message)}</p>
          )}
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Date <span className="text-red-500">*</span>
          </label>
          <input
            {...register('date')}
            type="date"
            max={new Date().toISOString().split('T')[0]}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          />
          {errors.date && (
            <p className="mt-1 text-xs text-red-600">{String(errors.date.message)}</p>
          )}
        </div>

        {/* Liters */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Liters <span className="text-red-500">*</span>
          </label>
          <input
            {...register('liters')}
            type="number"
            step="0.01"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="50.5"
          />
          {errors.liters && (
            <p className="mt-1 text-xs text-red-600">{String(errors.liters.message)}</p>
          )}
        </div>

        {/* Price per Liter */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Price per Liter ($) <span className="text-red-500">*</span>
          </label>
          <input
            {...register('price_per_liter')}
            type="number"
            step="0.01"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="1.25"
          />
          {errors.price_per_liter && (
            <p className="mt-1 text-xs text-red-600">{String(errors.price_per_liter.message)}</p>
          )}
        </div>

        {/* Odometer */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Odometer (km) <span className="text-red-500">*</span>
          </label>
          <input
            {...register('odometer_km')}
            type="number"
            step="0.01"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="15000"
          />
          {errors.odometer_km && (
            <p className="mt-1 text-xs text-red-600">{String(errors.odometer_km.message)}</p>
          )}
        </div>

        {/* Fuel Station */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Fuel Station
          </label>
          <input
            {...register('fuel_station')}
            type="text"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Shell, BP, etc."
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => navigate('/fuel')}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Creating...' : 'Add Fuel Log'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateFuelLog;