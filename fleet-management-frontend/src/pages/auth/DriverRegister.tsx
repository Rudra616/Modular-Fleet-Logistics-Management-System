import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { authService } from '../../services/auth';
import { driverService } from '../../services/drivers';
import { toast } from 'react-hot-toast';
import { TruckIcon } from '@heroicons/react/24/outline';

const schema = yup.object({
  // User account fields
  username: yup.string()
    .required('Username is required')
    .min(3, 'Username must be at least 3 characters'),
  password: yup.string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Must contain one uppercase letter')
    .matches(/[0-9]/, 'Must contain one number'),
  confirm_password: yup.string()
    .required('Please confirm password')
    .oneOf([yup.ref('password')], 'Passwords must match'),
  
  // Driver profile fields
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
});

type DriverRegisterForm = yup.InferType<typeof schema>;

const DriverRegister: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<DriverRegisterForm>({
    resolver: yupResolver(schema),
  });
const onSubmit = async (data: DriverRegisterForm) => {
  setIsLoading(true);
  try {
    // Prepare all data including driver fields for backend
    const userData = {
      username: data.username,
      password: data.password,
      confirm_password: data.confirm_password,
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone,
      role: 'driver',
      // Include driver-specific fields that backend will use
      license_number: data.license_number,
      license_expiry: data.license_expiry,
    };
    
    console.log('Registering driver with data:', { 
      ...userData, 
      password: '***',
      role: userData.role 
    });
    
    // Only one API call - backend handles both user and driver creation
    const response = await authService.register(userData);
    
    toast.success('Driver registration successful! Please login.');
    
    // Redirect to login page
    setTimeout(() => {
      navigate('/login');
    }, 2000);
    
  } catch (error: any) {
    console.error('Registration error:', error);
    if (error.response?.data) {
      const errors = error.response.data;
      Object.keys(errors).forEach(key => {
        const messages = errors[key];
        if (Array.isArray(messages)) {
          messages.forEach(msg => toast.error(`${key}: ${msg}`));
        } else if (typeof messages === 'string') {
          toast.error(`${key}: ${messages}`);
        }
      });
    } else {
      toast.error('Registration failed. Please check all fields.');
    }
  } finally {
    setIsLoading(false);
  }
};
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8 bg-white p-10 rounded-lg shadow-md">
        <div>
          <div className="flex justify-center">
            <TruckIcon className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Driver Registration
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {/* Account Information Section */}
          <div className="bg-blue-50 p-4 rounded-md">
            <h3 className="text-lg font-medium text-blue-800 mb-4">Account Information</h3>
            <div className="grid grid-cols-2 gap-4">
              {/* Username */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('username')}
                  type="text"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="johndoe"
                />
                {errors.username && (
                  <p className="mt-1 text-xs text-red-600">{errors.username.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Confirm <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    {...register('confirm_password')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {errors.confirm_password && (
                  <p className="mt-1 text-xs text-red-600">{errors.confirm_password.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Driver Profile Section */}
          <div className="bg-green-50 p-4 rounded-md">
            <h3 className="text-lg font-medium text-green-800 mb-4">Driver Profile</h3>
            <div className="grid grid-cols-2 gap-4">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('first_name')}
                  type="text"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="John"
                />
                {errors.first_name && (
                  <p className="mt-1 text-xs text-red-600">{errors.first_name.message}</p>
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
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Doe"
                />
                {errors.last_name && (
                  <p className="mt-1 text-xs text-red-600">{errors.last_name.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('email')}
                  type="email"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="john.doe@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
                )}
              </div>

              {/* Phone */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('phone')}
                  type="tel"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="+1234567890"
                />
                {errors.phone && (
                  <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>
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
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="DL2024001"
                />
                {errors.license_number && (
                  <p className="mt-1 text-xs text-red-600">{errors.license_number.message}</p>
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
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                {errors.license_expiry && (
                  <p className="mt-1 text-xs text-red-600">{errors.license_expiry.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Registering...
                </>
              ) : (
                'Register as Driver'
              )}
            </button>
          </div>

          <div className="text-center text-sm text-gray-500">
            By registering, you agree to our Terms and Privacy Policy
          </div>
        </form>
      </div>
    </div>
  );
};

export default DriverRegister;