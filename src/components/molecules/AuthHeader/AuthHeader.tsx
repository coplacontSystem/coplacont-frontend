import React from 'react';
import styles from './AuthHeader.module.scss';

import { Text } from '@/components';


/**
 * Props para el componente AuthHeader
 */
export interface AuthHeaderProps {
  /** Texto principal del header */
  title: string;
  /** Texto secundario/descripción */
  subtitle: string;
}

/**
 * Componente AuthHeader - Molécula que combina Logo y textos de encabezado
 * para páginas de autenticación
 */
export const AuthHeader: React.FC<AuthHeaderProps> = ({
  title,
  subtitle,
}) => {
  return (
    <div className={styles.authHeader}>
      <Text 
        as="p" 
        size="2xl" 
        weight={600} 
        color="neutral-primary" 
        align="left"
        className={styles.title}
      >
        {title}
      </Text>

      <Text 
        as="p" 
        size="md" 
        color="neutral-secondary" 
        align="left"
        className={styles.subtitle}
      >
        {subtitle}
      </Text>
    </div>
  );
};