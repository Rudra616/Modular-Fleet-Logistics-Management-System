import React from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import {
  HomeIcon,
  TruckIcon,
  UserGroupIcon,
  MapIcon,
  WrenchIcon,
  BeakerIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

const Sidebar: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, roles: ['manager', 'dispatcher', 'safety_officer', 'analyst'] },
    { name: 'Vehicles', href: '/vehicles', icon: TruckIcon, roles: ['manager', 'dispatcher'] },
    { name: 'Drivers', href: '/drivers', icon: UserGroupIcon, roles: ['manager', 'safety_officer'] },
    { name: 'Trips', href: '/trips', icon: MapIcon, roles: ['manager', 'dispatcher'] },
    { name: 'Maintenance', href: '/maintenance', icon: WrenchIcon, roles: ['manager', 'safety_officer'] },
    { name: 'Fuel Logs', href: '/fuel', icon: BeakerIcon, roles: ['manager', 'dispatcher'] },
    { name: 'Expenses', href: '/expenses', icon: CurrencyDollarIcon, roles: ['manager', 'analyst'] },
    { name: 'Reports', href: '/reports', icon: ChartBarIcon, roles: ['manager', 'analyst'] },
  ];

  const filteredNavigation = navigation.filter(item => 
    user && item.roles.includes(user.role)
  );

  return (
    <div className="w-64 bg-gray-800 min-h-screen">
      <nav className="mt-5 px-2">
        {filteredNavigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `group flex items-center px-2 py-2 text-sm font-medium rounded-md mb-1 ${
                isActive
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`
            }
          >
            <item.icon
              className="mr-3 h-6 w-6"
              aria-hidden="true"
            />
            {item.name}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;