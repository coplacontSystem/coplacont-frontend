import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  LuBan,
  LuChevronLeft,
  LuChevronRight,
  LuCloudOff,
  LuFileText,
  LuPencil,
  LuPlus,
  LuRotateCw,
  LuSearch,
  LuX,
} from 'react-icons/lu';
import { Drawer, ErrorCampo, Modal, ToastProvider } from '@/domains/settings/pages/Configuracion/ui';
import { cx, useToast } from '@/domains/settings/pages/Configuracion/util';
import { MAIN_ROUTES, TRANSACTIONS_ROUTES } from '@/router';
import {
  erroresDe,
  useAnularAsientoContableMutation,
  useGetAsientoContableQuery,
  useGetAsientosContablesQuery,
  type Asiento,
  type EstadoAsiento,
} from './asientosApi';
import { fecha, fechaHora, importe } from './formato';
import styles from './Asientos.module.scss';

const RUTA = `${MAIN_ROUTES.TRANSACTIONS}${TRANSACTIONS_ROUTES.MANUAL_JOURNAL_ENTRY}`;
const ORIGEN: Record<string, string> = { manual: 'Manual', compra: 'Compra', venta: 'Venta' };

/** Asientos contables de la empresa (Libro Diario manual). */
export const MainPage: React.FC = () => (
  <ToastProvider>
    <Asientos />
  </ToastProvider>
);

const Asientos: React.FC = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [texto, setTexto] = useState('');
  const [q, setQ] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [estado, setEstado] = useState<EstadoAsiento | ''>('');
  const [pagina, setPagina] = useState(1);
  const ver = params.get('ver');

  useEffect(() => {
    const t = setTimeout(() => {
      setQ(texto.trim());
      setPagina(1);
    }, 300);
    return () => clearTimeout(t);
  }, [texto]);

  const lista = useGetAsientosContablesQuery({
    q: q || undefined,
    desde: desde || undefined,
    hasta: hasta || undefined,
    estado: estado || undefined,
    pagina,
    limite: 20,
  });
  const datos = lista.data?.datos ?? [];
  const filtrado = !!(q || desde || hasta || estado);

  const abrir = (id: number) => setParams({ ver: String(id) });
  const cerrar = () => setParams({});

  return (
    <div className={styles.pagina}>
      <div className={styles.header}>
        <div className={styles.headerTexto}>
          <h1 className={styles.titulo}>Asientos contables</h1>
          <span className={styles.subtitulo}>
            Operaciones que van al Libro Diario sin un comprobante: planilla, caja y bancos, depreciación, ajustes.
          </span>
        </div>
        <button
          type="button"
          className={cx(styles.btnPrimary, styles.anchoMovil)}
          onClick={() => navigate(`${RUTA}/nuevo`)}
        >
          <LuPlus /> Nuevo asiento
        </button>
      </div>

      <section className={styles.card}>
        <div className={styles.filtros}>
          <label className={styles.buscador}>
            <LuSearch className={styles.buscadorIcono} />
            <input
              value={texto}
              placeholder="Buscar por glosa, referencia o N°"
              aria-label="Buscar asiento"
              onChange={(e) => setTexto(e.target.value)}
            />
            {texto && (
              <button type="button" aria-label="Limpiar búsqueda" onClick={() => setTexto('')}>
                <LuX />
              </button>
            )}
          </label>
          <label className={styles.campoFiltro}>
            <span>Desde</span>
            <input
              type="date"
              className={styles.input}
              value={desde}
              onChange={(e) => {
                setDesde(e.target.value);
                setPagina(1);
              }}
            />
          </label>
          <label className={styles.campoFiltro}>
            <span>Hasta</span>
            <input
              type="date"
              className={styles.input}
              value={hasta}
              onChange={(e) => {
                setHasta(e.target.value);
                setPagina(1);
              }}
            />
          </label>
          <div role="tablist" aria-label="Estado" className={styles.segmento}>
            {(
              [
                ['', 'Todos'],
                ['registrado', 'Registrados'],
                ['anulado', 'Anulados'],
              ] as [EstadoAsiento | '', string][]
            ).map(([v, l]) => (
              <button
                key={l}
                type="button"
                role="tab"
                aria-selected={estado === v}
                className={cx(estado === v && styles.segmentoOn)}
                onClick={() => {
                  setEstado(v);
                  setPagina(1);
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {lista.isLoading ? (
          <div className={styles.skelLista}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className={styles.skel} style={{ height: 48 }} />
            ))}
          </div>
        ) : lista.isError ? (
          <div role="alert" className={styles.vacio}>
            <LuCloudOff className={styles.vacioIcono} />
            <span className={styles.estadoTitulo}>No se pudieron cargar los asientos</span>
            <button type="button" className={styles.btnSecondary} onClick={() => lista.refetch()}>
              <LuRotateCw /> Reintentar
            </button>
          </div>
        ) : datos.length === 0 ? (
          <div className={styles.vacio}>
            <LuFileText className={styles.vacioIcono} />
            <span className={styles.estadoTitulo}>
              {filtrado ? 'No hay asientos con estos filtros' : 'Aún no hay asientos contables'}
            </span>
            <span className={styles.estadoTexto}>
              {filtrado
                ? 'Prueba con otras fechas o con otra búsqueda.'
                : 'Registra el primero: por ejemplo, la planilla del mes o un pago bancario.'}
            </span>
            {!filtrado && (
              <button type="button" className={styles.btnPrimary} onClick={() => navigate(`${RUTA}/nuevo`)}>
                <LuPlus /> Nuevo asiento
              </button>
            )}
          </div>
        ) : (
          <>
            <div className={styles.tablaScroll}>
              <table className={styles.tabla}>
                <thead>
                  <tr>
                    <th>N°</th>
                    <th>Fecha</th>
                    <th>Glosa</th>
                    <th>Origen</th>
                    <th className={styles.der}>Importe</th>
                    <th>Estado</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {datos.map((a) => (
                    <tr key={a.id} className={cx(a.estado === 'anulado' && styles.filaAnulada)} onClick={() => abrir(a.id)}>
                      <td className={styles.numero}>
                        {a.numero}
                        <span>{a.periodo.año}</span>
                      </td>
                      <td className={styles.nowrap}>{fecha(a.fecha)}</td>
                      <td>
                        <div className={styles.glosa}>
                          <span>{a.glosa}</span>
                          <span>
                            {a.referencia ? `${a.referencia} · ` : ''}
                            {a.cantidadLineas} líneas
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={cx(styles.badge, styles.tonoNeutral)}>{ORIGEN[a.origen]}</span>
                      </td>
                      <td className={cx(styles.der, styles.monto)}>{importe(a.totalDebe)}</td>
                      <td>
                        <Estado a={a} />
                      </td>
                      <td className={styles.der}>
                        <button
                          type="button"
                          className={styles.btnLink}
                          onClick={(e) => {
                            e.stopPropagation();
                            abrir(a.id);
                          }}
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.tarjetas}>
              {datos.map((a) => (
                <button key={a.id} type="button" className={cx(styles.tarjeta, a.estado === 'anulado' && styles.filaAnulada)} onClick={() => abrir(a.id)}>
                  <div className={styles.tarjetaHead}>
                    <span className={styles.numero}>
                      N° {a.numero}
                      <span>{fecha(a.fecha)}</span>
                    </span>
                    <Estado a={a} />
                  </div>
                  <span className={styles.tarjetaGlosa}>{a.glosa}</span>
                  <div className={styles.tarjetaPie}>
                    <span>
                      {ORIGEN[a.origen]} · {a.cantidadLineas} líneas
                    </span>
                    <b>S/ {importe(a.totalDebe)}</b>
                  </div>
                </button>
              ))}
            </div>

            {lista.data && lista.data.totalPaginas > 1 && (
              <div className={styles.paginacion}>
                <span>
                  {lista.data.total} asientos · página {lista.data.pagina} de {lista.data.totalPaginas}
                </span>
                <div>
                  <button type="button" aria-label="Página anterior" disabled={pagina <= 1} onClick={() => setPagina(pagina - 1)}>
                    <LuChevronLeft />
                  </button>
                  <button
                    type="button"
                    aria-label="Página siguiente"
                    disabled={pagina >= lista.data.totalPaginas}
                    onClick={() => setPagina(pagina + 1)}
                  >
                    <LuChevronRight />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {ver && <DetalleAsiento id={Number(ver)} onClose={cerrar} />}
    </div>
  );
};

const Estado: React.FC<{ a: Asiento }> = ({ a }) =>
  a.estado === 'anulado' ? (
    <span className={cx(styles.badge, styles.tonoError)}>Anulado</span>
  ) : (
    <span className={cx(styles.badge, styles.tonoSuccess)}>Registrado</span>
  );

/* ---------- Detalle ---------- */

const DetalleAsiento: React.FC<{ id: number; onClose: () => void }> = ({ id, onClose }) => {
  const navigate = useNavigate();
  const q = useGetAsientoContableQuery(id);
  const [anulando, setAnulando] = useState(false);
  const a = q.data;

  return (
    <Drawer
      titulo={a ? `Asiento N° ${a.numero} · ${a.periodo.año}` : 'Asiento'}
      onClose={onClose}
      pie={
        a?.editable ? (
          <div className={styles.botonesFin}>
            <button type="button" className={styles.btnPrimary} onClick={() => navigate(`${RUTA}/${a.id}/editar`)}>
              <LuPencil /> Editar
            </button>
            <button type="button" className={cx(styles.btnSecondary, styles.textoPeligro)} onClick={() => setAnulando(true)}>
              <LuBan /> Anular
            </button>
          </div>
        ) : (
          <div className={styles.botonesFin}>
            <button type="button" className={styles.btnSecondary} onClick={onClose}>
              Cerrar
            </button>
          </div>
        )
      }
    >
      {q.isLoading && <div className={styles.skel} style={{ height: 240 }} />}
      {q.isError && <ErrorCampo>No se pudo cargar el asiento.</ErrorCampo>}
      {a && (
        <>
          <div className={styles.detalleCab}>
            <div>
              <span>Fecha</span>
              <b>{fecha(a.fecha)}</b>
            </div>
            <div>
              <span>Estado</span>
              <Estado a={a} />
            </div>
            <div>
              <span>Origen</span>
              <b>{ORIGEN[a.origen]}</b>
            </div>
            {a.referencia && (
              <div>
                <span>Referencia</span>
                <b>{a.referencia}</b>
              </div>
            )}
          </div>
          <p className={styles.detalleGlosa}>{a.glosa}</p>

          {a.anulacion && (
            <div className={styles.alertaAnulado}>
              <LuBan />
              <span>
                Anulado el {fechaHora(a.anulacion.fecha)} por {a.anulacion.por}. Motivo: {a.anulacion.motivo}
              </span>
            </div>
          )}
          {!a.editable && a.estado === 'registrado' && a.periodo.cerrado && (
            <span className={styles.hint}>El periodo {a.periodo.año} está cerrado: el asiento no se puede modificar.</span>
          )}

          <div className={styles.detalleLineas}>
            <div className={cx(styles.detalleLinea, styles.detalleLineaHead)}>
              <span>Cuenta</span>
              <span className={styles.der}>Debe</span>
              <span className={styles.der}>Haber</span>
            </div>
            {a.lineas?.map((l) => (
              <div key={l.orden} className={styles.detalleLinea}>
                <span className={cx(styles.lineaCuenta, l.haber > 0 && styles.lineaHaber)}>
                  <b>{l.codigoCuenta}</b> {l.nombreCuenta}
                  {l.glosa && <em>{l.glosa}</em>}
                </span>
                <span className={styles.der}>{l.debe ? importe(l.debe) : ''}</span>
                <span className={styles.der}>{l.haber ? importe(l.haber) : ''}</span>
              </div>
            ))}
            <div className={cx(styles.detalleLinea, styles.detalleLineaTotal)}>
              <span>Totales</span>
              <span className={styles.der}>{importe(a.totalDebe)}</span>
              <span className={styles.der}>{importe(a.totalHaber)}</span>
            </div>
          </div>

          <div className={styles.auditoria}>
            <span>
              Registrado por {a.creadoPor} el {fechaHora(a.fechaCreacion)}
            </span>
            {a.modificadoPor && (
              <span>
                Modificado por {a.modificadoPor} el {fechaHora(a.fechaActualizacion)}
              </span>
            )}
          </div>
        </>
      )}
      {anulando && a && <Anular asiento={a} onClose={() => setAnulando(false)} />}
    </Drawer>
  );
};

const Anular: React.FC<{ asiento: Asiento; onClose: () => void }> = ({ asiento, onClose }) => {
  const toast = useToast();
  const [anular, { isLoading }] = useAnularAsientoContableMutation();
  const [motivo, setMotivo] = useState('');
  const [err, setErr] = useState('');

  const confirmar = async () => {
    if (motivo.trim().length < 5) return setErr('Indica el motivo (al menos 5 caracteres).');
    try {
      await anular({ id: asiento.id, motivo: motivo.trim() }).unwrap();
      toast(`Asiento N° ${asiento.numero} anulado`);
      onClose();
    } catch (e) {
      setErr(erroresDe(e)[0]);
    }
  };

  return (
    <Modal label="Anular asiento" alert onClose={onClose}>
      <div className={styles.modalTexto}>
        <span>Anular el asiento N° {asiento.numero}</span>
        <span>
          Deja de contar en el Libro Diario, pero conserva su número y queda el registro de quién lo anuló y por qué. No se
          puede deshacer.
        </span>
      </div>
      <label className={styles.campo}>
        <span>Motivo</span>
        <textarea
          className={cx(styles.input, styles.textarea)}
          value={motivo}
          maxLength={250}
          placeholder="p. ej. Registrado por error, se reemplaza por el asiento 15"
          onChange={(e) => {
            setMotivo(e.target.value);
            setErr('');
          }}
        />
      </label>
      {err && <ErrorCampo>{err}</ErrorCampo>}
      <div className={styles.botonesFin}>
        <button type="button" className={styles.btnPeligro} disabled={isLoading} onClick={() => void confirmar()}>
          <LuBan /> {isLoading ? 'Anulando…' : 'Anular asiento'}
        </button>
        <button type="button" className={styles.btnSecondary} onClick={onClose}>
          Cancelar
        </button>
      </div>
    </Modal>
  );
};
