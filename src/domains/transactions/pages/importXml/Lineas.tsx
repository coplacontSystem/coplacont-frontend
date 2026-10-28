import React from 'react';
import { LuCircleAlert, LuCircleCheck, LuInfo, LuPlus, LuTrash2, LuX } from 'react-icons/lu';
import { cx } from '@/domains/settings/pages/Configuracion/util';
import { importe } from '../manualJournalEntries/formato';
import {
  AFECTACION,
  cuadreManual,
  destinoVacio,
  nuevaClave,
  faltaLinea,
  numero,
  ORIGEN,
  pendiente,
  unidadDestino,
  type Decision,
  type LineaEscrita,
} from './decision';
import type { LineaPrevia } from './importacionApi';
import { SelectorDestino, type Catalogos } from './SelectorDestino';
import base from '../manualJournalEntries/Asientos.module.scss';
import styles from './ImportarXml.module.scss';

/** Línea que trae el XML: solo se decide a dónde va */
export const FilaXml: React.FC<{
  linea: LineaPrevia;
  moneda: string;
  decision: Decision | undefined;
  marcar: boolean;
  catalogos: Catalogos;
  onChange: (c: Partial<Decision>) => void;
}> = ({ linea: l, moneda, decision: d, marcar, catalogos, onChange }) => {
  if (!d) return null;
  const falta = marcar ? pendiente(d) : '';
  const simbolo = moneda === 'USD' ? 'US$' : 'S/';

  return (
    <div className={cx(styles.linea, falta && styles.lineaPendiente)}>
      <div className={styles.lineaXml}>
        <b>{l.descripcion}</b>
        <span>
          {l.cantidad} {l.unidad}
          {l.codigoVendedor && ` · cód. ${l.codigoVendedor}`} · {simbolo} {importe(l.subtotal + l.igv + l.isc)}
          {l.gratuita && ' · gratuita'}
        </span>
      </div>

      <div className={styles.lineaDecision}>
        <SelectorDestino
          destino={d}
          marcarFalta={!!falta}
          catalogos={catalogos}
          onChange={(c) => onChange({ ...c, confirmada: true, origen: 'idProducto' in c || 'cuenta' in c ? null : d.origen })}
          extra={
            <label className={styles.factor} title="Unidades tuyas por cada unidad del XML">
              <span>1 {l.unidad} =</span>
              <input
                className={cx(base.input, base.inputImporte, styles.mini)}
                inputMode="decimal"
                value={d.factor}
                aria-label="Factor de conversión"
                onChange={(e) => onChange({ factor: numero(e.target.value) })}
              />
              <span>{unidadDestino(d, catalogos.productos)}</span>
            </label>
          }
        />

        <div className={styles.estadoLinea}>
          {d.origen && (
            <span className={cx(styles.origen, d.confirmada ? styles.origenOk : styles.origenRevisar)}>
              {d.confirmada ? <LuCircleCheck /> : <LuInfo />}{' '}
              {d.confirmada && d.origen === 'nombre' ? 'Elegido por nombre parecido' : (ORIGEN[d.origen] ?? d.origen)}
            </span>
          )}
          {!d.confirmada && (
            <>
              <button type="button" className={base.btnLink} onClick={() => onChange({ confirmada: true })}>
                <LuCircleCheck /> Confirmar
              </button>
              <button
                type="button"
                className={base.btnLink}
                onClick={() => onChange({ idProducto: null, origen: null, confirmada: true })}
              >
                <LuX /> No es este
              </button>
            </>
          )}
          {falta && d.confirmada && (
            <span className={base.errorMsg}>
              <LuCircleAlert /> {falta}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

/** Detalle escrito a mano para un comprobante del TXT */
export const DetalleManual: React.FC<{
  lineas: LineaEscrita[];
  totales: { gravada: number; exonerada: number; inafecta: number; igv: number };
  moneda: string;
  marcar: boolean;
  catalogos: Catalogos;
  onChange: (lineas: LineaEscrita[]) => void;
}> = ({ lineas, totales, moneda, marcar, catalogos, onChange }) => {
  const cambiar = (clave: number, c: Partial<LineaEscrita>) =>
    onChange(lineas.map((l) => (l.clave === clave ? { ...l, ...c } : l)));
  const cuadre = cuadreManual(lineas, totales);
  const simbolo = moneda === 'USD' ? 'US$' : 'S/';

  return (
    <div className={styles.manual}>
      {lineas.map((l, i) => {
        const falta = marcar ? faltaLinea(l) : '';
        return (
          <div key={l.clave} className={cx(styles.linea, styles.lineaManual, falta && styles.lineaPendiente)}>
            <div className={styles.manualMontos}>
              <span className={styles.numLinea}>{i + 1}</span>
              <label className={styles.montoCampo}>
                <span>Cantidad</span>
                <input
                  className={cx(base.input, base.inputImporte)}
                  inputMode="decimal"
                  value={l.cantidad}
                  onChange={(e) => cambiar(l.clave, { cantidad: numero(e.target.value) })}
                />
              </label>
              <label className={styles.montoCampo}>
                <span>Importe sin IGV</span>
                <input
                  className={cx(base.input, base.inputImporte)}
                  inputMode="decimal"
                  value={l.valor}
                  onChange={(e) => cambiar(l.clave, { valor: numero(e.target.value) })}
                />
              </label>
              <label className={styles.montoCampo}>
                <span>IGV</span>
                <select
                  className={base.input}
                  value={l.afectacion}
                  onChange={(e) => cambiar(l.clave, { afectacion: e.target.value as LineaEscrita['afectacion'] })}
                >
                  {Object.entries(AFECTACION).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className={base.btnIcono}
                aria-label={`Quitar la línea ${i + 1}`}
                disabled={lineas.length <= 1}
                onClick={() => onChange(lineas.filter((x) => x.clave !== l.clave))}
              >
                <LuTrash2 />
              </button>
            </div>
            <div className={styles.lineaDecision}>
              <SelectorDestino
                destino={l}
                marcarFalta={!!falta}
                catalogos={catalogos}
                onChange={(c) => cambiar(l.clave, c)}
              />
              {falta && (
                <span className={base.errorMsg}>
                  <LuCircleAlert /> {falta}
                </span>
              )}
            </div>
          </div>
        );
      })}

      <div className={styles.manualPie}>
        <button
          type="button"
          className={base.btnLink}
          onClick={() => {
            // Propone lo que falta para cuadrar la base gravada
            const g = cuadre.find((c) => c.afectacion === '10');
            const resto = g ? Math.max(g.debe - g.tiene, 0) / 100 : 0;
            onChange([
              ...lineas,
              { ...destinoVacio(), clave: nuevaClave(), cantidad: '1', valor: resto ? resto.toFixed(2) : '', afectacion: '10' },
            ]);
          }}
        >
          <LuPlus /> Agregar línea
        </button>
        <div className={styles.cuadres}>
          {cuadre.map((c) => (
            <span key={c.afectacion} className={cx(styles.cuadre, c.ok ? styles.cuadreOk : styles.cuadreMal)}>
              {c.ok ? <LuCircleCheck /> : <LuCircleAlert />} {AFECTACION[c.afectacion]} {simbolo}{' '}
              {importe(c.tiene / 100)} de {importe(c.debe / 100)}
            </span>
          ))}
          <span className={styles.cuadreIgv}>
            IGV del registro {simbolo} {importe(totales.igv)}
          </span>
        </div>
      </div>
    </div>
  );
};
