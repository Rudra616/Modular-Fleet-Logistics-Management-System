import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { driverService } from '../../services/drivers';
import { toast } from 'react-hot-toast';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const schema = yup.object({
  first_name: yup.string()
    .required('First name is required')
    .min(2, 'First name too short'),
  last_name: yup.string()
    .required('Last name is required')
    .min(2, 'Last name too short'),
  email: yup.string()
    .email('Invalid email format')
    .required('Email is required'),
  phone: yup.string()
    .required('Phone number is required')
    .matches(/^[+]?[\d\s-]{10,}$/, 'Invalid phone number'),
  license_number: yup.string()
    .required('License number is required')
    .min(5, 'License number too short'),
  license_expiry: yup.string()
    .required('License expiry date is required')
    .test('future', 'License must be valid for at least 30 days', function(value) {
      const expiryDate = new Date(value);
      const today = new Date();
      const thirtyDays = new Date(today.setDate(today.getDate() + 30));
      return expiryDate >= thirtyDays;
    }),
  status: yup.string()
    .oneOf(['off_duty', 'on_duty', 'suspended'], 'Invalid status')
    .default('off_duty'),
  notes: yup.string().optional().nullable(),
});

type DriverForm = yup.InferType<typeof schema>;

const CreateDriver: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<any>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      status: 'off_duty',
      notes: '',
    },
  });

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      // Format data for API
      const driverData = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        license_number: data.license_number,
        license_expiry: data.license_expiry,
        status: data.status,
        notes: data.notes || '',
      };
      
      await driverService.createDriver(driverData);
      toast.success('Driver created successfully');
      navigate('/drivers');
    } catch (error: any) {
      console.error('Error creating driver:', error);
      if (error.response?.data) {
        Object.keys(error.response.data).forEach(key => {
          toast.error(`${key}: ${error.response.data[key]}`);
        });
      } else {
        toast.error('Failed to create driver');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header with back button */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/drivers')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Add New Driver</h1>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              {...register('first_name')}
              type="text"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="John"
            />
            {errors.first_name && (
              <p className="mt-1 text-xs text-red-600">{String(errors.first_name.message)}</p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              {...register('last_name')}
              type="text"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Doe"
            />
            {errors.last_name && (
              <p className="mt-1 text-xs text-red-600">{String(errors.last_name.message)}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              {...register('email')}
              type="email"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="john.doe@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{String(errors.email.message)}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              {...register('phone')}
              type="tel"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+1234567890"
            />
            {errors.phone && (
              <p className="mt-1 text-xs text-red-600">{String(errors.phone.message)}</p>
            )}
          </div>

          {/* License Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              License Number <span className="text-red-500">*</span>
            </label>
            <input
              {...register('license_number')}
              type="text"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="DL-2024-001"
            />
            {errors.license_number && (
              <p className="mt-1 text-xs text-red-600">{String(errors.license_number.message)}</p>
            )}
          </div>

          {/* License Expiry */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              License Expiry <span className="text-red-500">*</span>
            </label>
            <input
              {...register('license_expiry')}
              type="date"
              min={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.license_expiry && (
              <p className="mt-1 text-xs text-red-600">{String(errors.license_expiry.message)}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">Must be valid for at least 30 days</p>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              {...register('status')}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="off_duty">Off Duty</option>
              <option value="on_duty">On Duty</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            {...register('notes')}
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Any additional information..."
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => navigate('/drivers')}
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
              'Create Driver'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateDriver;