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
    updateUserName: builder.mutation<Collector, { id: number; firstName: string; lastName?: string }>({
      query: ({ id, ...body }) => ({
        url: `/users/${id}/name`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Users'],
    }),
    updateUserStatus: builder.mutation<Collector, { id: number; isActive: boolean }>({
      query: ({ id, isActive }) => ({
        url: `/users/${id}/status`,
        method: 'PUT',
        body: { isActive },
      }),
      invalidatesTags: ['Users'],
    }),
    deleteUser: builder.mutation<string, number>({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Users', 'Dashboard', 'Reports'],
    }),
  }),
});

export const {
  useGetCollectorsQuery,
  useCreateCollectorMutation,
  useUpdateUserNameMutation,
  useUpdateUserStatusMutation,
  useDeleteUserMutation,
} = userApiSlice;

