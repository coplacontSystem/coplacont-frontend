import React, { useState } from 'react';
import type { DashboardData } from './dashboardApi';
import { compacto, escala, MESES, nombreMes, soles } from './formato';
import styles from './Dashboard.module.scss';

interface Props {
  serie: DashboardData['serieMensual'];
}

/** Barras agrupadas de ventas y compras de 12 meses, con tooltip por mes. */
export const Grafico: React.FC<Props> = ({ serie }) => {
  const ultimo = serie.length - 1;
  const [activo, setActivo] = useState(ultimo);
  const { tope, ticks } = escala(Math.max(...serie.flatMap((m) => [m.ventas, m.compras])));
  const alto = (v: number) => `${(Math.max(v, 0) / tope) * 100}%`;

  return (
    <div className={styles.chartScroll}>
      <div className={styles.chart} onMouseLeave={() => setActivo(ultimo)}>
        <div className={styles.chartPlot}>
          <div className={styles.chartAxis}>
            {ticks.map((t) => (
              <span key={t} style={{ bottom: alto(t) }}>
                {compacto(t)}
              </span>
            ))}
          </div>
          <div className={styles.chartBars}>
            {ticks.map((t) => (
              <div key={t} className={styles.chartGrid} style={{ bottom: alto(t) }} />
            ))}
            {serie.map((m, i) => {
              const diferencia = m.ventas - m.compras;
              const lado = i < 2 ? styles.tipLeft : i > serie.length - 3 ? styles.tipRight : '';
              return (
                <div
                  key={m.mes}
                  className={`${styles.chartCol} ${i === activo ? styles.chartColActive : ''}`}
                  onMouseEnter={() => setActivo(i)}
                  onClick={() => setActivo(i)}
                >
                  <div className={styles.barVentas} style={{ height: alto(m.ventas) }} />
                  <div className={styles.barCompras} style={{ height: alto(m.compras) }} />
                  {i === activo && (
                    <div
                      className={`${styles.tooltip} ${lado}`}
                      style={{ bottom: `calc(${alto(Math.max(m.ventas, m.compras))} + 10px)` }}
                    >
                      <span className={styles.tooltipTitle}>{nombreMes(m.mes)}</span>
                      <div className={styles.tooltipRow}>
                        <span><i className={styles.dotVentas} />Ventas</span>
                        <b>{soles(m.ventas)}</b>
                      </div>
                      <div className={styles.tooltipRow}>
                        <span><i className={styles.dotCompras} />Compras</span>
                        <b>{soles(m.compras)}</b>
                      </div>
                      <div className={`${styles.tooltipRow} ${styles.tooltipTotal}`}>
                        <span>Diferencia</span>
                        <b className={diferencia >= 0 ? styles.positivo : styles.negativo}>
                          {soles(diferencia)}
                        </b>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className={styles.chartLabels}>
          {serie.map((m, i) => (
            <span key={m.mes} className={i === activo ? styles.chartLabelActive : ''}>
              {MESES[Number(m.mes.slice(5)) - 1].slice(0, 3)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
