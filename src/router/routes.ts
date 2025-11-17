/**
 * Constantes de rutas de la aplicación
 * Contiene todas las rutas utilizadas en el sistema para centralizar y reutilizar
 */

// Rutas de autenticación
export const AUTH_ROUTES = {
  AUTH: '/auth',
  LOGIN: 'login',
  RECOVERY_PASSWORD: 'recovery-password',
  NEW_PASSWORD: 'new-password',
} as const;

// Rutas principales de módulos
export const MAIN_ROUTES = {
  HOME: '/',
  MAINTAINERS: '/maintainers',
  TRANSACTIONS: '/transactions',
  INVENTORY: '/inventory',
  ACCOUNTING: '/accounting',
  FINANCIAL_CLOSING: '/financial-closing',
  FINANCIAL_STATEMENTS: '/financial-statements',
  SETTINGS: '/settings',
} as const;

// Rutas del módulo de transacciones
export const MAINTAINERS_ROUTES = {
  CATEGORIES: '/categories',
  PRODUCTS: '/products',
  WAREHOUSES: '/warehouses',
  CLIENTS: '/clients',
  SUPPLIERS: '/suppliers',
} as const;

// Rutas del módulo de transacciones
export const TRANSACTIONS_ROUTES = {
  SALES: '/sales',
  PURCHASES: '/purchases',
  CASH: '/cash',
  MANUAL_JOURNAL_ENTRY: '/manual-journal-entry',
  PAYROLL: '/payroll',
  OPERATIONS: '/operations',
  TRANSFERS: '/transfers',
} as const;

// Rutas del módulo de inventario
export const INVENTORY_ROUTES = {
  INVENTORY: '/',
  KARDEX: '/kardex',
  INVENTORY_ADJUSTMENT: '/inventory-adjustment',
} as const;

// Rutas del módulo de contabilidad
export const ACCOUNTING_ROUTES = {
  CHART_OF_ACCOUNT: '/chart-of-account',
  GENERAL_JOURNAL: '/general-journal',
  GENERAL_LEDGER: '/general-ledger',
  INVENTORY_AND_BALANCE_STATEMENT: '/inventory-and-balance-statement',
} as const;

// Rutas del módulo de cierre financiero
export const FINANCIAL_CLOSING_ROUTES = {
  ACCOUNTING_WORKSHEET: '/accounting-worksheet',
  CLOSING_ADJUSTMENT: '/closing-adjustment',
  TRIAL_BALANCE: '/trial-balance',
} as const;

// Rutas del módulo de estados financieros
export const FINANCIAL_STATEMENTS_ROUTES = {
  BALANCE_SHEET: '/balance-sheet',
  INCOME_STATEMENT: '/income-statement',
  CASH_FLOW_STATEMENT: '/cash-flow-statement',
  STATEMENT_OF_CHANGES_IN_EQUITY: '/statement-of-changes-in-equity',
  COST_OF_SALES_STATEMENT: '/cost-of-sales-statement',
  COST_OF_SALES_STATEMENT_BY_INVENTORY: '/cost-of-sales-statement-by-inventory',
} as const;

// Rutas del módulo de configuración
export const SETTINGS_ROUTES = {
  USERS: '/users',
  PARAMS: '/params',
  ACCOUNTING_PERIODS: '/accounting-periods',
  VALUATION_METHODS: '/valuation-methods',
  MY_ACCOUNT: '/my-account',
} as const;

// Rutas comunes de páginas
export const COMMON_ROUTES = {
  MAIN: '/',
  REGISTER: '/register',
  BULK_REGISTER: '/bulk-register',
} as const;

// Combinación de todas las rutas para facilitar el acceso
export const ROUTES = {
  AUTH: AUTH_ROUTES,
  MAIN: MAIN_ROUTES,
  TRANSACTIONS: TRANSACTIONS_ROUTES,
  INVENTORY: INVENTORY_ROUTES,
  ACCOUNTING: ACCOUNTING_ROUTES,
  FINANCIAL_CLOSING: FINANCIAL_CLOSING_ROUTES,
  FINANCIAL_STATEMENTS: FINANCIAL_STATEMENTS_ROUTES,
  SETTINGS: SETTINGS_ROUTES,
  COMMON: COMMON_ROUTES,
} as const;

// Tipos TypeScript para las rutas (opcional)
export type AuthRoute = typeof AUTH_ROUTES[keyof typeof AUTH_ROUTES];
export type MainRoute = typeof MAIN_ROUTES[keyof typeof MAIN_ROUTES];
export type TransactionsRoute = typeof TRANSACTIONS_ROUTES[keyof typeof TRANSACTIONS_ROUTES];
export type InventoryRoute = typeof INVENTORY_ROUTES[keyof typeof INVENTORY_ROUTES];
export type AccountingRoute = typeof ACCOUNTING_ROUTES[keyof typeof ACCOUNTING_ROUTES];
export type FinancialClosingRoute = typeof FINANCIAL_CLOSING_ROUTES[keyof typeof FINANCIAL_CLOSING_ROUTES];
export type FinancialStatementsRoute = typeof FINANCIAL_STATEMENTS_ROUTES[keyof typeof FINANCIAL_STATEMENTS_ROUTES];
export type SettingsRoute = typeof SETTINGS_ROUTES[keyof typeof SETTINGS_ROUTES];
export type CommonRoute = typeof COMMON_ROUTES[keyof typeof COMMON_ROUTES];