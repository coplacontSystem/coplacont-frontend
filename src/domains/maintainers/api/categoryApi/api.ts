import { apiSlice } from '@/store/api/apiSlice';
import type { Category, CreateCategoryPayload, UpdateCategoryPayload } from '../../types';

export const categoryApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getCategories: builder.query<Category[], boolean | void>({
            query: (includeInactive = false) => ({
                url: '/categorias',
                params: { includeInactive },
            }),
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: 'Categories' as const, id })),
                        { type: 'Categories', id: 'LIST' },
                    ]
                    : [{ type: 'Categories', id: 'LIST' }],
        }),

        getCategory: builder.query<Category, number>({
            query: (id) => `/categorias/${id}`,
            providesTags: (_result, _error, id) => [{ type: 'Categories', id }],
        }),

        getCategoryByName: builder.query<Category[], string>({
            query: (name) => `/categorias/search/by-name/${encodeURIComponent(name)}`,
            providesTags: [{ type: 'Categories', id: 'SEARCH' }],
        }),

        createCategory: builder.mutation<Category, CreateCategoryPayload>({
            query: (body) => ({
                url: '/categorias',
                method: 'POST',
                body,
            }),
            invalidatesTags: [{ type: 'Categories', id: 'LIST' }],
        }),

        updateCategory: builder.mutation<Category, { id: number; data: Partial<UpdateCategoryPayload> }>({
            query: ({ id, data }) => ({
                url: `/categorias/${id}`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: 'Categories', id },
                { type: 'Categories', id: 'LIST' },
            ],
        }),

        deleteCategory: builder.mutation<void, number>({
            query: (id) => ({
                url: `/categorias/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (_result, _error, id) => [
                { type: 'Categories', id },
                { type: 'Categories', id: 'LIST' },
            ],
        }),
    }),
});

export const {
    useGetCategoriesQuery,
    useGetCategoryQuery,
    useGetCategoryByNameQuery,
    useCreateCategoryMutation,
    useUpdateCategoryMutation,
    useDeleteCategoryMutation,
} = categoryApi;

export const Api = {
    getCategories: categoryApi.endpoints.getCategories,
    getCategory: categoryApi.endpoints.getCategory,
    getCategoryByName: categoryApi.endpoints.getCategoryByName,
    postCategory: categoryApi.endpoints.createCategory,
    patchCategory: categoryApi.endpoints.updateCategory,
    deleteCategory: categoryApi.endpoints.deleteCategory,
} as const;