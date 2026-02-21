import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { vehicleService } from '../../services/vehicles';
import { toast } from 'react-hot-toast';

const schema = yup.object({
  license_plate: yup.string().required('License plate is required'),
  make: yup.string().required('Make is required'),
  model: yup.string().required('Model is required'),
  year: yup.number()
    .required('Year is required')
    .min(1900, 'Invalid year')
    .max(new Date().getFullYear() + 1, 'Invalid year'),
  vehicle_type: yup.string()
    .required('Vehicle type is required')
    .oneOf(['truck', 'van', 'pickup', 'tanker', 'trailer']),
  capacity_kg: yup.number()
    .required('Capacity is required')
    .positive('Capacity must be positive'),
  acquisition_cost: yup.number()
    .required('Acquisition cost is required')
    .positive('Cost must be positive'),
  acquisition_date: yup.string().required('Acquisition date is required'),
  odometer_km: yup.number()
    .required('Odometer reading is required')
    .min(0, 'Odometer cannot be negative'),
});

type VehicleForm = yup.InferType<typeof schema>;

const CreateVehicle: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<VehicleForm>({
    resolver: yupResolver(schema),
  });

// Replace the onSubmit function (around line 43)
const onSubmit = async (data: any) => {
  setIsLoading(true);
  try {
    // Format data exactly as backend expects
    const vehicleData = {
      license_plate: data.license_plate,
      make: data.make,
      model: data.model,
      year: parseInt(data.year),
      vehicle_type: data.vehicle_type,
      capacity_kg: parseFloat(data.capacity_kg),
      acquisition_cost: parseFloat(data.acquisition_cost),
      acquisition_date: data.acquisition_date,
      odometer_km: parseFloat(data.odometer_km),
      // Don't include status - backend defaults to 'available'
    };
    
    console.log('Sending vehicle data:', vehicleData);
    const response = await vehicleService.createVehicle(vehicleData);
    console.log('Vehicle created:', response);
    
    toast.success('Vehicle created successfully');
    navigate('/vehicles');
  } catch (error: any) {
    console.error('Error creating vehicle:', error);
    if (error.response?.data) {
      Object.keys(error.response.data).forEach(key => {
        toast.error(`${key}: ${JSON.stringify(error.response.data[key])}`);
      });
    } else {
      toast.error('Failed to create vehicle');
    }
  } finally {
    setIsLoading(false);
  }
};
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Vehicle</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">License Plate *</label>
            <input
              {...register('license_plate')}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="ABC-1234"
            />
            {errors.license_plate && (
              <p className="mt-1 text-xs text-red-600">{errors.license_plate.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Vehicle Type *</label>
            <select
              {...register('vehicle_type')}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Select type</option>
              <option value="truck">Truck</option>
              <option value="van">Van</option>
              <option value="pickup">Pickup</option>
              <option value="tanker">Tanker</option>
              <option value="trailer">Trailer</option>
            </select>
            {errors.vehicle_type && (
              <p className="mt-1 text-xs text-red-600">{errors.vehicle_type.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Make *</label>
            <input
              {...register('make')}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Toyota"
            />
            {errors.make && (
              <p className="mt-1 text-xs text-red-600">{errors.make.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Model *</label>
            <input
              {...register('model')}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Hilux"
            />
            {errors.model && (
              <p className="mt-1 text-xs text-red-600">{errors.model.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Year *</label>
            <input
              {...register('year')}
              type="number"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="2023"
            />
            {errors.year && (
              <p className="mt-1 text-xs text-red-600">{errors.year.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Capacity (kg) *</label>
            <input
              {...register('capacity_kg')}
              type="number"
              step="0.01"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="2000"
            />
            {errors.capacity_kg && (
              <p className="mt-1 text-xs text-red-600">{errors.capacity_kg.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Odometer (km) *</label>
            <input
              {...register('odometer_km')}
              type="number"
              step="0.01"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="15000"
            />
            {errors.odometer_km && (
              <p className="mt-1 text-xs text-red-600">{errors.odometer_km.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Acquisition Cost ($) *</label>
            <input
              {...register('acquisition_cost')}
              type="number"
              step="0.01"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="35000"
            />
            {errors.acquisition_cost && (
              <p className="mt-1 text-xs text-red-600">{errors.acquisition_cost.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Acquisition Date *</label>
            <input
              {...register('acquisition_date')}
              type="date"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            {errors.acquisition_date && (
              <p className="mt-1 text-xs text-red-600">{errors.acquisition_date.message}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/vehicles')}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Creating...' : 'Create Vehicle'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateVehicle;