import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { LuBell, LuBuilding2, LuCalendar, LuChevronRight } from "react-icons/lu";
import styles from "./AppHeader.module.scss";
import { useAuth } from "@/domains/auth";
import { useGetPeriodosQuery } from "@/domains/settings/pages/Configuracion/configuracionApi";
import { buildMenu } from "@/components/organisms/Sidebar/menu";

/**
 * Barra superior del sistema: ruta actual, periodo contable activo,
 * empresa del usuario y acceso a notificaciones.
 */
export const AppHeader: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const role = user?.roles?.[0]?.nombre ?? "";
  const isCompany = role === "EMPRESA";
  // Se actualiza solo al crear, cerrar o reabrir periodos (tag Periodos)
  const { data: periodos } = useGetPeriodosQuery(undefined, { skip: !isCompany });
  const period = periodos?.find((p) => p.estado === "activo" || p.estado === "reabierto");

  // Migas de pan a partir de la configuración del menú: Grupo > Página
  const crumbs = useMemo(() => {
    const path = location.pathname;
    for (const group of buildMenu(role)) {
      if (!group.items) {
        if (group.to === "/" && path === "/") return [group.label];
        continue;
      }
      const match = group.items
        .filter((i) => path === i.to || path.startsWith(i.to + "/"))
        .sort((a, b) => b.to.length - a.to.length)[0];
      if (match) {
        const extra = path.startsWith(match.to + "/") ? ["Detalle"] : [];
        if (path.endsWith("/register")) extra.splice(0, 1, "Nuevo registro");
        return [group.label, match.label, ...extra];
      }
    }
    return [];
  }, [location.pathname, role]);

  const company = user?.persona;

  return (
    <header className={styles.header}>
      <nav className={styles.crumbs} aria-label="Ruta">
        {crumbs.map((c, i) => (
          <React.Fragment key={c + i}>
            {i > 0 && <LuChevronRight size={14} className={styles.sep} />}
            <span className={i === crumbs.length - 1 ? styles.current : styles.muted}>
              {c}
            </span>
          </React.Fragment>
        ))}
      </nav>

      <div className={styles.actions}>
        {isCompany && periodos && (
          <div className={styles.chip}>
            <LuCalendar size={16} />
            {period ? (
              <>
                Periodo <strong>{period.año}</strong>
                <span className={styles.badgeOpen}>
                  {period.estado === "reabierto" ? "Reabierto" : "Abierto"}
                </span>
              </>
            ) : (
              <span className={styles.badgeClosed}>Sin periodo activo</span>
            )}
          </div>
        )}

        {company && (
          <div className={`${styles.chip} ${styles.company}`}>
            <LuBuilding2 size={16} className={styles.sep} />
            <span className={styles.companyName}>
              {company.razonSocial || company.nombreEmpresa}
            </span>
            <span className={styles.ruc}>RUC {company.ruc}</span>
          </div>
        )}

        <button
          type="button"
          className={styles.bell}
          title="Notificaciones"
          aria-label="Notificaciones"
        >
          <LuBell size={17} />
        </button>
      </div>
    </header>
  );
};

export default AppHeader;
