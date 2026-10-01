import React from 'react';
import styles from './Divider.module.scss';

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  thickness?: number;
  color?: string;
  margin?: string;
}

export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  thickness = 1,
  color = 'var(--border)',
  margin = '0.75rem 0',
}) => {
  const style = {
    borderTopWidth: orientation === 'horizontal' ? `${thickness}px` : 0,
    borderLeftWidth: orientation === 'vertical' ? `${thickness}px` : 0,
    borderColor: color,
    margin: margin,
  };

  return <hr className={`${styles.divider} ${styles[orientation]}`} style={style} />;
};