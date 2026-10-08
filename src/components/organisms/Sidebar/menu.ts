import {
  LuArrowLeftRight,
  LuBox,
  LuChartColumn,
  LuDatabase,
  LuLayoutDashboard,
  LuSettings,
} from "react-icons/lu";
import type { IconType } from "react-icons";
import {
  MAIN_ROUTES,
  TRANSACTIONS_ROUTES,
  INVENTORY_ROUTES,
  FINANCIAL_STATEMENTS_ROUTES,
  SETTINGS_ROUTES,
  MAINTAINERS_ROUTES,
} from "@/router/routes";

export const UserRoleType = {
  ADMIN: "ADMIN",
  EMPRESA: "EMPRESA",
} as const;

export interface NavItem {
  label: string;
  to: string;
}

export interface NavGroup {
  id: string;
  label: string;
  icon: IconType;
  /** Si no tiene items, el grupo es un enlace directo */
  to?: string;
  items?: NavItem[];
}

/** Menú según el rol del usuario. */
export const buildMenu = (role: string): NavGroup[] => {
  const menu: NavGroup[] = [
    {
      id: "home",
      label: "Panel de control",
      icon: LuLayoutDashboard,
      to: MAIN_ROUTES.HOME,
    },
  ];

  if (role === UserRoleType.EMPRESA) {
    const tx = MAIN_ROUTES.TRANSACTIONS;
    const inv = MAIN_ROUTES.INVENTORY;
    const fs = MAIN_ROUTES.FINANCIAL_STATEMENTS;
    const mt = MAIN_ROUTES.MAINTAINERS;
    menu.push(
      {
        id: "transactions",
        label: "Transacciones",
        icon: LuArrowLeftRight,
        items: [
          { label: "Compras", to: `${tx}${TRANSACTIONS_ROUTES.PURCHASES}` },
          { label: "Ventas", to: `${tx}${TRANSACTIONS_ROUTES.SALES}` },
          { label: "Operaciones", to: `${tx}${TRANSACTIONS_ROUTES.OPERATIONS}` },
          { label: "Transferencias", to: `${tx}${TRANSACTIONS_ROUTES.TRANSFERS}` },
        ],
      },
      {
        id: "inventory",
        label: "Inventario",
        icon: LuBox,
        items: [
          { label: "Inventario", to: `${inv}${INVENTORY_ROUTES.INVENTORY}` },
          { label: "Kardex", to: `${inv}${INVENTORY_ROUTES.KARDEX}` },
        ],
      },
      {
        id: "financial",
        label: "Estados Financieros",
        icon: LuChartColumn,
        items: [
          {
            label: "Estado de costo de venta",
            to: `${fs}${FINANCIAL_STATEMENTS_ROUTES.COST_OF_SALES_STATEMENT}`,
          },
          {
            label: "Estado consolidado de costo de venta",
            to: `${fs}${FINANCIAL_STATEMENTS_ROUTES.COST_OF_SALES_STATEMENT_BY_INVENTORY}`,
          },
        ],
      },
      {
        id: "maintainers",
        label: "Mantenedores",
        icon: LuDatabase,
        items: [
          { label: "Clientes", to: `${mt}${MAINTAINERS_ROUTES.CLIENTS}` },
          { label: "Proveedores", to: `${mt}${MAINTAINERS_ROUTES.SUPPLIERS}` },
          { label: "Productos", to: `${mt}${MAINTAINERS_ROUTES.PRODUCTS}` },
          { label: "Categorías", to: `${mt}${MAINTAINERS_ROUTES.CATEGORIES}` },
          { label: "Almacenes", to: `${mt}${MAINTAINERS_ROUTES.WAREHOUSES}` },
        ],
      },
    );
  }

  const st = MAIN_ROUTES.SETTINGS;
  const settingsItems: NavItem[] =
    role === UserRoleType.EMPRESA
      ? [
          { label: "Mi cuenta", to: `${st}${SETTINGS_ROUTES.CUENTA}` },
          { label: "Empresa", to: `${st}${SETTINGS_ROUTES.EMPRESA}` },
          { label: "Periodos contables", to: `${st}${SETTINGS_ROUTES.PERIODOS}` },
          { label: "Parámetros", to: `${st}${SETTINGS_ROUTES.PARAMETROS}` },
        ]
      : role === UserRoleType.ADMIN
        ? [
            { label: "Usuarios y Roles", to: `${st}${SETTINGS_ROUTES.USERS}` },
            { label: "Métodos de Valoración", to: `${st}${SETTINGS_ROUTES.VALUATION_METHODS}` },
            { label: "Mi cuenta", to: `${st}${SETTINGS_ROUTES.CUENTA}` },
          ]
        : [];

  menu.push({
    id: "settings",
    label: "Configuración",
    icon: LuSettings,
    items: settingsItems,
  });

  return menu;
};
