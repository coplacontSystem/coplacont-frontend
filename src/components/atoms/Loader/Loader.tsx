import React from 'react';
import styles from './Loader.module.scss';

export interface LoaderProps {
  /** Texto a mostrar junto al spinner */
  text?: string;
  /** Variante inline para uso dentro de contenedores específicos */
  inline?: boolean;
  /** Clase CSS adicional */
  className?: string;
}

export const Loader: React.FC<LoaderProps> = ({
  text = 'Cargando...',
  inline = false,
  className
}) => {
  const loaderClass = `${styles.loader} ${inline ? styles.inline : ''} ${className || ''}`.trim();

  return (
    <div className={loaderClass} role="status" aria-live="polite">
      <div className={styles.content}>
        <span className={styles.spinner} />
        <span className={styles.text}>{text}</span>
      </div>
    </div>
  );
};

export default Loader;
