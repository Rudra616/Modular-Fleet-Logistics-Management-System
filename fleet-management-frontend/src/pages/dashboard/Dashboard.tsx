import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { dashboardService } from '../../services/dashboard';
import { DashboardKPI } from '../../types/dashboard';
import { toast } from 'react-hot-toast';
import { 
  TruckIcon, 
  UserGroupIcon, 
  MapIcon, 
  CurrencyDollarIcon,
  WrenchIcon,
  BeakerIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const Dashboard: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [kpi, setKpi] = useState<DashboardKPI | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      const data = await dashboardService.getDashboardKPIs();
      setKpi(data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!kpi) return null;

  // Role-Based Cards Configuration
  const getCards = () => {
    const cards = [];

    // Common cards for all roles
    cards.push(
      { 
        title: 'Total Vehicles', 
        value: kpi.total_vehicles, 
        icon: TruckIcon, 
        color: 'blue',
        role: ['manager', 'dispatcher', 'safety_officer', 'analyst']
      },
      { 
        title: 'Active Fleet', 
        value: kpi.active_fleet, 
        icon: TruckIcon, 
        color: 'green',
        role: ['manager', 'dispatcher', 'safety_officer', 'analyst']
      },
      { 
        title: 'Utilization Rate', 
        value: `${kpi.utilization_rate}%`, 
        icon: ChartBarIcon, 
        color: 'purple',
        role: ['manager', 'dispatcher', 'safety_officer', 'analyst']
      }
    );

    // Role-specific cards
    if (user?.role === 'manager' || user?.role === 'dispatcher') {
      cards.push(
        { 
          title: 'Total Trips', 
          value: kpi.total_trips, 
          icon: MapIcon, 
          color: 'indigo',
          role: ['manager', 'dispatcher']
        },
        { 
          title: 'Active Trips', 
          value: kpi.trips_dispatched, 
          icon: MapIcon, 
          color: 'green',
          role: ['manager', 'dispatcher']
        }
      );
    }

    if (user?.role === 'manager' || user?.role === 'safety_officer') {
      cards.push(
        { 
          title: 'Total Drivers', 
          value: kpi.total_drivers, 
          icon: UserGroupIcon, 
          color: 'yellow',
          role: ['manager', 'safety_officer']
        },
        { 
          title: 'Drivers On Duty', 
          value: kpi.drivers_on_duty, 
          icon: UserGroupIcon, 
          color: 'green',
          role: ['manager', 'safety_officer']
        },
        { 
          title: 'License Expired', 
          value: kpi.drivers_expired_license, 
          icon: UserGroupIcon, 
          color: 'red',
          role: ['manager', 'safety_officer']
        },
        { 
          title: 'Maintenance Alerts', 
          value: kpi.maintenance_alerts, 
          icon: WrenchIcon, 
          color: 'orange',
          role: ['manager', 'safety_officer']
        }
      );
    }

    if (user?.role === 'manager' || user?.role === 'analyst') {
      cards.push(
        { 
          title: 'Total Revenue', 
          value: `$${kpi.total_revenue.toLocaleString()}`, 
          icon: CurrencyDollarIcon, 
          color: 'green',
          role: ['manager', 'analyst']
        },
        { 
          title: 'Fuel Cost', 
          value: `$${kpi.total_fuel_cost.toLocaleString()}`, 
          icon: BeakerIcon, 
          color: 'yellow',
          role: ['manager', 'analyst']
        },
        { 
          title: 'Net Profit', 
          value: `$${kpi.net_profit.toLocaleString()}`, 
          icon: CurrencyDollarIcon, 
          color: 'purple',
          role: ['manager', 'analyst']
        }
      );
    }

    return cards;
  };

  const getCardColor = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-green-50 text-green-600',
      red: 'bg-red-50 text-red-600',
      yellow: 'bg-yellow-50 text-yellow-600',
      purple: 'bg-purple-50 text-purple-600',
      indigo: 'bg-indigo-50 text-indigo-600',
      orange: 'bg-orange-50 text-orange-600',
    };
    return colors[color as keyof typeof colors] || 'bg-gray-50 text-gray-600';
  };

  const cards = getCards();

  return (
    <div className="p-6">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.first_name}!
        </h1>
        <p className="text-gray-600 mt-2">
          {user?.role_display} Dashboard - {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-full ${getCardColor(card.color)}`}>
                <card.icon className="h-6 w-6" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{card.value}</span>
            </div>
            <h3 className="text-gray-600 font-medium">{card.title}</h3>
          </div>
        ))}
      </div>

      {/* Role-Specific Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trip Status - For Manager/Dispatcher */}
        {(user?.role === 'manager' || user?.role === 'dispatcher') && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MapIcon className="h-5 w-5 text-blue-500" />
              Trip Status
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Draft</span>
                <span className="font-semibold">{kpi.trips_in_draft}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Dispatched</span>
                <span className="font-semibold text-blue-600">{kpi.trips_dispatched}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Completed</span>
                <span className="font-semibold text-green-600">{kpi.trips_completed}</span>
              </div>
            </div>
          </div>
        )}

        {/* Driver Compliance - For Manager/Safety Officer */}
        {(user?.role === 'manager' || user?.role === 'safety_officer') && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <UserGroupIcon className="h-5 w-5 text-yellow-500" />
              Driver Compliance
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">On Duty</span>
                <span className="font-semibold text-green-600">{kpi.drivers_on_duty}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Suspended</span>
                <span className="font-semibold text-red-600">{kpi.drivers_suspended}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Expired License</span>
                <span className="font-semibold text-red-600">{kpi.drivers_expired_license}</span>
              </div>
            </div>
          </div>
        )}

        {/* Vehicle Status - For All */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TruckIcon className="h-5 w-5 text-blue-500" />
            Vehicle Status
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Available</span>
              <span className="font-semibold text-green-600">{kpi.vehicles_available}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">On Trip</span>
              <span className="font-semibold text-blue-600">{kpi.active_fleet}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">In Shop</span>
              <span className="font-semibold text-yellow-600">{kpi.vehicles_in_shop}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;