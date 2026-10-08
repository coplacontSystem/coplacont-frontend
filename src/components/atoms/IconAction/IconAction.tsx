import React from "react";
import styles from "./IconAction.module.scss";

export interface IconActionProps {
  /** Texto accesible y tooltip */
  title: string;
  onClick?: () => void;
  /** Color al pasar el mouse: neutro (acento), peligro o éxito */
  tone?: "default" | "danger" | "success";
  disabled?: boolean;
  children: React.ReactNode;
}

/**
 * Botón cuadrado de 32 px con un icono, para las acciones de cada fila de una tabla.
 */
export const IconAction: React.FC<IconActionProps> = ({
  title,
  onClick,
  tone = "default",
  disabled = false,
  children,
}) => (
  <button
    type="button"
    className={`${styles.iconAction} ${styles[tone]}`}
    title={title}
    aria-label={title}
    onClick={onClick}
    disabled={disabled}
  >
    {children}
  </button>
);

export default IconAction;
