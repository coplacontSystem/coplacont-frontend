import { apiSlice } from '@/store/api/apiSlice';

interface InventoryLot {
  id: number;
  idInventario: number;
  fechaIngreso: string;
  cantidadInicial: number;
  cantidadActual: number;
  costoUnitario: number;
  fechaVencimiento?: string;
  numeroLote?: string;
  observaciones?: string;
}

interface CreateInventoryLotPayload {
  idInventario: number;
  fechaIngreso: string;
  cantidadInicial: number;
  cantidadActual: number;
  costoUnitario: number;
  fechaVencimiento?: string;
  numeroLote?: string;
  observaciones?: string;
}

export const inventoryLotRtkApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createInventoryLot: builder.mutation<InventoryLot, CreateInventoryLotPayload>({
      query: (body) => ({
        url: '/inventario-lote',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'InventoryLots', id: 'LIST' },
        { type: 'Inventory', id: 'LIST' },
      ],
    }),

    getAllInventoryLots: builder.query<InventoryLot[], void>({
      query: () => '/inventario-lote',
      transformResponse: (response: { data: InventoryLot[] } | InventoryLot[]) => {
        if (Array.isArray(response)) {
          return response;
        }
        return response.data ?? [];
      },
      providesTags: (result) =>
        result
          ? [
            ...result.map(({ id }) => ({ type: 'InventoryLots' as const, id })),
            { type: 'InventoryLots', id: 'LIST' },
          ]
          : [{ type: 'InventoryLots', id: 'LIST' }],
    }),

    getInventoryLotsByInventory: builder.query<InventoryLot[], number>({
      query: (idInventario) => `/inventario-lote/inventario/${idInventario}`,
      transformResponse: (response: { data: InventoryLot[] } | InventoryLot[]) => {
        if (Array.isArray(response)) {
          return response;
        }
        return response.data ?? [];
      },
      providesTags: (_result, _error, idInventario) => [
        { type: 'InventoryLots', id: `inventory-${idInventario}` },
      ],
    }),

    getActiveInventoryLots: builder.query<InventoryLot[], number | void>({
      query: (idInventario) => ({
        url: '/inventario-lote/reportes/activos',
        params: idInventario ? { idInventario } : undefined,
      }),
      transformResponse: (response: { data: InventoryLot[] } | InventoryLot[]) => {
        if (Array.isArray(response)) {
          return response;
        }
        return response.data ?? [];
      },
      providesTags: [{ type: 'InventoryLots', id: 'ACTIVE' }],
    }),
  }),
});

export const {
  useCreateInventoryLotMutation,
  useGetAllInventoryLotsQuery,
  useGetInventoryLotsByInventoryQuery,
  useGetActiveInventoryLotsQuery,
} = inventoryLotRtkApi;

export const inventoryLotApi = {
  createInventoryLot: inventoryLotRtkApi.endpoints.createInventoryLot,
  getAllInventoryLots: inventoryLotRtkApi.endpoints.getAllInventoryLots,
  getInventoryLotsByInventory: inventoryLotRtkApi.endpoints.getInventoryLotsByInventory,
  getActiveInventoryLots: inventoryLotRtkApi.endpoints.getActiveInventoryLots,
} as const;