import { apiSlice } from '@/store/api/apiSlice';
import type { Entidad, EntidadParcial, EntidadToUpdate } from '../../services/entitiesService';

interface EntidadesApiResponse {
    success: boolean;
    message: string;
    data: Entidad[];
}

interface EntidadMutationResponse {
    success: boolean;
    message: string;
    data?: Entidad;
}

export const entitiesRtkApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getClients: builder.query<Entidad[], boolean | void>({
            query: (includeInactive = false) => ({
                url: '/entidades/clients',
                params: { includeInactive },
            }),
            transformResponse: (response: EntidadesApiResponse) => response.data,
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: 'Clients' as const, id })),
                        { type: 'Clients', id: 'LIST' },
                    ]
                    : [{ type: 'Clients', id: 'LIST' }],
        }),

        getSuppliers: builder.query<Entidad[], boolean | void>({
            query: (includeInactive = false) => ({
                url: '/entidades/providers',
                params: { includeInactive },
            }),
            transformResponse: (response: EntidadesApiResponse) => response.data,
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: 'Suppliers' as const, id })),
                        { type: 'Suppliers', id: 'LIST' },
                    ]
                    : [{ type: 'Suppliers', id: 'LIST' }],
        }),

        createEntity: builder.mutation<EntidadMutationResponse, EntidadParcial>({
            query: (body) => ({
                url: '/entidades',
                method: 'POST',
                body,
            }),
            invalidatesTags: (_result, _error, arg) => [
                { type: arg.esCliente ? 'Clients' : 'Suppliers', id: 'LIST' },
            ],
        }),

        deleteEntity: builder.mutation<EntidadMutationResponse, number>({
            query: (id) => ({
                url: `/entidades/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: [
                { type: 'Clients', id: 'LIST' },
                { type: 'Suppliers', id: 'LIST' },
            ],
        }),

        restoreEntity: builder.mutation<EntidadMutationResponse, number>({
            query: (id) => ({
                url: `/entidades/${id}/restore`,
                method: 'PATCH',
            }),
            invalidatesTags: [
                { type: 'Clients', id: 'LIST' },
                { type: 'Suppliers', id: 'LIST' },
            ],
        }),

        updateEntity: builder.mutation<EntidadMutationResponse, { id: number; data: EntidadToUpdate }>({
            query: ({ id, data }) => ({
                url: `/entidades/${id}`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: 'Clients', id },
                { type: 'Suppliers', id },
                { type: 'Clients', id: 'LIST' },
                { type: 'Suppliers', id: 'LIST' },
            ],
        }),
    }),
});

export const {
    useGetClientsQuery,
    useGetSuppliersQuery,
    useCreateEntityMutation,
    useDeleteEntityMutation,
    useRestoreEntityMutation,
    useUpdateEntityMutation,
} = entitiesRtkApi;

export const entitiesApi = {
    getClients: entitiesRtkApi.endpoints.getClients,
    getSuppliers: entitiesRtkApi.endpoints.getSuppliers,
    postEntidad: entitiesRtkApi.endpoints.createEntity,
    deleteEntidad: entitiesRtkApi.endpoints.deleteEntity,
    restoreEntidad: entitiesRtkApi.endpoints.restoreEntity,
    updateEntidad: entitiesRtkApi.endpoints.updateEntity,
} as const;
