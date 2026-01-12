import React from "react";
import styles from "./EmptyState.module.scss";
import { Text, NoDataIcon } from "@/components/atoms";

export type EmptyStateVariant = "empty" | "loading";

export interface EmptyStateProps {
  /**
   * Variant determines the visual state
   * - 'empty': Shows no data message with icon
   * - 'loading': Shows loading spinner with message
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
   * Custom icon to display (only for 'empty' variant)
   */
  icon?: React.ReactNode;
  /**
   * Additional CSS class
   */
  className?: string;
}

const defaultMessages = {
  empty: {
    title: "Sin datos",
    subtitle: "No se encontraron registros para mostrar",
  },
  loading: {
    title: "Cargando...",
    subtitle: "Por favor espera mientras se cargan los datos",
  },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  variant = "empty",
  title,
  subtitle,
  icon,
  className,
}) => {
  const displayTitle = title ?? defaultMessages[variant].title;
  const displaySubtitle = subtitle ?? defaultMessages[variant].subtitle;

  return (
    <section className={`${styles.emptyState} ${className ?? ""}`.trim()}>
      <div className={styles.emptyState__content}>
        {variant === "loading" ? (
          <div className={styles.emptyState__loader}>
            <div className={styles.spinner} />
          </div>
        ) : (
          <div className={styles.emptyState__icon}>
            {icon ?? <NoDataIcon />}
          </div>
        )}
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
