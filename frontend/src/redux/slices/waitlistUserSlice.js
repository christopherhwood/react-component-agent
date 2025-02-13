import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isLoading: false,
  email: null,
  error: null,
};

const waitlistUserSlice = createSlice({
  name: 'waitlistUser',
  initialState,
  reducers: {
    addToWaitlist: (state, action) => {
      state.isLoading = true;
      state.error = null;
    },
    addToWaitlistSuccess: (state, action) => {
      state.isLoading = false;
      state.email = action.payload;
    },
    addToWaitlistFailure: (state, action) => {
      state.isLoading = false;
      state.email = null;
      state.error = action.payload;
    },
  },
});

export const { addToWaitlist, addToWaitlistSuccess, addToWaitlistFailure } = waitlistUserSlice.actions;

export default waitlistUserSlice.reducer;
