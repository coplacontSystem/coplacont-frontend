import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  LuChevronDown,
  LuChevronRight,
  LuLogOut,
  LuMoon,
  LuPanelLeftClose,
  LuPanelLeftOpen,
  LuSun,
} from "react-icons/lu";

import styles from "./Sidebar.module.scss";
import { MAIN_ROUTES, WELCOME_ROUTE } from "@/router/routes";
import { buildMenu, type NavGroup } from "./menu";
import { useAuth } from "@/domains/auth";
import { ThemeContext } from "@/shared/context";

const ROLE_DISPLAY_NAMES: Record<string, string> = {
  ADMIN: "Administrador del sistema",
  EMPRESA: "Empresa",
};

const getInitials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "U";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useContext(ThemeContext);

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

  const menu = buildMenu(userRoleType);

  const isActiveLink = (path: string): boolean => {
    if (path === MAIN_ROUTES.HOME) {
      return location.pathname === "/";
    }
    const currentPath = location.pathname;
    if (currentPath === path) return true;
    if (currentPath.startsWith(path)) {
      const nextChar = currentPath[path.length];
      return nextChar === "/" || nextChar === undefined;
    }
    return false;
  };

  const groupHasActive = (group: NavGroup): boolean =>
    group.items ? group.items.some((i) => isActiveLink(i.to)) : false;

  // Grupos abiertos: el que contiene la ruta activa se abre automáticamente.
  const [open, setOpen] = useState<Record<string, boolean>>({});
  useEffect(() => {
    const active = buildMenu(userRoleType).find((g) =>
      g.items?.some((i) => isActiveLink(i.to)),
    );
    if (active) setOpen((prev) => ({ ...prev, [active.id]: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, userRoleType]);

  const toggleGroup = (id: string) =>
    setOpen((prev) => ({ ...prev, [id]: !prev[id] }));

  const expandAndOpen = (id: string) => {
    setOpen((prev) => ({ ...prev, [id]: true }));
    onToggle();
  };

  const handleLogout = () => {
    logout();
    navigate(WELCOME_ROUTE, { replace: true });
  };

  const isDark = theme === "dark";
  const initials = getInitials(userName);

  return (
    <aside
      className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ""}`}
    >
      <div className={styles.header}>
        <div className={styles.brand}>
          <img className={styles.brandMark} src="/images/brand/logo-mark.png" alt="" />
          {!isCollapsed && (
            <img
              className={styles.brandWord}
              src="/images/brand/logo-wordmark.png"
              alt="Coplacont"
            />
          )}
        </div>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={onToggle}
          title={isCollapsed ? "Expandir menú" : "Contraer menú"}
          aria-label={isCollapsed ? "Expandir menú" : "Contraer menú"}
        >
          {isCollapsed ? <LuPanelLeftOpen size={18} /> : <LuPanelLeftClose size={18} />}
        </button>
      </div>

      {isCollapsed ? (
        <div className={styles.avatarOnly} title={`${userName} · ${userRole}`}>
          {initials}
        </div>
      ) : (
        <div className={styles.userCard}>
          <div className={styles.avatar}>{initials}</div>
          <div className={styles.userText}>
            <span className={styles.userName}>{userName}</span>
            <span className={styles.userEmail}>{userEmail}</span>
            <span className={styles.userRole}>{userRole}</span>
          </div>
        </div>
      )}

      {isCollapsed ? (
        <button
          type="button"
          className={styles.themeIcon}
          onClick={toggleTheme}
          title="Cambiar tema"
          aria-label="Cambiar tema"
        >
          {isDark ? <LuSun size={18} /> : <LuMoon size={18} />}
        </button>
      ) : (
        <div className={styles.themeSwitch} role="group" aria-label="Tema">
          <button
            type="button"
            className={!isDark ? styles.themeOn : ""}
            onClick={() => isDark && toggleTheme()}
          >
            <LuSun size={14} />
            Claro
          </button>
          <button
            type="button"
            className={isDark ? styles.themeOn : ""}
            onClick={() => !isDark && toggleTheme()}
          >
            <LuMoon size={14} />
            Oscuro
          </button>
        </div>
      )}

      <nav className={styles.navigation}>
        {menu.map((group) => {
          const Icon = group.icon;
          const hasItems = !!group.items && group.items.length > 0;
          const active = hasItems ? groupHasActive(group) : isActiveLink(group.to!);
          const isOpen = !!open[group.id];

          if (isCollapsed) {
            const target = hasItems ? group.items![0].to : group.to!;
            return hasItems ? (
              <button
                key={group.id}
                type="button"
                className={`${styles.railBtn} ${active ? styles.railActive : ""}`}
                title={group.label}
                aria-label={group.label}
                onClick={() => expandAndOpen(group.id)}
              >
                <Icon size={20} />
              </button>
            ) : (
              <Link
                key={group.id}
                to={target}
                className={`${styles.railBtn} ${active ? styles.railActive : ""}`}
                title={group.label}
                aria-label={group.label}
              >
                <Icon size={20} />
              </Link>
            );
          }

          return (
            <div key={group.id} className={styles.group}>
              {hasItems ? (
                <button
                  type="button"
                  className={`${styles.groupBtn} ${active ? styles.groupHasActive : ""}`}
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={isOpen}
                >
                  <Icon size={18} />
                  <span className={styles.groupLabel}>{group.label}</span>
                  {isOpen ? <LuChevronDown size={16} /> : <LuChevronRight size={16} />}
                </button>
              ) : (
                <Link
                  to={group.to!}
                  className={`${styles.groupBtn} ${active ? styles.groupActive : ""}`}
                >
                  <Icon size={18} />
                  <span className={styles.groupLabel}>{group.label}</span>
                </Link>
              )}

              {hasItems && isOpen && (
                <ul className={styles.subList}>
                  {group.items!.map((item) => (
                    <li key={item.to + item.label}>
                      <Link
                        to={item.to}
                        className={isActiveLink(item.to) ? styles.active : ""}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <button
          type="button"
          className={isCollapsed ? styles.railBtn : styles.logoutBtn}
          onClick={handleLogout}
          title="Cerrar sesión"
        >
          <LuLogOut size={isCollapsed ? 20 : 18} />
          {!isCollapsed && "Cerrar sesión"}
        </button>
      </div>
    </aside>
  );
};
