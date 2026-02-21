import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';


import vehicleReducer from './slices/vehicleSlice';
import driverReducer from './slices/driverSlice';
import tripReducer from './slices/tripSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    vehicles: vehicleReducer,
    drivers: driverReducer,
    trips: tripReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;