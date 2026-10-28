import React, { useState } from 'react';
import { LuCircleAlert, LuCircleCheck, LuRefreshCw, LuRotateCcw } from 'react-icons/lu';
import { Drawer, ErrorCampo, Modal } from '@/domains/settings/pages/Configuracion/ui';
import { cx, useToast } from '@/domains/settings/pages/Configuracion/util';
import {
  erroresDe,
  useGenerarAsientosAutomaticosMutation,
  useGetCuentasAutomaticasQuery,
  useGuardarCuentasAutomaticasMutation,
  type ResultadoGeneracion,
} from './asientosApi';
import { CuentaSelector } from './CuentaSelector';
import styles from './Asientos.module.scss';

/** Cuentas que usan los asientos automáticos de compras y ventas */
export const CuentasAutomaticas: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const toast = useToast();
  const q = useGetCuentasAutomaticasQuery();
  const [guardar, { isLoading }] = useGuardarCuentasAutomaticasMutation();
  const [cambios, setCambios] = useState<Record<string, { codigo: string; nombre: string }>>({});
  const [errores, setErrores] = useState<string[]>([]);

  const confirmar = async () => {
    setErrores([]);
    try {
      await guardar(Object.fromEntries(Object.entries(cambios).map(([k, v]) => [k, v.codigo]))).unwrap();
      toast('Cuentas guardadas. Regenera los asientos para aplicarlas a lo ya registrado.');
      setCambios({});
    } catch (e) {
      setErrores(erroresDe(e));
    }
  };

  return (
    <Drawer
      titulo="Cuentas de los asientos automáticos"
      onClose={onClose}
      pie={
        <div className={styles.botonesFin}>
          <button
            type="button"
            className={styles.btnPrimary}
            disabled={isLoading || !Object.keys(cambios).length}
            onClick={() => void confirmar()}
          >
            {isLoading ? 'Guardando…' : 'Guardar cambios'}
          </button>
          <button type="button" className={styles.btnSecondary} onClick={onClose}>
            Cerrar
          </button>
        </div>
      }
    >
      <p className={styles.hint}>
        Cada compra y venta genera su asiento con estas cuentas. Las líneas de gasto o servicio usan la cuenta elegida al
        registrarlas, y los gastos con área van a la cuenta de destino del área.
      </p>
      <div className={styles.cuentasAuto}>
        {(q.data ?? []).map((c) => {
          const cambio = cambios[c.clave];
          const valor = cambio ?? { codigo: c.codigo, nombre: c.nombreCuenta ?? '' };
          return (
            <div key={c.clave} className={styles.cuentaAuto}>
              <span className={styles.cuentaAutoUso}>{c.uso}</span>
              <CuentaSelector
                valor={valor}
                error={!cambio && !!c.error}
                onChange={(v) => v && setCambios((x) => ({ ...x, [c.clave]: v }))}
              />
              {!cambio && c.error && <ErrorCampo>{c.error}</ErrorCampo>}
              {valor.codigo !== c.porDefecto && (
                <button
                  type="button"
                  className={styles.btnLink}
                  onClick={() => setCambios((x) => ({ ...x, [c.clave]: { codigo: c.porDefecto, nombre: '' } }))}
                >
                  <LuRotateCcw /> Volver a {c.porDefecto}
                </button>
              )}
            </div>
          );
        })}
      </div>
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
    </Drawer>
  );
};

const hoy = new Date();
const dosDigitos = (n: number) => String(n).padStart(2, '0');
const inicioMes = `${hoy.getFullYear()}-${dosDigitos(hoy.getMonth() + 1)}-01`;
const finMes = (() => {
  const f = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
  return `${f.getFullYear()}-${dosDigitos(f.getMonth() + 1)}-${dosDigitos(f.getDate())}`;
})();

/** Genera o actualiza los asientos de las compras y ventas de un rango */
export const GenerarAsientos: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [generar, { isLoading }] = useGenerarAsientosAutomaticosMutation();
  const [desde, setDesde] = useState(inicioMes);
  const [hasta, setHasta] = useState(finMes);
  const [resultado, setResultado] = useState<ResultadoGeneracion | null>(null);
  const [err, setErr] = useState('');

  const confirmar = async () => {
    setErr('');
    if (!desde || !hasta || desde > hasta) return setErr('Revisa las fechas.');
    try {
      setResultado(await generar({ desde, hasta }).unwrap());
    } catch (e) {
      setErr(erroresDe(e)[0]);
    }
  };

  return (
    <Modal label="Generar asientos de compras y ventas" onClose={onClose}>
      <div className={styles.modalTexto}>
        <span>Generar asientos de compras y ventas</span>
        <span>
          Crea el asiento de las que no lo tienen y actualiza los demás (conservan su número). Úsalo tras cambiar las
          cuentas o si cambió el costo de las ventas por una compra registrada con fecha anterior.
        </span>
      </div>
      <div className={styles.rangoFechas}>
        <label className={styles.campo}>
          <span>Desde</span>
          <input type="date" className={styles.input} value={desde} onChange={(e) => setDesde(e.target.value)} />
        </label>
        <label className={styles.campo}>
          <span>Hasta</span>
          <input type="date" className={styles.input} value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </label>
      </div>
      {err && <ErrorCampo>{err}</ErrorCampo>}
      {resultado && (
        <div className={cx(styles.resultadoGen, resultado.errores.length ? styles.tonoError : styles.tonoSuccess)}>
          {resultado.errores.length ? <LuCircleAlert /> : <LuCircleCheck />}
          <div>
            <b>
              {resultado.generados} nuevos · {resultado.actualizados} actualizados
              {resultado.errores.length > 0 && ` · ${resultado.errores.length} con error`}
            </b>
            {resultado.errores.length > 0 && (
              <ul>
                {resultado.errores.slice(0, 8).map((e) => (
                  <li key={e.idComprobante}>
                    {e.comprobante}: {e.error}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
      <div className={styles.botonesFin}>
        <button type="button" className={styles.btnPrimary} disabled={isLoading} onClick={() => void confirmar()}>
          <LuRefreshCw /> {isLoading ? 'Generando…' : 'Generar'}
        </button>
        <button type="button" className={styles.btnSecondary} onClick={onClose}>
          Cerrar
        </button>
      </div>
    </Modal>
  );
};
