import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  LuBuilding2,
  LuCalendarRange,
  LuChevronDown,
  LuCircleUser,
  LuSlidersHorizontal,
  LuTriangleAlert,
} from 'react-icons/lu';
import { useAuth } from '@/domains/auth';
import { MAIN_ROUTES } from '@/router';
import { SeccionCuenta } from './SeccionCuenta';
import { SeccionEmpresa } from './SeccionEmpresa';
import { SeccionPeriodos } from './SeccionPeriodos';
import { SeccionParametros } from './SeccionParametros';
import { Modal, ToastProvider } from './ui';
import { cx } from './util';
import styles from './Configuracion.module.scss';

export type SeccionId = 'cuenta' | 'empresa' | 'periodos' | 'parametros';

const SECCIONES: {
  id: SeccionId;
  label: string;
  desc: string;
  icono: React.ElementType;
  titulo: string;
  sub: (empresa: string) => string;
}[] = [
  {
    id: 'cuenta',
    label: 'Mi cuenta',
    desc: 'Perfil y seguridad',
    icono: LuCircleUser,
    titulo: 'Mi cuenta',
    sub: () => 'Tus datos de acceso a COPLACONT y la seguridad de tu cuenta.',
  },
  {
    id: 'empresa',
    label: 'Empresa',
    desc: 'Datos fiscales y logo',
    icono: LuBuilding2,
    titulo: 'Empresa',
    sub: (e) => (e ? `Los datos fiscales de ${e.replace(/\.$/, '')}.` : 'Los datos fiscales de tu empresa.'),
  },
  {
    id: 'periodos',
    label: 'Periodos contables',
    desc: 'Apertura y cierre',
    icono: LuCalendarRange,
    titulo: 'Periodos contables',
    sub: () => 'Cada periodo agrupa las compras, ventas y el kardex de un ejercicio.',
  },
  {
    id: 'parametros',
    label: 'Parámetros',
    desc: 'Inventario y costeo',
    icono: LuSlidersHorizontal,
    titulo: 'Parámetros',
    sub: () => 'Reglas de inventario y costeo del periodo activo.',
  },
];

/** Configuración: una pantalla con navegación interna (diseño CoplacontConfiguracion). */
export const Configuracion: React.FC = () => {
  const { seccion } = useParams<{ seccion?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const esEmpresa = user?.roles?.some((r) => r.nombre === 'EMPRESA') ?? false;
  const disponibles = esEmpresa ? SECCIONES : SECCIONES.filter((s) => s.id === 'cuenta');

  const [sucios, setSucios] = useState<Partial<Record<SeccionId, number>>>({});
  const [salirA, setSalirA] = useState<SeccionId | null>(null);
  const [guardandoSalida, setGuardandoSalida] = useState(false);
  const guardarRef = useRef<(() => Promise<boolean>) | null>(null);

  const actual = disponibles.find((s) => s.id === seccion);
  const id = actual?.id ?? 'cuenta';

  const onDirty = useCallback((n: number) => setSucios((s) => (s[id] === n ? s : { ...s, [id]: n })), [id]);
  const registrarGuardado = useCallback((fn: (() => Promise<boolean>) | null) => {
    guardarRef.current = fn;
  }, []);

  const ir = useCallback(
    (destino: SeccionId) => navigate(`${MAIN_ROUTES.SETTINGS}/${destino}`),
    [navigate],
  );
  const irA = (destino: string) => {
    if (destino === id) return;
    if (sucios[id]) return setSalirA(destino as SeccionId);
    ir(destino as SeccionId);
  };

  // Al cambiar de sección se olvidan los cambios de la anterior
  useEffect(() => {
    setSucios({});
    guardarRef.current = null;
  }, [id]);

  if (!actual) return <Navigate to={`${MAIN_ROUTES.SETTINGS}/${disponibles[0].id}`} replace />;

  const empresa = user?.persona?.razonSocial || user?.persona?.nombreEmpresa || '';
  const n = sucios[id] ?? 0;
  const props = { onDirty, registrarGuardado, irA };

  const salir = async (guardar: boolean) => {
    if (!salirA) return;
    if (guardar && guardarRef.current) {
      setGuardandoSalida(true);
      const ok = await guardarRef.current();
      setGuardandoSalida(false);
      if (!ok) return setSalirA(null);
    }
    const destino = salirA;
    setSalirA(null);
    ir(destino);
  };

  return (
    <ToastProvider>
      <div className={styles.config} data-screen-label="Configuración">
        <div className={styles.encabezado}>
          <h1 className={styles.titulo}>Configuración</h1>
          <span className={styles.subtitulo}>
            {esEmpresa
              ? 'Tu cuenta, los datos de la empresa y las reglas de cada periodo contable.'
              : 'Tus datos de acceso y la seguridad de tu cuenta.'}
          </span>
        </div>

        <div className={cx(styles.layout, disponibles.length === 1 && styles.layoutSolo)}>
          {disponibles.length > 1 && (
            <>
              <nav data-component="SettingsNav" data-variant="vertical" aria-label="Secciones de configuración" className={styles.navVertical}>
                {disponibles.map((s) => {
                  const on = s.id === id;
                  const Icono = s.icono;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      aria-current={on ? 'page' : undefined}
                      className={cx(styles.navItem, on && styles.navItemOn)}
                      onClick={() => irA(s.id)}
                    >
                      <span className={styles.navIcono}>
                        <Icono />
                      </span>
                      <span className={styles.navTexto}>
                        <span>{s.label}</span>
                        <span>{s.desc}</span>
                      </span>
                      {on && n > 0 && <span title="Cambios sin guardar" className={styles.puntoAviso} />}
                    </button>
                  );
                })}
              </nav>

              <nav data-component="SettingsNav" data-variant="tabs" aria-label="Secciones de configuración" className={styles.navTabs}>
                {disponibles.map((s) => {
                  const on = s.id === id;
                  const Icono = s.icono;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      aria-current={on ? 'page' : undefined}
                      className={cx(styles.tab, on && styles.tabOn)}
                      onClick={() => irA(s.id)}
                    >
                      <Icono />
                      {s.label}
                      {on && n > 0 && <span className={styles.puntoAviso} />}
                    </button>
                  );
                })}
              </nav>

              <label data-component="SettingsNav" data-variant="select" className={styles.navSelect}>
                <span>Sección</span>
                <span className={styles.navSelectCaja}>
                  <actual.icono className={styles.navSelectIcono} />
                  <select value={id} onChange={(e) => irA(e.target.value)}>
                    {disponibles.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                        {s.id === id && n > 0 ? ' · sin guardar' : ''}
                      </option>
                    ))}
                  </select>
                  <LuChevronDown className={styles.navSelectFlecha} />
                </span>
              </label>
            </>
          )}

          <div className={styles.contenido}>
            <div className={styles.seccionHead}>
              <h2>{actual.titulo}</h2>
              <span>{actual.sub(empresa)}</span>
            </div>
            {id === 'cuenta' && <SeccionCuenta key="cuenta" {...props} />}
            {id === 'empresa' && <SeccionEmpresa key="empresa" {...props} />}
            {id === 'periodos' && <SeccionPeriodos key="periodos" {...props} />}
            {id === 'parametros' && <SeccionParametros key="parametros" {...props} />}
          </div>
        </div>
      </div>

      {salirA && (
        <Modal label="Cambios sin guardar" alert onClose={() => setSalirA(null)}>
          <div className={styles.modalIconoFila}>
            <span className={cx(styles.modalIcono, styles.modalIconoAviso)}>
              <LuTriangleAlert />
            </span>
            <div className={styles.modalIconoTexto}>
              <span className={styles.modalTitle}>Tienes cambios sin guardar</span>
              <span className={styles.modalTexto}>
                Si sales de {actual.label}, perderás {n === 1 ? 'el cambio sin guardar.' : `los ${n} cambios sin guardar.`}
              </span>
            </div>
          </div>
          <div className={styles.btnRowEnd}>
            {guardarRef.current && (
              <button type="button" className={styles.btnPrimary} disabled={guardandoSalida} onClick={() => void salir(true)}>
                {guardandoSalida ? 'Guardando…' : 'Guardar y salir'}
              </button>
            )}
            <button type="button" className={cx(styles.btnSecondary, styles.textoPeligro)} onClick={() => void salir(false)}>
              Descartar cambios
            </button>
            <button type="button" className={styles.btnGhost} onClick={() => setSalirA(null)}>
              Seguir editando
            </button>
          </div>
        </Modal>
      )}
    </ToastProvider>
  );
};

export default Configuracion;
