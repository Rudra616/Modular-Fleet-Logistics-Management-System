export const colors = {
  // Status colors
  status: {
    available: '#10b981',      // green
    on_trip: '#3b82f6',        // blue
    in_shop: '#f59e0b',        // amber
    retired: '#6b7280',        // gray
    suspended: '#ef4444',       // red
    off_duty: '#6b7280',        // gray
    on_duty: '#10b981',         // green
    
    draft: '#6b7280',           // gray
    dispatched: '#3b82f6',      // blue
    completed: '#10b981',        // green
    cancelled: '#ef4444',        // red
  },
  
  // Role colors
  roles: {
    manager: '#8b5cf6',          // purple
    dispatcher: '#3b82f6',       // blue
    safety_officer: '#f59e0b',   // amber
    analyst: '#06b6d4',          // cyan
  },
  
  // Category colors
  categories: {
    fuel: '#f97316',             // orange
    maintenance: '#06b6d4',      // cyan
    toll: '#8b5cf6',             // purple
    parking: '#ec4899',          // pink
    insurance: '#14b8a6',        // teal
    salary: '#10b981',           // green
    other: '#6b7280',            // gray
  },
  
  // Vehicle types
  vehicleTypes: {
    truck: '#3b82f6',            // blue
    van: '#10b981',              // green
    pickup: '#f59e0b',           // amber
    tanker: '#ef4444',           // red
    trailer: '#8b5cf6',          // purple
  },
  
  // UI colors
  ui: {
    primary: '#3b82f6',
    secondary: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    success: '#10b981',
    info: '#3b82f6',
    dark: '#1f2937',
    light: '#f9fafb',
    white: '#ffffff',
  }
};

export const getStatusColor = (status: string): string => {
  return colors.status[status as keyof typeof colors.status] || colors.ui.primary;
};

export const getRoleColor = (role: string): string => {
  return colors.roles[role as keyof typeof colors.roles] || colors.ui.primary;
};

export const getCategoryColor = (category: string): string => {
  return colors.categories[category as keyof typeof colors.categories] || colors.ui.primary;
};