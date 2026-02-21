import { createSlice } from '@reduxjs/toolkit';

interface TripState {
  trips: any[];
  loading: boolean;
  error: string | null;
}

const initialState: TripState = {
  trips: [],
  loading: false,
  error: null,
};

const tripSlice = createSlice({
  name: 'trips',
  initialState,
  reducers: {},
});

export default tripSlice.reducer;