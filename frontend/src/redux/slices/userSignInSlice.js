import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  userIsSignedIn: false,
  userId: null,
  invitationCodeRequired: false,
};

const userSignInSlice = createSlice({
  name: 'userSignIn',
  initialState,
  reducers: {
    // Called when user signs in (not sign up)
    signIn: (state, action) => {
    },
    // Called after successful sign in or sign up
    signInSuccess: (state, action) => {
      state.invitationCodeRequired = action.payload.invitationRequired;
      state.userId = action.payload.userId;
      state.userIsSignedIn = true;
    },
    // server-initiated
    invalidateUser: (state, action) => {
      state.userIsSignedIn = false;
      state.invitationCodeRequired = false;
      state.userId = null;
    },
    // user-initiated
    signOut: (state, action) => {
      state.userIsSignedIn = false;
      state.invitationCodeRequired = false;
      state.userId = null;
    },
  },
});

export const { signIn, signInSuccess, invalidateUser, signOut } = userSignInSlice.actions;

export default userSignInSlice.reducer;