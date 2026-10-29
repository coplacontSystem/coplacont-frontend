import React, { useState } from 'react';
import { LuCircleAlert, LuCircleCheck, LuTriangleAlert } from 'react-icons/lu';
import { Drawer } from '@/domains/settings/pages/Configuracion/ui';
import { cx, useToast } from '@/domains/settings/pages/Configuracion/util';
import { useGetPeriodosQuery } from '@/domains/settings/pages/Configuracion/configuracionApi';
import { erroresDe } from '@/domains/transactions/pages/manualJournalEntries/asientosApi';
import base from '@/domains/transactions/pages/manualJournalEntries/Asientos.module.scss';
import {
  useCambiarPlanContableMutation,
  useGetPlanesContablesQuery,
  usePrevisualizarCambioPlanMutation,
  type InformeCambioPlan,
  type Plan,
} from './planContableApi';
import styles from './CambiarPlan.module.scss';

/**
 * Cambio de plan de cuentas desde un período: primero se revisa qué pasará
 * (cuentas que se trasladan, subcuentas, áreas y lo que lo impide) y luego se
 * confirma. Los períodos anteriores conservan su plan.
 */
export const CambiarPlanDrawer: React.FC<{ actual: Plan; onClose: () => void }> = ({ actual, onClose }) => {
  const toast = useToast();
  const planes = useGetPlanesContablesQuery();
  const periodos = useGetPeriodosQuery();
  const [previsualizar, { isLoading: revisando }] = usePrevisualizarCambioPlanMutation();
  const [cambiar, { isLoading: cambiando }] = useCambiarPlanContableMutation();
  const otros = (planes.data ?? []).filter((p) => p.id !== actual.id);
  const [idPlan, setIdPlan] = useState<number | null>(null);
  const [idPeriodo, setIdPeriodo] = useState<number | null>(null);
  const [reasignar, setReasignar] = useState<Record<string, string>>({});
  const [informe, setInforme] = useState<InformeCambioPlan | null>(null);
  const [errores, setErrores] = useState<string[]>([]);
  const [confirmado, setConfirmado] = useState(false);

  const plan = idPlan ?? otros[0]?.id ?? null;
  const listaPeriodos = [...(periodos.data ?? [])].sort((a, b) => a.año - b.año);
  const periodo = idPeriodo ?? listaPeriodos[listaPeriodos.length - 1]?.id ?? null;
  const cuerpo = () => ({
    idPlan: plan!,
    idPeriodoDesde: periodo ?? undefined,
    reasignar: Object.fromEntries(Object.entries(reasignar).filter(([, v]) => v.trim())),
  });

  const revisar = async () => {
    setErrores([]);
    setConfirmado(false);
    try {
      setInforme(await previsualizar(cuerpo()).unwrap());
    } catch (e) {
      setInforme(null);
      setErrores(erroresDe(e));
    }
  };

  const confirmar = async () => {
    setErrores([]);
    try {
      const r = await cambiar(cuerpo()).unwrap();
      toast(`La empresa ahora usa ${r.plan.nombre}`);
      onClose();
    } catch (e) {
      setErrores(erroresDe(e));
    }
  };

  const conProblema = informe?.cuentasUsadas.filter((c) => c.problema) ?? [];
  const listo = informe && informe.errores.length === 0;

  return (
    <Drawer
      titulo="Cambiar de plan de cuentas"
      onClose={onClose}
      pie={
        <div className={base.botonesFin}>
          {listo ? (
            <button
              type="button"
              className={base.btnPrimary}
              disabled={!confirmado || cambiando}
              onClick={() => void confirmar()}
            >
              {cambiando ? 'Cambiando…' : `Cambiar a ${informe.planDestino.codigo}`}
            </button>
          ) : (
            <button type="button" className={base.btnPrimary} disabled={!plan || revisando} onClick={() => void revisar()}>
              {revisando ? 'Revisando…' : 'Revisar el cambio'}
            </button>
          )}
          <button type="button" className={base.btnSecondary} onClick={onClose}>
            Cancelar
          </button>
        </div>
      }
    >
      <p className={base.hint}>
        Hoy usas <b>{actual.nombre}</b>. Los períodos anteriores al elegido conservan su plan y sus libros; desde ese
        período, cada cuenta con movimientos pasa a su equivalente en el plan nuevo.
      </p>

      <div className={styles.campos}>
        <label className={base.campo}>
          <span>Plan nuevo</span>
          <select
            className={base.input}
            value={plan ?? ''}
            onChange={(e) => {
              setIdPlan(Number(e.target.value));
              setInforme(null);
            }}
          >
            {otros.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className={base.campo}>
          <span>Desde el período</span>
          <select
            className={base.input}
            value={periodo ?? ''}
            onChange={(e) => {
              setIdPeriodo(Number(e.target.value));
              setInforme(null);
            }}
          >
            {listaPeriodos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.año}
              </option>
            ))}
          </select>
        </label>
      </div>
      {otros.find((p) => p.id === plan)?.nota && <p className={base.hint}>{otros.find((p) => p.id === plan)?.nota}</p>}

      {informe && (
        <div className={styles.informe}>
          <div className={styles.periodos}>
            {informe.periodos.map((p) => (
              <span key={p.id} className={cx(base.badge, p.pasa ? base.tonoSuccess : base.tonoNeutral)}>
                {p.año}: {p.pasa ? informe.planDestino.codigo : informe.planActual.codigo}
              </span>
            ))}
          </div>

          {informe.errores.length > 0 && (
            <div role="alert" className={base.alertaError}>
              <LuCircleAlert />
              <div>
                <b>Hay cuentas con movimientos sin destino en el plan nuevo.</b> Escribe a qué cuenta del plan nuevo va
                cada una y vuelve a revisar.
              </div>
            </div>
          )}

          {conProblema.length > 0 && (
            <section className={styles.bloque}>
              <h3>Cuentas por reasignar</h3>
              {conProblema.map((c) => (
                <div key={c.codigo} className={styles.reasignar}>
                  <div>
                    <b>
                      {c.codigo} {c.nombre}
                    </b>
                    <span>
                      {c.usos} movimientos · {c.problema}
                    </span>
                  </div>
                  <input
                    className={base.input}
                    placeholder={`Cuenta ${informe.planDestino.codigo}`}
                    inputMode="numeric"
                    value={reasignar[c.codigo] ?? ''}
                    onChange={(e) => setReasignar((r) => ({ ...r, [c.codigo]: e.target.value.replace(/\D/g, '') }))}
                    aria-label={`Cuenta nueva para ${c.codigo}`}
                  />
                </div>
              ))}
            </section>
          )}

          <section className={styles.bloque}>
            <h3>Cuentas con movimientos que se trasladan ({informe.cuentasUsadas.length})</h3>
            <ul className={styles.lista}>
              {informe.cuentasUsadas
                .filter((c) => !c.problema)
                .map((c) => (
                  <li key={c.codigo}>
                    <span className={styles.codigo}>{c.codigo}</span> {c.nombre}
                    <span className={styles.flecha}>→</span>
                    <span className={cx(styles.codigo, c.destino !== c.codigo && styles.cambia)}>{c.destino}</span>{' '}
                    {c.nombreDestino}
                  </li>
                ))}
            </ul>
          </section>

          {informe.cuentasPropias.length > 0 && (
            <section className={styles.bloque}>
              <h3>Subcuentas propias</h3>
              <ul className={styles.lista}>
                {informe.cuentasPropias.map((c) => (
                  <li key={c.codigo}>
                    <span className={styles.codigo}>{c.codigo}</span> {c.nombre}
                    <span className={styles.flecha}>→</span>
                    {c.nuevoCodigo ? <span className={styles.codigo}>{c.nuevoCodigo}</span> : <i>no pasa</i>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {informe.avisos.length > 0 && (
            <ul className={styles.avisos}>
              {informe.avisos.map((a) => (
                <li key={a}>
                  <LuTriangleAlert /> {a}
                </li>
              ))}
            </ul>
          )}

          {listo && (
            <label className={styles.confirmar}>
              <input type="checkbox" checked={confirmado} onChange={(e) => setConfirmado(e.target.checked)} />
              <span>
                <LuCircleCheck /> Revisé el traslado. Entiendo que desde {informe.periodos.find((p) => p.pasa)?.año} la
                empresa usará {informe.planDestino.nombre}.
              </span>
            </label>
          )}
        </div>
      )}

      {errores.length > 0 && (
        <div role="alert" className={base.alertaError}>
          <LuCircleAlert />
          <ul>
            {errores.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}
    </Drawer>
  );
};
