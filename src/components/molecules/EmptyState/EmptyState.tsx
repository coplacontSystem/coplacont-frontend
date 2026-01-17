import React from "react";
import styles from "./EmptyState.module.scss";
import { Text, NoDataIcon } from "@/components/atoms";
import { HiOutlineClock, HiOutlineExclamationTriangle } from "react-icons/hi2";

export type EmptyStateVariant = "empty" | "loading" | "error";

export interface EmptyStateProps {
 /**
  * Variant determines the visual state
  * - 'empty': Shows no data message with icon
  * - 'loading': Shows loading spinner with message
  * - 'error': Shows error message with icon
  */
 variant?: EmptyStateVariant;
 /**
  * Custom title to display
  */
 title?: string;
 /**
  * Custom subtitle/description to display
  */
 subtitle?: string;
 /**
  * Custom icon to display
  */
 icon?: React.ReactNode;
 /**
  * Additional CSS class
  */
 className?: string;
}

const defaultConfig: Record<
 EmptyStateVariant,
 { title: string; subtitle: string; icon: React.ReactNode }
> = {
 empty: {
  title: "Sin datos",
  subtitle: "No se encontraron registros para mostrar",
  icon: <NoDataIcon />,
 },
 loading: {
  title: "Cargando...",
  subtitle: "Por favor espera mientras se cargan los datos",
  icon: <HiOutlineClock size={40} />,
 },
 error: {
  title: "Error",
  subtitle: "Ha ocurrido un error al cargar los datos",
  icon: <HiOutlineExclamationTriangle size={40} />,
 },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
 variant = "empty",
 title,
 subtitle,
 icon,
 className,
}) => {
 const config = defaultConfig[variant];
 const displayTitle = title ?? config.title;
 const displaySubtitle = subtitle ?? config.subtitle;
 const displayIcon = icon ?? config.icon;

 const iconClassName = [
  styles.emptyState__icon,
  variant === "loading" ? styles.emptyState__iconLoading : "",
  variant === "error" ? styles.emptyState__iconError : "",
 ]
  .filter(Boolean)
  .join(" ");

 return (
  <section className={`${styles.emptyState} ${className ?? ""}`.trim()}>
   <div className={styles.emptyState__content}>
    <div className={iconClassName}>{displayIcon}</div>
    <Text
     size="xl"
     color="info"
     weight={500}
     className={styles.emptyState__title}
    >
     {displayTitle}
    </Text>
    <Text size="md" color="info" className={styles.emptyState__subtitle}>
     {displaySubtitle}
    </Text>
   </div>
  </section>
 );
};

export default EmptyState;
