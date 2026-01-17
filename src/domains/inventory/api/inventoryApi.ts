import { apiSlice } from '@/store/api/apiSlice';
import type {
    InventoryItem,
    InventoryResponse,
    KardexResponse,
    InitialInventoryResponse,
} from '../services/types';
import type { Product } from '@/domains/maintainers/types';

interface CreateInventoryPayload {
    idAlmacen: number;
    idProducto: number;
    stockInicial?: number;
    precioUnitario?: number;
    fechaInicial?: string;
}

interface UpdateInitialInventoryPayload {
    cantidadInicial?: number;
    costoUnitario?: number;
}

export const inventoryRtkApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getInventory: builder.query<InventoryItem[], void>({
            query: () => '/inventario',
            transformResponse: (response: InventoryResponse | InventoryItem[]) => {
                if (Array.isArray(response)) {
                    return response;
                }
                return response.data ?? [];
            },
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: 'Inventory' as const, id })),
                        { type: 'Inventory', id: 'LIST' },
                    ]
                    : [{ type: 'Inventory', id: 'LIST' }],
        }),

        getInventoryByWarehouse: builder.query<InventoryItem[], number>({
            query: (idAlmacen) => `/inventario/almacen/${idAlmacen}`,
            transformResponse: (response: InventoryResponse | InventoryItem[]) => {
                if (Array.isArray(response)) {
                    return response;
                }
                return response.data ?? [];
            },
            providesTags: (_result, _error, idAlmacen) => [
                { type: 'Inventory', id: `warehouse-${idAlmacen}` },
            ],
        }),

        getInventoryByWarehouseAndProduct: builder.query<InventoryItem, { idAlmacen: number; idProducto: number }>({
            query: ({ idAlmacen, idProducto }) => `/inventario/almacen/${idAlmacen}/producto/${idProducto}`,
            providesTags: (_result, _error, { idAlmacen, idProducto }) => [
                { type: 'Inventory', id: `${idAlmacen}-${idProducto}` },
            ],
        }),

        createInventory: builder.mutation<InventoryItem, CreateInventoryPayload>({
            query: (body) => ({
                url: '/inventario',
                method: 'POST',
                body,
            }),
            invalidatesTags: [{ type: 'Inventory', id: 'LIST' }],
        }),

        getKardexMovements: builder.query<KardexResponse, { idInventario: number; fechaInicio: string; fechaFin: string }>({
            query: ({ idInventario, fechaInicio, fechaFin }) => ({
                url: '/kardex',
                params: { idInventario, fechaInicio, fechaFin },
            }),
            providesTags: (_result, _error, { idInventario }) => [
                { type: 'Kardex', id: idInventario },
            ],
        }),

        getCommonProducts: builder.query<Product[], { idAlmacen1: number; idAlmacen2: number }>({
            query: ({ idAlmacen1, idAlmacen2 }) => ({
                url: '/inventario/almacenes/comunes',
                params: { idAlmacen1, idAlmacen2 },
            }),
        }),

        getInitialInventory: builder.query<InitialInventoryResponse, number>({
            query: (idInventario) => `/inventario/${idInventario}/inicial`,
            providesTags: (_result, _error, idInventario) => [
                { type: 'Inventory', id: `initial-${idInventario}` },
            ],
        }),

        updateInitialInventory: builder.mutation<void, { idInventario: number; data: UpdateInitialInventoryPayload }>({
            query: ({ idInventario, data }) => ({
                url: `/inventario/${idInventario}/inicial`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: (_result, _error, { idInventario }) => [
                { type: 'Inventory', id: `initial-${idInventario}` },
                { type: 'Inventory', id: 'LIST' },
            ],
        }),
    }),
});

export const {
    useGetInventoryQuery,
    useGetInventoryByWarehouseQuery,
    useGetInventoryByWarehouseAndProductQuery,
    useCreateInventoryMutation,
    useGetKardexMovementsQuery,
    useGetCommonProductsQuery,
    useGetInitialInventoryQuery,
    useUpdateInitialInventoryMutation,
} = inventoryRtkApi;

export const inventoryApi = {
    getInventory: inventoryRtkApi.endpoints.getInventory,
    getInventoryByWarehouseAndProduct: inventoryRtkApi.endpoints.getInventoryByWarehouseAndProduct,
    getInventoryByWarehouse: inventoryRtkApi.endpoints.getInventoryByWarehouse,
    createInventory: inventoryRtkApi.endpoints.createInventory,
    getKardexMovements: inventoryRtkApi.endpoints.getKardexMovements,
    getCommonProducts: inventoryRtkApi.endpoints.getCommonProducts,
    getInitialInventory: inventoryRtkApi.endpoints.getInitialInventory,
    updateInitialInventory: inventoryRtkApi.endpoints.updateInitialInventory,
} as const;

export type InventoryApi = typeof inventoryApi;
