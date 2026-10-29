import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LuArrowLeft, LuCircleAlert, LuCircleCheck, LuPlus, LuTrash2 } from 'react-icons/lu';
import { ToastProvider } from '@/domains/settings/pages/Configuracion/ui';
import { cx, useToast } from '@/domains/settings/pages/Configuracion/util';
import { MAIN_ROUTES, TRANSACTIONS_ROUTES } from '@/router';
import {
  erroresDe,
  useCrearAsientoContableMutation,
  useEditarAsientoContableMutation,
  useGetAsientoContableQuery,
} from './asientosApi';
import { CuentaSelector, type CuentaElegida } from './CuentaSelector';
import { importe } from './formato';
import styles from './Asientos.module.scss';

interface Linea {
  clave: number;
  cuenta: CuentaElegida | null;
  glosa: string;
  debe: string;
  haber: string;
}

const RUTA = `${MAIN_ROUTES.TRANSACTIONS}${TRANSACTIONS_ROUTES.MANUAL_JOURNAL_ENTRY}`;
const centimos = (s: string) => Math.round((parseFloat(s.replace(',', '.')) || 0) * 100);
const hoy = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Solo dígitos y un separador decimal con hasta 2 decimales */
const limpiarImporte = (v: string) => {
  const s = v.replace(',', '.').replace(/[^\d.]/g, '');
  const [ent, ...dec] = s.split('.');
  return dec.length ? `${ent}.${dec.join('').slice(0, 2)}` : ent;
};

export const AsientoFormPage: React.FC = () => (
  <ToastProvider>
    <AsientoForm />
  </ToastProvider>
);

const AsientoForm: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const idNum = id ? Number(id) : null;
  const navigate = useNavigate();
  const toast = useToast();
  const existente = useGetAsientoContableQuery(idNum ?? 0, { skip: !idNum });
  const [crear, { isLoading: creando }] = useCrearAsientoContableMutation();
  const [editar, { isLoading: editando }] = useEditarAsientoContableMutation();

  const clave = useRef(2);
  const nueva = (): Linea => ({ clave: clave.current++, cuenta: null, glosa: '', debe: '', haber: '' });
  const [fecha, setFecha] = useState(hoy());
  const [glosa, setGlosa] = useState('');
  const [referencia, setReferencia] = useState('');
  const [lineas, setLineas] = useState<Linea[]>(() => [
    { clave: 0, cuenta: null, glosa: '', debe: '', haber: '' },
    { clave: 1, cuenta: null, glosa: '', debe: '', haber: '' },
  ]);
  const [intentado, setIntentado] = useState(false);
  const [errores, setErrores] = useState<string[]>([]);

  // Al editar, carga el asiento una sola vez
  const cargado = useRef(false);
  useEffect(() => {
    const a = existente.data;
    if (!a || cargado.current) return;
    cargado.current = true;
    setFecha(a.fecha);
    setGlosa(a.glosa);
    setReferencia(a.referencia ?? '');
    setLineas(
      (a.lineas ?? []).map((l) => ({
        clave: clave.current++,
        cuenta: { codigo: l.codigoCuenta, nombre: l.nombreCuenta },
        glosa: l.glosa ?? '',
        debe: l.debe ? l.debe.toFixed(2) : '',
        haber: l.haber ? l.haber.toFixed(2) : '',
      })),
    );
  }, [existente.data]);

  const totales = useMemo(() => {
    const debe = lineas.reduce((s, l) => s + centimos(l.debe), 0);
    const haber = lineas.reduce((s, l) => s + centimos(l.haber), 0);
    return { debe, haber, diferencia: debe - haber };
  }, [lineas]);

  const errLinea = (l: Linea) => {
    if (!l.cuenta) return 'Elige la cuenta';
    const d = centimos(l.debe);
    const h = centimos(l.haber);
    if ((d > 0) === (h > 0)) return 'Importe en el Debe o en el Haber';
    return '';
  };
  const lineasConError = lineas.map(errLinea);
  const eGlosa = glosa.trim().length < 3 ? 'Escribe la glosa (al menos 3 caracteres).' : '';
  const cuadra = totales.diferencia === 0 && totales.debe > 0;
  const valido = !eGlosa && !!fecha && lineas.length >= 2 && lineasConError.every((e) => !e) && cuadra;

  const cambiar = (clave: number, cambio: Partial<Linea>) =>
    setLineas((ls) => ls.map((l) => (l.clave === clave ? { ...l, ...cambio } : l)));

  const guardar = async () => {
    setIntentado(true);
    setErrores([]);
    if (!valido) return;
    const datos = {
      fecha,
      glosa: glosa.trim(),
      referencia: referencia.trim() || undefined,
      lineas: lineas.map((l) => ({
        codigoCuenta: l.cuenta!.codigo,
        glosa: l.glosa.trim() || undefined,
        debe: centimos(l.debe) / 100,
        haber: centimos(l.haber) / 100,
      })),
    };
    try {
      const a = idNum ? await editar({ id: idNum, datos }).unwrap() : await crear(datos).unwrap();
      toast(idNum ? `Asiento N° ${a.numero} actualizado` : `Asiento N° ${a.numero} registrado`);
      navigate(`${RUTA}?ver=${a.id}`);
    } catch (e) {
      setErrores(erroresDe(e));
    }
  };

  if (idNum && existente.isLoading) {
    return <div className={styles.pagina}><div className={cx(styles.card, styles.skel)} style={{ height: 320 }} /></div>;
  }
  if (idNum && existente.data && !existente.data.editable) {
    return (
      <div className={styles.pagina}>
        <div className={cx(styles.card, styles.vacio)}>
          <span className={styles.estadoTitulo}>Este asiento no se puede editar</span>
          <span className={styles.estadoTexto}>
            Solo se editan los asientos manuales registrados en un periodo abierto.
          </span>
          <button type="button" className={styles.btnSecondary} onClick={() => navigate(RUTA)}>
            Volver a los asientos
          </button>
        </div>
      </div>
    );
  }

  const guardando = creando || editando;
  const dif = totales.diferencia;

  return (
    <div className={styles.pagina}>
      <div className={styles.header}>
        <div className={styles.headerTexto}>
          <button type="button" className={styles.volver} onClick={() => navigate(RUTA)}>
            <LuArrowLeft /> Asientos contables
          </button>
          <h1 className={styles.titulo}>
            {idNum ? `Editar asiento N° ${existente.data?.numero ?? ''}` : 'Nuevo asiento'}
          </h1>
          <span className={styles.subtitulo}>
            Registra operaciones sin comprobante de compra o venta: planilla, caja y bancos, depreciación, ajustes…
          </span>
        </div>
      </div>

      <section className={cx(styles.card, styles.datos)}>
        <label className={styles.campo}>
          <span>Fecha</span>
          <input type="date" className={styles.input} value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </label>
        <label className={styles.campo}>
          <span>
            Referencia <span className={styles.opcional}>(opcional)</span>
          </span>
          <input
            className={styles.input}
            value={referencia}
            maxLength={60}
            placeholder="p. ej. PLAME 10/2026, Voucher 123"
            onChange={(e) => setReferencia(e.target.value)}
          />
        </label>
        <label className={cx(styles.campo, styles.campoAncho)}>
          <span>Glosa</span>
          <input
            className={cx(styles.input, intentado && eGlosa && styles.inputError)}
            value={glosa}
            maxLength={250}
            placeholder="p. ej. Planilla de remuneraciones de octubre"
            onChange={(e) => setGlosa(e.target.value)}
          />
          {intentado && eGlosa && <span className={styles.errorMsg}>{eGlosa}</span>}
        </label>
      </section>

      <section className={cx(styles.card, styles.cardLineas)}>
        <div className={styles.lineasHead}>
          <span className={styles.cardTitle}>Líneas del asiento</span>
          <span className={styles.cardSub}>Solo cuentas de movimiento. Cada línea va al Debe o al Haber.</span>
        </div>

        <div className={styles.tablaLineas}>
          <div className={cx(styles.filaLinea, styles.filaLineaHead)}>
            <span>#</span>
            <span>Cuenta</span>
            <span>Glosa de la línea</span>
            <span className={styles.der}>Debe</span>
            <span className={styles.der}>Haber</span>
            <span />
          </div>
          {lineas.map((l, i) => {
            const err = intentado ? lineasConError[i] : '';
            return (
              <div key={l.clave} className={cx(styles.filaLinea, err && styles.filaLineaError)}>
                <span className={styles.numLinea}>{i + 1}</span>
                <div className={styles.celdaCuenta}>
                  <CuentaSelector
                    valor={l.cuenta}
                    error={intentado && !l.cuenta}
                    onChange={(c) => cambiar(l.clave, { cuenta: c })}
                  />
                  {err && (
                    <span className={styles.errorMsg}>
                      <LuCircleAlert /> {err}
                    </span>
                  )}
                </div>
                <input
                  className={styles.input}
                  value={l.glosa}
                  maxLength={250}
                  placeholder={glosa || 'Opcional'}
                  aria-label={`Glosa de la línea ${i + 1}`}
                  onChange={(e) => cambiar(l.clave, { glosa: e.target.value })}
                />
                <label className={styles.importe}>
                  <span className={styles.soloMovil}>Debe</span>
                  <input
                    className={cx(styles.input, styles.inputImporte)}
                    inputMode="decimal"
                    value={l.debe}
                    placeholder="0.00"
                    aria-label={`Debe de la línea ${i + 1}`}
                    onChange={(e) => {
                      const v = limpiarImporte(e.target.value);
                      cambiar(l.clave, { debe: v, haber: v ? '' : l.haber });
                    }}
                  />
                </label>
                <label className={styles.importe}>
                  <span className={styles.soloMovil}>Haber</span>
                  <input
                    className={cx(styles.input, styles.inputImporte)}
                    inputMode="decimal"
                    value={l.haber}
                    placeholder="0.00"
                    aria-label={`Haber de la línea ${i + 1}`}
                    onChange={(e) => {
                      const v = limpiarImporte(e.target.value);
                      cambiar(l.clave, { haber: v, debe: v ? '' : l.debe });
                    }}
                  />
                </label>
                <button
                  type="button"
                  className={styles.btnIcono}
                  aria-label={`Quitar la línea ${i + 1}`}
                  disabled={lineas.length <= 2}
                  onClick={() => setLineas((ls) => ls.filter((x) => x.clave !== l.clave))}
                >
                  <LuTrash2 />
                </button>
              </div>
            );
          })}
        </div>

        <div className={styles.lineasPie}>
          <button
            type="button"
            className={styles.btnLink}
            onClick={() => {
              // Propone el importe que falta para cuadrar en el lado contrario
              const l = nueva();
              if (dif > 0) l.haber = (dif / 100).toFixed(2);
              if (dif < 0) l.debe = (-dif / 100).toFixed(2);
              setLineas((ls) => [...ls, l]);
            }}
          >
            <LuPlus /> Agregar línea
          </button>
          <div className={styles.totales}>
            <div>
              <span>Total Debe</span>
              <b>{importe(totales.debe / 100)}</b>
            </div>
            <div>
              <span>Total Haber</span>
              <b>{importe(totales.haber / 100)}</b>
            </div>
            <div className={cx(styles.cuadre, cuadra ? styles.cuadreOk : styles.cuadreMal)}>
              {cuadra ? <LuCircleCheck /> : <LuCircleAlert />}
              {cuadra
                ? 'Cuadrado'
                : totales.debe === 0 && totales.haber === 0
                  ? 'Sin importes'
                  : `Diferencia ${importe(Math.abs(dif) / 100)}`}
            </div>
          </div>
        </div>
      </section>

      {errores.length > 0 && (
        <div role="alert" className={styles.alertaError}>
          <LuCircleAlert />
          <ul>
            {errores.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.barraGuardar}>
        <span className={styles.barraTexto}>
          {intentado && !valido
            ? 'Revisa los campos marcados: el asiento debe cuadrar y cada línea necesita cuenta e importe.'
            : `${lineas.length} líneas`}
        </span>
        <div className={styles.botonesFin}>
          <button type="button" className={styles.btnPrimary} disabled={guardando} onClick={() => void guardar()}>
            {guardando ? 'Guardando…' : idNum ? 'Guardar cambios' : 'Registrar asiento'}
          </button>
          <button type="button" className={styles.btnSecondary} onClick={() => navigate(RUTA)}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
