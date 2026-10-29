import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LuBookOpen, LuCircleAlert, LuCircleCheck, LuDownload, LuFileText } from 'react-icons/lu';
import { ToastProvider } from '@/domains/settings/pages/Configuracion/ui';
import { cx, useToast } from '@/domains/settings/pages/Configuracion/util';
import { MAIN_ROUTES, TRANSACTIONS_ROUTES } from '@/router';
import { descargarArchivo, descargarReporte } from '@/shared/utils';
import { fecha, importe } from '@/domains/transactions/pages/manualJournalEntries/formato';
import base from '@/domains/transactions/pages/manualJournalEntries/Asientos.module.scss';
import { useGetLibroDiarioQuery } from './libroDiarioApi';
import styles from './LibroDiario.module.scss';

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];
const ORIGEN: Record<string, string> = { manual: 'Manual', compra: 'Compra', venta: 'Venta' };
const ASIENTOS = `${MAIN_ROUTES.TRANSACTIONS}${TRANSACTIONS_ROUTES.MANUAL_JOURNAL_ENTRY}`;

export const MainPage: React.FC = () => (
  <ToastProvider>
    <LibroDiario />
  </ToastProvider>
);

/** Libro Diario de formato simplificado (5.2): vista del mes y descargas */
const LibroDiario: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const hoy = new Date();
  const [año, setAño] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [descargando, setDescargando] = useState<string | null>(null);
  const [error, setError] = useState('');
  const q = useGetLibroDiarioQuery({ año, mes });
  const libro = q.data;
  const cuadra = libro && Math.round(libro.totalDebe * 100) === Math.round(libro.totalHaber * 100);

  const descargar = async (tipo: 'pdf' | 'xlsx' | 'ple') => {
    setDescargando(tipo);
    setError('');
    try {
      if (tipo === 'ple') {
        await descargarArchivo('/libros/diario/ple', { año, mes }, `libro_diario_${año}_${mes}.txt`);
        toast('TXT del PLE descargado: valídalo en el programa PLE de SUNAT');
      } else {
        await descargarReporte('libro-diario', tipo, { año, mes });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo descargar');
    } finally {
      setDescargando(null);
    }
  };

  return (
    <div className={base.pagina}>
      <div className={base.header}>
        <div className={base.headerTexto}>
          <h1 className={base.titulo}>Libro Diario</h1>
          <span className={base.subtitulo}>
            Formato simplificado (5.2): todos los asientos del mes, de compras, ventas y manuales.
          </span>
        </div>
        <div className={styles.descargas}>
          <button type="button" className={base.btnSecondary} disabled={!!descargando} onClick={() => void descargar('pdf')}>
            <LuDownload /> {descargando === 'pdf' ? 'Generando…' : 'PDF'}
          </button>
          <button type="button" className={base.btnSecondary} disabled={!!descargando} onClick={() => void descargar('xlsx')}>
            <LuDownload /> {descargando === 'xlsx' ? 'Generando…' : 'Excel'}
          </button>
          <button type="button" className={base.btnPrimary} disabled={!!descargando} onClick={() => void descargar('ple')}>
            <LuFileText /> {descargando === 'ple' ? 'Generando…' : 'TXT del PLE'}
          </button>
        </div>
      </div>

      <section className={cx(base.card, styles.resumen)}>
        <label className={base.campoFiltro}>
          <span>Mes</span>
          <select className={base.input} value={mes} onChange={(e) => setMes(Number(e.target.value))}>
            {MESES.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label className={base.campoFiltro}>
          <span>Año</span>
          <input
            type="number"
            className={base.input}
            value={año}
            min={2000}
            max={2100}
            onChange={(e) => setAño(Number(e.target.value) || hoy.getFullYear())}
          />
        </label>
        {libro && (
          <dl className={styles.cifras}>
            <div>
              <dt>Asientos</dt>
              <dd>{libro.asientos.length}</dd>
            </div>
            <div>
              <dt>Total Debe</dt>
              <dd>{importe(libro.totalDebe)}</dd>
            </div>
            <div>
              <dt>Total Haber</dt>
              <dd>{importe(libro.totalHaber)}</dd>
            </div>
            <div className={cx(styles.estado, cuadra ? styles.ok : styles.mal)}>
              {cuadra ? <LuCircleCheck /> : <LuCircleAlert />}
              {cuadra ? 'Cuadrado' : 'No cuadra'}
            </div>
          </dl>
        )}
      </section>

      {error && (
        <div role="alert" className={base.alertaError}>
          <LuCircleAlert /> {error}
        </div>
      )}

      <section className={base.card}>
        {q.isLoading ? (
          <div className={base.skelLista}>
            {[0, 1, 2].map((i) => (
              <div key={i} className={base.skel} style={{ height: 44 }} />
            ))}
          </div>
        ) : !libro?.asientos.length ? (
          <div className={base.vacio}>
            <LuBookOpen className={base.vacioIcono} />
            <span className={base.estadoTitulo}>Sin asientos en {MESES[mes - 1].toLowerCase()} de {año}</span>
            <span className={base.estadoTexto}>
              Las compras y ventas generan su asiento al registrarse. Si registraste comprobantes antes de esta función,
              usa "Generar asientos" en Asientos contables.
            </span>
            <button type="button" className={base.btnSecondary} onClick={() => navigate(ASIENTOS)}>
              Ir a Asientos contables
            </button>
          </div>
        ) : (
          <div className={base.tablaScroll}>
            <table className={cx(base.tabla, styles.tabla)}>
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Fecha</th>
                  <th>Cuenta</th>
                  <th>Denominación / glosa</th>
                  <th className={base.der}>Debe</th>
                  <th className={base.der}>Haber</th>
                </tr>
              </thead>
              {libro.asientos.map((a) => (
                <tbody key={a.id} className={styles.asiento}>
                  <tr className={styles.cabAsiento}>
                    <td className={base.numero}>{a.numero}</td>
                    <td className={base.nowrap}>{fecha(a.fecha)}</td>
                    <td colSpan={4}>
                      <b>{a.glosa}</b>
                      <span className={cx(base.badge, base.tonoNeutral, styles.origen)}>{ORIGEN[a.origen]}</span>
                    </td>
                  </tr>
                  {a.lineas.map((l) => (
                    <tr key={l.orden} className={styles.lineaAsiento}>
                      <td />
                      <td />
                      <td className={cx(styles.cuenta, l.haber > 0 && styles.cuentaHaber)}>{l.codigoCuenta}</td>
                      <td className={cx(l.haber > 0 && styles.cuentaHaber)}>
                        {l.nombreCuenta}
                        {l.glosa && <span className={styles.glosaLinea}> · {l.glosa}</span>}
                      </td>
                      <td className={cx(base.der, base.monto)}>{l.debe ? importe(l.debe) : ''}</td>
                      <td className={cx(base.der, base.monto)}>{l.haber ? importe(l.haber) : ''}</td>
                    </tr>
                  ))}
                </tbody>
              ))}
              <tfoot>
                <tr className={styles.totales}>
                  <td colSpan={4}>Totales del mes</td>
                  <td className={base.der}>{importe(libro.totalDebe)}</td>
                  <td className={base.der}>{importe(libro.totalHaber)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
