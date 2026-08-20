import { baseApi } from '../../../app/api/baseApi';
import { Collection, CreateCollectionInput, UpdateCollectionInput, CollectionFilterParams } from '../types';

export const collectionApiSlice = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCollections: builder.query<Collection[], CollectionFilterParams | void>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              queryParams.append(key, String(value));
            }
          });
        }
        return `/collections?${queryParams.toString()}`;
      },
      providesTags: ['Collections'],
    }),
    getCollectionById: builder.query<Collection, number>({
      query: (id) => `/collections/${id}`,
      providesTags: (_res, _err, id) => [{ type: 'Collections', id }],
    }),
    createCollection: builder.mutation<Collection, CreateCollectionInput>({
      query: (body) => ({
        url: '/collections',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Collections', 'Flats', 'BlockGrid', 'Dashboard', 'Reports', 'Users'],
    }),
    updateCollection: builder.mutation<Collection, UpdateCollectionInput>({
      query: ({ id, ...body }) => ({
        url: `/collections/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Collections', 'Flats', 'BlockGrid', 'Dashboard', 'Reports', 'Users'],
    }),
    deleteCollection: builder.mutation<void, number>({
      query: (id) => ({
        url: `/collections/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Collections', 'Flats', 'BlockGrid', 'Dashboard', 'Reports', 'Users'],
    }),
  }),
});

export const {
  useGetCollectionsQuery,
  useGetCollectionByIdQuery,
  useCreateCollectionMutation,
  useUpdateCollectionMutation,
  useDeleteCollectionMutation,
} = collectionApiSlice;
