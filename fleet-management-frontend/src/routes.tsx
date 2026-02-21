import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from './store/store';

// Layouts
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Main Pages
import Dashboard from './pages/dashboard/Dashboard';
import Profile from './pages/profile/Profile';

// Vehicle Pages
import Vehicles from './pages/vehicles/Vehicles';
import VehicleDetail from './pages/vehicles/VehicleDetail';
import CreateVehicle from './pages/vehicles/CreateVehicle';

// Driver Pages
import Drivers from './pages/drivers/Drivers';
import DriverDetail from './pages/drivers/DriverDetail';
import CreateDriver from './pages/drivers/CreateDriver';
// Trip Pages
import Trips from './pages/trips/Trips';
import TripDetail from './pages/trips/TripDetail';
import CreateTrip from './pages/trips/CreateTrip';
// Other Pages
import Maintenance from './pages/maintenance/Maintenance';
import FuelLogs from './pages/fuel/FuelLogs';
import Expenses from './pages/expenses/Expenses';
import Reports from './pages/reports/Reports';
import UserManagement from './pages/users/UserManagement';
import Unauthorized from './pages/Unauthorized';
import CreateFuelLog from './pages/fuel/CreateFuelLog';
import DriverRegister from './pages/auth/DriverRegister';
import DriverDashboard from 'pages/drivers/DriverDashboard';
// Route guards
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { user, token } = useSelector((state: RootState) => state.auth);
  
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <>{children}</>;
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <ProtectedRoute><Dashboard /></ProtectedRoute> },
      { path: 'profile', element: <ProtectedRoute><Profile /></ProtectedRoute> },
      {
  path: 'driver/register',
  element: <DriverRegister />,
},

// Add to MainLayout routes (protected route for drivers)
{
  path: 'driver/dashboard',
  element: (
    <ProtectedRoute allowedRoles={['driver']}>
      <DriverDashboard />
    </ProtectedRoute>
  ),
},
      // Vehicle Routes
      { path: 'vehicles', element: <ProtectedRoute allowedRoles={['manager', 'dispatcher']}><Vehicles /></ProtectedRoute> },
      { path: 'vehicles/create', element: <ProtectedRoute allowedRoles={['manager', 'dispatcher']}><CreateVehicle /></ProtectedRoute> },
      { path: 'vehicles/:id', element: <ProtectedRoute allowedRoles={['manager', 'dispatcher']}><VehicleDetail /></ProtectedRoute> },
      
      // Driver Routes
      { path: 'drivers', element: <ProtectedRoute allowedRoles={['manager', 'safety_officer']}><Drivers /></ProtectedRoute> },
      { path: 'drivers/create', element: <ProtectedRoute allowedRoles={['manager', 'safety_officer']}><CreateDriver /></ProtectedRoute> },
      { path: 'drivers/:id', element: <ProtectedRoute allowedRoles={['manager', 'safety_officer']}><DriverDetail /></ProtectedRoute> },
      
      // Trip Routes
      { path: 'trips', element: <ProtectedRoute allowedRoles={['manager', 'dispatcher']}><Trips /></ProtectedRoute> },
      { path: 'trips/create', element: <ProtectedRoute allowedRoles={['manager', 'dispatcher']}><CreateTrip /></ProtectedRoute> },
      { path: 'trips/:id', element: <ProtectedRoute allowedRoles={['manager', 'dispatcher']}><TripDetail /></ProtectedRoute> },
      
      // Other Routes
      { path: 'maintenance', element: <ProtectedRoute allowedRoles={['manager', 'safety_officer']}><Maintenance /></ProtectedRoute> },
      { path: 'fuel', element: <ProtectedRoute allowedRoles={['manager', 'dispatcher']}><FuelLogs /></ProtectedRoute> },
      { path: 'expenses', element: <ProtectedRoute allowedRoles={['manager', 'analyst']}><Expenses /></ProtectedRoute> },
      { path: 'reports', element: <ProtectedRoute allowedRoles={['manager', 'analyst']}><Reports /></ProtectedRoute> },
      { path: 'users', element: <ProtectedRoute allowedRoles={['manager']}><UserManagement /></ProtectedRoute> },
      { path: 'fuel/create', element: <ProtectedRoute allowedRoles={['manager', 'dispatcher']}><CreateFuelLog /></ProtectedRoute> },
    ],
  },
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: 'forgot-password', element: <ForgotPassword /> },
      { path: 'reset-password/:token', element: <ResetPassword /> },
    ],
  },
  { path: '/unauthorized', element: <Unauthorized /> },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
]);