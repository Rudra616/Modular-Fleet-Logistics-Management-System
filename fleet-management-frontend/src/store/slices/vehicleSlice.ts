import { createSlice } from '@reduxjs/toolkit';

interface VehicleState {
  vehicles: any[];
  loading: boolean;
  error: string | null;
}

const initialState: VehicleState = {
  vehicles: [],
  loading: false,
  error: null,
};

const vehicleSlice = createSlice({
  name: 'vehicles',
  initialState,
  reducers: {},
});

export default vehicleSlice.reducer;