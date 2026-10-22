import React, { useEffect, useMemo, useState } from 'react';
import { LuInfo } from 'react-icons/lu';
import { Drawer, ErrorCampo, Switch } from '@/domains/settings/pages/Configuracion/ui';
import { cx, useToast } from '@/domains/settings/pages/Configuracion/util';
import {
  useActualizarSubcuentaContableMutation,
  useCrearSubcuentaContableMutation,
  useGetCuentaContableQuery,
  type Cuenta,
  type Naturaleza,
} from './planContableApi';
import styles from './PlanDeCuentas.module.scss';

export type DrawerEstado = { modo: 'crear'; padre?: Cuenta } | { modo: 'editar'; cuenta: Cuenta };

const mensajeError = (e: unknown) => {
  const m = (e as { data?: { message?: string | string[] } })?.data?.message;
  return (Array.isArray(m) ? m[0] : m) || 'No se pudo guardar. Inténtalo de nuevo.';
};

export const SubcuentaDrawer: React.FC<{
  estado: DrawerEstado;
  onClose: () => void;
  onGuardada: (c: Cuenta) => void;
}> = ({ estado, onClose, onGuardada }) =>
  estado.modo === 'crear' ? (
    <Crear padreInicial={estado.padre} onClose={onClose} onGuardada={onGuardada} />
  ) : (
    <Editar cuenta={estado.cuenta} onClose={onClose} onGuardada={onGuardada} />
  );

/* ---------- Crear ---------- */

const Crear: React.FC<{
  padreInicial?: Cuenta;
  onClose: () => void;
  onGuardada: (c: Cuenta) => void;
}> = ({ padreInicial, onClose, onGuardada }) => {
  const toast = useToast();
  const [crear, { isLoading }] = useCrearSubcuentaContableMutation();
  const [codigoPadre, setCodigoPadre] = useState(padreInicial?.codigo ?? '');
  const [padreBuscado, setPadreBuscado] = useState(padreInicial?.codigo ?? '');
  const [codigo, setCodigo] = useState('');
  const [codigoTocado, setCodigoTocado] = useState(false);
  const [nombre, setNombre] = useState('');
  const [naturaleza, setNaturaleza] = useState<Naturaleza | ''>('');
  const [intentado, setIntentado] = useState(false);
  const [errServidor, setErrServidor] = useState('');

  // Busca la cuenta padre mientras se escribe (con pausa)
  useEffect(() => {
    const t = setTimeout(() => setPadreBuscado(codigoPadre), 350);
    return () => clearTimeout(t);
  }, [codigoPadre]);
  const valido = /^\d{2,9}$/.test(padreBuscado);
  const detalle = useGetCuentaContableQuery(padreBuscado, { skip: !valido });
  const padre = valido && detalle.data && !detalle.isFetching ? detalle.data : null;
  const padreNoExiste = valido && detalle.isError && !detalle.isFetching;

  // Código sugerido: siguiente número libre bajo el padre
  const sugerido = useMemo(() => {
    if (!padre) return '';
    const base = padre.cuenta.codigo;
    const sufijos = padre.hijas
      .map((h) => h.codigo.slice(base.length))
      .filter((s) => /^\d+$/.test(s))
      .map(Number);
    const n = Math.max(0, ...sufijos) + 1;
    // Un dígito mientras alcance (1–9); si ya usan dos dígitos o se pasa de 9, dos
    const dos = n > 9 || padre.hijas.some((h) => h.codigo.length - base.length === 2);
    return `${base}${String(n).padStart(dos ? 2 : 1, '0')}`;
  }, [padre]);

  useEffect(() => {
    if (!codigoTocado && sugerido) setCodigo(sugerido);
  }, [sugerido, codigoTocado]);

  const sinPadre = codigoPadre.trim() === '';
  let eCodigo = '';
  if (!/^\d{2,10}$/.test(codigo)) eCodigo = 'Solo dígitos, entre 2 y 10.';
  else if (sinPadre && !/^9\d$/.test(codigo)) eCodigo = 'Sin cuenta padre solo se crean las cuentas 90–99.';
  else if (padre) {
    const extra = codigo.length - padre.cuenta.codigo.length;
    if (!codigo.startsWith(padre.cuenta.codigo) || extra < 1 || extra > 2) {
      eCodigo = `Debe empezar con ${padre.cuenta.codigo} y agregar 1 o 2 dígitos.`;
    } else if (padre.hijas.some((h) => h.codigo === codigo)) {
      eCodigo = `La cuenta ${codigo} ya existe.`;
    }
  }
  let ePadre = '';
  if (!sinPadre && !/^\d{2,9}$/.test(codigoPadre)) ePadre = 'Código de cuenta inválido.';
  else if (padreNoExiste) ePadre = `No existe la cuenta ${padreBuscado}.`;
  else if (padre && !padre.cuenta.activa) ePadre = `La cuenta ${padre.cuenta.codigo} está desactivada.`;
  const eNombre = nombre.trim().length < 3 ? 'Escribe al menos 3 caracteres.' : '';

  const guardar = async () => {
    setIntentado(true);
    setErrServidor('');
    if (eCodigo || ePadre || eNombre || (!sinPadre && !padre)) return;
    try {
      const c = await crear({
        codigoPadre: sinPadre ? undefined : codigoPadre,
        codigo,
        nombre: nombre.trim(),
        naturaleza: naturaleza || undefined,
      }).unwrap();
      toast(`Subcuenta ${c.codigo} creada`);
      onGuardada(c);
    } catch (e) {
      setErrServidor(mensajeError(e));
    }
  };

  // Al pasar de cuenta de movimiento a agrupadora conviene avisarlo
  const vuelveAgrupadora = padre?.cuenta.imputable;

  return (
    <Drawer
      titulo="Nueva subcuenta"
      onClose={onClose}
      pie={
        <div className={styles.pieDrawer}>
          <button type="button" className={styles.btnPrimary} disabled={isLoading} onClick={() => void guardar()}>
            {isLoading ? 'Creando…' : 'Crear subcuenta'}
          </button>
          <button type="button" className={styles.btnSecondary} onClick={onClose}>
            Cancelar
          </button>
        </div>
      }
    >
      <label className={styles.campo}>
        <span>Cuenta padre</span>
        <input
          className={cx(styles.input, intentado && ePadre && styles.inputError)}
          inputMode="numeric"
          value={codigoPadre}
          placeholder="p. ej. 1041"
          onChange={(ev) => {
            setCodigoPadre(ev.target.value.replace(/\D/g, '').slice(0, 9));
            setCodigoTocado(false);
          }}
        />
        {padre ? (
          <span className={styles.padreInfo}>
            <b>{padre.cuenta.codigo}</b> {padre.cuenta.nombre}
            {padre.ruta.length > 0 && <span> · {padre.ruta.map((r) => r.codigo).join(' › ')}</span>}
          </span>
        ) : (intentado || padreNoExiste) && ePadre ? (
          <ErrorCampo>{ePadre}</ErrorCampo>
        ) : (
          <span className={styles.hint}>Déjala vacía solo para crear cuentas del elemento 9 (90–99).</span>
        )}
      </label>

      <label className={styles.campo}>
        <span>Código</span>
        <input
          className={cx(styles.input, styles.inputCodigo, intentado && eCodigo && styles.inputError)}
          inputMode="numeric"
          value={codigo}
          onChange={(ev) => {
            setCodigo(ev.target.value.replace(/\D/g, '').slice(0, 10));
            setCodigoTocado(true);
          }}
        />
        {intentado && eCodigo ? (
          <ErrorCampo>{eCodigo}</ErrorCampo>
        ) : (
          sugerido && <span className={styles.hint}>Sugerido: {sugerido} (siguiente libre)</span>
        )}
      </label>

      <label className={styles.campo}>
        <span>Nombre</span>
        <input
          className={cx(styles.input, intentado && eNombre && styles.inputError)}
          value={nombre}
          maxLength={200}
          placeholder="p. ej. BCP cuenta corriente soles"
          onChange={(ev) => setNombre(ev.target.value)}
          onKeyDown={(ev) => ev.key === 'Enter' && void guardar()}
        />
        {intentado && eNombre && <ErrorCampo>{eNombre}</ErrorCampo>}
      </label>

      <label className={styles.campo}>
        <span>Naturaleza</span>
        <select className={styles.input} value={naturaleza} onChange={(ev) => setNaturaleza(ev.target.value as Naturaleza | '')}>
          <option value="">{padre ? `Igual que la cuenta padre (${padre.cuenta.naturaleza})` : 'Deudora (por defecto)'}</option>
          <option value="deudora">Deudora</option>
          <option value="acreedora">Acreedora</option>
          <option value="mixta">Mixta</option>
        </select>
      </label>

      {vuelveAgrupadora && (
        <div className={styles.aviso}>
          <LuInfo />
          <span>
            La cuenta {padre.cuenta.codigo} hoy recibe movimientos. Al crear esta subcuenta pasará a agrupar y los
            asientos irán a sus subcuentas. Solo afecta a tu empresa.
          </span>
        </div>
      )}
      {errServidor && <ErrorCampo>{errServidor}</ErrorCampo>}
    </Drawer>
  );
};

/* ---------- Editar ---------- */

const Editar: React.FC<{ cuenta: Cuenta; onClose: () => void; onGuardada: (c: Cuenta) => void }> = ({
  cuenta,
  onClose,
  onGuardada,
}) => {
  const toast = useToast();
  const [actualizar, { isLoading }] = useActualizarSubcuentaContableMutation();
  const [nombre, setNombre] = useState(cuenta.nombre);
  const [activa, setActiva] = useState(cuenta.activa);
  const [err, setErr] = useState('');
  const eNombre = nombre.trim().length < 3 ? 'Escribe al menos 3 caracteres.' : '';

  const guardar = async () => {
    setErr('');
    if (eNombre) return;
    try {
      const c = await actualizar({
        id: cuenta.id,
        nombre: nombre.trim() !== cuenta.nombre ? nombre.trim() : undefined,
        activa: activa !== cuenta.activa ? activa : undefined,
      }).unwrap();
      toast(`Subcuenta ${c.codigo} actualizada`);
      onGuardada(c);
    } catch (e) {
      setErr(mensajeError(e));
    }
  };

  return (
    <Drawer
      titulo={`Subcuenta ${cuenta.codigo}`}
      onClose={onClose}
      pie={
        <div className={styles.pieDrawer}>
          <button type="button" className={styles.btnPrimary} disabled={isLoading} onClick={() => void guardar()}>
            {isLoading ? 'Guardando…' : 'Guardar cambios'}
          </button>
          <button type="button" className={styles.btnSecondary} onClick={onClose}>
            Cancelar
          </button>
        </div>
      }
    >
      <div className={styles.datoFijo}>
        <span>Código</span>
        <b>{cuenta.codigo}</b>
        <span className={styles.hint}>El código no se cambia: identifica la cuenta en los libros.</span>
      </div>
      <label className={styles.campo}>
        <span>Nombre</span>
        <input className={cx(styles.input, eNombre && styles.inputError)} value={nombre} maxLength={200} onChange={(ev) => setNombre(ev.target.value)} />
        {eNombre && <ErrorCampo>{eNombre}</ErrorCampo>}
      </label>
      <div className={styles.filaSwitch}>
        <div>
          <span>Activa</span>
          <span className={styles.hint}>Una subcuenta inactiva no recibe nuevos movimientos.</span>
        </div>
        <Switch on={activa} label="Subcuenta activa" onChange={setActiva} />
      </div>
      {err && <ErrorCampo>{err}</ErrorCampo>}
    </Drawer>
  );
};
