import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LuCircleAlert, LuCircleCheck, LuLock, LuMinus, LuPencil, LuPlus, LuShieldCheck, LuX } from 'react-icons/lu';
import { cx, ToastCtx } from './util';
import styles from './Configuracion.module.scss';

/* ---------- Toast ---------- */

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [msg, setMsg] = useState('');
  const t = useRef<number>(undefined);
  const mostrar = (m: string) => {
    window.clearTimeout(t.current);
    setMsg(m);
    t.current = window.setTimeout(() => setMsg(''), 3200);
  };
  useEffect(() => () => window.clearTimeout(t.current), []);
  return (
    <ToastCtx.Provider value={mostrar}>
      {children}
      {msg &&
        createPortal(
          <div role="status" aria-live="polite" className={styles.toast}>
            <span className={styles.toastIcon}><LuCircleCheck /></span>
            <span className={styles.toastText}>{msg}</span>
            <button type="button" className={styles.iconBtn} aria-label="Cerrar aviso" onClick={() => setMsg('')}>
              <LuX />
            </button>
          </div>,
          document.body,
        )}
    </ToastCtx.Provider>
  );
};

/* ---------- Tarjetas y avisos ---------- */

export const Card: React.FC<{ titulo?: string; sub?: string; className?: string; children: React.ReactNode }> = ({
  titulo,
  sub,
  className,
  children,
}) => (
  <section className={cx(styles.card, className)}>
    {titulo && (
      <div className={styles.cardHead}>
        <span className={styles.cardTitle}>{titulo}</span>
        {sub && <span className={styles.cardSub}>{sub}</span>}
      </div>
    )}
    {children}
  </section>
);

export const ErrorCampo: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span role="alert" className={styles.errorMsg}>
    <LuCircleAlert /> {children}
  </span>
);

/* ---------- Modal y drawer (en portal: el panel usa container queries) ---------- */

function useEscape(onClose: () => void) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [onClose]);
}

export const Modal: React.FC<{
  label: string;
  alert?: boolean;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ label, alert, onClose, children }) => {
  useEscape(onClose);
  return createPortal(
    <div className={styles.modalLayer}>
      <div className={styles.scrim} onClick={onClose} />
      <div role={alert ? 'alertdialog' : 'dialog'} aria-modal="true" aria-label={label} className={styles.modal}>
        {children}
      </div>
    </div>,
    document.body,
  );
};

export const Drawer: React.FC<{
  titulo: string;
  onClose: () => void;
  pie: React.ReactNode;
  children: React.ReactNode;
}> = ({ titulo, onClose, pie, children }) => {
  useEscape(onClose);
  return createPortal(
    <div className={styles.drawerLayer}>
      <div className={styles.scrim} onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label={titulo} className={styles.drawer}>
        <div className={styles.drawerHead}>
          <span className={styles.modalTitle}>{titulo}</span>
          <button type="button" className={styles.iconBtnLg} aria-label="Cerrar" onClick={onClose}>
            <LuX />
          </button>
        </div>
        <div className={styles.drawerBody}>{children}</div>
        <div className={styles.drawerFoot}>{pie}</div>
      </div>
    </div>,
    document.body,
  );
};

/* ---------- Controles ---------- */

export const Switch: React.FC<{ on: boolean; label: string; peligro?: boolean; onChange: (v: boolean) => void }> = ({
  on,
  label,
  peligro,
  onChange,
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    aria-label={label}
    className={cx(styles.switch, on && styles.switchOn, on && peligro && styles.switchPeligro)}
    onClick={() => onChange(!on)}
  >
    <span />
  </button>
);

export const NumberStepper: React.FC<{
  valor: string;
  min: number;
  max: number;
  label: string;
  error?: boolean;
  onChange: (v: string) => void;
}> = ({ valor, min, max, label, error, onChange }) => {
  const fijar = (n: number) => onChange(String(Math.max(min, Math.min(max, n))));
  const n = parseInt(valor, 10) || 0;
  return (
    <div data-component="NumberStepper" className={styles.stepperWrap}>
      <div className={cx(styles.stepper, error && styles.stepperError)}>
        <button type="button" aria-label="Restar un día" onClick={() => fijar(n - 1)}>
          <LuMinus />
        </button>
        <input
          aria-label={label}
          inputMode="numeric"
          value={valor}
          aria-invalid={error}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 3))}
        />
        <button type="button" aria-label="Sumar un día" onClick={() => fijar(n + 1)}>
          <LuPlus />
        </button>
      </div>
      <span className={styles.stepperUnidad}>días</span>
    </div>
  );
};

export const RadioCard: React.FC<{
  label: string;
  desc: string;
  sel: boolean;
  deshabilitado?: boolean;
  etiqueta?: { texto: string; aviso?: boolean };
  candado?: boolean;
  compacto?: boolean;
  onPick: () => void;
}> = ({ label, desc, sel, deshabilitado, etiqueta, candado, compacto, onPick }) => (
  <button
    type="button"
    data-component="RadioCard"
    role="radio"
    aria-checked={sel}
    disabled={deshabilitado}
    onClick={onPick}
    className={cx(styles.radioCard, sel && styles.radioSel, compacto && styles.radioCompacto, deshabilitado && !sel && styles.radioApagado)}
  >
    <span className={styles.radioRing}><span /></span>
    <span className={styles.radioText}>
      <span className={styles.radioLabel}>
        {label}
        {etiqueta && <span className={cx(styles.radioTag, etiqueta.aviso && styles.radioTagAviso)}>{etiqueta.texto}</span>}
      </span>
      <span className={styles.radioDesc}>{desc}</span>
    </span>
    {candado && <LuLock aria-label="Bloqueado" className={styles.radioLock} />}
  </button>
);

/* ---------- Campo editable en línea ---------- */

export interface CampoDef {
  k: string;
  label: string;
  tipo?: 'text' | 'email' | 'tel';
  opcional?: boolean;
  placeholder?: string;
  hint?: string;
  soloLectura?: boolean;
  /** Pide la contraseña actual para guardar un valor distinto */
  pideContrasena?: boolean;
  validar?: (v: string) => string;
}

export const InlineEditField: React.FC<{
  def: CampoDef;
  valor: string | null;
  editando: boolean;
  otroEditando: boolean;
  extraLectura?: React.ReactNode;
  onEditar: () => void;
  onCancelar: () => void;
  onCambio: (sucio: boolean) => void;
  onGuardar: (valor: string, contrasena: string) => Promise<void>;
}> = ({ def, valor, editando, otroEditando, extraLectura, onEditar, onCancelar, onCambio, onGuardar }) => {
  const [draft, setDraft] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [perr, setPerr] = useState('');
  const [guardando, setGuardando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editando) {
      setDraft(valor ?? '');
      setPass('');
      setErr('');
      setPerr('');
      setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 30);
    }
  }, [editando]); // eslint-disable-line react-hooks/exhaustive-deps

  const cambiado = draft.trim() !== (valor ?? '');
  const pidePass = !!def.pideContrasena && cambiado;

  const guardar = async () => {
    const v = draft.trim();
    let e = '';
    if (!v && !def.opcional) e = 'Este campo es obligatorio.';
    else if (v && def.validar) e = def.validar(v);
    const pe = pidePass && !pass ? 'Ingresa tu contraseña actual para cambiar el correo.' : '';
    setErr(e);
    setPerr(pe);
    if (e || pe) return;
    if (!cambiado) return onCancelar();
    setGuardando(true);
    try {
      await onGuardar(v, pass);
    } catch (ex) {
      const m = ex instanceof Error ? ex.message : String(ex);
      if (/contraseña/i.test(m)) setPerr(m);
      else setErr(m);
    } finally {
      setGuardando(false);
    }
  };

  if (!editando) {
    return (
      <div data-component="InlineEditField" className={styles.fila}>
        <div className={styles.filaLectura}>
          <div className={styles.fieldGrid}>
            <span className={styles.fieldLabel}>{def.label}</span>
            <span className={cx(styles.fieldValor, !valor && styles.fieldVacio)}>
              {valor || 'Sin especificar'}
              {extraLectura}
            </span>
          </div>
          {def.soloLectura ? (
            <span className={styles.noEditable} title="Validado con SUNAT. No se puede editar.">
              <LuLock /> <span className={styles.soloAncho}>No editable</span>
            </span>
          ) : (
            <button
              type="button"
              className={styles.btnEditar}
              disabled={otroEditando}
              aria-label={`Editar ${def.label.toLowerCase()}`}
              onClick={onEditar}
            >
              <LuPencil /> Editar
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div data-component="InlineEditField" className={cx(styles.fila, styles.filaEdicion)}>
      <label className={styles.campo}>
        <span className={styles.campoLabel}>
          {def.label}
          {def.opcional && <span className={styles.opcional}> (opcional)</span>}
        </span>
        <input
          ref={inputRef}
          className={cx(styles.input, err && styles.inputError)}
          type={def.tipo ?? 'text'}
          value={draft}
          placeholder={def.placeholder}
          aria-invalid={!!err}
          onChange={(e) => {
            setDraft(e.target.value);
            setErr('');
            onCambio(e.target.value.trim() !== (valor ?? ''));
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void guardar();
            if (e.key === 'Escape') onCancelar();
          }}
        />
        {err ? <ErrorCampo>{err}</ErrorCampo> : def.hint && <span className={styles.hint}>{def.hint}</span>}
      </label>
      {pidePass && (
        <label className={cx(styles.campo, styles.cajaPass)}>
          <span className={styles.campoLabelIcono}>
            <LuShieldCheck /> Contraseña actual
          </span>
          <span className={styles.hintFuerte}>
            Para cambiar el correo con el que inicias sesión, confirma tu contraseña.
          </span>
          <input
            className={cx(styles.input, perr && styles.inputError)}
            type="password"
            autoComplete="current-password"
            value={pass}
            onChange={(e) => {
              setPass(e.target.value);
              setPerr('');
            }}
            onKeyDown={(e) => e.key === 'Enter' && void guardar()}
          />
          {perr && <ErrorCampo>{perr}</ErrorCampo>}
        </label>
      )}
      <div className={styles.btnRow}>
        <button type="button" className={styles.btnPrimary} disabled={guardando} onClick={() => void guardar()}>
          <LuCircleCheck /> {guardando ? 'Guardando…' : 'Guardar'}
        </button>
        <button type="button" className={styles.btnSecondary} onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </div>
  );
};

