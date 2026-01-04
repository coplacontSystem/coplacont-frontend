import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const baseQuery = fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers) => {
        const token = localStorage.getItem('jwt');
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
        headers.set('Content-Type', 'application/json');
        return headers;
    },
});

const baseQueryWithReauth: BaseQueryFn<
    string | FetchArgs,
    unknown,
    FetchBaseQueryError
> = async (args, api, extraOptions) => {
    const result = await baseQuery(args, api, extraOptions);

    if (result.error && result.error.status === 401) {
        localStorage.removeItem('jwt');
        localStorage.removeItem('user');
        localStorage.removeItem('persona');
        localStorage.removeItem('roles');

        const duplicateKeys = ['_token', 'auth_user', 'token', 'authToken'];
        duplicateKeys.forEach(key => {
            localStorage.removeItem(key);
        });

        window.location.href = '/auth/login';
    }

    return result;
};

export const apiSlice = createApi({
    reducerPath: 'api',
    baseQuery: baseQueryWithReauth,
    tagTypes: [
        'Products',
        'Categories',
        'Warehouses',
        'Inventory',
        'Transactions',
        'Entities',
        'Clients',
        'Suppliers',
        'Users',
        'Configuration',
    ],
    endpoints: () => ({}),
});

export const {
    usePrefetch,
    middleware: apiMiddleware,
    reducer: apiReducer,
    reducerPath: apiReducerPath,
} = apiSlice;
