import { baseApi } from '../../../app/api/baseApi';
import { DefaulterFlat, DateWiseSummary } from '../types';

export const reportApiSlice = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDefaulters: builder.query<DefaulterFlat[], void>({
      query: () => '/reports/defaulters',
      providesTags: ['Reports', 'Flats', 'Collections'],
    }),
    getDateWiseReport: builder.query<DateWiseSummary[], void>({
      query: () => '/reports/date-wise',
      providesTags: ['Reports', 'Collections', 'Expenses'],
    }),
  }),
});

export const {
  useGetDefaultersQuery,
  useGetDateWiseReportQuery,
} = reportApiSlice;
