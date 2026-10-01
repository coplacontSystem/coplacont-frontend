import React from "react";
import { LuInbox, LuTriangleAlert } from "react-icons/lu";
import styles from "./EmptyState.module.scss";

export type EmptyStateVariant = "empty" | "loading" | "error";

export interface EmptyStateProps {
 /**
  * Variant determines the visual state
  * - 'empty': Shows no data message with icon
  * - 'loading': Shows loading spinner with message
  * - 'error': Shows error message with icon
  */
 variant?: EmptyStateVariant;
 /** Custom title to display */
 title?: string;
 /** Custom subtitle/description to display */
 subtitle?: string;
 /** Custom icon to display */
 icon?: React.ReactNode;
 /** Acción opcional (por ejemplo, un botón para crear el primer registro) */
 action?: React.ReactNode;
 /** Additional CSS class */
 className?: string;
}

const defaultConfig: Record<
 EmptyStateVariant,
 { title: string; subtitle: string; icon: React.ReactNode }
> = {
 empty: {
  title: "Sin datos",
  subtitle: "No se encontraron registros para mostrar",
  icon: <LuInbox size={24} />,
 },
 loading: {
  title: "Cargando...",
  subtitle: "Por favor espera mientras se cargan los datos",
  icon: <span className={styles.spinner} />,
 },
 error: {
  title: "Ocurrió un error",
  subtitle: "Ha ocurrido un error al cargar los datos",
  icon: <LuTriangleAlert size={24} />,
 },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
 variant = "empty",
 title,
 subtitle,
 icon,
 action,
 className,
}) => {
 const config = defaultConfig[variant];

 const iconClassName = [
  styles.emptyState__icon,
  variant === "error" ? styles.emptyState__iconError : "",
 ]
  .filter(Boolean)
  .join(" ");

 return (
  <section className={`${styles.emptyState} ${className ?? ""}`.trim()}>
   <div className={styles.emptyState__content}>
    <div className={iconClassName}>{icon ?? config.icon}</div>
    <span className={styles.emptyState__title}>{title ?? config.title}</span>
    <span className={styles.emptyState__subtitle}>
     {subtitle ?? config.subtitle}
    </span>
    {action && <div className={styles.emptyState__action}>{action}</div>}
   </div>
  </section>
 );
};

export default EmptyState;
