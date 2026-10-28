import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LuArrowLeft,
  LuArrowRight,
  LuCircleAlert,
  LuCircleCheck,
  LuCircleDashed,
  LuCircleSlash,
  LuTriangleAlert,
  LuUpload,
} from 'react-icons/lu';
import { ToastProvider, Switch } from '@/domains/settings/pages/Configuracion/ui';
import { cx, useToast } from '@/domains/settings/pages/Configuracion/util';
import { useGetCategoriesQuery, useGetProductsQuery, useGetWarehousesQuery } from '@/domains/maintainers/api';
import { MAIN_ROUTES, TRANSACTIONS_ROUTES } from '@/router';
import { erroresDe } from '../manualJournalEntries/asientosApi';
import { importe } from '../manualJournalEntries/formato';
import {
  aBase64,
  useGetAreasContablesQuery,
  usePrevisualizarXmlMutation,
  useRegistrarComprobanteMutation,
  type ArchivoPrevio,
  type ArchivoXml,
  type LineaManual,
} from './importacionApi';
import {
  claveDecision,
  claveItem,
  cuadreManual,
  decisionInicial,
  destinoPayload,
  faltaLinea,
  lineasIniciales,
  numero,
  pendiente,
  TIPO,
  type Decision,
  type LineaEscrita,
} from './decision';
import { DetalleManual, FilaXml } from './Lineas';
import type { Catalogos } from './SelectorDestino';
import base from '../manualJournalEntries/Asientos.module.scss';
import styles from './ImportarXml.module.scss';

type Estado =
  | { tipo: 'pendiente' }
  | { tipo: 'registrado'; correlativo?: string }
  | { tipo: 'saltado' }
  | { tipo: 'error'; mensaje: string };

const ACEPTA = '.xml,.txt,text/xml,application/xml,text/plain';
const MAXIMO = 200;

export const ImportarXmlPage: React.FC<{ desde: 'compras' | 'ventas' }> = ({ desde }) => (
  <ToastProvider>
    <Importar desde={desde} />
  </ToastProvider>
);

/**
 * Carga de comprobantes en cola: se suben XML o TXT de SIRE y se registran
 * uno por uno. En cada uno el usuario elige los productos o el gasto de
 * cada línea (o escribe el detalle si el archivo no lo trae) y lo registra.
 */
const Importar: React.FC<{ desde: 'compras' | 'ventas' }> = ({ desde }) => {
  const navigate = useNavigate();
  const toast = useToast();
  const volver = `${MAIN_ROUTES.TRANSACTIONS}${desde === 'compras' ? TRANSACTIONS_ROUTES.PURCHASES : TRANSACTIONS_ROUTES.SALES}`;

  const [previsualizar, { isLoading: leyendo }] = usePrevisualizarXmlMutation();
  const [registrarComprobante, { isLoading: registrando }] = useRegistrarComprobanteMutation();
  const productos = useGetProductsQuery();
  const categorias = useGetCategoriesQuery();
  const almacenes = useGetWarehousesQuery();
  const areas = useGetAreasContablesQuery();

  const [archivos, setArchivos] = useState<Record<string, ArchivoXml>>({});
  const [cola, setCola] = useState<ArchivoPrevio[] | null>(null);
  const [actual, setActual] = useState(0);
  const [estados, setEstados] = useState<Record<string, Estado>>({});
  const [decisiones, setDecisiones] = useState<Record<string, Decision>>({});
  const [manuales, setManuales] = useState<Record<string, LineaEscrita[]>>({});
  const [sinDetalle, setSinDetalle] = useState<Record<string, boolean>>({});
  const [tiposCambio, setTiposCambio] = useState<Record<string, string>>({});
  const [idAlmacen, setIdAlmacen] = useState<number | null>(null);
  const [recordar, setRecordar] = useState(true);
  const [intentado, setIntentado] = useState(false);
  const [errores, setErrores] = useState<string[]>([]);
  const [arrastrando, setArrastrando] = useState(false);
  const entrada = useRef<HTMLInputElement>(null);

  const catalogos: Catalogos = useMemo(
    () => ({
      productos: (productos.data ?? []).filter((p) => p.tipo === 'producto' && p.estado),
      categorias: (categorias.data ?? []).filter((c) => c.tipo === 'producto' && c.estado),
      areas: (areas.data ?? []).filter((a) => a.activa),
    }),
    [productos.data, categorias.data, areas.data],
  );

  const agregar = async (files: FileList | null) => {
    const elegidos = Array.from(files ?? []).filter((f) => /\.(xml|txt)$/i.test(f.name));
    setErrores([]);
    if (!elegidos.length) return setErrores(['Elige archivos .xml (comprobantes) o .txt (propuestas de SIRE).']);
    if (elegidos.length > MAXIMO) return setErrores([`Puedes subir hasta ${MAXIMO} archivos por carga.`]);
    const lista = await Promise.all(elegidos.map(async (f) => ({ nombre: f.name, contenido: await aBase64(f) })));
    try {
      const r = await previsualizar({ archivos: lista }).unwrap();
      setArchivos(Object.fromEntries(lista.map((a) => [a.nombre, a])));
      setCola(r);
      setActual(Math.max(0, r.findIndex((a) => a.valido)));
      setEstados({});
      setIntentado(false);
      setTiposCambio(Object.fromEntries(r.flatMap((a) => (a.tipoCambio ? [[claveItem(a), String(a.tipoCambio)]] : []))));
      setManuales(
        Object.fromEntries(
          r.filter((a) => !a.conDetalle && a.documento).map((a) => [claveItem(a), lineasIniciales(a.documento!.totales)]),
        ),
      );
      setSinDetalle({});
      setDecisiones((prev) => {
        const sig = { ...prev };
        for (const a of r) for (const l of a.lineas) sig[claveDecision(a, l)] ??= decisionInicial(l);
        return sig;
      });
    } catch (e) {
      setErrores(erroresDe(e, 'No se pudieron leer los archivos.'));
    }
  };

  const reiniciar = () => {
    setCola(null);
    setArchivos({});
    setErrores([]);
  };

  /* ---------- Sin cola: subir archivos ---------- */
  if (!cola) {
    return (
      <div className={base.pagina}>
        <Encabezado volver={() => navigate(volver)} desde={desde} />
        <section
          className={cx(base.card, styles.zona, arrastrando && styles.zonaActiva)}
          onDragOver={(e) => {
            e.preventDefault();
            setArrastrando(true);
          }}
          onDragLeave={() => setArrastrando(false)}
          onDrop={(e) => {
            e.preventDefault();
            setArrastrando(false);
            void agregar(e.dataTransfer.files);
          }}
        >
          <LuUpload className={styles.zonaIcono} />
          <div className={styles.zonaTexto}>
            <b>Arrastra aquí tus XML o el TXT de SIRE</b>
            <span>
              XML de facturas, boletas y notas, o la propuesta del Registro de Ventas o de Compras exportada de SIRE.
              Compras y ventas se reconocen por tu RUC.
            </span>
          </div>
          <button type="button" className={base.btnSecondary} disabled={leyendo} onClick={() => entrada.current?.click()}>
            {leyendo ? 'Leyendo…' : 'Elegir archivos'}
          </button>
          <input
            ref={entrada}
            type="file"
            accept={ACEPTA}
            multiple
            hidden
            onChange={(e) => {
              void agregar(e.target.files);
              e.target.value = '';
            }}
          />
        </section>
        <Alertas errores={errores} />
      </div>
    );
  }

  const estadoDe = (a: ArchivoPrevio): Estado => estados[claveItem(a)] ?? { tipo: 'pendiente' };
  const porRegistrar = (a: ArchivoPrevio) => a.valido && ['pendiente', 'error'].includes(estadoDe(a).tipo);
  const cuenta = (t: Estado['tipo']) => cola.filter((a) => a.valido && estadoDe(a).tipo === t).length;
  const noValidos = cola.filter((a) => !a.valido).length;
  const quedan = cola.filter(porRegistrar).length;

  const item = cola[actual];
  const k = claveItem(item);
  const doc = item.documento;
  const estado = estadoDe(item);
  const editable = item.valido && estado.tipo !== 'registrado';
  const sinDet = !!sinDetalle[k];
  const escritas = manuales[k] ?? [];

  // Qué falta para registrar el actual
  const faltas: string[] = [];
  if (editable) {
    const lineasPendientes = item.conDetalle
      ? item.lineas.filter((l) => pendiente(decisiones[claveDecision(item, l)])).length
      : sinDet
        ? 0
        : escritas.filter((l) => faltaLinea(l)).length;
    if (lineasPendientes) faltas.push(`${lineasPendientes} línea(s) por completar`);
    if (!item.conDetalle && !sinDet && doc) {
      if (!escritas.length) faltas.push('Agrega el detalle o regístralo sin detalle');
      else if (cuadreManual(escritas, doc.totales).some((c) => !c.ok)) faltas.push('Las bases no cuadran con el registro');
    }
    if (doc?.moneda === 'USD' && !(Number(tiposCambio[k]) > 0)) faltas.push('Falta el tipo de cambio');
    const hayProductos = item.conDetalle
      ? item.lineas.some((l) => decisiones[claveDecision(item, l)]?.tipo === 'producto')
      : !sinDet && escritas.some((l) => l.tipo === 'producto');
    if (hayProductos && !idAlmacen) faltas.push('Elige el almacén');
  }

  const irA = (i: number) => {
    setActual(i);
    setIntentado(false);
    setErrores([]);
  };
  const siguientePendiente = () => {
    const resto = [...cola.slice(actual + 1), ...cola.slice(0, actual + 1)];
    const sig = resto.find((a) => a !== item && porRegistrar(a));
    if (sig) irA(cola.indexOf(sig));
  };

  const registrar = async () => {
    setIntentado(true);
    setErrores([]);
    if (faltas.length || !doc) return;
    const lineasManuales: LineaManual[] = escritas.map((l) => ({
      ...destinoPayload(l),
      cantidad: Number(l.cantidad),
      valor: Number(l.valor),
      afectacionIgv: l.afectacion,
    }));
    try {
      const r = await registrarComprobante({
        archivo: archivos[item.nombre],
        indice: item.indice,
        idAlmacen: idAlmacen ?? undefined,
        tipoCambio: doc.moneda === 'USD' ? Number(tiposCambio[k]) : undefined,
        ...(item.conDetalle
          ? {
              lineas: item.lineas.map((l) => {
                const d = decisiones[claveDecision(item, l)];
                return {
                  orden: l.orden,
                  ...destinoPayload(d),
                  ...(d.tipo === 'producto' && { factor: Number(d.factor) }),
                  recordar,
                };
              }),
            }
          : sinDet
            ? { sinDetalle: true }
            : { lineasManuales }),
      }).unwrap();
      setEstados((e) => ({ ...e, [k]: { tipo: 'registrado', correlativo: r.correlativo } }));
      toast(`${TIPO[doc.tipoComprobante]} ${doc.serie}-${doc.numero} registrada`);
      siguientePendiente();
    } catch (e) {
      const mensaje = erroresDe(e).join('. ');
      setEstados((s) => ({ ...s, [k]: { tipo: 'error', mensaje } }));
      setErrores([mensaje]);
    }
  };

  const saltar = () => {
    setEstados((e) => ({ ...e, [k]: { tipo: 'saltado' } }));
    siguientePendiente();
  };

  return (
    <div className={base.pagina}>
      <Encabezado volver={() => navigate(volver)} desde={desde} />

      {/* ---------- Opciones y avance ---------- */}
      <section className={cx(base.card, styles.opciones)}>
        <label className={base.campo}>
          <span>Almacén de la carga</span>
          <select
            className={cx(base.input, intentado && faltas.includes('Elige el almacén') && base.inputError)}
            value={idAlmacen ?? ''}
            onChange={(e) => setIdAlmacen(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Elegir almacén</option>
            {(almacenes.data ?? [])
              .filter((a) => a.estado !== false)
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
          </select>
          <span className={base.hint}>Las líneas de producto entran o salen de este almacén.</span>
        </label>
        <div className={styles.recordar}>
          <div className={styles.recordarFila}>
            <Switch on={recordar} label="Recordar mis decisiones" onChange={setRecordar} />
            <b>Recordar mis decisiones</b>
          </div>
          <span className={base.hint}>En los XML, el mismo artículo del mismo emisor se completa solo la próxima vez.</span>
        </div>
        <div className={styles.avance}>
          <span>
            <b>{cuenta('registrado')}</b> registrados
          </span>
          <span>
            <b>{cuenta('saltado')}</b> saltados
          </span>
          <span>
            <b>{quedan}</b> por registrar
          </span>
          {noValidos > 0 && (
            <span>
              <b>{noValidos}</b> no se pueden registrar
            </span>
          )}
          <button type="button" className={base.btnLink} onClick={reiniciar}>
            Cargar otros archivos
          </button>
        </div>
      </section>

      <div className={styles.colaLayout}>
        {/* ---------- Cola ---------- */}
        <nav className={cx(base.card, styles.cola)} aria-label="Comprobantes de la carga">
          <ol>
            {cola.map((a, i) => {
              const e = estadoDe(a);
              const d = a.documento;
              return (
                <li key={claveItem(a)}>
                  <button
                    type="button"
                    className={cx(styles.colaItem, i === actual && styles.colaItemActual)}
                    aria-current={i === actual}
                    onClick={() => irA(i)}
                  >
                    <IconoEstado valido={a.valido} estado={e} />
                    <span className={styles.colaTexto}>
                      <b>{d ? `${TIPO[d.tipoComprobante]} ${d.serie}-${d.numero}` : a.nombre}</b>
                      <span>
                        {a.contraparte?.razonSocial ?? (a.origen === 'txt' ? `Fila ${a.indice}` : a.nombre)}
                      </span>
                    </span>
                    {d && (
                      <span className={styles.colaMonto}>
                        {d.moneda === 'USD' ? 'US$' : 'S/'} {importe(d.totales.total)}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* ---------- Comprobante actual ---------- */}
        <div className={styles.actual}>
          <section className={cx(base.card, styles.archivo)}>
            <div className={styles.archivoCab}>
              <div className={styles.archivoTitulo}>
                <span className={styles.posicion}>
                  {actual + 1} de {cola.length} · {item.origen === 'txt' ? `${item.nombre}, fila ${item.indice}` : item.nombre}
                </span>
                <b>{doc ? `${TIPO[doc.tipoComprobante]} ${doc.serie}-${doc.numero}` : 'No se pudo leer'}</b>
                {doc && item.contraparte && (
                  <span>
                    {item.contraparte.razonSocial}
                    {item.contraparte.numeroDocumento && ` · ${item.contraparte.numeroDocumento}`} · {doc.fechaEmision}
                  </span>
                )}
              </div>
              {item.operacion && (
                <span className={cx(base.badge, item.operacion === 'compra' ? base.tonoNeutral : base.tonoSuccess)}>
                  {item.operacion === 'compra' ? 'Compra' : 'Venta'}
                </span>
              )}
              {doc && (
                <b className={styles.archivoTotal}>
                  {doc.moneda === 'USD' ? 'US$ ' : 'S/ '}
                  {importe(doc.totales.total)}
                </b>
              )}
            </div>

            {doc && (
              <dl className={styles.importes}>
                {doc.totales.gravada > 0 && <Importe etiqueta="Gravada" valor={doc.totales.gravada} />}
                {doc.totales.exonerada > 0 && <Importe etiqueta="Exonerada" valor={doc.totales.exonerada} />}
                {doc.totales.inafecta > 0 && <Importe etiqueta="Inafecta" valor={doc.totales.inafecta} />}
                <Importe etiqueta="IGV" valor={doc.totales.igv} />
                {doc.totales.isc > 0 && <Importe etiqueta="ISC" valor={doc.totales.isc} />}
                {item.afectado && <Importe etiqueta="Modifica a" texto={item.afectado.serieNumero} />}
                {doc.fechaVencimiento && <Importe etiqueta="Vence" texto={doc.fechaVencimiento} />}
              </dl>
            )}

            {estado.tipo === 'registrado' && (
              <div className={cx(styles.mensajeEstado, styles.msgOk)}>
                <LuCircleCheck /> Registrado{estado.correlativo ? ` como ${estado.correlativo}` : ''}.
              </div>
            )}
            {(item.errores.length > 0 || item.avisos.length > 0) && (
              <ul className={styles.mensajes}>
                {item.errores.map((m) => (
                  <li key={m} className={styles.msgError}>
                    <LuCircleAlert /> {m}
                  </li>
                ))}
                {item.avisos
                  .filter((m) => !(item.origen === 'txt' && /no trae el detalle/.test(m)))
                  .map((m) => (
                    <li key={m} className={styles.msgAviso}>
                      <LuTriangleAlert /> {m}
                    </li>
                  ))}
              </ul>
            )}

            {editable && doc?.moneda === 'USD' && (
              <label className={cx(base.campo, styles.tc)}>
                <span>Tipo de cambio del {doc.fechaEmision}</span>
                <input
                  className={cx(base.input, base.inputImporte, intentado && !(Number(tiposCambio[k]) > 0) && base.inputError)}
                  inputMode="decimal"
                  placeholder="3.750"
                  value={tiposCambio[k] ?? ''}
                  onChange={(e) => setTiposCambio((t) => ({ ...t, [k]: numero(e.target.value) }))}
                />
              </label>
            )}
          </section>

          {editable && doc && (
            <section className={cx(base.card, styles.archivo)}>
              <div className={styles.detalleCab}>
                <div>
                  <span className={base.cardTitle}>Detalle</span>
                  <span className={base.cardSub}>
                    {item.conDetalle
                      ? 'Elige a qué producto o gasto va cada línea del XML.'
                      : 'El TXT no trae el detalle: escríbelo o registra solo los totales (no mueve inventario).'}
                  </span>
                </div>
                {!item.conDetalle && (
                  <div className={base.segmento} role="group" aria-label="Cómo registrar">
                    <button type="button" className={cx(!sinDet && base.segmentoOn)} onClick={() => setSinDetalle((s) => ({ ...s, [k]: false }))}>
                      Con detalle
                    </button>
                    <button type="button" className={cx(sinDet && base.segmentoOn)} onClick={() => setSinDetalle((s) => ({ ...s, [k]: true }))}>
                      Solo totales
                    </button>
                  </div>
                )}
              </div>
              <div className={styles.lineas}>
                {item.conDetalle ? (
                  item.lineas.map((l) => {
                    const dk = claveDecision(item, l);
                    return (
                      <FilaXml
                        key={l.orden}
                        linea={l}
                        moneda={doc.moneda}
                        decision={decisiones[dk]}
                        marcar={intentado}
                        catalogos={catalogos}
                        onChange={(c) => setDecisiones((ds) => ({ ...ds, [dk]: { ...ds[dk], ...c } }))}
                      />
                    );
                  })
                ) : sinDet ? (
                  <p className={styles.soloTotales}>
                    Se registrará con las bases, el IGV y el total del registro. No mueve inventario ni kardex.
                  </p>
                ) : (
                  <DetalleManual
                    lineas={escritas}
                    totales={doc.totales}
                    moneda={doc.moneda}
                    marcar={intentado}
                    catalogos={catalogos}
                    onChange={(ls) => setManuales((m) => ({ ...m, [k]: ls }))}
                  />
                )}
              </div>
            </section>
          )}

          <Alertas errores={errores} />

          <div className={base.barraGuardar}>
            <span className={base.barraTexto}>
              {quedan === 0
                ? `Listo: ${cuenta('registrado')} registrados, ${cuenta('saltado')} saltados.`
                : !editable
                  ? estado.tipo === 'registrado'
                    ? 'Ya registrado.'
                    : 'Este comprobante no se puede registrar.'
                  : intentado && faltas.length
                    ? faltas.join(' · ')
                    : `${quedan} por registrar`}
            </span>
            {/* botonesFin va en orden inverso: el primero queda a la derecha */}
            <div className={base.botonesFin}>
              {quedan === 0 ? (
                <button type="button" className={base.btnPrimary} onClick={() => navigate(volver)}>
                  Ver {desde}
                </button>
              ) : (
                editable && (
                  <>
                    <button type="button" className={base.btnPrimary} disabled={registrando} onClick={() => void registrar()}>
                      <LuCircleCheck /> {registrando ? 'Registrando…' : 'Registrar'}
                    </button>
                    <button type="button" className={base.btnSecondary} onClick={saltar}>
                      Saltar
                    </button>
                  </>
                )
              )}
              <button
                type="button"
                className={base.btnSecondary}
                disabled={actual === cola.length - 1}
                onClick={() => irA(actual + 1)}
                aria-label="Siguiente"
              >
                <LuArrowRight />
              </button>
              <button
                type="button"
                className={base.btnSecondary}
                disabled={actual === 0}
                onClick={() => irA(actual - 1)}
                aria-label="Anterior"
              >
                <LuArrowLeft />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Encabezado: React.FC<{ volver: () => void; desde: 'compras' | 'ventas' }> = ({ volver, desde }) => (
  <div className={base.header}>
    <div className={base.headerTexto}>
      <button type="button" className={base.volver} onClick={volver}>
        <LuArrowLeft /> {desde === 'compras' ? 'Compras' : 'Ventas'}
      </button>
      <h1 className={base.titulo}>Cargar comprobantes</h1>
      <span className={base.subtitulo}>
        Sube XML o el TXT de SIRE y regístralos uno por uno: revisa cada comprobante, completa su detalle y regístralo.
      </span>
    </div>
  </div>
);

const Alertas: React.FC<{ errores: string[] }> = ({ errores }) =>
  errores.length > 0 ? (
    <div role="alert" className={base.alertaError}>
      <LuCircleAlert />
      <ul>
        {errores.map((e) => (
          <li key={e}>{e}</li>
        ))}
      </ul>
    </div>
  ) : null;

const IconoEstado: React.FC<{ valido: boolean; estado: Estado }> = ({ valido, estado }) => {
  if (!valido) return <LuCircleSlash className={styles.icoNo} aria-label="No se puede registrar" />;
  if (estado.tipo === 'registrado') return <LuCircleCheck className={styles.icoOk} aria-label="Registrado" />;
  if (estado.tipo === 'error') return <LuCircleAlert className={styles.icoError} aria-label="Con error" />;
  if (estado.tipo === 'saltado') return <LuArrowRight className={styles.icoNo} aria-label="Saltado" />;
  return <LuCircleDashed className={styles.icoPendiente} aria-label="Pendiente" />;
};

const Importe: React.FC<{ etiqueta: string; valor?: number; texto?: string }> = ({ etiqueta, valor, texto }) => (
  <div>
    <dt>{etiqueta}</dt>
    <dd>{texto ?? importe(valor ?? 0)}</dd>
  </div>
);
