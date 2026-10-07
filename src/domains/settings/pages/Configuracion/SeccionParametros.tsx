import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LuArrowRight, LuChevronDown, LuChevronUp, LuInfo, LuLock, LuTriangleAlert } from 'react-icons/lu';
import {
  mensajeError,
  useActualizarReglasMutation,
  useCambiarMetodoMutation,
  useGetConfiguracionQuery,
  type Configuracion,
  type Metodo,
  type Reglas,
} from './configuracionApi';
import { Card, ErrorCampo, Modal, NumberStepper, RadioCard, Switch } from './ui';
import { cx, MESES, METODOS, NOMBRE_METODO, useToast } from './util';
import { CargandoSeccion, ErrorSeccion, type SeccionProps } from './comun';
import styles from './Configuracion.module.scss';

type Borrador = {
  mesInicio: string;
  diasLimiteRetroactivo: string;
  requiereAutorizacionRetroactivo: boolean;
  cierreAutomatico: boolean;
  diasParaCierreAutomatico: string;
  notificarProximoCierre: boolean;
  diasNotificacionCierre: string;
  permitirMovimientosPeriodoCerrado: boolean;
};

const NUMS = {
  diasLimiteRetroactivo: [0, 90],
  diasParaCierreAutomatico: [1, 60],
  diasNotificacionCierre: [1, 30],
} as const;
type CampoNum = keyof typeof NUMS;

const aBorrador = (c: Configuracion): Borrador => ({
  mesInicio: String(c.mesInicio),
  diasLimiteRetroactivo: String(c.diasLimiteRetroactivo),
  requiereAutorizacionRetroactivo: c.requiereAutorizacionRetroactivo,
  cierreAutomatico: c.cierreAutomatico,
  diasParaCierreAutomatico: String(c.diasParaCierreAutomatico),
  notificarProximoCierre: c.notificarProximoCierre,
  diasNotificacionCierre: String(c.diasNotificacionCierre),
  permitirMovimientosPeriodoCerrado: c.permitirMovimientosPeriodoCerrado,
});

function errores(d: Borrador): Partial<Record<CampoNum, string>> {
  const e: Partial<Record<CampoNum, string>> = {};
  const chk = (k: CampoNum, activo: boolean) => {
    if (!activo) return;
    const [lo, hi] = NUMS[k];
    const v = d[k];
    if (!/^\d+$/.test(v) || +v < lo || +v > hi) e[k] = `Ingresa un número entre ${lo} y ${hi}.`;
  };
  chk('diasLimiteRetroactivo', true);
  chk('diasParaCierreAutomatico', d.cierreAutomatico);
  chk('diasNotificacionCierre', d.notificarProximoCierre);
  return e;
}

export const SeccionParametros: React.FC<SeccionProps> = ({ onDirty, registrarGuardado, irA }) => {
  const q = useGetConfiguracionQuery();
  const toast = useToast();
  const [guardarReglas, { isLoading: guardando }] = useActualizarReglasMutation();
  const [cambiarMetodo, { isLoading: cambiando }] = useCambiarMetodoMutation();
  const [draft, setDraft] = useState<Borrador | null>(null);
  const [porQue, setPorQue] = useState(false);
  const [metodoA, setMetodoA] = useState<Metodo | null>(null);
  const [errMetodo, setErrMetodo] = useState('');
  const [errGuardar, setErrGuardar] = useState('');

  const guardado = useMemo(() => (q.data ? aBorrador(q.data) : null), [q.data]);
  useEffect(() => {
    if (guardado && !draft) setDraft(guardado);
  }, [guardado, draft]);

  const cambios = useMemo(
    () =>
      draft && guardado
        ? (Object.keys(guardado) as (keyof Borrador)[]).filter((k) => String(draft[k]) !== String(guardado[k]))
        : [],
    [draft, guardado],
  );
  const errs = draft ? errores(draft) : {};
  const hayErrores = Object.keys(errs).length > 0;

  useEffect(() => onDirty(cambios.length), [cambios.length, onDirty]);

  const guardar = async (): Promise<boolean> => {
    if (!draft || hayErrores) return false;
    setErrGuardar('');
    const body: Partial<Reglas> = {};
    for (const k of cambios) {
      const v = draft[k];
      (body as Record<string, unknown>)[k] = typeof v === 'boolean' ? v : Number(v);
    }
    try {
      const r = await guardarReglas(body).unwrap();
      setDraft(aBorrador(r));
      toast('Cambios guardados');
      return true;
    } catch (e) {
      setErrGuardar(mensajeError(e));
      return false;
    }
  };
  const guardarRef = useRef(guardar);
  guardarRef.current = guardar;
  useEffect(() => {
    registrarGuardado?.(cambios.length && !hayErrores ? () => guardarRef.current() : null);
    return () => registrarGuardado?.(null);
  }, [cambios.length, hayErrores, registrarGuardado]);

  // Avisa al salir de la página con cambios sin guardar
  useEffect(() => {
    if (!cambios.length) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [cambios.length]);

  if (q.isLoading || (q.data && !draft)) return <CargandoSeccion />;
  if (q.isError || !q.data || !draft) return <ErrorSeccion onRetry={q.refetch} />;
  const c = q.data;
  const bloqueado = c.metodoBloqueado;
  const anio = c.periodoActivo?.año;

  const set = <K extends keyof Borrador>(k: K, v: Borrador[K]) => setDraft({ ...draft, [k]: v });

  const confirmarMetodo = async () => {
    if (!metodoA) return;
    setErrMetodo('');
    try {
      await cambiarMetodo(metodoA).unwrap();
      toast(`Método cambiado a ${NOMBRE_METODO[metodoA]}`);
      setMetodoA(null);
    } catch (e) {
      setErrMetodo(mensajeError(e));
    }
  };

  const fila = (k: CampoNum, label: string) => (
    <NumberStepper
      valor={draft[k]}
      min={NUMS[k][0]}
      max={NUMS[k][1]}
      label={label}
      error={!!errs[k]}
      onChange={(v) => set(k, v)}
    />
  );

  return (
    <>
      <Card titulo="Método de valoración" sub="Define cómo se calcula el costo de lo que vendes y el valor de tu kardex.">
        {!c.periodoActivo ? (
          <div className={styles.alertNeutral}>
            <LuLock />
            <div className={styles.alertCuerpo}>
              <span>No hay un periodo activo. Elige el método al crear el próximo periodo.</span>
              <button type="button" className={styles.linkFlecha} onClick={() => irA?.('periodos')}>
                Ir a Periodos contables <LuArrowRight />
              </button>
            </div>
          </div>
        ) : bloqueado ? (
          <div className={styles.alertNeutral}>
            <LuLock />
            <div className={styles.alertCuerpo}>
              <span className={styles.textoFuerte}>
                El periodo {anio} ya tiene movimientos. Podrás elegir otro método al iniciar el próximo periodo.
              </span>
              <button type="button" className={styles.linkPorQue} aria-expanded={porQue} onClick={() => setPorQue(!porQue)}>
                ¿Por qué? {porQue ? <LuChevronUp /> : <LuChevronDown />}
              </button>
              {porQue && (
                <span className={styles.textoSuave}>
                  El método decide el costo de cada salida del kardex. Cambiarlo ahora revalorizaría el kardex ya registrado y
                  alteraría el costo de ventas y los reportes que ya emitiste.
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className={styles.alertInfo}>
            <LuInfo />
            <span>Puedes cambiarlo hasta registrar el primer movimiento del periodo {anio}.</span>
          </div>
        )}
        <div role="radiogroup" aria-label="Método de valoración" className={styles.radioGrid}>
          {METODOS.map((m) => {
            const sel = c.metodoValoracion === m.id;
            return (
              <RadioCard
                key={m.id}
                label={m.label}
                desc={m.desc}
                sel={sel}
                deshabilitado={bloqueado}
                candado={bloqueado && sel}
                etiqueta={sel ? { texto: bloqueado ? 'En uso' : 'Actual' } : undefined}
                onPick={() => !bloqueado && !sel && setMetodoA(m.id)}
              />
            );
          })}
        </div>
      </Card>

      <Card
        titulo="Reglas del periodo"
        sub={anio ? `Se aplican al periodo ${anio} y a los que crees después.` : 'Se aplican a los periodos que crees.'}
      >
        <div className={styles.filas}>
          <div className={styles.prow}>
            <div className={styles.prowTexto}>
              <span>Mes de inicio del ejercicio</span>
              <span>Fecha de inicio de los periodos que crees desde ahora.</span>
            </div>
            <span className={styles.selectWrap}>
              <select
                aria-label="Mes de inicio del ejercicio"
                className={styles.select}
                value={draft.mesInicio}
                onChange={(e) => set('mesInicio', e.target.value)}
              >
                {MESES.map((m, i) => (
                  <option key={m} value={String(i + 1)}>
                    {m}
                  </option>
                ))}
              </select>
              <LuChevronDown />
            </span>
          </div>

          <div className={styles.prow}>
            <div className={styles.prowTexto}>
              <span>Días límite para registros retroactivos</span>
              <span>Plazo para registrar un comprobante después de su fecha de emisión.</span>
              {errs.diasLimiteRetroactivo && <ErrorCampo>{errs.diasLimiteRetroactivo}</ErrorCampo>}
            </div>
            {fila('diasLimiteRetroactivo', 'Días límite para registros retroactivos')}
          </div>

          <div className={styles.prowSwitch}>
            <div className={styles.prowTexto}>
              <span>Requerir autorización para retroactivos</span>
              <span>Un administrador debe aprobar los registros que superen el plazo.</span>
            </div>
            <Switch
              on={draft.requiereAutorizacionRetroactivo}
              label="Requerir autorización para retroactivos"
              onChange={(v) => set('requiereAutorizacionRetroactivo', v)}
            />
          </div>

          <div className={styles.prowBloque}>
            <div className={styles.prowSwitch}>
              <div className={styles.prowTexto}>
                <span>Cierre automático</span>
                <span>Cierra el periodo solo, pasado el plazo desde su fecha de fin.</span>
              </div>
              <Switch on={draft.cierreAutomatico} label="Cierre automático" onChange={(v) => set('cierreAutomatico', v)} />
            </div>
            {draft.cierreAutomatico && (
              <div className={styles.subRow}>
                <div className={styles.prowTexto}>
                  <span>Días para el cierre automático</span>
                  <span>Después del fin del periodo.</span>
                  {errs.diasParaCierreAutomatico && <ErrorCampo>{errs.diasParaCierreAutomatico}</ErrorCampo>}
                </div>
                {fila('diasParaCierreAutomatico', 'Días para el cierre automático')}
              </div>
            )}
          </div>

          <div className={styles.prowBloque}>
            <div className={styles.prowSwitch}>
              <div className={styles.prowTexto}>
                <span>Notificar el próximo cierre</span>
                <span>Te avisamos en el panel antes de que cierre el periodo.</span>
              </div>
              <Switch
                on={draft.notificarProximoCierre}
                label="Notificar el próximo cierre"
                onChange={(v) => set('notificarProximoCierre', v)}
              />
            </div>
            {draft.notificarProximoCierre && (
              <div className={styles.subRow}>
                <div className={styles.prowTexto}>
                  <span>Anticipación del aviso</span>
                  <span>Antes de la fecha de cierre.</span>
                  {errs.diasNotificacionCierre && <ErrorCampo>{errs.diasNotificacionCierre}</ErrorCampo>}
                </div>
                {fila('diasNotificacionCierre', 'Días de anticipación')}
              </div>
            )}
          </div>

          <div className={cx(styles.prowBloque, styles.prowUltima)}>
            <div className={styles.prowSwitch}>
              <div className={styles.prowTexto}>
                <span>Permitir movimientos en periodo cerrado</span>
                <span className={styles.textoPeligro}>Modifica saldos ya cerrados y reportados. No lo recomendamos.</span>
              </div>
              <Switch
                peligro
                on={draft.permitirMovimientosPeriodoCerrado}
                label="Permitir movimientos en periodo cerrado"
                onChange={(v) => set('permitirMovimientosPeriodoCerrado', v)}
              />
            </div>
            {draft.permitirMovimientosPeriodoCerrado && (
              <div role="alert" className={styles.alertError}>
                <LuTriangleAlert />
                <span>
                  Con esta opción activa se pueden registrar compras y ventas en periodos cerrados. Eso cambia el kardex, el
                  costo de ventas y los estados financieros ya emitidos. Actívala solo para correcciones puntuales y
                  desactívala al terminar.
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {cambios.length > 0 && (
        <div data-component="StickySaveBar" role="region" aria-label="Cambios sin guardar" className={styles.saveBar}>
          <div className={styles.saveBarTexto}>
            <span>
              <span className={styles.puntoAviso} />
              {cambios.length === 1 ? '1 cambio sin guardar' : `${cambios.length} cambios sin guardar`}
            </span>
            {hayErrores && <span className={styles.saveBarError}>Corrige los campos marcados para guardar.</span>}
            {errGuardar && <span className={styles.saveBarError}>{errGuardar}</span>}
          </div>
          <div className={styles.btnRowEnd}>
            <button type="button" className={styles.btnPrimary} disabled={hayErrores || guardando} onClick={() => void guardar()}>
              {guardando ? 'Guardando…' : 'Guardar cambios'}
            </button>
            <button type="button" className={styles.btnGhost} onClick={() => guardado && setDraft(guardado)}>
              Descartar
            </button>
          </div>
        </div>
      )}

      {metodoA && (
        <Modal label="Cambiar método de valoración" onClose={() => setMetodoA(null)}>
          <span className={styles.modalTitle}>¿Cambiar el método de valoración?</span>
          <div className={styles.metodoCambio}>
            <span className={styles.metodoDe}>{NOMBRE_METODO[c.metodoValoracion]}</span>
            <LuArrowRight />
            <span className={styles.metodoPill}>{NOMBRE_METODO[metodoA]}</span>
          </div>
          <span className={styles.modalTexto}>
            Se aplicará a todas las compras y ventas del periodo {anio}. Como aún no hay movimientos, no se revaloriza nada.
          </span>
          <span className={styles.nota}>Después del primer movimiento ya no podrás cambiarlo hasta el próximo periodo.</span>
          {errMetodo && <ErrorCampo>{errMetodo}</ErrorCampo>}
          <div className={styles.btnRowEnd}>
            <button type="button" className={styles.btnPrimary} disabled={cambiando} onClick={() => void confirmarMetodo()}>
              {cambiando ? 'Cambiando…' : `Cambiar a ${NOMBRE_METODO[metodoA]}`}
            </button>
            <button type="button" className={styles.btnSecondary} onClick={() => setMetodoA(null)}>
              Cancelar
            </button>
          </div>
        </Modal>
      )}
    </>
  );
};
