export interface DashboardKPI {
  // Fleet summary
  total_vehicles: number;
  active_fleet: number;
  vehicles_available: number;
  vehicles_in_shop: number;
  vehicles_retired: number;
  utilization_rate: number;
  
  // Trip summary
  total_trips: number;
  trips_in_draft: number;
  trips_dispatched: number;
  trips_completed: number;
  
  // Driver summary
  total_drivers: number;
  drivers_on_duty: number;
  drivers_suspended: number;
  drivers_expired_license: number;
  
  // Financial summary
  total_revenue: number;
  total_fuel_cost: number;
  total_maintenance_cost: number;
  total_expenses: number;
  net_profit: number;
  
  // Alerts
  maintenance_alerts: number;
}