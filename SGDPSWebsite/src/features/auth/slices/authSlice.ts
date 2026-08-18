import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, User, LoginResponse } from '../types';

const storedToken = localStorage.getItem('sgdps_token');
const storedUser = localStorage.getItem('sgdps_user');

const initialState: AuthState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  token: storedToken || null,
  isAuthenticated: !!storedToken,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      localStorage.setItem('sgdps_token', action.payload.token);
      localStorage.setItem('sgdps_user', JSON.stringify(action.payload.user));
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('sgdps_token');
      localStorage.removeItem('sgdps_user');
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
