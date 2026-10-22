import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LuArrowLeft,
  LuCircleAlert,
  LuCircleCheck,
  LuFileCode,
  LuInfo,
  LuTriangleAlert,
  LuUpload,
  LuX,
} from 'react-icons/lu';
import { ToastProvider, Switch } from '@/domains/settings/pages/Configuracion/ui';
import { cx, useToast } from '@/domains/settings/pages/Configuracion/util';
import { useGetCategoriesQuery, useGetProductsQuery, useGetWarehousesQuery } from '@/domains/maintainers/api';
import { MAIN_ROUTES, TRANSACTIONS_ROUTES } from '@/router';
import { CuentaSelector, type CuentaElegida } from '../manualJournalEntries/CuentaSelector';
import { erroresDe } from '../manualJournalEntries/asientosApi';
import { importe } from '../manualJournalEntries/formato';
import {
  aBase64,
  useGetAreasContablesQuery,
  usePrevisualizarXmlMutation,
  useRegistrarXmlMutation,
  type ArchivoPrevio,
  type ArchivoXml,
  type LineaPrevia,
  type ResolucionLinea,
  type ResultadoRegistro,
} from './importacionApi';
import base from '../manualJournalEntries/Asientos.module.scss';
import styles from './ImportarXml.module.scss';

/** Qué es una línea del XML. Se decide una vez por emisor y artículo. */
interface Decision {
  tipo: 'producto' | 'servicio';
  modo: 'existente' | 'nuevo';
  idProducto: number | null;
  factor: string;
  nombre: string;
  idCategoria: number | null;
  unidad: string;
  cuenta: CuentaElegida | null;
  idArea: number | null;
  origen: string | null;
  /** Las sugerencias por nombre parecido se confirman a mano */
  confirmada: boolean;
}

const TIPO: Record<string, string> = {
  '01': 'Factura',
  '03': 'Boleta',
  '07': 'Nota de crédito',
  '08': 'Nota de débito',
};

const UNIDAD: Record<string, string> = {
  NIU: 'unidad',
  KGM: 'kg',
  GRM: 'gramo',
  BX: 'caja',
  PK: 'paquete',
  DZN: 'docena',
  LTR: 'litro',
  GLL: 'galón',
  MTR: 'metro',
  TNE: 'tonelada',
};

const ORIGEN: Record<string, string> = {
  equivalencia: 'Recordado',
  codigo: 'Por código',
  gtin: 'Por código de barras',
  nombre: 'Nombre parecido: confírmalo',
};

const claveDe = (a: ArchivoPrevio, l: LineaPrevia) => `${a.documento?.emisor.numeroDocumento}|${l.clave}`;

/** Unidad legible para un producto nuevo */
const unidadDe = (u: string) => UNIDAD[u] ?? 'unidad';

function decisionInicial(l: LineaPrevia): Decision {
  const d: Decision = {
    tipo: l.unidad === 'ZZ' ? 'servicio' : 'producto',
    modo: 'existente',
    idProducto: null,
    factor: '1',
    nombre: l.descripcion.slice(0, 255),
    idCategoria: null,
    unidad: unidadDe(l.unidad),
    cuenta: null,
    idArea: null,
    origen: null,
    confirmada: true,
  };
  const s = l.sugerencia;
  if (s?.tipo === 'producto') {
    return { ...d, tipo: 'producto', idProducto: s.idProducto, factor: String(s.factor), origen: s.origen, confirmada: s.segura };
  }
  if (s?.tipo === 'servicio') {
    return { ...d, tipo: 'servicio', cuenta: { codigo: s.codigoCuenta, nombre: '' }, idArea: s.idArea, origen: s.origen };
  }
  return d;
}

function pendiente(d: Decision | undefined): string {
  if (!d) return 'Decide qué es';
  if (d.tipo === 'servicio') return d.cuenta ? '' : 'Elige la cuenta';
  if (!(Number(d.factor) > 0)) return 'Factor inválido';
  if (d.modo === 'nuevo') {
    if (d.nombre.trim().length < 3) return 'Nombre del producto';
    if (!d.idCategoria) return 'Elige la categoría';
    return '';
  }
  if (!d.idProducto) return 'Elige el producto';
  return d.confirmada ? '' : 'Confirma la sugerencia';
}

export const ImportarXmlPage: React.FC<{ desde: 'compras' | 'ventas' }> = ({ desde }) => (
  <ToastProvider>
    <ImportarXml desde={desde} />
  </ToastProvider>
);

const ImportarXml: React.FC<{ desde: 'compras' | 'ventas' }> = ({ desde }) => {
  const navigate = useNavigate();
  const toast = useToast();
  const volver = `${MAIN_ROUTES.TRANSACTIONS}${desde === 'compras' ? TRANSACTIONS_ROUTES.PURCHASES : TRANSACTIONS_ROUTES.SALES}`;

  const [previsualizar, { isLoading: leyendo }] = usePrevisualizarXmlMutation();
  const [registrarXml, { isLoading: registrando }] = useRegistrarXmlMutation();
  const productos = useGetProductsQuery();
  const categorias = useGetCategoriesQuery();
  const almacenes = useGetWarehousesQuery();
  const areas = useGetAreasContablesQuery();

  const [archivos, setArchivos] = useState<ArchivoXml[]>([]);
  const [previa, setPrevia] = useState<ArchivoPrevio[] | null>(null);
  const [decisiones, setDecisiones] = useState<Record<string, Decision>>({});
  const [incluidos, setIncluidos] = useState<Set<number>>(new Set());
  const [tiposCambio, setTiposCambio] = useState<Record<number, string>>({});
  const [idAlmacen, setIdAlmacen] = useState<number | null>(null);
  const [recordar, setRecordar] = useState(true);
  const [resultados, setResultados] = useState<ResultadoRegistro[] | null>(null);
  const [errores, setErrores] = useState<string[]>([]);
  const [arrastrando, setArrastrando] = useState(false);
  const entrada = useRef<HTMLInputElement>(null);

  const listaProductos = useMemo(
    () => (productos.data ?? []).filter((p) => p.tipo === 'producto' && p.estado),
    [productos.data],
  );
  const categoriasProducto = (categorias.data ?? []).filter((c) => c.tipo === 'producto' && c.estado);
  const areasActivas = (areas.data ?? []).filter((a) => a.activa);

  const leer = async (lista: ArchivoXml[]) => {
    setErrores([]);
    setResultados(null);
    try {
      const r = await previsualizar({ archivos: lista }).unwrap();
      setArchivos(lista);
      setPrevia(r);
      setIncluidos(new Set(r.flatMap((a, i) => (a.valido ? [i] : []))));
      setTiposCambio(Object.fromEntries(r.flatMap((a, i) => (a.tipoCambio ? [[i, String(a.tipoCambio)]] : []))));
      // Lo ya decidido en esta sesión se respeta; lo nuevo parte de la sugerencia
      setDecisiones((prev) => {
        const sig = { ...prev };
        for (const a of r) for (const l of a.lineas) sig[claveDe(a, l)] ??= decisionInicial(l);
        return sig;
      });
    } catch (e) {
      setErrores(erroresDe(e, 'No se pudieron leer los archivos.'));
    }
  };

  const agregar = async (files: FileList | null) => {
    const xml = Array.from(files ?? []).filter((f) => /\.xml$/i.test(f.name));
    if (!xml.length) {
      setErrores(['Elige archivos .xml de comprobantes electrónicos.']);
      return;
    }
    if (xml.length > 200) {
      setErrores(['Puedes subir hasta 200 XML por carga.']);
      return;
    }
    const nuevos = await Promise.all(xml.map(async (f) => ({ nombre: f.name, contenido: await aBase64(f) })));
    await leer(nuevos);
  };

  const cambiar = (clave: string, cambio: Partial<Decision>) =>
    setDecisiones((ds) => ({ ...ds, [clave]: { ...ds[clave], ...cambio } }));

  const elegidos = (previa ?? []).map((a, i) => ({ a, i })).filter(({ i }) => incluidos.has(i));
  const pendientes = elegidos.reduce(
    (n, { a }) => n + a.lineas.filter((l) => pendiente(decisiones[claveDe(a, l)])).length,
    0,
  );
  const faltaTc = elegidos.filter(({ a, i }) => a.documento?.moneda === 'USD' && !(Number(tiposCambio[i]) > 0));
  const hayProductos = elegidos.some(({ a }) =>
    a.lineas.some((l) => decisiones[claveDe(a, l)]?.tipo === 'producto'),
  );
  const faltaAlmacen = hayProductos && !idAlmacen;
  const listo = elegidos.length > 0 && pendientes === 0 && faltaTc.length === 0 && !faltaAlmacen;

  const registrar = async () => {
    if (!previa || !listo) return;
    setErrores([]);
    const payload = elegidos.map(({ a, i }) => ({
      ...archivos[i],
      tipoCambio: a.documento?.moneda === 'USD' ? Number(tiposCambio[i]) : undefined,
      lineas: a.lineas.map((l): ResolucionLinea => {
        const d = decisiones[claveDe(a, l)];
        if (d.tipo === 'servicio') {
          return { orden: l.orden, tipo: 'servicio', codigoCuenta: d.cuenta!.codigo, idArea: d.idArea ?? undefined, recordar };
        }
        return {
          orden: l.orden,
          tipo: 'producto',
          factor: Number(d.factor),
          recordar,
          ...(d.modo === 'nuevo'
            ? { nuevoProducto: { nombre: d.nombre.trim(), idCategoria: d.idCategoria!, unidadMedida: d.unidad } }
            : { idProducto: d.idProducto! }),
        };
      }),
    }));
    try {
      const r = await registrarXml({ idAlmacen: idAlmacen ?? undefined, archivos: payload }).unwrap();
      setResultados(r);
      const ok = r.filter((x) => x.ok).length;
      toast(`${ok} de ${r.length} comprobantes registrados`);
    } catch (e) {
      setErrores(erroresDe(e));
    }
  };

  const reiniciar = () => {
    setArchivos([]);
    setPrevia(null);
    setResultados(null);
    setErrores([]);
  };

  /* ---------- Resultado ---------- */
  if (resultados) {
    const fallidos = resultados.filter((r) => !r.ok);
    return (
      <div className={base.pagina}>
        <Encabezado volver={() => navigate(volver)} desde={desde} />
        <section className={cx(base.card, styles.resultado)}>
          <span className={base.cardTitle}>
            {resultados.length - fallidos.length} de {resultados.length} comprobantes registrados
          </span>
          <ul className={styles.listaResultado}>
            {resultados.map((r) => (
              <li key={r.nombre} className={r.ok ? styles.ok : styles.mal}>
                {r.ok ? <LuCircleCheck /> : <LuCircleAlert />}
                <b>{r.serieNumero ?? r.nombre}</b>
                <span>{r.ok ? `Registrado como ${r.correlativo}` : r.error}</span>
              </li>
            ))}
          </ul>
          <div className={base.botonesFin}>
            {fallidos.length > 0 && (
              <button
                type="button"
                className={base.btnSecondary}
                onClick={() => void leer(archivos.filter((f) => fallidos.some((x) => x.nombre === f.nombre)))}
              >
                Revisar los que fallaron
              </button>
            )}
            <button type="button" className={base.btnSecondary} onClick={reiniciar}>
              Cargar más XML
            </button>
            <button type="button" className={base.btnPrimary} onClick={() => navigate(volver)}>
              Ver {desde}
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={base.pagina}>
      <Encabezado volver={() => navigate(volver)} desde={desde} />

      {/* ---------- Subida ---------- */}
      <section
        className={cx(base.card, styles.zona, arrastrando && styles.zonaActiva, previa && styles.zonaCompacta)}
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
          <b>{previa ? `${previa.length} archivos leídos` : 'Arrastra aquí los XML de tus facturas, boletas y notas'}</b>
          <span>
            Compras y ventas se reconocen por tu RUC. Las notas de crédito y débito se registran después de su
            comprobante.
          </span>
        </div>
        <button type="button" className={base.btnSecondary} disabled={leyendo} onClick={() => entrada.current?.click()}>
          {leyendo ? 'Leyendo…' : previa ? 'Cambiar archivos' : 'Elegir archivos'}
        </button>
        <input
          ref={entrada}
          type="file"
          accept=".xml,text/xml,application/xml"
          multiple
          hidden
          onChange={(e) => {
            void agregar(e.target.files);
            e.target.value = '';
          }}
        />
      </section>

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

      {previa && (
        <>
          {/* ---------- Opciones de la carga ---------- */}
          <section className={cx(base.card, styles.opciones)}>
            <label className={base.campo}>
              <span>Almacén de la carga</span>
              <select
                className={cx(base.input, faltaAlmacen && base.inputError)}
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
              <span className={base.hint}>
                La próxima vez que llegue el mismo artículo del mismo emisor se completa solo.
              </span>
            </div>
          </section>

          {/* ---------- Archivos ---------- */}
          {previa.map((a, i) => (
            <TarjetaArchivo
              key={`${a.nombre}-${i}`}
              archivo={a}
              incluido={incluidos.has(i)}
              onIncluir={(v) =>
                setIncluidos((s) => {
                  const n = new Set(s);
                  if (v) n.add(i);
                  else n.delete(i);
                  return n;
                })
              }
              tipoCambio={tiposCambio[i] ?? ''}
              onTipoCambio={(v) => setTiposCambio((t) => ({ ...t, [i]: v }))}
            >
              {a.lineas.map((l) => {
                const k = claveDe(a, l);
                return (
                  <FilaLinea
                    key={l.orden}
                    linea={l}
                    moneda={a.documento?.moneda ?? 'PEN'}
                    decision={decisiones[k]}
                    marcar={incluidos.has(i)}
                    productos={listaProductos}
                    categorias={categoriasProducto}
                    areas={areasActivas}
                    onChange={(c) => cambiar(k, c)}
                  />
                );
              })}
            </TarjetaArchivo>
          ))}

          <div className={base.barraGuardar}>
            <span className={base.barraTexto}>
              {elegidos.length === 0
                ? 'No hay comprobantes para registrar.'
                : faltaAlmacen
                  ? 'Elige el almacén de la carga.'
                  : faltaTc.length
                    ? `Falta el tipo de cambio en ${faltaTc.length} comprobante(s) en dólares.`
                    : pendientes
                      ? `${pendientes} línea(s) por resolver.`
                      : `${elegidos.length} comprobante(s) listos.`}
            </span>
            <div className={base.botonesFin}>
              <button
                type="button"
                className={base.btnPrimary}
                disabled={!listo || registrando}
                onClick={() => void registrar()}
              >
                {registrando ? 'Registrando…' : `Registrar ${elegidos.length}`}
              </button>
              <button type="button" className={base.btnSecondary} onClick={reiniciar}>
                Cancelar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const Encabezado: React.FC<{ volver: () => void; desde: 'compras' | 'ventas' }> = ({ volver, desde }) => (
  <div className={base.header}>
    <div className={base.headerTexto}>
      <button type="button" className={base.volver} onClick={volver}>
        <LuArrowLeft /> {desde === 'compras' ? 'Compras' : 'Ventas'}
      </button>
      <h1 className={base.titulo}>Cargar XML</h1>
      <span className={base.subtitulo}>
        Registra de una vez los comprobantes electrónicos (UBL 2.1 de SUNAT). Revisa cada uno antes de registrar.
      </span>
    </div>
  </div>
);

const TarjetaArchivo: React.FC<{
  archivo: ArchivoPrevio;
  incluido: boolean;
  onIncluir: (v: boolean) => void;
  tipoCambio: string;
  onTipoCambio: (v: string) => void;
  children: React.ReactNode;
}> = ({ archivo: a, incluido, onIncluir, tipoCambio, onTipoCambio, children }) => {
  const d = a.documento;
  return (
    <section className={cx(base.card, styles.archivo, !incluido && styles.archivoFuera)}>
      <div className={styles.archivoCab}>
        <LuFileCode className={styles.archivoIcono} />
        <div className={styles.archivoTitulo}>
          <b>{d ? `${TIPO[d.tipoComprobante]} ${d.serie}-${d.numero}` : a.nombre}</b>
          {d && a.contraparte && (
            <span>
              {a.contraparte.razonSocial} · {a.contraparte.numeroDocumento} · {d.fechaEmision}
            </span>
          )}
        </div>
        {a.operacion && (
          <span className={cx(base.badge, a.operacion === 'compra' ? base.tonoNeutral : base.tonoSuccess)}>
            {a.operacion === 'compra' ? 'Compra' : 'Venta'}
          </span>
        )}
        {d && (
          <b className={styles.archivoTotal}>
            {d.moneda === 'USD' ? 'US$ ' : 'S/ '}
            {importe(d.totales.total)}
          </b>
        )}
        {a.valido && <Switch on={incluido} label="Incluir en la carga" onChange={onIncluir} />}
      </div>

      {(a.errores.length > 0 || a.avisos.length > 0) && (
        <ul className={styles.mensajes}>
          {a.errores.map((m) => (
            <li key={m} className={styles.msgError}>
              <LuCircleAlert /> {m}
            </li>
          ))}
          {a.avisos.map((m) => (
            <li key={m} className={styles.msgAviso}>
              <LuTriangleAlert /> {m}
            </li>
          ))}
        </ul>
      )}

      {a.valido && d?.moneda === 'USD' && (
        <label className={cx(base.campo, styles.tc)}>
          <span>Tipo de cambio del {d.fechaEmision}</span>
          <input
            className={cx(base.input, base.inputImporte, incluido && !(Number(tipoCambio) > 0) && base.inputError)}
            inputMode="decimal"
            placeholder="3.750"
            value={tipoCambio}
            onChange={(e) => onTipoCambio(e.target.value.replace(',', '.').replace(/[^\d.]/g, ''))}
          />
        </label>
      )}

      {a.valido && a.lineas.length > 0 && <div className={styles.lineas}>{children}</div>}
    </section>
  );
};

const FilaLinea: React.FC<{
  linea: LineaPrevia;
  moneda: string;
  decision: Decision | undefined;
  marcar: boolean;
  productos: { id: number; nombre: string; codigo: string; unidadMedida: string }[];
  categorias: { id: number; nombre: string }[];
  areas: { id: number; nombre: string }[];
  onChange: (c: Partial<Decision>) => void;
}> = ({ linea: l, moneda, decision: d, marcar, productos, categorias, areas, onChange }) => {
  const falta = marcar ? pendiente(d) : '';
  const etiqueta = (p: { codigo: string; nombre: string }) => (p.codigo ? `${p.codigo} · ${p.nombre}` : p.nombre);
  const elegido = productos.find((p) => p.id === d?.idProducto);
  const [texto, setTexto] = useState<string | null>(null);
  const listaId = `productos-${l.clave}`;
  if (!d) return null;
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
        <div className={base.segmento} role="group" aria-label="Tipo de línea">
          {(['producto', 'servicio'] as const).map((t) => (
            <button
              key={t}
              type="button"
              className={cx(d.tipo === t && base.segmentoOn)}
              onClick={() => onChange({ tipo: t, confirmada: true })}
            >
              {t === 'producto' ? 'Producto' : 'Gasto o servicio'}
            </button>
          ))}
        </div>

        {d.tipo === 'producto' ? (
          <div className={styles.controles}>
            {d.modo === 'existente' ? (
              <>
                <input
                  className={cx(base.input, styles.crece, falta && !d.idProducto && base.inputError)}
                  list={listaId}
                  placeholder="Buscar producto por código o nombre"
                  value={texto ?? (elegido ? etiqueta(elegido) : '')}
                  onChange={(e) => {
                    const v = e.target.value;
                    setTexto(v);
                    const p = productos.find((x) => etiqueta(x) === v);
                    if (p) {
                      onChange({ idProducto: p.id, confirmada: true, origen: null });
                      setTexto(null);
                    }
                  }}
                  onBlur={() => setTexto(null)}
                />
                <datalist id={listaId}>
                  {productos.map((p) => (
                    <option key={p.id} value={etiqueta(p)} />
                  ))}
                </datalist>
              </>
            ) : (
              <>
                <input
                  className={cx(base.input, styles.crece)}
                  value={d.nombre}
                  maxLength={255}
                  aria-label="Nombre del producto nuevo"
                  onChange={(e) => onChange({ nombre: e.target.value })}
                />
                <select
                  className={cx(base.input, styles.medio, falta && !d.idCategoria && base.inputError)}
                  value={d.idCategoria ?? ''}
                  aria-label="Categoría"
                  onChange={(e) => onChange({ idCategoria: e.target.value ? Number(e.target.value) : null })}
                >
                  <option value="">Categoría</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
                <input
                  className={cx(base.input, styles.corto)}
                  value={d.unidad}
                  maxLength={50}
                  aria-label="Unidad del producto"
                  onChange={(e) => onChange({ unidad: e.target.value })}
                />
              </>
            )}
            <label className={styles.factor} title="Unidades tuyas por cada unidad del XML">
              <span>
                1 {l.unidad} =
              </span>
              <input
                className={cx(base.input, base.inputImporte, styles.mini)}
                inputMode="decimal"
                value={d.factor}
                aria-label="Factor de conversión"
                onChange={(e) => onChange({ factor: e.target.value.replace(',', '.').replace(/[^\d.]/g, '') })}
              />
              <span>{d.modo === 'nuevo' ? d.unidad : (elegido?.unidadMedida ?? 'und.')}</span>
            </label>
            <button
              type="button"
              className={base.btnLink}
              onClick={() =>
                onChange({
                  modo: d.modo === 'nuevo' ? 'existente' : 'nuevo',
                  confirmada: true,
                  idCategoria: d.idCategoria ?? categorias[0]?.id ?? null,
                })
              }
            >
              {d.modo === 'nuevo' ? 'Elegir existente' : 'Crear producto'}
            </button>
          </div>
        ) : (
          <div className={styles.controles}>
            <div className={styles.crece}>
              <CuentaSelector
                valor={d.cuenta}
                error={!!falta && !d.cuenta}
                onChange={(c) => onChange({ cuenta: c, origen: null })}
              />
            </div>
            <select
              className={cx(base.input, styles.medio)}
              value={d.idArea ?? ''}
              aria-label="Área"
              onChange={(e) => onChange({ idArea: e.target.value ? Number(e.target.value) : null })}
            >
              <option value="">Sin área</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

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
