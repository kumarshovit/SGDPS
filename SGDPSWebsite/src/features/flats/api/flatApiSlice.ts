import { baseApi } from '../../../app/api/baseApi';
import { Flat, BlockGridSummary, CreateFlatInput, UpdateFlatInput } from '../types';

export const flatApiSlice = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getFlats: builder.query<Flat[], void>({
      query: () => '/flats',
      providesTags: ['Flats'],
    }),
    getBlockGridSummary: builder.query<BlockGridSummary[], void>({
      query: () => '/flats/grid-summary',
      providesTags: ['BlockGrid'],
    }),
    createFlat: builder.mutation<Flat, CreateFlatInput>({
      query: (body) => ({
        url: '/flats',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Flats', 'BlockGrid', 'Dashboard', 'Reports'],
    }),
    updateFlat: builder.mutation<Flat, UpdateFlatInput>({
      query: ({ id, ...body }) => ({
        url: `/flats/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Flats', 'BlockGrid', 'Dashboard', 'Reports'],
    }),
    deleteFlat: builder.mutation<void, number>({
      query: (id) => ({
        url: `/flats/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Flats', 'BlockGrid', 'Dashboard', 'Reports'],
    }),
    createBlock: builder.mutation<Flat[], { blockName: string; floors?: number; flatsPerFloor?: number }>({
      query: (body) => ({
        url: '/flats/create-block',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Flats', 'BlockGrid', 'Dashboard', 'Reports'],
    }),
  }),
});

export const {
  useGetFlatsQuery,
  useGetBlockGridSummaryQuery,
  useCreateFlatMutation,
  useCreateBlockMutation,
  useUpdateFlatMutation,
  useDeleteFlatMutation,
} = flatApiSlice;
