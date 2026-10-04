import { apiSlice } from '@/store/api/apiSlice';

export interface KpiComprobantes {
  total: number;
  cantidad: number;
  variacion: number | null;
}

export interface Ranking {
  id: number;
  nombre: string;
  documento: string;
  monto: number;
  comprobantes: number;
}

export interface DashboardData {
  periodo: {
    mes: string;
    idPeriodoContable: number | null;
    año: number | null;
    cerrado: boolean;
    metodoValoracion: 'fifo' | 'promedio' | null;
    cierre: string | null;
    diasParaCierre: number | null;
    tipoCambio: { fecha: string; compra: number; venta: number } | null;
  };
  kpis: {
    ventas: KpiComprobantes;
    compras: KpiComprobantes;
    costoVentas: number;
    margen: { monto: number; porcentaje: number | null };
    igv: { ventas: number; compras: number; saldo: number };
  };
  serieMensual: { mes: string; ventas: number; compras: number; costoVentas: number }[];
  inventario: {
    valorTotal: number;
    productosConStock: number;
    porAlmacen: { idAlmacen: number; nombre: string; valor: number }[];
  };
  alertas: {
    totalStockBajo: number;
    totalFaltantes: number;
    stockBajo: { idInventario: number; producto: string; almacen: string; stock: number; minimo: number }[];
    faltantes: { idInventario: number; producto: string; almacen: string; fecha: string; cantidad: number }[];
  };
  topProductos: { id: number; codigo: string; nombre: string; cantidad: number; monto: number }[];
  topClientes: Ranking[];
  topProveedores: Ranking[];
  ultimosMovimientos: {
    id: number;
    tipo: 'COMPRA' | 'VENTA' | 'TRANSFERENCIA';
    tipoComprobante: string;
    fecha: string;
    serie: string;
    numero: string;
    entidad: string | null;
    total: number;
    moneda: string;
  }[];
}

export const dashboardApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /** Portada de la empresa para un mes 'YYYY-MM'. */
    getDashboard: builder.query<DashboardData, string>({
      query: (periodo) => ({ url: '/dashboard', params: { periodo } }),
      // Se refresca al registrar compras, ventas, transferencias o mover inventario
      providesTags: (['Sales', 'Purchases', 'Transfers', 'Operations', 'Inventory'] as const).map(
        (type) => ({ type, id: 'LIST' }),
      ),
      keepUnusedDataFor: 30,
    }),
  }),
});

export const { useGetDashboardQuery } = dashboardApi;
