import { apiSlice } from '@/store/api/apiSlice';
import type {
    Transaction,
    RegisterSalePayload,
    RegisterPurchasePayload,
    RegisterOperationPayload,
    SalesApiResponse,
    PurchasesApiResponse,
} from '../services/types';

interface TransferPayload {
    idAlmacenOrigen: number;
    idAlmacenDestino: number;
    fechaEmision: string;
    moneda: string;
    tipoCambio?: number;
    serie: string;
    numero: string;
    fechaVencimiento?: string;
    detalles: {
        idProducto: number;
        cantidad: number;
        descripcion: string;
    }[];
}

interface ExchangeRateResponse {
    compra: number;
    venta: number;
    fecha: string;
}

interface CorrelativoResponse {
    correlativo: string;
}

export const transactionsRtkApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getSales: builder.query<Transaction[], void>({
            query: () => '/ventas',
            transformResponse: (response: SalesApiResponse | Transaction[]) => {
                // Handle both wrapped {data: [...]} and unwrapped [...] responses
                if (Array.isArray(response)) {
                    return response;
                }
                return response.data ?? [];
            },
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ idComprobante }) => ({ type: 'Sales' as const, id: idComprobante })),
                        { type: 'Sales', id: 'LIST' },
                    ]
                    : [{ type: 'Sales', id: 'LIST' }],
        }),

        getPurchases: builder.query<Transaction[], void>({
            query: () => '/compras',
            transformResponse: (response: PurchasesApiResponse | Transaction[]) => {
                // Handle both wrapped {data: [...]} and unwrapped [...] responses
                if (Array.isArray(response)) {
                    return response;
                }
                return response.data ?? [];
            },
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ idComprobante }) => ({ type: 'Purchases' as const, id: idComprobante })),
                        { type: 'Purchases', id: 'LIST' },
                    ]
                    : [{ type: 'Purchases', id: 'LIST' }],
        }),

        getOperations: builder.query<Transaction[], void>({
            query: () => '/comprobante',
            transformResponse: (response: { data: Transaction[] } | Transaction[]) => {
                if (Array.isArray(response)) {
                    return response;
                }
                return response.data ?? [];
            },
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ idComprobante }) => ({ type: 'Operations' as const, id: idComprobante })),
                        { type: 'Operations', id: 'LIST' },
                    ]
                    : [{ type: 'Operations', id: 'LIST' }],
        }),

        getTransfers: builder.query<Transaction[], void>({
            query: () => '/transferencias',
            transformResponse: (response: { data: Transaction[] } | Transaction[]) => {
                if (Array.isArray(response)) {
                    return response;
                }
                return response.data ?? [];
            },
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ idComprobante }) => ({ type: 'Transfers' as const, id: idComprobante })),
                        { type: 'Transfers', id: 'LIST' },
                    ]
                    : [{ type: 'Transfers', id: 'LIST' }],
        }),

        getExchangeRate: builder.query<ExchangeRateResponse, string>({
            query: (date) => ({
                url: '/tipo-cambio/sunat',
                params: { date },
            }),
        }),

        getNextCorrelativo: builder.query<CorrelativoResponse, number>({
            query: (idTipoOperacion) => ({
                url: '/comprobante/siguiente-correlativo',
                params: { idTipoOperacion },
            }),
        }),

        registerSale: builder.mutation<Transaction, RegisterSalePayload>({
            query: (body) => ({
                url: '/comprobante',
                method: 'POST',
                body,
            }),
            invalidatesTags: [
                { type: 'Sales', id: 'LIST' },
                { type: 'Inventory', id: 'LIST' },
            ],
        }),

        registerPurchase: builder.mutation<Transaction, RegisterPurchasePayload>({
            query: (body) => ({
                url: '/comprobante',
                method: 'POST',
                body,
            }),
            invalidatesTags: [
                { type: 'Purchases', id: 'LIST' },
                { type: 'Inventory', id: 'LIST' },
            ],
        }),

        createOperation: builder.mutation<Transaction, RegisterOperationPayload>({
            query: (body) => ({
                url: '/comprobante',
                method: 'POST',
                body,
            }),
            invalidatesTags: [{ type: 'Operations', id: 'LIST' }],
        }),

        createTransfer: builder.mutation<Transaction, TransferPayload>({
            query: (body) => ({
                url: '/transferencias',
                method: 'POST',
                body,
            }),
            invalidatesTags: [
                { type: 'Transfers', id: 'LIST' },
                { type: 'Inventory', id: 'LIST' },
            ],
        }),
    }),
});

export const {
    useGetSalesQuery,
    useGetPurchasesQuery,
    useGetOperationsQuery,
    useGetTransfersQuery,
    useGetExchangeRateQuery,
    useLazyGetExchangeRateQuery,
    useGetNextCorrelativoQuery,
    useRegisterSaleMutation,
    useRegisterPurchaseMutation,
    useCreateOperationMutation,
    useCreateTransferMutation,
} = transactionsRtkApi;

export const transactionsApi = {
    registerSale: transactionsRtkApi.endpoints.registerSale,
    registerPurchase: transactionsRtkApi.endpoints.registerPurchase,
    createOperation: transactionsRtkApi.endpoints.createOperation,
    getSales: transactionsRtkApi.endpoints.getSales,
    getPurchases: transactionsRtkApi.endpoints.getPurchases,
    getTypeExchange: transactionsRtkApi.endpoints.getExchangeRate,
    getSiguienteCorrelative: transactionsRtkApi.endpoints.getNextCorrelativo,
    getOperations: transactionsRtkApi.endpoints.getOperations,
    getTransfers: transactionsRtkApi.endpoints.getTransfers,
    createTransfer: transactionsRtkApi.endpoints.createTransfer,
} as const;

export type TransactionsApi = typeof transactionsApi;
