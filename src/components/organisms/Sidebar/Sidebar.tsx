import React from "react";
import styles from "./Sidebar.module.scss";

import { GoHomeFill } from "react-icons/go";

import { Link, useNavigate, useLocation } from "react-router-dom";
import { Logo } from "@/components/atoms";
import { ThemeToggle } from "@/components/atoms/ThemeToggle/ThemeToggle";
import {
  TransaccionesIcon,
  InventarioIcon,
  MantenedoresIcon,
  CerrarSesionIcon,
  EstadosFinancierosIcon,
  ConfiguracionIcon,
} from "@/components/atoms";
import {
  MAIN_ROUTES,
  TRANSACTIONS_ROUTES,
  INVENTORY_ROUTES,
  FINANCIAL_STATEMENTS_ROUTES,
  SETTINGS_ROUTES,
  AUTH_ROUTES,
  MAINTAINERS_ROUTES,
} from "@/router/routes";
import { useAuth } from "@/domains/auth";

const UserRoleType = {
  ADMIN: "ADMIN",
  EMPRESA: "EMPRESA",
} as const;

const ROLE_DISPLAY_NAMES: Record<string, string> = {
  [UserRoleType.ADMIN]: "Administrador del sistema",
  [UserRoleType.EMPRESA]: "Empresa",
};

interface SidebarProps {}

export const Sidebar: React.FC<SidebarProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();

  const userName = user?.persona
    ? user.persona.nombreEmpresa
    : user?.nombre || "Usuario";

    const userEmail = user?.email || "Sin email";

  const userRoleType =
    user?.roles && user.roles.length > 0 ? user.roles[0].nombre : "";

  const userRole =
    user?.roles && user.roles.length > 0
      ? ROLE_DISPLAY_NAMES[user.roles[0].nombre] || user.roles[0].nombre
      : "Sin rol";

  const isActiveLink = (path: string): boolean => {
    if (path === MAIN_ROUTES.HOME) {
      return location.pathname === "/";
    }

    const currentPath = location.pathname;

    if (currentPath === path) {
      return true;
    }

    if (currentPath.startsWith(path)) {
      const nextChar = currentPath[path.length];
      return nextChar === "/" || nextChar === undefined;
    }
    return false;
  };

  const handleLogout = () => {
    logout();
    navigate(`${AUTH_ROUTES.AUTH}${AUTH_ROUTES.LOGIN}`, { replace: true });
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <Logo src="/assets/sidebar/logo.svg" width={141} height={52} />
        <Logo src="/assets/sidebar/hide.svg" size={18} />
      </div>

      <div className={styles.userInfo}>
        <span className={styles.userName}>{userName}</span>
        <span className={styles.userEmail}>{userEmail}</span>
        <span className={styles.userRole}>{userRole}</span>
      </div>

      <div>
        <ThemeToggle />
      </div>

      <nav className={styles.navigation}>
        {/* Dashboard - Página de inicio */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            <GoHomeFill style={{ color: "var(--text-color)" }} />
            <h3 className={styles.sectionTitle__title}>Panel de control</h3>
          </div>
          <ul className={styles.menuList}>
            <li>
              <Link
                to={MAIN_ROUTES.HOME}
                className={isActiveLink(MAIN_ROUTES.HOME) ? styles.active : ""}
              >
                Panel de control
              </Link>
            </li>
          </ul>
        </div>

        {/* Transacciones - Compras y Ventas */}
        {userRoleType === "EMPRESA" && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              <TransaccionesIcon />
              <h3 className={styles.sectionTitle__title}>Transacciones</h3>
            </div>
            <ul className={styles.menuList}>
              <li>
                <Link
                  to={`${MAIN_ROUTES.TRANSACTIONS}${TRANSACTIONS_ROUTES.PURCHASES}`}
                  className={
                    isActiveLink(
                      `${MAIN_ROUTES.TRANSACTIONS}${TRANSACTIONS_ROUTES.PURCHASES}`
                    )
                      ? styles.active
                      : ""
                  }
                >
                  Compras
                </Link>
              </li>
              <li>
                <Link
                  to={`${MAIN_ROUTES.TRANSACTIONS}${TRANSACTIONS_ROUTES.SALES}`}
                  className={
                    isActiveLink(
                      `${MAIN_ROUTES.TRANSACTIONS}${TRANSACTIONS_ROUTES.SALES}`
                    )
                      ? styles.active
                      : ""
                  }
                >
                  Ventas
                </Link>
              </li>
              <li>
                <Link
                  to={`${MAIN_ROUTES.TRANSACTIONS}${TRANSACTIONS_ROUTES.OPERATIONS}`}
                  className={
                    isActiveLink(
                      `${MAIN_ROUTES.TRANSACTIONS}${TRANSACTIONS_ROUTES.OPERATIONS}`
                    )
                      ? styles.active
                      : ""
                  }
                >
                  Operaciones
                </Link>
              </li>
              <li>
                <Link
                  to={`${MAIN_ROUTES.TRANSACTIONS}${TRANSACTIONS_ROUTES.TRANSFERS}`}
                  className={
                    isActiveLink(
                      `${MAIN_ROUTES.TRANSACTIONS}${TRANSACTIONS_ROUTES.TRANSFERS}`
                    )
                      ? styles.active
                      : ""
                  }
                >
                  Transferencias
                </Link>
              </li>
            </ul>
          </div>
        )}

        {/* Inventario - Gestión de stock */}
        {userRoleType === "EMPRESA" && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              <InventarioIcon />
              <h3 className={styles.sectionTitle__title}>Inventario</h3>
            </div>
            <ul className={styles.menuList}>
              <li>
                <Link
                  to={`${MAIN_ROUTES.INVENTORY}${INVENTORY_ROUTES.INVENTORY}`}
                  className={
                    isActiveLink(
                      `${MAIN_ROUTES.INVENTORY}${INVENTORY_ROUTES.INVENTORY}`
                    )
                      ? styles.active
                      : ""
                  }
                >
                  Inventario
                </Link>
              </li>
              <li>
                <Link
                  to={`${MAIN_ROUTES.INVENTORY}${INVENTORY_ROUTES.KARDEX}`}
                  className={
                    isActiveLink(
                      `${MAIN_ROUTES.INVENTORY}${INVENTORY_ROUTES.KARDEX}`
                    )
                      ? styles.active
                      : ""
                  }
                >
                  Kardex
                </Link>
              </li>
              {/**<li>
              <Link
                to={`${MAIN_ROUTES.INVENTORY}${INVENTORY_ROUTES.INVENTORY_ADJUSTMENT}`}
              >
                Ajustes
              </Link>
            </li>*/}
            </ul>
          </div>
        )}

        {/* Estados Financieros - Análisis financiero */}
        {userRoleType === "EMPRESA" && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              <EstadosFinancierosIcon />
              <h3 className={styles.sectionTitle__title}>
                Estados Financieros
              </h3>
            </div>
            <ul className={styles.menuList}>
              <li>
                <Link
                  to={`${MAIN_ROUTES.FINANCIAL_STATEMENTS}${FINANCIAL_STATEMENTS_ROUTES.COST_OF_SALES_STATEMENT}`}
                  className={
                    isActiveLink(
                      `${MAIN_ROUTES.FINANCIAL_STATEMENTS}${FINANCIAL_STATEMENTS_ROUTES.COST_OF_SALES_STATEMENT}`
                    )
                      ? styles.active
                      : ""
                  }
                >
                  Estado de costo de venta
                </Link>
              </li>
              <li>
                <Link
                  to={`${MAIN_ROUTES.FINANCIAL_STATEMENTS}${FINANCIAL_STATEMENTS_ROUTES.COST_OF_SALES_STATEMENT_BY_INVENTORY}`}
                  className={
                    isActiveLink(
                      `${MAIN_ROUTES.FINANCIAL_STATEMENTS}${FINANCIAL_STATEMENTS_ROUTES.COST_OF_SALES_STATEMENT_BY_INVENTORY}`
                    )
                      ? styles.active
                      : ""
                  }
                >
                  Estado consolidado de costo de venta
                </Link>
              </li>
              {/*<li>
              <Link
                to={`${MAIN_ROUTES.FINANCIAL_STATEMENTS}${FINANCIAL_STATEMENTS_ROUTES.BALANCE_SHEET}`}
              >
                Balance General
              </Link>
            </li>
            <li>
              <Link
                to={`${MAIN_ROUTES.FINANCIAL_STATEMENTS}${FINANCIAL_STATEMENTS_ROUTES.INCOME_STATEMENT}`}
              >
                Estado de Resultados
              </Link>
            </li>
            <li>
              <Link
                to={`${MAIN_ROUTES.FINANCIAL_STATEMENTS}${FINANCIAL_STATEMENTS_ROUTES.CASH_FLOW_STATEMENT}`}
              >
                Flujo de efectivo
              </Link>
            </li>
            <li>
              <Link
                to={`${MAIN_ROUTES.FINANCIAL_STATEMENTS}${FINANCIAL_STATEMENTS_ROUTES.STATEMENT_OF_CHANGES_IN_EQUITY}`}
              >
                Estado de patrimonio
              </Link>
            </li>*/}
            </ul>
          </div>
        )}

        {/* Mantenedores - Gestión de entidades */}
        {userRoleType === "EMPRESA" && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              <MantenedoresIcon />
              <h3 className={styles.sectionTitle__title}>Mantenedores</h3>
            </div>
            <ul className={styles.menuList}>
              <li>
                <Link
                  to={`${MAIN_ROUTES.MAINTAINERS}${MAINTAINERS_ROUTES.CLIENTS}`}
                  className={
                    isActiveLink(
                      `${MAIN_ROUTES.MAINTAINERS}${MAINTAINERS_ROUTES.CLIENTS}`
                    )
                      ? styles.active
                      : ""
                  }
                >
                  Clientes
                </Link>
              </li>
              <li>
                <Link
                  to={`${MAIN_ROUTES.MAINTAINERS}${MAINTAINERS_ROUTES.SUPPLIERS}`}
                  className={
                    isActiveLink(
                      `${MAIN_ROUTES.MAINTAINERS}${MAINTAINERS_ROUTES.SUPPLIERS}`
                    )
                      ? styles.active
                      : ""
                  }
                >
                  Proveedores
                </Link>
              </li>
              <li>
                <Link
                  to={`${MAIN_ROUTES.MAINTAINERS}${MAINTAINERS_ROUTES.PRODUCTS}`}
                  className={
                    isActiveLink(
                      `${MAIN_ROUTES.MAINTAINERS}${MAINTAINERS_ROUTES.PRODUCTS}`
                    )
                      ? styles.active
                      : ""
                  }
                >
                  Productos
                </Link>
              </li>
              <li>
                <Link
                  to={`${MAIN_ROUTES.MAINTAINERS}${MAINTAINERS_ROUTES.CATEGORIES}`}
                  className={
                    isActiveLink(
                      `${MAIN_ROUTES.MAINTAINERS}${MAINTAINERS_ROUTES.CATEGORIES}`
                    )
                      ? styles.active
                      : ""
                  }
                >
                  Categorías
                </Link>
              </li>
              <li>
                <Link
                  to={`${MAIN_ROUTES.MAINTAINERS}${MAINTAINERS_ROUTES.WAREHOUSES}`}
                  className={
                    isActiveLink(
                      `${MAIN_ROUTES.MAINTAINERS}${MAINTAINERS_ROUTES.WAREHOUSES}`
                    )
                      ? styles.active
                      : ""
                  }
                >
                  Almacenes
                </Link>
              </li>
            </ul>
          </div>
        )}

        {/* Configuración - Ajustes y parámetros */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            <ConfiguracionIcon />
            <h3 className={styles.sectionTitle__title}>Configuración</h3>
          </div>
          <ul className={styles.menuList}>
            {userRoleType === "EMPRESA" && (
              <>
                <li>
                  <Link
                    to={`${MAIN_ROUTES.SETTINGS}${SETTINGS_ROUTES.ACCOUNTING_PERIODS}`}
                    className={
                      isActiveLink(
                        `${MAIN_ROUTES.SETTINGS}${SETTINGS_ROUTES.ACCOUNTING_PERIODS}`
                      )
                        ? styles.active
                        : ""
                    }
                  >
                    Periodos Contables
                  </Link>
                </li>
                <li>
                  <Link
                    to={`${MAIN_ROUTES.SETTINGS}${SETTINGS_ROUTES.PARAMS}`}
                    className={
                      isActiveLink(
                        `${MAIN_ROUTES.SETTINGS}${SETTINGS_ROUTES.PARAMS}`
                      )
                        ? styles.active
                        : ""
                    }
                  >
                    Parámetros
                  </Link>
                </li>
              </>
            )}
            {userRoleType === "ADMIN" && (
              <>
                <li>
                  <Link
                    to={`${MAIN_ROUTES.SETTINGS}${SETTINGS_ROUTES.USERS}`}
                    className={
                      isActiveLink(
                        `${MAIN_ROUTES.SETTINGS}${SETTINGS_ROUTES.USERS}`
                      )
                        ? styles.active
                        : ""
                    }
                  >
                    Usuarios y Roles
                  </Link>
                </li>
                <li>
                  <Link
                    to={`${MAIN_ROUTES.SETTINGS}${SETTINGS_ROUTES.VALUATION_METHODS}`}
                    className={
                      isActiveLink(
                        `${MAIN_ROUTES.SETTINGS}${SETTINGS_ROUTES.VALUATION_METHODS}`
                      )
                        ? styles.active
                        : ""
                    }
                  >
                    Métodos de Valoración
                  </Link>
                </li>
                <li>
                  <Link
                    to={`${MAIN_ROUTES.SETTINGS}${SETTINGS_ROUTES.MY_ACCOUNT}`}
                    className={
                      isActiveLink(
                        `${MAIN_ROUTES.SETTINGS}${SETTINGS_ROUTES.MY_ACCOUNT}`
                      )
                        ? styles.active
                        : ""
                    }
                  >
                    Mi cuenta
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Logout */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            <CerrarSesionIcon />
            <Link
              to={`${AUTH_ROUTES.AUTH}${AUTH_ROUTES.LOGIN}`}
              onClick={handleLogout}
              className={styles.sectionTitle__title}
            >
              Cerrar Sesión
            </Link>
          </div>
        </div>
      </nav>
    </aside>
  );
};
