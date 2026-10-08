import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LuArrowDownRight,
  LuArrowRight,
  LuArrowUpRight,
  LuBuilding2,
  LuCalculator,
  LuCalendar,
  LuChartColumn,
  LuCircleCheck,
  LuClipboardList,
  LuCloudOff,
  LuPackage,
  LuPackageX,
  LuPercent,
  LuPlus,
  LuReceipt,
  LuRotateCw,
  LuShoppingCart,
  LuTrendingUp,
  LuTriangleAlert,
} from 'react-icons/lu';
import { PageLayout, Text } from '@/components';
import { useAuth } from '@/domains/auth';
import {
  COMMON_ROUTES,
  FINANCIAL_STATEMENTS_ROUTES,
  INVENTORY_ROUTES,
  MAIN_ROUTES,
  TRANSACTIONS_ROUTES,
} from '@/router';
import { useGetDashboardQuery, type DashboardData, type KpiComprobantes } from './dashboardApi';
import { Grafico } from './Grafico';
import { fecha, iniciales, MESES, nombreMes, numero, porcentaje, soles } from './formato';
import styles from './Dashboard.module.scss';

const RUTAS = {
  nuevaCompra: `${MAIN_ROUTES.TRANSACTIONS}${TRANSACTIONS_ROUTES.PURCHASES}${COMMON_ROUTES.REGISTER}`,
  nuevaVenta: `${MAIN_ROUTES.TRANSACTIONS}${TRANSACTIONS_ROUTES.SALES}${COMMON_ROUTES.REGISTER}`,
  kardex: `${MAIN_ROUTES.INVENTORY}${INVENTORY_ROUTES.KARDEX}`,
  costoVentas: `${MAIN_ROUTES.FINANCIAL_STATEMENTS}${FINANCIAL_STATEMENTS_ROUTES.COST_OF_SALES_STATEMENT}`,
};

const COLORES_ALMACEN = ['var(--chart-1)', 'var(--accent)', 'var(--chart-2)', 'var(--text-3)'];
const MAX_ALERTAS = 4;

/** Mes actual en Lima, 'YYYY-MM'. */
const mesActual = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' }).slice(0, 7);

const saludo = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
};

type Estado = 'cargando' | 'error' | 'ok';

/* ---------- Piezas comunes ---------- */

const Card: React.FC<{ className?: string; children: React.ReactNode }> = ({ className = '', children }) => (
  <section className={`${styles.card} ${className}`}>{children}</section>
);

const Skeleton: React.FC<{ lineas: string[]; alto?: number }> = ({ lineas, alto = 12 }) => (
  <>
    {lineas.map((ancho, i) => (
      <div key={i} className={styles.skeleton} style={{ width: ancho, height: i === 1 && alto === 12 ? 28 : alto }} />
    ))}
  </>
);

const Reintentar: React.FC<{ titulo: string; onRetry: () => void; compacto?: boolean }> = ({
  titulo,
  onRetry,
  compacto,
}) => (
  <div className={compacto ? styles.errorCompacto : styles.errorBloque}>
    {compacto ? (
      <span className={styles.kpiLabel}>
        <LuCloudOff className={styles.errorIcon} />
        {titulo}
      </span>
    ) : (
      <div className={`${styles.circulo} ${styles.circuloError}`}>
        <LuCloudOff />
      </div>
    )}
    <span className={compacto ? styles.textoSecundario : styles.estadoTitulo}>
      {compacto ? 'No se pudo cargar.' : `No se pudo cargar ${titulo}`}
    </span>
    {!compacto && <span className={styles.textoSecundario}>El resto del panel sigue disponible. Inténtalo de nuevo.</span>}
    <button type="button" className={styles.botonSecundario} onClick={onRetry}>
      <LuRotateCw />
      Reintentar
    </button>
  </div>
);

/* ---------- Indicadores ---------- */

interface KpiProps {
  titulo: string;
  icono: React.ReactNode;
  tono: 'accent' | 'neutral' | 'success' | 'warning';
  estado: Estado;
  onRetry: () => void;
  /** Píldora a la derecha del título */
  etiqueta?: React.ReactNode;
  children?: React.ReactNode;
}

const Kpi: React.FC<KpiProps> = ({ titulo, icono, tono, estado, onRetry, etiqueta, children }) => (
  <Card className={styles.kpi}>
    {estado === 'cargando' && <Skeleton lineas={['50%', '80%', '60%']} />}
    {estado === 'error' && <Reintentar compacto titulo={titulo} onRetry={onRetry} />}
    {estado === 'ok' && (
      <>
        <div className={styles.kpiHead}>
          <span className={`${styles.kpiIcon} ${styles[`tono_${tono}`]}`}>{icono}</span>
          <span className={styles.kpiLabel}>{titulo}</span>
          {etiqueta}
        </div>
        {children}
      </>
    )}
  </Card>
);

/** Píldora de variación vs. el mes anterior. */
const Variacion: React.FC<{ kpi: KpiComprobantes; neutral?: boolean }> = ({ kpi, neutral }) => {
  if (kpi.variacion === null) return null;
  const sube = kpi.variacion >= 0;
  const tono = neutral ? styles.pillNeutral : sube ? styles.pillSuccess : styles.pillError;
  return (
    <span className={`${styles.pill} ${tono}`}>
      {sube ? <LuArrowUpRight /> : <LuArrowDownRight />}
      {porcentaje(Math.abs(kpi.variacion))}
    </span>
  );
};

function notaComprobantes(kpi: KpiComprobantes, mesAnterior: string): React.ReactNode {
  if (kpi.cantidad === 0) return 'Sin comprobantes';
  const n = `${numero(kpi.cantidad)} comprobante${kpi.cantidad === 1 ? '' : 's'}`;
  return kpi.variacion === null ? (
    n
  ) : (
    <>
      <span className={styles.soloAncho}>vs. {mesAnterior.toLowerCase()} · </span>
      {n}
    </>
  );
}

/* ---------- Página ---------- */

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const esAdmin = user?.roles?.some((r) => r.nombre === 'ADMIN');
  return esAdmin ? <DashboardAdmin nombre={user?.nombre} /> : <DashboardEmpresa />;
};

/** El administrador no tiene empresa: por ahora solo un saludo. */
const DashboardAdmin: React.FC<{ nombre?: string }> = ({ nombre }) => (
  <PageLayout title="Panel de control" subtitle="Administración de empresas y usuarios">
    <Text size="lg" color="neutral-primary">
      {saludo()}
      {nombre ? `, ${nombre}` : ''}. Gestiona las empresas desde Configuración → Usuarios.
    </Text>
  </PageLayout>
);

const DashboardEmpresa: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mes, setMes] = useState(mesActual);
  const [tab, setTab] = useState<'clientes' | 'proveedores'>('clientes');
  const { data, isLoading, isFetching, isError, refetch } = useGetDashboardQuery(mes);

  const estado: Estado = isError ? 'error' : isLoading || (isFetching && !data) ? 'cargando' : 'ok';
  const [año, numMes] = mes.split('-');
  const años = useMemo(() => {
    const actual = Number(mesActual().slice(0, 4));
    return [actual - 2, actual - 1, actual];
  }, []);

  const d = estado === 'ok' ? data : undefined;
  const vacio =
    !!d &&
    d.ultimosMovimientos.length === 0 &&
    d.serieMensual.every((m) => m.ventas === 0 && m.compras === 0);
  const nombreUsuario = user?.nombre?.split(' ')[0];
  const empresa = user?.persona;

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <span className={styles.saludo}>
            {saludo()}
            {nombreUsuario ? `, ${nombreUsuario}` : ''}
          </span>
          <h1 className={styles.titulo}>{empresa?.razonSocial || empresa?.nombreEmpresa || 'Mi empresa'}</h1>
          {empresa?.ruc && (
            <div className={styles.chips}>
              <span className={styles.chipRuc}>
                <LuBuilding2 />
                RUC {empresa.ruc}
              </span>
            </div>
          )}
        </div>
        <div className={styles.headerActions}>
          <ChipPeriodo data={d} mes={mes} />
          <div className={styles.selector}>
            <LuCalendar className={styles.selectorIcon} />
            <select
              aria-label="Mes"
              value={numMes}
              onChange={(e) => setMes(`${año}-${e.target.value}`)}
            >
              {MESES.map((m, i) => (
                <option key={m} value={String(i + 1).padStart(2, '0')}>
                  {m}
                </option>
              ))}
            </select>
            <span className={styles.selectorSep} />
            <select aria-label="Año" value={año} onChange={(e) => setMes(`${e.target.value}-${numMes}`)}>
              {años.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div className={styles.grid}>
        {vacio && (
          <div className={styles.banner}>
            <div className={styles.bannerRing} />
            <div className={styles.bannerText}>
              <span className={styles.bannerEyebrow}>Sin movimientos en los últimos 12 meses</span>
              <span className={styles.bannerTitle}>Tu panel se llenará con tu primer comprobante</span>
              <span className={styles.bannerBody}>
                Registra una compra para empezar a valorizar tu inventario y ver ventas, IGV y márgenes del
                periodo.
              </span>
            </div>
            <button type="button" className={styles.bannerButton} onClick={() => navigate(RUTAS.nuevaCompra)}>
              <LuPlus />
              Registra tu primera compra
            </button>
          </div>
        )}

        <KpisDelMes data={d} estado={estado} onRetry={refetch} mes={mes} />

        <Card className={styles.chartCard}>
          <div className={styles.cardHeadWrap}>
            <div className={styles.cardHeadText}>
              <span className={styles.cardTitle}>Ventas vs. compras</span>
              <span className={styles.cardSubtitle}>Últimos 12 meses · en soles, sin IGV</span>
            </div>
            <div className={styles.legend}>
              <span><i className={styles.dotVentas} />Ventas</span>
              <span><i className={styles.dotCompras} />Compras</span>
            </div>
          </div>
          {estado === 'cargando' && (
            <div className={styles.chartSkeleton}>
              {[40, 55, 70, 50, 62, 45, 75, 58].map((h, i) => (
                <div key={i} className={styles.skeleton} style={{ height: `${h}%` }} />
              ))}
            </div>
          )}
          {estado === 'error' && <Reintentar titulo="el gráfico" onRetry={refetch} />}
          {d && (vacio ? (
            <div className={styles.vacioBloque}>
              <div className={styles.circulo}><LuChartColumn /></div>
              <span className={styles.estadoTitulo}>Aún no hay movimientos</span>
              <span className={styles.textoSecundario}>
                Aquí verás la evolución mensual de tus ventas y compras.
              </span>
            </div>
          ) : (
            <Grafico serie={d.serieMensual} />
          ))}
        </Card>

        <Inventario data={d} estado={estado} onRetry={refetch} />
        <Periodo data={d} estado={estado} onRetry={refetch} />
        <Alertas data={d} estado={estado} onRetry={refetch} irKardex={() => navigate(RUTAS.kardex)} />

        <Card className={styles.side}>
          <span className={styles.cardTitle}>Accesos rápidos</span>
          <div className={styles.accesos}>
            <button type="button" className={styles.accesoPrimario} onClick={() => navigate(RUTAS.nuevaCompra)}>
              <LuShoppingCart />
              Nueva compra
            </button>
            <button type="button" className={styles.acceso} onClick={() => navigate(RUTAS.nuevaVenta)}>
              <LuReceipt />
              Nueva venta
            </button>
            <button type="button" className={styles.acceso} onClick={() => navigate(RUTAS.kardex)}>
              <LuClipboardList />
              Kardex
            </button>
            <button type="button" className={styles.acceso} onClick={() => navigate(RUTAS.costoVentas)}>
              <LuCalculator />
              Costo de ventas
            </button>
          </div>
        </Card>

        <TopProductos data={d} estado={estado} onRetry={refetch} mes={mes} />

        <Card className={styles.half}>
          <div className={styles.cardHeadWrap}>
            <span className={styles.cardTitle}>Top 5</span>
            <div className={styles.segmented} role="tablist">
              {(['clientes', 'proveedores'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={tab === t}
                  className={tab === t ? styles.segmentOn : ''}
                  onClick={() => setTab(t)}
                >
                  {t === 'clientes' ? 'Clientes' : 'Proveedores'}
                </button>
              ))}
            </div>
          </div>
          <Ranking data={d} estado={estado} onRetry={refetch} tab={tab} />
        </Card>

        <Movimientos data={d} estado={estado} onRetry={refetch} />
      </div>
    </div>
  );
};

interface BloqueProps {
  data?: DashboardData;
  estado: Estado;
  onRetry: () => void;
}

const ChipPeriodo: React.FC<{ data?: DashboardData; mes: string }> = ({ data, mes }) => {
  if (!data) return null;
  const { idPeriodoContable, cerrado } = data.periodo;
  const [clase, texto] = !idPeriodoContable
    ? [styles.chipWarning, 'Sin periodo contable']
    : cerrado
      ? [styles.chipNeutral, 'Periodo cerrado']
      : [styles.chipSuccess, 'Periodo activo'];
  return (
    <span className={`${styles.chipPeriodo} ${clase}`}>
      <span className={styles.chipDot} />
      {texto} · {nombreMes(mes)}
    </span>
  );
};

const KpisDelMes: React.FC<BloqueProps & { mes: string }> = ({ data, estado, onRetry, mes }) => {
  const k = data?.kpis;
  const anterior = MESES[(Number(mes.slice(5)) + 10) % 12];

  // Margen del mes anterior para la diferencia en puntos porcentuales
  let ppTexto: string | null = null;
  if (data && k?.margen.porcentaje != null) {
    const previo = data.serieMensual[data.serieMensual.length - 2];
    if (previo && previo.ventas > 0) {
      const pp = k.margen.porcentaje - ((previo.ventas - previo.costoVentas) / previo.ventas) * 100;
      ppTexto = `${pp >= 0 ? '+' : '−'}${Math.abs(pp).toFixed(1).replace('.', ',')} pp`;
    }
  }
  const igvAPagar = (k?.igv.saldo ?? 0) > 0.004;
  const igvAFavor = (k?.igv.saldo ?? 0) < -0.004;
  const igvTag = igvAPagar ? 'A pagar' : igvAFavor ? 'Saldo a favor' : 'Sin saldo';
  const igvClase = igvAPagar ? styles.pillWarning : igvAFavor ? styles.pillSuccess : styles.pillNeutral;

  return (
    <>
      <Kpi titulo="Ventas del mes" icono={<LuTrendingUp />} tono="accent" estado={estado} onRetry={onRetry}>
        {k && (
          <>
            <span className={styles.kpiNum}>{soles(k.ventas.total)}</span>
            <div className={styles.kpiFoot}>
              <Variacion kpi={k.ventas} />
              <span className={styles.kpiNota}>{notaComprobantes(k.ventas, anterior)}</span>
            </div>
          </>
        )}
      </Kpi>
      <Kpi titulo="Compras del mes" icono={<LuShoppingCart />} tono="neutral" estado={estado} onRetry={onRetry}>
        {k && (
          <>
            <span className={styles.kpiNum}>{soles(k.compras.total)}</span>
            <div className={styles.kpiFoot}>
              <Variacion kpi={k.compras} neutral />
              <span className={styles.kpiNota}>{notaComprobantes(k.compras, anterior)}</span>
            </div>
          </>
        )}
      </Kpi>
      <Kpi titulo="Margen bruto" icono={<LuPercent />} tono="success" estado={estado} onRetry={onRetry}>
        {k && (
          <>
            <span className={styles.kpiNum}>{soles(k.margen.monto)}</span>
            <div className={styles.kpiFoot}>
              <span className={`${styles.pill} ${styles.pillActive}`}>
                {k.margen.porcentaje === null ? '—' : porcentaje(k.margen.porcentaje)}
              </span>
              <span className={styles.kpiNota}>
                {k.margen.porcentaje === null ? (
                  'Sin ventas'
                ) : ppTexto ? (
                  <>
                    {ppTexto}
                    <span className={styles.soloAncho}> vs. {anterior.toLowerCase()}</span>
                  </>
                ) : (
                  `Costo ${soles(k.costoVentas)}`
                )}
              </span>
            </div>
          </>
        )}
      </Kpi>
      <Kpi
        titulo="IGV del mes"
        icono={<LuReceipt />}
        tono="warning"
        estado={estado}
        onRetry={onRetry}
        etiqueta={k && <span className={`${styles.pill} ${igvClase} ${styles.igvTag}`}>{igvTag}</span>}
      >
        {k && (
          <>
            <span className={styles.kpiNum}>{soles(Math.abs(k.igv.saldo))}</span>
            <div className={styles.igvDetalle}>
              <div>
                <span>Débito (ventas)</span>
                <b>{soles(k.igv.ventas)}</b>
              </div>
              <div>
                <span>Crédito (compras)</span>
                <b>{soles(-k.igv.compras)}</b>
              </div>
            </div>
            <span className={`${styles.igvTagMovil} ${igvClase}`}>{igvTag}</span>
          </>
        )}
      </Kpi>
    </>
  );
};

const Inventario: React.FC<BloqueProps> = ({ data, estado, onRetry }) => {
  const inv = data?.inventario;
  return (
    <Card className={styles.side}>
      <div className={styles.cardHead}>
        <span className={styles.cardTitle}>Valor del inventario</span>
        <LuPackage className={styles.cardHeadIcon} />
      </div>
      {estado === 'cargando' && <Skeleton lineas={['70%', '100%', '85%', '75%']} alto={14} />}
      {estado === 'error' && <Reintentar compacto titulo="Inventario" onRetry={onRetry} />}
      {inv && (
        <>
          <div className={styles.invTotal}>
            <span>{soles(inv.valorTotal)}</span>
            <span className={styles.kpiNota}>
              {numero(inv.productosConStock)} producto{inv.productosConStock === 1 ? '' : 's'} con stock
            </span>
          </div>
          <div className={styles.stackBar}>
            {inv.porAlmacen.map((a, i) =>
              inv.valorTotal > 0 && a.valor > 0 ? (
                <div
                  key={a.idAlmacen}
                  style={{
                    width: `${(a.valor / inv.valorTotal) * 100}%`,
                    background: COLORES_ALMACEN[Math.min(i, COLORES_ALMACEN.length - 1)],
                  }}
                />
              ) : null,
            )}
          </div>
          <div className={styles.lista}>
            {inv.porAlmacen.map((a, i) => (
              <div key={a.idAlmacen} className={styles.almacen}>
                <i style={{ background: COLORES_ALMACEN[Math.min(i, COLORES_ALMACEN.length - 1)] }} />
                <span className={styles.truncar}>{a.nombre}</span>
                <b>{soles(a.valor)}</b>
              </div>
            ))}
            {inv.porAlmacen.length === 0 && <span className={styles.kpiNota}>Aún no tienes almacenes con productos.</span>}
          </div>
        </>
      )}
    </Card>
  );
};

const Periodo: React.FC<BloqueProps> = ({ data, estado, onRetry }) => {
  const p = data?.periodo;
  const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
  let avance = 0;
  if (p?.año && p.cierre) {
    const inicio = Date.parse(`${p.año}-01-01`);
    const fin = Date.parse(p.cierre);
    avance = Math.min(100, Math.max(0, ((Date.parse(hoy) - inicio) / (fin - inicio)) * 100));
  }
  const badge = !p?.idPeriodoContable ? null : p.cerrado ? ['Cerrado', styles.pillNeutral] : ['Abierto', styles.pillSuccess];

  return (
    <Card className={styles.side}>
      <div className={styles.cardHead}>
        <span className={styles.cardTitle}>Periodo</span>
        {badge && <span className={`${styles.pill} ${badge[1]}`}>{badge[0]}</span>}
      </div>
      {estado === 'cargando' && <Skeleton lineas={['65%', '100%', '90%', '80%']} alto={14} />}
      {estado === 'error' && <Reintentar compacto titulo="Periodo" onRetry={onRetry} />}
      {p && (
        <>
          <span className={styles.periodoTitulo}>{nombreMes(p.mes)}</span>
          <div className={styles.periodoFilas}>
            <div className={styles.fila}>
              <span>Valoración</span>
              <span className={`${styles.pill} ${styles.pillActive} ${styles.pillCuadrada}`}>
                {p.metodoValoracion === 'fifo' ? 'PEPS (FIFO)' : p.metodoValoracion === 'promedio' ? 'Promedio ponderado' : 'Sin definir'}
              </span>
            </div>
            {p.cierre && p.diasParaCierre !== null && (
              <div className={styles.cierre}>
                <div className={styles.fila}>
                  <span>{p.diasParaCierre >= 0 ? 'Cierre en' : 'Venció hace'}</span>
                  <b>
                    {numero(Math.abs(p.diasParaCierre))} día{Math.abs(p.diasParaCierre) === 1 ? '' : 's'}{' '}
                    <small>· {fecha(p.cierre).slice(0, 5)}/{p.cierre.slice(2, 4)}</small>
                  </b>
                </div>
                <div className={styles.progreso}>
                  <div style={{ width: `${avance}%` }} />
                </div>
              </div>
            )}
            {!p.idPeriodoContable && <span className={styles.kpiNota}>Crea el periodo contable en Configuración.</span>}
            <div className={styles.fila}>
              <span>T.C. {p.tipoCambio?.fecha === hoy ? 'hoy' : p.tipoCambio ? fecha(p.tipoCambio.fecha).slice(0, 5) : ''} (SUNAT)</span>
              <b className={styles.normal}>
                {p.tipoCambio
                  ? `C ${p.tipoCambio.compra.toFixed(3).replace('.', ',')} · V ${p.tipoCambio.venta.toFixed(3).replace('.', ',')}`
                  : '—'}
              </b>
            </div>
          </div>
        </>
      )}
    </Card>
  );
};

const Alertas: React.FC<BloqueProps & { irKardex: () => void }> = ({ data, estado, onRetry, irKardex }) => {
  const a = data?.alertas;
  const total = a ? a.totalStockBajo + a.totalFaltantes : 0;
  const items = a
    ? [
        ...a.faltantes.map((f) => ({
          clave: `f${f.idInventario}`,
          error: true,
          nombre: f.producto,
          detalle: `Faltante kardex: ${numero(f.cantidad)} · ${fecha(f.fecha)}`,
        })),
        ...a.stockBajo.map((s) => ({
          clave: `s${s.idInventario}`,
          error: false,
          nombre: s.producto,
          detalle: `Stock ${numero(s.stock)} · mínimo ${numero(s.minimo)} · ${s.almacen}`,
        })),
      ].slice(0, MAX_ALERTAS)
    : [];
  const restantes = total - items.length;

  return (
    <Card className={styles.side}>
      <div className={styles.cardHead}>
        <span className={styles.cardTitleBadge}>
          Alertas
          {total > 0 && <span className={styles.badge}>{numero(total)}</span>}
        </span>
        {total > 0 && (
          <button type="button" className={styles.link} onClick={irKardex}>
            Ver kardex
            <LuArrowRight />
          </button>
        )}
      </div>
      {estado === 'cargando' && <Skeleton lineas={['100%', '100%', '100%']} alto={40} />}
      {estado === 'error' && <Reintentar compacto titulo="Alertas" onRetry={onRetry} />}
      {a && total === 0 && (
        <div className={styles.vacioBloque}>
          <div className={`${styles.circulo} ${styles.circuloSuccess}`}>
            <LuCircleCheck />
          </div>
          <span className={styles.estadoTitulo}>Todo en orden</span>
          <span className={styles.textoSecundario}>Sin productos con stock bajo ni diferencias de kardex.</span>
        </div>
      )}
      {items.length > 0 && (
        <>
          <div className={styles.listaBordes}>
            {items.map((i) => (
              <div key={i.clave} className={styles.alerta}>
                <span className={`${styles.alertaIcon} ${i.error ? styles.tono_error : styles.tono_warning}`}>
                  {i.error ? <LuPackageX /> : <LuTriangleAlert />}
                </span>
                <div className={styles.alertaText}>
                  <span className={styles.truncar}>{i.nombre}</span>
                  <small className={styles.truncar}>{i.detalle}</small>
                </div>
              </div>
            ))}
          </div>
          {restantes > 0 && (
            <span className={styles.kpiNota}>
              +{numero(restantes)} alerta{restantes === 1 ? '' : 's'} más en kardex
            </span>
          )}
        </>
      )}
    </Card>
  );
};

const TopProductos: React.FC<BloqueProps & { mes: string }> = ({ data, estado, onRetry, mes }) => {
  const top = data?.topProductos ?? [];
  const max = top[0]?.monto || 1;
  return (
    <Card className={styles.half}>
      <div className={styles.cardHead}>
        <span className={styles.cardTitle}>Top 5 productos vendidos</span>
        <span className={styles.kpiNota}>{nombreMes(mes, false)}</span>
      </div>
      {estado === 'cargando' && <Skeleton lineas={['100%', '85%', '70%', '60%']} alto={30} />}
      {estado === 'error' && <Reintentar titulo="los productos" onRetry={onRetry} />}
      {data && top.length === 0 && <span className={styles.vacioTexto}>Aún no hay ventas en este mes.</span>}
      {top.length > 0 && (
        <div className={styles.topLista}>
          {top.map((p, i) => (
            <div key={p.id} className={styles.topItem}>
              <div className={styles.topFila}>
                <span className={styles.topN}>{i + 1}</span>
                <span className={`${styles.truncar} ${styles.topNombre}`} title={p.nombre}>
                  {p.nombre}
                </span>
                <span className={styles.topCant}>{numero(p.cantidad)} und</span>
                <b className={styles.topMonto}>{soles(p.monto)}</b>
              </div>
              <div className={styles.topBarra}>
                <div style={{ width: `${(p.monto / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

const Ranking: React.FC<BloqueProps & { tab: 'clientes' | 'proveedores' }> = ({ data, estado, onRetry, tab }) => {
  const filas = data ? (tab === 'clientes' ? data.topClientes : data.topProveedores) : [];
  const total = data ? (tab === 'clientes' ? data.kpis.ventas.total : data.kpis.compras.total) : 0;
  return (
    <>
      {estado === 'cargando' && <Skeleton lineas={['100%', '100%', '100%', '100%']} alto={38} />}
      {estado === 'error' && <Reintentar titulo="el ranking" onRetry={onRetry} />}
      {data && filas.length === 0 && <span className={styles.vacioTexto}>Sin datos en este mes.</span>}
      {filas.length > 0 && (
        <div className={styles.listaBordes}>
          {filas.map((r) => (
            <div key={r.id} className={styles.rankItem}>
              <span className={styles.avatar}>{iniciales(r.nombre)}</span>
              <div className={styles.alertaText}>
                <span className={styles.truncar} title={r.nombre}>{r.nombre}</span>
                <small>
                  {r.documento.length === 11 ? 'RUC' : 'Doc.'} {r.documento}
                </small>
              </div>
              <div className={styles.rankMonto}>
                <b>{soles(r.monto)}</b>
                {total > 0 && <small>{porcentaje((r.monto / total) * 100)} del total</small>}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

const TIPOS = {
  VENTA: ['Venta', styles.pillSuccess],
  COMPRA: ['Compra', styles.pillActive],
  TRANSFERENCIA: ['Transferencia', styles.pillNeutral],
} as const;

const Movimientos: React.FC<BloqueProps> = ({ data, estado, onRetry }) => {
  const filas = (data?.ultimosMovimientos ?? []).map((m) => ({
    ...m,
    numeroCompleto: `${m.serie}-${m.numero}`,
    entidadTexto: m.entidad ?? (m.tipo === 'TRANSFERENCIA' ? 'Entre almacenes' : '—'),
    // Las transferencias no tienen importe
    totalTexto: m.tipo === 'TRANSFERENCIA' && m.total === 0 ? '—' : soles(m.total, m.moneda),
  }));
  return (
    <section className={`${styles.card} ${styles.full} ${styles.movCard}`}>
      <div className={styles.movHead}>
        <span className={styles.cardTitle}>Últimos movimientos</span>
      </div>
      {estado === 'cargando' && (
        <div className={styles.movSkeleton}>
          <Skeleton lineas={['100%', '100%', '100%', '100%']} alto={36} />
        </div>
      )}
      {estado === 'error' && <Reintentar titulo="los movimientos" onRetry={onRetry} />}
      {data && filas.length === 0 && (
        <span className={styles.vacioTexto}>Todavía no hay movimientos registrados.</span>
      )}
      {filas.length > 0 && (
        <>
          <table className={styles.tabla}>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Número</th>
                <th>Entidad</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((m) => (
                <tr key={m.id}>
                  <td className={styles.tdFecha}>{fecha(m.fecha)}</td>
                  <td>
                    <span className={`${styles.pill} ${TIPOS[m.tipo][1]}`}>{TIPOS[m.tipo][0]}</span>
                  </td>
                  <td className={styles.tdNumero}>{m.numeroCompleto}</td>
                  <td>{m.entidadTexto}</td>
                  <td className={styles.tdTotal}>{m.totalTexto}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className={styles.movCards}>
            {filas.map((m) => (
              <div key={m.id} className={styles.movItem}>
                <div className={styles.fila}>
                  <span className={`${styles.pill} ${TIPOS[m.tipo][1]}`}>{TIPOS[m.tipo][0]}</span>
                  <small>{fecha(m.fecha)}</small>
                </div>
                <span className={styles.movEntidad}>{m.entidadTexto}</span>
                <div className={styles.fila}>
                  <small>{m.numeroCompleto}</small>
                  <b>{m.totalTexto}</b>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
};
