import React from 'react';
import { LuCloudOff, LuRotateCw } from 'react-icons/lu';
import { cx } from './util';
import styles from './Configuracion.module.scss';

export interface SeccionProps {
  /** Cantidad de cambios sin guardar de la sección */
  onDirty: (n: number) => void;
  /** Guarda los cambios pendientes; la usa "Guardar y salir" */
  registrarGuardado?: (fn: (() => Promise<boolean>) | null) => void;
  irA?: (seccion: string) => void;
}

const Linea: React.FC<{ w?: string; h?: number }> = ({ w = '100%', h = 14 }) => (
  <div className={styles.skel} style={{ width: w, height: h }} />
);

export const CargandoSeccion: React.FC<{ avatar?: boolean }> = ({ avatar }) => (
  <div aria-busy="true" aria-label="Cargando configuración" className={styles.skelWrap}>
    {avatar && (
      <div className={cx(styles.card, styles.skelAvatarCard)}>
        <div className={cx(styles.skel, styles.skelAvatar)} />
        <div className={styles.skelCol}>
          <Linea w="40%" h={16} />
          <Linea w="60%" h={12} />
          <Linea w="180px" h={36} />
        </div>
      </div>
    )}
    <div className={styles.card}>
      <Linea w="30%" h={16} />
      <Linea />
      <Linea w="85%" />
      <Linea w="90%" />
      <Linea w="70%" />
    </div>
    <div className={styles.card}>
      <Linea w="25%" h={16} />
      <Linea w="75%" />
      <Linea w="55%" />
    </div>
  </div>
);

export const ErrorSeccion: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div role="alert" className={cx(styles.card, styles.estadoError)}>
    <div className={styles.estadoErrorIcono}>
      <LuCloudOff />
    </div>
    <span className={styles.estadoTitulo}>No se pudo cargar la configuración</span>
    <span className={styles.estadoTexto}>Revisa tu conexión e inténtalo de nuevo. Tus datos están a salvo.</span>
    <button type="button" className={styles.btnSecondary} onClick={onRetry}>
      <LuRotateCw /> Reintentar
    </button>
  </div>
);
