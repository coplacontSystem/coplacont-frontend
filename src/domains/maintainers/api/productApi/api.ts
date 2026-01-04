import { apiSlice } from '@/store/api/apiSlice';
import type { Product, CreateProductPayload, UpdateProductPayload } from '../../types';

export const productApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getProducts: builder.query<Product[], boolean | void>({
            query: (includeInactive = false) => ({
                url: '/productos',
                params: { includeInactive },
            }),
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: 'Products' as const, id })),
                        { type: 'Products', id: 'LIST' },
                    ]
                    : [{ type: 'Products', id: 'LIST' }],
        }),

        getProduct: builder.query<Product, number>({
            query: (id) => `/productos/${id}`,
            providesTags: (_result, _error, id) => [{ type: 'Products', id }],
        }),

        getProductsByCategory: builder.query<Product[], number>({
            query: (categoryId) => `/productos/search/by-category/${categoryId}`,
            providesTags: [{ type: 'Products', id: 'BY_CATEGORY' }],
        }),

        getProductsByDescription: builder.query<Product[], string>({
            query: (description) => `/productos/search/by-description/${encodeURIComponent(description)}`,
            providesTags: [{ type: 'Products', id: 'SEARCH' }],
        }),

        getProductsLowStock: builder.query<Product[], void>({
            query: () => '/productos/reports/low-stock',
            providesTags: [{ type: 'Products', id: 'LOW_STOCK' }],
        }),

        createProduct: builder.mutation<Product, CreateProductPayload>({
            query: (body) => ({
                url: '/productos',
                method: 'POST',
                body,
            }),
            invalidatesTags: [{ type: 'Products', id: 'LIST' }],
        }),

        updateProduct: builder.mutation<Product, { id: number; data: UpdateProductPayload }>({
            query: ({ id, data }) => ({
                url: `/productos/${id}`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: 'Products', id },
                { type: 'Products', id: 'LIST' },
            ],
        }),

        deleteProduct: builder.mutation<Product, number>({
            query: (id) => ({
                url: `/productos/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (_result, _error, id) => [
                { type: 'Products', id },
                { type: 'Products', id: 'LIST' },
            ],
        }),
    }),
});

export const {
    useGetProductsQuery,
    useGetProductQuery,
    useGetProductsByCategoryQuery,
    useGetProductsByDescriptionQuery,
    useGetProductsLowStockQuery,
    useCreateProductMutation,
    useUpdateProductMutation,
    useDeleteProductMutation,
} = productApi;

export const Api = {
    getProducts: productApi.endpoints.getProducts,
    getProduct: productApi.endpoints.getProduct,
    postProduct: productApi.endpoints.createProduct,
    patchProduct: productApi.endpoints.updateProduct,
    deleteProduct: productApi.endpoints.deleteProduct,
    getProductByDescription: productApi.endpoints.getProductsByDescription,
    getProductByCategory: productApi.endpoints.getProductsByCategory,
    getProductLowStock: productApi.endpoints.getProductsLowStock,
} as const;