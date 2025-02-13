import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  success: false,
  isLoading: false,
  error: null,
};

const userSignUpSlice = createSlice({
  name: 'userSignUp',
  initialState,
  reducers: {
    // Called on user sign up
    validateInvitationCode: (state, action) => {
      state.isLoading = true;
      state.success = false;
      state.error = null;
    },
    validateInvitationCodeSuccess: (state, action) => {
      state.isLoading = false;
      state.success = true;
      state.error = null;
    },
    validateInvitationCodeFailure: (state, action) => {
      state.isLoading = false;
      state.success = false;
      state.error = action.payload;
    },
    clearInvitationCodeState: (state, action) => {
      state.isLoading = false;
      state.success = false;
      state.error = null;
    }
  },
});

export const { validateInvitationCode, validateInvitationCodeSuccess, validateInvitationCodeFailure, clearInvitationCodeState } = userSignUpSlice.actions;

export default userSignUpSlice.reducer;
