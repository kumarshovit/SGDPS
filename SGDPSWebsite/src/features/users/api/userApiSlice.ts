import { baseApi } from '../../../app/api/baseApi';
import { Collector, CreateCollectorInput } from '../types';

export const userApiSlice = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCollectors: builder.query<Collector[], void>({
      query: () => '/users/collectors',
      providesTags: ['Users'],
    }),
    createCollector: builder.mutation<Collector, CreateCollectorInput>({
      query: (body) => ({
        url: '/users/collectors',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Users'],
    }),
  }),
});

export const {
  useGetCollectorsQuery,
  useCreateCollectorMutation,
} = userApiSlice;
