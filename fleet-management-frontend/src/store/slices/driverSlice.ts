import { createSlice } from '@reduxjs/toolkit';

interface DriverState {
  drivers: any[];
  loading: boolean;
  error: string | null;
}

const initialState: DriverState = {
  drivers: [],
  loading: false,
  error: null,
};

const driverSlice = createSlice({
  name: 'drivers',
  initialState,
  reducers: {},
});

export default driverSlice.reducer;