import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? 'http://164.52.216.107:9012/api' : '/api');

export const baseApi = createApi({
  reducerPath: 'api',
  refetchOnFocus: true,
  refetchOnReconnect: true,
  refetchOnMountOrArgChange: true,
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState)?.auth?.token || localStorage.getItem('sgdps_token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: [
    'Auth',
    'Dashboard',
    'Flats',
    'Blocks',
    'BlockGrid',
    'Collections',
    'Expenses',
    'Reports',
    'Users',
  ],
  endpoints: () => ({}),
});
