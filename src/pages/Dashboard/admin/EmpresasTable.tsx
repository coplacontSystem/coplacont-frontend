import React, { useState } from 'react';
import { LuChevronLeft, LuChevronRight, LuPower, LuPowerOff, LuSearch, LuSearchX, LuX } from 'react-icons/lu';
import { cx } from '@/domains/settings/pages/Configuracion/util';
import { iniciales, numero } from '../formato';
import type { EmpresaFila } from './adminApi';
import { diasDesde, relativo } from './util';
import styles from './AdminDashboard.module.scss';

type Filtro = 'todas' | 'hab' | 'des';
const POR_PAGINA = 6;

const PERIODO = {
  activo: { label: 'Activo', tono: styles.tonoSuccess },
  vencido: { label: 'Vencido', tono: styles.tonoError },
  sin: { label: 'Sin periodo', tono: styles.tonoWarning },
};

const Estado: React.FC<{ e: EmpresaFila; mini?: boolean }> = ({ e, mini }) => (
  <span className={cx(styles.chipEstado, mini && styles.chipEstadoMini, e.habilitada ? styles.tonoSuccess : styles.tonoNeutral)}>
    <span className={cx(styles.dot, e.habilitada ? styles.dotOn : styles.dotOff)} />
    {e.habilitada ? 'Habilitada' : 'Deshabilitada'}
  </span>
);

export const EmpresasTable: React.FC<{
  empresas?: EmpresaFila[];
  cargando: boolean;
  onVer: (id: number) => void;
  onEstado: (e: EmpresaFila) => void;
}> = ({ empresas = [], cargando, onVer, onEstado }) => {
  const [q, setQ] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const [pagina, setPagina] = useState(1);

  const hab = empresas.filter((e) => e.habilitada).length;
  const texto = q.trim().toLowerCase();
  const filtradas = empresas.filter(
    (e) =>
      (filtro === 'todas' || (filtro === 'hab' ? e.habilitada : !e.habilitada)) &&
      (!texto || e.razonSocial.toLowerCase().includes(texto) || e.ruc.includes(texto)),
  );
  const paginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  const pag = Math.min(pagina, paginas);
  const filas = filtradas.slice((pag - 1) * POR_PAGINA, pag * POR_PAGINA);

  const filtros: { id: Filtro; label: string; corto: string; n: number }[] = [
    { id: 'todas', label: 'Todas', corto: 'Todas', n: empresas.length },
    { id: 'hab', label: 'Habilitadas', corto: 'Habilit.', n: hab },
    { id: 'des', label: 'Deshabilitadas', corto: 'Deshab.', n: empresas.length - hab },
  ];

  const datos = (e: EmpresaFila) => {
    const p = e.periodo ? PERIODO[e.periodo.estado] : PERIODO.sin;
    const inactiva = (diasDesde(e.ultimoAcceso) ?? 999) >= 30;
    return { p, inactiva };
  };

  return (
    <div data-component="EmpresasTable" className={cx(styles.card, styles.tablaCard)}>
      <div className={styles.tablaHead}>
        <div className={styles.cardHead}>
          <span className={styles.cardTitle}>Empresas</span>
          <span className={styles.cardSub}>
            {empresas.length} empresas · {hab} habilitadas
          </span>
        </div>
        <div className={styles.controles}>
          <label className={styles.buscador}>
            <LuSearch className={styles.buscadorIcono} />
            <input
              value={q}
              placeholder="Buscar por razón social o RUC"
              aria-label="Buscar empresa"
              onChange={(ev) => {
                setQ(ev.target.value);
                setPagina(1);
              }}
            />
            {q && (
              <button type="button" aria-label="Limpiar búsqueda" onClick={() => setQ('')}>
                <LuX />
              </button>
            )}
          </label>
          <div role="tablist" aria-label="Filtrar por estado" className={styles.segmento}>
            {filtros.map((f) => (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={filtro === f.id}
                className={cx(filtro === f.id && styles.segmentoOn)}
                onClick={() => {
                  setFiltro(f.id);
                  setPagina(1);
                }}
              >
                <span className={styles.soloAncho}>{f.label}</span>
                <span className={styles.soloMovil}>{f.corto}</span>
                <span className={styles.segmentoN}>{f.n}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {cargando ? (
        <div className={styles.tablaSkel}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className={styles.skel} style={{ height: 44 }} />
          ))}
        </div>
      ) : filas.length === 0 ? (
        <div className={styles.sinResultados}>
          <LuSearchX />
          <span>{q ? `No hay empresas que coincidan con “${q}”` : 'No hay empresas con este filtro'}</span>
          <button
            type="button"
            className={styles.btnLink}
            onClick={() => {
              setQ('');
              setFiltro('todas');
              setPagina(1);
            }}
          >
            Limpiar búsqueda y filtros
          </button>
        </div>
      ) : (
        <>
          <div className={styles.tablaScroll}>
            <table className={styles.tabla}>
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th className={styles.der}>Usuarios</th>
                  <th>Periodo</th>
                  <th>Último acceso</th>
                  <th className={styles.der}>Comprob. del mes</th>
                  <th>Estado</th>
                  <th className={styles.der}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((e) => {
                  const { p, inactiva } = datos(e);
                  return (
                    <tr key={e.id} className={cx(!e.habilitada && styles.filaApagada)}>
                      <td>
                        <div className={styles.celdaEmpresa}>
                          <span className={styles.empresaIni}>{iniciales(e.razonSocial)}</span>
                          <div>
                            <span>{e.razonSocial}</span>
                            <span>RUC {e.ruc}</span>
                          </div>
                        </div>
                      </td>
                      <td className={cx(styles.der, styles.num)}>{e.usuarios}</td>
                      <td>
                        <span className={styles.celdaPeriodo}>
                          {e.periodo?.año ?? '—'}
                          <span className={cx(styles.chip, p.tono)}>{p.label}</span>
                        </span>
                      </td>
                      <td className={cx(styles.nowrap, inactiva ? styles.textoAviso : styles.textoSuave)}>
                        {relativo(e.ultimoAcceso)}
                      </td>
                      <td className={cx(styles.der, styles.numFuerte)}>{numero(e.comprobantesMes)}</td>
                      <td>
                        <Estado e={e} />
                      </td>
                      <td className={styles.der}>
                        <div className={styles.acciones}>
                          <button type="button" className={styles.btnLink} onClick={() => onVer(e.id)}>
                            Ver detalle
                          </button>
                          <button
                            type="button"
                            className={cx(styles.btnIcono, e.habilitada ? styles.textoPeligro : styles.textoOk)}
                            title={e.habilitada ? 'Deshabilitar' : 'Habilitar'}
                            aria-label={`${e.habilitada ? 'Deshabilitar' : 'Habilitar'} ${e.razonSocial}`}
                            onClick={() => onEstado(e)}
                          >
                            {e.habilitada ? <LuPowerOff /> : <LuPower />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className={styles.tarjetas}>
            {filas.map((e) => {
              const { p, inactiva } = datos(e);
              return (
                <div key={e.id} className={styles.tarjeta}>
                  <div className={styles.tarjetaHead}>
                    <span className={cx(styles.empresaIni, styles.empresaIniLg, !e.habilitada && styles.apagado)}>
                      {iniciales(e.razonSocial)}
                    </span>
                    <div className={styles.tarjetaNombre}>
                      <span>{e.razonSocial}</span>
                      <span>RUC {e.ruc}</span>
                    </div>
                    <Estado e={e} mini />
                  </div>
                  <div className={styles.tarjetaDatos}>
                    <div>
                      <span>Periodo</span>
                      <span className={styles.celdaPeriodo}>
                        {e.periodo?.año ?? '—'}
                        <span className={cx(styles.chip, styles.chipMini, p.tono)}>{p.label}</span>
                      </span>
                    </div>
                    <div>
                      <span>Último acceso</span>
                      <span className={inactiva ? styles.textoAviso : undefined}>{relativo(e.ultimoAcceso)}</span>
                    </div>
                    <div>
                      <span>Usuarios</span>
                      <span>{e.usuarios}</span>
                    </div>
                    <div>
                      <span>Comprob. del mes</span>
                      <span>{numero(e.comprobantesMes)}</span>
                    </div>
                  </div>
                  <div className={styles.tarjetaBotones}>
                    <button type="button" className={styles.btnSecondary} onClick={() => onVer(e.id)}>
                      Ver detalle
                    </button>
                    <button
                      type="button"
                      className={cx(styles.btnSecondary, e.habilitada ? styles.textoPeligro : styles.textoOk)}
                      onClick={() => onEstado(e)}
                    >
                      {e.habilitada ? <LuPowerOff /> : <LuPower />}
                      {e.habilitada ? 'Deshabilitar' : 'Habilitar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className={styles.paginacion}>
            <span>
              Mostrando {(pag - 1) * POR_PAGINA + 1}–{Math.min(pag * POR_PAGINA, filtradas.length)} de {filtradas.length}
            </span>
            <div>
              <button type="button" aria-label="Página anterior" disabled={pag <= 1} onClick={() => setPagina(pag - 1)}>
                <LuChevronLeft />
              </button>
              {Array.from({ length: paginas }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-current={n === pag ? 'page' : undefined}
                  className={cx(n === pag && styles.paginaOn)}
                  onClick={() => setPagina(n)}
                >
                  {n}
                </button>
              ))}
              <button type="button" aria-label="Página siguiente" disabled={pag >= paginas} onClick={() => setPagina(pag + 1)}>
                <LuChevronRight />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
