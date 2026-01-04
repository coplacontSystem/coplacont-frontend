import { apiSlice } from '@/store/api/apiSlice';
import { TRANSACTIONS_ENDPOINTS } from './endpoints';
import type {
    RegisterSalePayload,
    RegisterPurchasePayload,
    RegisterOperationPayload,
    Transaction,
    SalesApiResponse, // Assuming these cover the response structure
    PurchasesApiResponse
} from '../services/types';
import type { IApiResponse } from '@/shared/types/ApiTypes';

interface RegisterTransferPayload {
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

export const transactionsApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getSales: builder.query<SalesApiResponse, void>({
            query: () => TRANSACTIONS_ENDPOINTS.OBTENER_VENTAS,
            providesTags: ['Sales'],
        }),
        getPurchases: builder.query<PurchasesApiResponse, void>({
            query: () => TRANSACTIONS_ENDPOINTS.OBTENER_COMPRAS,
            providesTags: ['Purchases'],
        }),
        getOperations: builder.query<IApiResponse<Transaction[]>, void>({
            query: () => TRANSACTIONS_ENDPOINTS.OBTENER_OPERACIONES,
            providesTags: ['Operations'],
        }),
        getTransfers: builder.query<IApiResponse<any[]>, void>({ // TODO: Define Transfer type if available
            query: () => TRANSACTIONS_ENDPOINTS.OBTENER_TRANSFERENCIAS,
            providesTags: ['Transfers'],
        }),
        registerSale: builder.mutation<IApiResponse<Transaction>, RegisterSalePayload>({
            query: (payload) => ({
                url: TRANSACTIONS_ENDPOINTS.REGISTRAR_VENTA,
                method: 'POST',
                body: payload,
            }),
            invalidatesTags: ['Sales', 'Operations'],
        }),
        registerPurchase: builder.mutation<IApiResponse<Transaction>, RegisterPurchasePayload>({
            query: (payload) => ({
                url: TRANSACTIONS_ENDPOINTS.REGISTRAR_COMPRA,
                method: 'POST',
                body: payload,
            }),
            invalidatesTags: ['Purchases', 'Operations'],
        }),
        createOperation: builder.mutation<IApiResponse<Transaction>, RegisterOperationPayload>({
            query: (payload) => ({
                url: TRANSACTIONS_ENDPOINTS.REGISTRAR_VENTA,
                method: 'POST',
                body: payload,
            }),
            invalidatesTags: ['Operations'],
        }),
        createTransfer: builder.mutation<IApiResponse<any>, RegisterTransferPayload>({
            query: (payload) => ({
                url: TRANSACTIONS_ENDPOINTS.OBTENER_TRANSFERENCIAS,
                method: 'POST',
                body: payload,
            }),
            invalidatesTags: ['Transfers'],
        }),
        getTypeExchange: builder.query<IApiResponse<any>, string>({
            query: (date) => ({
                url: TRANSACTIONS_ENDPOINTS.TIPO_CAMBIO_SUNAT,
                params: { date },
            }),
        }),
        getSiguienteCorrelative: builder.query<IApiResponse<number>, number>({
            query: (idTipoOperacion) => `${TRANSACTIONS_ENDPOINTS.GET_SIGUIENTE_CORRELATIVO}?idTipoOperacion=${idTipoOperacion}`,
        }),
    }),
});

export const {
    useGetSalesQuery,
    useGetPurchasesQuery,
    useGetOperationsQuery,
    useGetTransfersQuery,
    useRegisterSaleMutation,
    useRegisterPurchaseMutation,
    useCreateOperationMutation,
    useCreateTransferMutation,
    useGetTypeExchangeQuery,
    useLazyGetTypeExchangeQuery,
    useGetSiguienteCorrelativeQuery,
} = transactionsApiSlice;
