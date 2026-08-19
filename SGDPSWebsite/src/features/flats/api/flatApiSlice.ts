import { baseApi } from '../../../app/api/baseApi';
import { Flat, BlockGridSummary, CreateFlatInput, UpdateFlatInput, BlockItem } from '../types';

export const flatApiSlice = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getFlats: builder.query<Flat[], void>({
      query: () => '/flats',
      providesTags: ['Flats'],
    }),
    getBlocks: builder.query<BlockItem[], void>({
      query: () => '/blocks',
      providesTags: ['Blocks'],
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
      invalidatesTags: ['Flats', 'Blocks', 'BlockGrid', 'Dashboard', 'Reports'],
    }),
    updateFlat: builder.mutation<Flat, UpdateFlatInput>({
      query: ({ id, ...body }) => ({
        url: `/flats/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Flats', 'Blocks', 'BlockGrid', 'Dashboard', 'Reports'],
    }),
    deleteFlat: builder.mutation<void, number>({
      query: (id) => ({
        url: `/flats/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Flats', 'Blocks', 'BlockGrid', 'Dashboard', 'Reports'],
    }),
    createBlock: builder.mutation<BlockItem, { blockName: string; floors?: number; flatsPerFloor?: number; expectedAmount?: number }>({
      query: (body) => ({
        url: '/blocks',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Blocks', 'Flats', 'BlockGrid', 'Dashboard', 'Reports'],
    }),
    toggleBlockStatus: builder.mutation<{ message: string }, { blockName: string; isActive: boolean }>({
      query: ({ blockName, isActive }) => ({
        url: `/blocks/${encodeURIComponent(blockName)}/status`,
        method: 'PUT',
        body: { isActive },
      }),
      invalidatesTags: ['Blocks', 'Flats', 'BlockGrid', 'Dashboard', 'Reports'],
    }),
    deleteBlock: builder.mutation<string, string>({
      query: (blockName) => ({
        url: `/blocks/${encodeURIComponent(blockName)}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Blocks', 'Flats', 'BlockGrid', 'Dashboard', 'Reports'],
    }),
  }),
});

export const {
  useGetFlatsQuery,
  useGetBlocksQuery,
  useGetBlockGridSummaryQuery,
  useCreateFlatMutation,
  useCreateBlockMutation,
  useToggleBlockStatusMutation,
  useDeleteBlockMutation,
  useUpdateFlatMutation,
  useDeleteFlatMutation,
} = flatApiSlice;
