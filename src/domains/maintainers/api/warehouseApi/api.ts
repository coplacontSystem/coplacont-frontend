import { apiSlice } from '@/store/api/apiSlice';
import type { Warehouse, CreateWarehousePayload, UpdateWarehousePayload } from '../../types';

export const warehouseApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getWarehouses: builder.query<Warehouse[], boolean | void>({
            query: (includeInactive = false) => ({
                url: '/almacenes',
                params: { includeInactive },
            }),
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: 'Warehouses' as const, id })),
                        { type: 'Warehouses', id: 'LIST' },
                    ]
                    : [{ type: 'Warehouses', id: 'LIST' }],
        }),

        getWarehouse: builder.query<Warehouse, number>({
            query: (id) => `/almacenes/${id}`,
            providesTags: (_result, _error, id) => [{ type: 'Warehouses', id }],
        }),

        createWarehouse: builder.mutation<Warehouse, CreateWarehousePayload>({
            query: (body) => ({
                url: '/almacenes',
                method: 'POST',
                body,
            }),
            invalidatesTags: [{ type: 'Warehouses', id: 'LIST' }],
        }),

        updateWarehouse: builder.mutation<Warehouse, { id: number; data: UpdateWarehousePayload }>({
            query: ({ id, data }) => ({
                url: `/almacenes/${id}`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: 'Warehouses', id },
                { type: 'Warehouses', id: 'LIST' },
            ],
        }),

        deleteWarehouse: builder.mutation<void, number>({
            query: (id) => ({
                url: `/almacenes/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (_result, _error, id) => [
                { type: 'Warehouses', id },
                { type: 'Warehouses', id: 'LIST' },
            ],
        }),

        restoreWarehouse: builder.mutation<Warehouse, { id: number; data: UpdateWarehousePayload }>({
            query: ({ id, data }) => ({
                url: `/almacenes/${id}`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: 'Warehouses', id },
                { type: 'Warehouses', id: 'LIST' },
            ],
        }),
    }),
});

export const {
    useGetWarehousesQuery,
    useGetWarehouseQuery,
    useCreateWarehouseMutation,
    useUpdateWarehouseMutation,
    useDeleteWarehouseMutation,
    useRestoreWarehouseMutation,
} = warehouseApi;

export const Api = {
    getWarehouses: warehouseApi.endpoints.getWarehouses,
    postWarehouse: warehouseApi.endpoints.createWarehouse,
    patchWarehouse: warehouseApi.endpoints.updateWarehouse,
    deleteWarehouse: warehouseApi.endpoints.deleteWarehouse,
} as const;