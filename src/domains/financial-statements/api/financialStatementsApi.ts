import { apiClient } from "@/shared";
import { FINANCIAL_STATEMENTS_ENDPOINTS } from "./endpoints";

interface CostOfSalesParams {
  año: number;
  idAlmacen?: number;
  idProducto?: number;
}

export const financialStatementsApi = {
  getCostOfSalesStatement: (params: CostOfSalesParams) =>
    apiClient.get(FINANCIAL_STATEMENTS_ENDPOINTS.GET_COST_OF_SALES_STATEMENT, {
      params: {
        año: params.año,
        idAlmacen: params.idAlmacen,
        idProducto: params.idProducto,
      },
    }),

  getCostOfSalesStatementByInventory: (params: CostOfSalesParams) =>
    apiClient.get(
      FINANCIAL_STATEMENTS_ENDPOINTS.GET_COST_OF_SALES_STATEMENT_BY_INVENTORY,
      {
        params: {
          año: params.año,
          idAlmacen: params.idAlmacen,
          idProducto: params.idProducto,
        },
      }
    ),
} as const;

export type FinancialStatementsApi = typeof financialStatementsApi;
export type { CostOfSalesParams };
