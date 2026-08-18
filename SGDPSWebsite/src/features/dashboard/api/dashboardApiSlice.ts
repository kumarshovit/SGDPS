import { baseApi } from '../../../app/api/baseApi';
import { DashboardKpis } from '../types';

export const dashboardApiSlice = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardKpis: builder.query<DashboardKpis, void>({
      query: () => '/dashboard/kpis',
      providesTags: ['Dashboard'],
    }),
  }),
});

export const { useGetDashboardKpisQuery } = dashboardApiSlice;
