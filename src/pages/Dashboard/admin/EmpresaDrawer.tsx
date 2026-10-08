import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  LuCalendarX,
  LuCloudOff,
  LuDatabase,
  LuLogOut,
  LuPower,
  LuPowerOff,
  LuRotateCcw,
  LuUserPlus,
  LuX,
} from 'react-icons/lu';
import { ErrorCampo, Modal } from '@/domains/settings/pages/Configuracion/ui';
import { cx, useToast } from '@/domains/settings/pages/Configuracion/util';
import { iniciales, MESES, numero } from '../formato';
import {
  useAgregarUsuarioMutation,
  useCambiarEstadoEmpresaMutation,
  useGetEmpresaAdminQuery,
  useGetRolesQuery,
  type EmpresaDetalle,
} from './adminApi';
import { fechaCorta, relativo } from './util';
import styles from './AdminDashboard.module.scss';

export interface EmpresaEstado {
  id: number;
  nombre: string;
  usuarios: number;
  habilitada: boolean;
}

const PERIODO: Record<string, { label: string; tono: string }> = {
  activo: { label: 'Activo', tono: styles.tonoSuccess },
  reabierto: { label: 'Reabierto', tono: styles.tonoWarning },
  vencido: { label: 'Vencido', tono: styles.tonoError },
  sinCerrar: { label: 'Sin cerrar', tono: styles.tonoWarning },
  futuro: { label: 'Futuro', tono: styles.tonoAccent },
  cerrado: { label: 'Cerrado', tono: styles.tonoNeutral },
};

export const EmpresaDrawer: React.FC<{
  id: number;
  onClose: () => void;
  onEstado: (e: EmpresaEstado) => void;
}> = ({ id, onClose, onEstado }) => {
  const q = useGetEmpresaAdminQuery(id);
  const [agregando, setAgregando] = useState(false);

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && !agregando && onClose();
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [onClose, agregando]);

  const e = q.data;
  return createPortal(
    <div className={styles.drawerCapa}>
      <div className={styles.velo} onClick={onClose} />
      <div data-component="EmpresaDrawer" role="dialog" aria-modal="true" aria-label="Detalle de empresa" className={styles.drawer}>
        <div className={styles.drawerHead}>
          <span className={styles.drawerIni}>{e ? iniciales(e.razonSocial) : '·'}</span>
          <div className={styles.drawerTitulo}>
            <span>{e?.razonSocial ?? 'Cargando…'}</span>
            {e && (
              <span>
                RUC {e.ruc}
                <span className={cx(styles.chipEstado, styles.chipEstadoMini, e.habilitada ? styles.tonoSuccess : styles.tonoNeutral)}>
                  <span className={cx(styles.dot, e.habilitada ? styles.dotOn : styles.dotOff)} />
                  {e.habilitada ? 'Habilitada' : 'Deshabilitada'}
                </span>
              </span>
            )}
          </div>
          <button type="button" className={styles.cerrar} aria-label="Cerrar" onClick={onClose}>
            <LuX />
          </button>
        </div>

        <div className={styles.drawerCuerpo}>
          {q.isLoading && [0, 1, 2].map((i) => <div key={i} className={styles.skel} style={{ height: 120 }} />)}
          {q.isError && (
            <div className={styles.todoEnOrden}>
              <div className={styles.errorIcono}>
                <LuCloudOff />
              </div>
              <span className={styles.estadoTitulo}>No se pudo cargar la empresa</span>
              <button type="button" className={styles.btnSecondary} onClick={() => q.refetch()}>
                Reintentar
              </button>
            </div>
          )}
          {e && <Detalle e={e} onAgregar={() => setAgregando(true)} />}
        </div>

        {e && (
          <div className={styles.drawerPie}>
            <button type="button" className={styles.btnPrimary} onClick={() => setAgregando(true)}>
              <LuUserPlus /> Agregar usuario
            </button>
            <button
              type="button"
              className={cx(styles.btnSecondary, e.habilitada ? styles.textoPeligro : styles.textoOk)}
              onClick={() =>
                onEstado({ id: e.id, nombre: e.razonSocial, usuarios: e.usuarios.length, habilitada: e.habilitada })
              }
            >
              {e.habilitada ? <LuPowerOff /> : <LuPower />}
              {e.habilitada ? 'Deshabilitar empresa' : 'Habilitar empresa'}
            </button>
          </div>
        )}
      </div>
      {agregando && e && <AgregarUsuario empresa={e} onClose={() => setAgregando(false)} />}
    </div>,
    document.body,
  );
};

const Detalle: React.FC<{ e: EmpresaDetalle; onAgregar: () => void }> = ({ e, onAgregar }) => {
  const fiscal: [string, string][] = [
    ['Razón social', e.razonSocial],
    ['RUC', e.ruc],
    ...(e.nombreComercial && e.nombreComercial !== e.razonSocial ? [['Nombre comercial', e.nombreComercial] as [string, string]] : []),
    ['Dirección fiscal', e.direccion || '—'],
    ['Teléfono', e.telefono || '—'],
    ['Fecha de alta', fechaCorta(e.creada)],
  ];
  // Últimos 6 meses de actividad
  const act = e.actividad.slice(-6);
  const max = Math.max(1, ...act.map((m) => m.comprobantes));

  return (
    <>
      <section className={styles.bloque}>
        <span className={styles.bloqueTitulo}>Datos fiscales</span>
        <div className={styles.caja}>
          {fiscal.map(([l, v]) => (
            <div key={l} className={styles.fiscalFila}>
              <span>{l}</span>
              <span>{v}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.bloque}>
        <div className={styles.bloqueHead}>
          <span className={styles.bloqueTitulo}>Usuarios · {e.usuarios.length}</span>
          <button type="button" className={styles.btnLink} onClick={onAgregar}>
            <LuUserPlus /> Agregar usuario
          </button>
        </div>
        <div className={cx(styles.caja, styles.cajaLista)}>
          {e.usuarios.map((u) => {
            const est = !e.habilitada || !u.habilitado
              ? { l: 'Bloqueado', t: styles.tonoNeutral }
              : u.ultimoAcceso
                ? { l: 'Activo', t: styles.tonoSuccess }
                : { l: 'Pendiente', t: styles.tonoWarning };
            return (
              <div key={u.id} className={styles.usuario}>
                <span className={styles.accesoIni}>{iniciales(u.nombre)}</span>
                <div className={styles.usuarioTexto}>
                  <span>{u.nombre}</span>
                  <span>{u.email}</span>
                  <span>{u.ultimoAcceso ? `Último acceso ${relativo(u.ultimoAcceso)}` : 'Nunca inició sesión'}</span>
                </div>
                <span className={cx(styles.chip, styles.chipMini, est.t)}>{est.l}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className={styles.bloque}>
        <span className={styles.bloqueTitulo}>Periodos</span>
        {e.periodos.length ? (
          <div className={styles.periodos}>
            {e.periodos.map((p) => {
              const c = PERIODO[p.estado] ?? PERIODO.futuro;
              return (
                <span key={p.id} className={styles.periodo}>
                  {p.año}
                  <span className={cx(styles.chip, styles.chipMini, c.tono)}>{c.label}</span>
                </span>
              );
            })}
          </div>
        ) : (
          <span className={styles.avisoAmarillo}>
            <LuCalendarX /> La empresa aún no creó su primer periodo contable.
          </span>
        )}
      </section>

      <section className={styles.bloque}>
        <div className={styles.bloqueHead}>
          <span className={styles.bloqueTitulo}>Actividad</span>
          <span className={styles.cardSub}>Comprobantes por mes</span>
        </div>
        <div className={styles.caja}>
          <div className={styles.miniChart}>
            {act.map((m, i) => (
              <div key={m.mes}>
                <span>{numero(m.comprobantes)}</span>
                <div
                  className={cx(i === act.length - 1 && styles.miniActual)}
                  style={{ height: `${(m.comprobantes / max) * 72}px` }}
                />
              </div>
            ))}
          </div>
          <div className={styles.miniMeses}>
            {act.map((m) => (
              <span key={m.mes}>{MESES[Number(m.mes.slice(5)) - 1].slice(0, 3)}</span>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

/* ---------- Confirmar habilitar / deshabilitar ---------- */

export const ConfirmarEstado: React.FC<{ empresa: EmpresaEstado; onClose: () => void }> = ({ empresa, onClose }) => {
  const toast = useToast();
  const [cambiar, { isLoading }] = useCambiarEstadoEmpresaMutation();
  const des = empresa.habilitada;
  const n = empresa.usuarios;

  const confirmar = async () => {
    try {
      await cambiar({ id: empresa.id, habilitar: !des }).unwrap();
      toast(`${empresa.nombre} quedó ${des ? 'deshabilitada' : 'habilitada'}`);
      onClose();
    } catch {
      toast('No se pudo cambiar el estado de la empresa');
    }
  };

  return (
    <Modal label={des ? 'Deshabilitar empresa' : 'Habilitar empresa'} alert onClose={onClose}>
      <div className={styles.modalFila}>
        <span className={cx(styles.modalIcono, des ? styles.tonoError : styles.tonoSuccess)}>
          {des ? <LuPowerOff /> : <LuPower />}
        </span>
        <div className={styles.modalTexto}>
          <span>
            ¿{des ? 'Deshabilitar' : 'Habilitar'} {empresa.nombre}?
          </span>
          <span>
            {des
              ? `Sus ${n} ${n === 1 ? 'usuario no podrá' : 'usuarios no podrán'} iniciar sesión hasta que la vuelvas a habilitar.`
              : `Sus ${n} ${n === 1 ? 'usuario podrá' : 'usuarios podrán'} volver a iniciar sesión y registrar comprobantes.`}
          </span>
        </div>
      </div>
      {des && (
        <ul className={styles.consecuencias}>
          <li>
            <LuLogOut /> Sus usuarios ya no podrán iniciar sesión.
          </li>
          <li>
            <LuDatabase /> Sus datos, periodos y comprobantes se conservan.
          </li>
          <li>
            <LuRotateCcw /> Puedes volver a habilitarla cuando quieras.
          </li>
        </ul>
      )}
      <div className={styles.botonesFin}>
        <button
          type="button"
          className={des ? styles.btnPeligro : styles.btnPrimary}
          disabled={isLoading}
          onClick={() => void confirmar()}
        >
          {des ? <LuPowerOff /> : <LuPower />}
          {des ? 'Deshabilitar empresa' : 'Habilitar empresa'}
        </button>
        <button type="button" className={styles.btnSecondary} onClick={onClose}>
          Cancelar
        </button>
      </div>
    </Modal>
  );
};

/* ---------- Agregar usuario ---------- */

const AgregarUsuario: React.FC<{ empresa: EmpresaDetalle; onClose: () => void }> = ({ empresa, onClose }) => {
  const toast = useToast();
  const roles = useGetRolesQuery();
  const [agregar, { isLoading }] = useAgregarUsuarioMutation();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [intentado, setIntentado] = useState(false);
  const [err, setErr] = useState('');

  const eNombre = intentado && nombre.trim().split(/\s+/).length < 2 ? 'Escribe nombre y apellido.' : '';
  const eEmail = intentado && !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email.trim()) ? 'Ingresa un correo válido.' : '';
  const idRol = roles.data?.find((r) => r.nombre === 'EMPRESA')?.id;

  const enviar = async () => {
    setIntentado(true);
    setErr('');
    if (nombre.trim().split(/\s+/).length < 2 || !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email.trim()) || !idRol) return;
    try {
      await agregar({ idPersona: empresa.id, nombre: nombre.trim(), email: email.trim().toLowerCase(), idRol }).unwrap();
      toast(`Usuario creado. Le enviamos sus datos de acceso a ${email.trim().toLowerCase()}`);
      onClose();
    } catch (e) {
      const m = (e as { data?: { message?: string | string[] } })?.data?.message;
      setErr((Array.isArray(m) ? m[0] : m) || 'No se pudo crear el usuario.');
    }
  };

  return (
    <Modal label="Agregar usuario" onClose={onClose}>
      <div className={styles.modalTexto}>
        <span>Agregar usuario</span>
        <span>Tendrá acceso a {empresa.razonSocial}. Le enviaremos sus datos de acceso por correo.</span>
      </div>
      <label className={styles.campo}>
        <span>Nombre completo</span>
        <input className={cx(styles.input, eNombre && styles.inputError)} value={nombre} onChange={(ev) => setNombre(ev.target.value)} />
        {eNombre && <ErrorCampo>{eNombre}</ErrorCampo>}
      </label>
      <label className={styles.campo}>
        <span>Correo electrónico</span>
        <input
          className={cx(styles.input, eEmail && styles.inputError)}
          type="email"
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
          onKeyDown={(ev) => ev.key === 'Enter' && void enviar()}
        />
        {eEmail && <ErrorCampo>{eEmail}</ErrorCampo>}
      </label>
      {err && <ErrorCampo>{err}</ErrorCampo>}
      <div className={styles.botonesFin}>
        <button type="button" className={styles.btnPrimary} disabled={isLoading || !idRol} onClick={() => void enviar()}>
          <LuUserPlus /> {isLoading ? 'Creando…' : 'Agregar usuario'}
        </button>
        <button type="button" className={styles.btnSecondary} onClick={onClose}>
          Cancelar
        </button>
      </div>
    </Modal>
  );
};
