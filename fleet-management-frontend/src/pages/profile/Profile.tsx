import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { authService } from '../../services/auth';
import { toast } from 'react-hot-toast';
import { UserCircleIcon } from '@heroicons/react/24/outline';

const profileSchema = yup.object({
  first_name: yup.string().required('First name is required'),
  last_name: yup.string().required('Last name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().optional().nullable(),
});

const passwordSchema = yup.object({
  current_password: yup.string().required('Current password is required'),
  new_password: yup.string()
    .required('New password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Must contain one uppercase letter')
    .matches(/[0-9]/, 'Must contain one number'),
  confirm_password: yup.string()
    .required('Please confirm password')
    .oneOf([yup.ref('new_password')], 'Passwords must match'),
});

type ProfileForm = yup.InferType<typeof profileSchema>;
type PasswordForm = yup.InferType<typeof passwordSchema>;

const Profile: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register: registerProfile, handleSubmit: handleProfileSubmit, formState: { errors: profileErrors } } = useForm<any>({
    resolver: yupResolver(profileSchema) as any,
    defaultValues: {
      first_name: user?.first_name,
      last_name: user?.last_name,
      email: user?.email,
      phone: user?.phone || '',
    },
  });

  const { register: registerPassword, handleSubmit: handlePasswordSubmit, reset: resetPassword, formState: { errors: passwordErrors } } = useForm<any>({
    resolver: yupResolver(passwordSchema) as any,
  });

  const onProfileSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const profileData = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone || '',
      };
      await authService.updateProfile(profileData);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onPasswordSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      await authService.changePassword(data.current_password, data.new_password);
      setChangingPassword(false);
      resetPassword();
      toast.success('Password changed successfully');
    } catch (error) {
      console.error('Error changing password:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>
      
      {/* Profile Info Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center mb-6">
          <UserCircleIcon className="h-16 w-16 text-gray-400" />
          <div className="ml-4">
            <h2 className="text-xl font-semibold">{user?.first_name} {user?.last_name}</h2>
            <p className="text-gray-600">{user?.role_display}</p>
          </div>
        </div>

        {!isEditing ? (
          // View Mode
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <p className="mt-1 text-gray-900">{user?.username}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-gray-900">{user?.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <p className="mt-1 text-gray-900">{user?.first_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <p className="mt-1 text-gray-900">{user?.last_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <p className="mt-1 text-gray-900">{user?.phone || 'Not provided'}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Edit Profile
              </button>
              <button
                onClick={() => setChangingPassword(!changingPassword)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Change Password
              </button>
            </div>
          </div>
        ) : (
          // Edit Mode
          <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name *</label>
                <input
                  {...registerProfile('first_name')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                {profileErrors.first_name && (
                  <p className="mt-1 text-xs text-red-600">{String(profileErrors.first_name.message)}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name *</label>
                <input
                  {...registerProfile('last_name')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                {profileErrors.last_name && (
                  <p className="mt-1 text-xs text-red-600">{String(profileErrors.last_name.message)}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email *</label>
                <input
                  {...registerProfile('email')}
                  type="email"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                {profileErrors.email && (
                  <p className="mt-1 text-xs text-red-600">{String(profileErrors.email.message)}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  {...registerProfile('phone')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                {profileErrors.phone && (
                  <p className="mt-1 text-xs text-red-600">{String(profileErrors.phone.message)}</p>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Change Password Section */}
      {changingPassword && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Change Password</h3>
          <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Current Password</label>
              <input
                {...registerPassword('current_password')}
                type="password"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              {passwordErrors.current_password && (
                <p className="mt-1 text-xs text-red-600">{String(passwordErrors.current_password.message)}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">New Password</label>
              <input
                {...registerPassword('new_password')}
                type="password"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              {passwordErrors.new_password && (
                <p className="mt-1 text-xs text-red-600">{String(passwordErrors.new_password.message)}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
              <input
                {...registerPassword('confirm_password')}
                type="password"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              {passwordErrors.confirm_password && (
                <p className="mt-1 text-xs text-red-600">{String(passwordErrors.confirm_password.message)}</p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Changing...' : 'Change Password'}
              </button>
              <button
                type="button"
                onClick={() => setChangingPassword(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Profile;