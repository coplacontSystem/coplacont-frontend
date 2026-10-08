import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LuActivity,
  LuArrowDownRight,
  LuArrowRight,
  LuArrowUpRight,
  LuBan,
  LuBuilding2,
  LuCalendar,
  LuCalendarClock,
  LuCalendarX,
  LuCheck,
  LuChevronDown,
  LuChevronUp,
  LuCircleCheck,
  LuCloudOff,
  LuFileText,
  LuMoon,
  LuPlus,
  LuRotateCw,
  LuSend,
  LuUserX,
  LuUsers,
} from 'react-icons/lu';
import { useAuth } from '@/domains/auth';
import { MAIN_ROUTES, SETTINGS_ROUTES } from '@/router';
import { ToastProvider } from '@/domains/settings/pages/Configuracion/ui';
import { cx, useToast } from '@/domains/settings/pages/Configuracion/util';
import { escala, compacto, iniciales, MESES, numero, porcentaje } from '../formato';
import {
  useGetAdminDashboardQuery,
  useReenviarAccesoMutation,
  type AdminDashboard as Datos,
  type ItemAtencion,
} from './adminApi';
import { EmpresasTable } from './EmpresasTable';
import { EmpresaDrawer, ConfirmarEstado } from './EmpresaDrawer';
import { DIAS_SEMANA, diasDesde, dosPalabras, fechaCorta, navegador, relativo, sinSociedad } from './util';
import styles from './AdminDashboard.module.scss';

/** Panel del administrador (diseño CoplacontAdmin): solo cantidades, estados y actividad. */
export const AdminDashboard: React.FC<{ nombre?: string }> = (props) => (
  <ToastProvider>
    <Panel {...props} />
  </ToastProvider>
);

const Panel: React.FC<{ nombre?: string }> = ({ nombre }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  // Se refresca al volver al panel (el alta de empresa no pasa por RTK Query)
  const q = useGetAdminDashboardQuery(undefined, { refetchOnMountOrArgChange: true });
  const [drawer, setDrawer] = useState<number | null>(null);
  const [confirmar, setConfirmar] = useState<{ id: number; nombre: string; usuarios: number; habilitada: boolean } | null>(null);

  const hoy = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const nuevaEmpresa = () => navigate(`${MAIN_ROUTES.SETTINGS}${SETTINGS_ROUTES.USERS}?nueva=1`);
  const primerNombre = (nombre ?? user?.nombre ?? '').split(' ')[0];

  const d = q.data;
  const cargando = q.isLoading;
  const vacio = !!d && d.empresas.length === 0;

  return (
    <div className={styles.admin} data-screen-label="Panel del administrador">
      <div className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.titulo}>Hola{primerNombre ? `, ${primerNombre}` : ''}</h1>
          <span className={styles.fechaHoy}>
            <LuCalendar />
            {DIAS_SEMANA[hoy.getDay()]}, {pad(hoy.getDate())}/{pad(hoy.getMonth() + 1)}/{hoy.getFullYear()}
          </span>
        </div>
        <button type="button" className={cx(styles.btnPrimary, styles.anchoMovil)} onClick={nuevaEmpresa}>
          <LuBuilding2 /> Nueva empresa
        </button>
      </div>

      {q.isError ? (
        <div role="alert" className={cx(styles.card, styles.errorCard)}>
          <div className={styles.errorIcono}>
            <LuCloudOff />
          </div>
          <span className={styles.estadoTitulo}>No se pudo cargar el panel</span>
          <span className={styles.estadoTexto}>Revisa tu conexión e inténtalo de nuevo.</span>
          <button type="button" className={styles.btnSecondary} onClick={() => q.refetch()}>
            <LuRotateCw /> Reintentar
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {vacio && (
            <div className={styles.banner}>
              <div className={styles.bannerCirculo} />
              <div className={styles.bannerTexto}>
                <span>Plataforma nueva</span>
                <span>Aún no hay empresas. Crea la primera.</span>
                <span>Registra su RUC y sus usuarios. Aquí verás su actividad, sus periodos y quién inicia sesión.</span>
              </div>
              <button type="button" className={styles.bannerBtn} onClick={nuevaEmpresa}>
                <LuPlus /> Nueva empresa
              </button>
            </div>
          )}

          <Kpis d={d} cargando={cargando} vacio={vacio} />

          {!vacio && (
            <>
              <Actividad d={d} cargando={cargando} />
              <Atencion d={d} cargando={cargando} onVer={setDrawer} />
              <EmpresasTable
                empresas={d?.empresas}
                cargando={cargando}
                onVer={setDrawer}
                onEstado={(e) =>
                  setConfirmar({ id: e.id, nombre: e.razonSocial, usuarios: e.usuarios, habilitada: e.habilitada })
                }
              />
              <Accesos d={d} cargando={cargando} />
              <Altas d={d} cargando={cargando} onVer={setDrawer} />
            </>
          )}
        </div>
      )}

      {drawer != null && (
        <EmpresaDrawer
          id={drawer}
          onClose={() => setDrawer(null)}
          onEstado={(e) => setConfirmar(e)}
        />
      )}
      {confirmar && <ConfirmarEstado empresa={confirmar} onClose={() => setConfirmar(null)} />}
    </div>
  );
};

/* ---------- KPIs ---------- */

const Kpis: React.FC<{ d?: Datos; cargando: boolean; vacio: boolean }> = ({ d, cargando, vacio }) => {
  if (cargando || !d) {
    return (
      <>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} data-component="AdminKpi" className={cx(styles.card, styles.kpi)}>
            <div className={styles.skel} style={{ width: '55%', height: 12 }} />
            <div className={styles.skel} style={{ width: '45%', height: 28 }} />
            <div className={styles.skel} style={{ width: '70%', height: 12 }} />
          </div>
        ))}
      </>
    );
  }
  const k = d.kpis;
  const total = k.empresasHabilitadas + k.empresasDeshabilitadas;
  const pctActivas = k.empresasHabilitadas ? Math.round((k.empresasActivas30 / k.empresasHabilitadas) * 100) : 0;
  const hoy = new Date();
  const ant = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
  const pad = (n: number) => String(n).padStart(2, '0');
  const rangoAnterior = `01–${pad(Math.min(hoy.getDate(), new Date(ant.getFullYear(), ant.getMonth() + 1, 0).getDate()))}/${pad(ant.getMonth() + 1)}/${ant.getFullYear()}`;
  const v = k.variacion;

  const items: {
    label: string;
    corto: string;
    icono: React.ReactNode;
    tono: string;
    valor: string;
    suf?: string;
    chip?: { texto: string; icono: React.ReactNode; tono: string };
    nota: string;
    notaMovil?: string;
  }[] = [
    {
      label: 'Empresas habilitadas',
      corto: 'Empresas habilitadas',
      icono: <LuBuilding2 />,
      tono: styles.tonoAccent,
      valor: numero(k.empresasHabilitadas),
      chip: k.empresasDeshabilitadas
        ? {
            texto: `${k.empresasDeshabilitadas} ${k.empresasDeshabilitadas === 1 ? 'deshabilitada' : 'deshabilitadas'}`,
            icono: <LuBan />,
            tono: styles.tonoNeutral,
          }
        : undefined,
      nota: vacio ? 'Sin empresas registradas' : `de ${total} en total`,
      notaMovil: '',
    },
    {
      label: 'Usuarios totales',
      corto: 'Usuarios totales',
      icono: <LuUsers />,
      tono: styles.tonoNeutral,
      valor: numero(k.usuarios),
      nota: vacio
        ? 'Se crean junto con cada empresa'
        : `Promedio de ${(total ? k.usuarios / total : 0).toFixed(1).replace('.', ',')} por empresa`,
      notaMovil: `en ${total} empresas`,
    },
    {
      label: 'Activas en los últimos 30 días',
      corto: 'Activas (30 días)',
      icono: <LuActivity />,
      tono: styles.tonoSuccess,
      valor: numero(k.empresasActivas30),
      suf: vacio ? undefined : `de ${k.empresasHabilitadas}`,
      chip: vacio ? undefined : { texto: `${pctActivas}%`, icono: <LuCheck />, tono: styles.tonoSuccess },
      nota: vacio ? 'Sin actividad' : 'con acceso o comprobante',
      notaMovil: '',
    },
    {
      label: 'Comprobantes este mes',
      corto: 'Comprob. del mes',
      icono: <LuFileText />,
      tono: styles.tonoWarning,
      valor: numero(k.comprobantesMes),
      chip:
        v == null
          ? undefined
          : {
              texto: `${v > 0 ? '+' : ''}${porcentaje(v)}`,
              icono: v >= 0 ? <LuArrowUpRight /> : <LuArrowDownRight />,
              tono: v >= 0 ? styles.tonoSuccess : styles.tonoError,
            },
      nota: vacio ? 'Sin comprobantes' : `vs. ${rangoAnterior}`,
      notaMovil: `vs. ${MESES[ant.getMonth()].slice(0, 3).toLowerCase()}.`,
    },
  ];

  return (
    <>
      {items.map((it) => (
        <div key={it.label} data-component="AdminKpi" className={cx(styles.card, styles.kpi)}>
          <div className={styles.kpiHead}>
            <span className={cx(styles.kpiIcono, it.tono)}>{it.icono}</span>
            <span className={styles.kpiLabel}>
              <span className={styles.soloAncho}>{it.label}</span>
              <span className={styles.soloMovil}>{it.corto}</span>
            </span>
          </div>
          <div className={styles.kpiValorFila}>
            <span className={styles.kpiValor}>{it.valor}</span>
            {it.suf && <span className={styles.kpiSuf}>{it.suf}</span>}
          </div>
          <div className={styles.kpiPie}>
            {it.chip && (
              <span className={cx(styles.chip, it.chip.tono)}>
                {it.chip.icono}
                {it.chip.texto}
              </span>
            )}
            <span className={cx(styles.kpiNota, styles.soloAncho)}>{it.nota}</span>
            {(it.notaMovil ?? it.nota) && (
              <span className={cx(styles.kpiNota, styles.soloMovil)}>{it.notaMovil ?? it.nota}</span>
            )}
          </div>
        </div>
      ))}
    </>
  );
};

/* ---------- Gráfico de actividad ---------- */

const Actividad: React.FC<{ d?: Datos; cargando: boolean }> = ({ d, cargando }) => {
  const serie = d?.actividad ?? [];
  const ultimo = serie.length - 1;
  const [activo, setActivo] = useState(ultimo);
  const idx = activo < 0 ? ultimo : activo;
  const { tope, ticks } = escala(Math.max(0, ...serie.map((m) => m.comprobantes)));
  const maxNuevas = Math.max(1, ...serie.map((m) => m.empresasNuevas));
  const alto = (v: number) => `${(v / tope) * 100}%`;

  return (
    <div data-component="ActividadChart" className={cx(styles.card, styles.chartCard)}>
      <div className={styles.cardHeadFila}>
        <div className={styles.cardHead}>
          <span className={styles.cardTitle}>Actividad de la plataforma</span>
          <span className={styles.cardSub}>Últimos 12 meses · todas las empresas</span>
        </div>
        <div className={styles.leyenda}>
          <span>
            <i className={styles.leyendaBarra} />
            Comprobantes
          </span>
          <span>
            <i className={styles.leyendaPunto} />
            Empresas nuevas
          </span>
        </div>
      </div>
      {cargando ? (
        <div className={styles.chartSkel}>
          {[40, 55, 70, 50, 62, 45, 75, 58].map((h, i) => (
            <div key={i} className={styles.skel} style={{ height: `${h}%` }} />
          ))}
        </div>
      ) : (
        <div className={styles.chart} onMouseLeave={() => setActivo(ultimo)}>
          <div className={styles.chartPlot}>
            <div className={styles.chartEje}>
              {ticks.map((t) => (
                <span key={t} style={{ bottom: alto(t) }}>
                  {compacto(t)}
                </span>
              ))}
            </div>
            <div className={styles.chartBarras}>
              {ticks.map((t) => (
                <div key={t} className={styles.chartGrid} style={{ bottom: alto(t) }} />
              ))}
              {serie.map((m, i) => {
                const [a, mm] = m.mes.split('-').map(Number);
                const lado = i < 3 ? styles.tipIzq : i > serie.length - 4 ? styles.tipDer : '';
                const hn = (m.empresasNuevas / maxNuevas) * 100;
                return (
                  <div
                    key={m.mes}
                    className={cx(styles.chartCol, i === idx && styles.chartColOn)}
                    onMouseEnter={() => setActivo(i)}
                    onClick={() => setActivo(i)}
                  >
                    <div className={styles.barra} style={{ height: alto(m.comprobantes) }} />
                    {m.empresasNuevas > 0 && (
                      <span className={styles.nuevas} style={{ bottom: `${hn}%` }}>
                        {m.empresasNuevas}
                      </span>
                    )}
                    {i === idx && (
                      <div
                        className={cx(styles.tooltip, lado)}
                        style={{ bottom: `calc(${Math.max((m.comprobantes / tope) * 100, hn)}% + 14px)` }}
                      >
                        <span className={styles.tooltipTitulo}>
                          {MESES[mm - 1]} {a}
                        </span>
                        <div className={styles.tooltipFila}>
                          <span>
                            <i className={styles.leyendaBarra} />
                            Comprobantes
                          </span>
                          <b>{numero(m.comprobantes)}</b>
                        </div>
                        <div className={styles.tooltipFila}>
                          <span>
                            <i className={styles.leyendaPunto} />
                            Empresas nuevas
                          </span>
                          <b>{m.empresasNuevas}</b>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div className={styles.chartMeses}>
            {serie.map((m, i) => {
              const nom = MESES[Number(m.mes.slice(5)) - 1];
              return (
                <span key={m.mes} className={cx(i === idx && styles.mesOn)}>
                  <span className={styles.soloAncho}>{nom.slice(0, 3)}</span>
                  <span className={styles.soloMovil}>{nom[0]}</span>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

/* ---------- Necesitan atención ---------- */

const SEV: Record<ItemAtencion['severidad'], { label: string; tono: string; orden: number }> = {
  alta: { label: 'Alta', tono: styles.tonoError, orden: 0 },
  media: { label: 'Media', tono: styles.tonoWarning, orden: 1 },
  baja: { label: 'Baja', tono: styles.tonoNeutral, orden: 2 },
};

const Atencion: React.FC<{ d?: Datos; cargando: boolean; onVer: (id: number) => void }> = ({ d, cargando, onVer }) => {
  const toast = useToast();
  const [reenviar] = useReenviarAccesoMutation();
  const [todo, setTodo] = useState(false);

  const items = useMemo(
    () => [...(d?.atencion ?? [])].sort((a, b) => SEV[a.severidad].orden - SEV[b.severidad].orden),
    [d],
  );
  const visibles = todo ? items : items.slice(0, 4);

  const enviar = async (email: string) => {
    try {
      const r = await reenviar(email).unwrap();
      toast(r.success ? `Acceso reenviado a ${email}` : r.message);
    } catch {
      toast('No se pudo reenviar el acceso');
    }
  };

  const describir = (a: ItemAtencion) => {
    const ver = { accion: 'Ver empresa', accionIcono: <LuArrowRight />, on: () => onVer(a.idPersona) };
    switch (a.tipo) {
      case 'periodoVencido':
        return {
          icono: <LuCalendarClock />,
          titulo: `Periodo ${a.periodo?.año} vencido sin cerrar`,
          det: `${a.empresa} · venció el ${a.periodo ? fechaCorta(a.periodo.fin) : ''}`,
          ...ver,
        };
      case 'sinPeriodo':
        return { icono: <LuCalendarX />, titulo: 'Sin periodo contable activo', det: a.empresa, ...ver };
      case 'sinLogin':
        return {
          icono: <LuUserX />,
          titulo: `${dosPalabras(a.usuario!.nombre)} nunca inició sesión`,
          det: `${a.empresa} · usuario creado el ${fechaCorta(a.usuario!.alta)}`,
          accion: 'Reenviar acceso',
          accionIcono: <LuSend />,
          on: () => void enviar(a.usuario!.email),
        };
      default: {
        const dias = diasDesde(a.ultimaActividad);
        return {
          icono: <LuMoon />,
          titulo: dias == null ? 'Sin actividad registrada' : `Sin actividad hace ${dias} días`,
          det: `${a.empresa} · último acceso ${relativo(a.ultimaActividad).toLowerCase()}`,
          ...ver,
        };
      }
    }
  };

  return (
    <div data-component="AtencionList" className={cx(styles.card, styles.atencion)}>
      <span className={styles.cardTitleFila}>
        Necesitan atención
        {!cargando && items.length > 0 && <span className={styles.contador}>{items.length}</span>}
      </span>
      {cargando ? (
        [0, 1, 2, 3].map((i) => <div key={i} className={styles.skel} style={{ height: 52 }} />)
      ) : items.length === 0 ? (
        <div className={styles.todoEnOrden}>
          <div className={styles.okIcono}>
            <LuCircleCheck />
          </div>
          <span className={styles.estadoTitulo}>Todo en orden</span>
          <span className={styles.estadoTexto}>
            Todas las empresas tienen periodo activo, actividad reciente y usuarios con acceso.
          </span>
        </div>
      ) : (
        <>
          <div className={styles.lista}>
            {visibles.map((a, i) => {
              const x = describir(a);
              const s = SEV[a.severidad];
              return (
                <div key={`${a.tipo}-${a.idPersona}-${a.usuario?.id ?? i}`} className={styles.atencionItem}>
                  <span className={cx(styles.atencionIcono, s.tono)}>{x.icono}</span>
                  <div className={styles.atencionTexto}>
                    <span>
                      {x.titulo}
                      <span className={cx(styles.sev, s.tono)}>{s.label}</span>
                    </span>
                    <span>{x.det}</span>
                  </div>
                  <button type="button" className={styles.btnMini} onClick={x.on}>
                    {x.accionIcono}
                    {x.accion}
                  </button>
                </div>
              );
            })}
          </div>
          {items.length > 4 && (
            <button type="button" className={styles.btnMas} onClick={() => setTodo(!todo)}>
              {todo ? 'Ver menos' : `+${items.length - 4} más`}
              {todo ? <LuChevronUp /> : <LuChevronDown />}
            </button>
          )}
        </>
      )}
    </div>
  );
};

/* ---------- Últimos accesos y altas ---------- */

const Accesos: React.FC<{ d?: Datos; cargando: boolean }> = ({ d, cargando }) => (
  <div data-component="AccesosFeed" className={cx(styles.card, styles.mitad)}>
    <div className={styles.cardHeadFila}>
      <span className={styles.cardTitle}>Últimos accesos</span>
      <span className={styles.cardSub}>Inicios de sesión</span>
    </div>
    {cargando ? (
      [0, 1, 2, 3, 4].map((i) => <div key={i} className={styles.skel} style={{ height: 40 }} />)
    ) : d?.accesos.length ? (
      <div className={styles.lista}>
        {d.accesos.map((a) => (
          <div key={`${a.idUsuario}-${a.fecha}`} className={styles.acceso}>
            {a.avatar ? (
              <img src={a.avatar} alt="" className={styles.accesoFoto} />
            ) : (
              <span className={styles.accesoIni}>{iniciales(a.nombre)}</span>
            )}
            <div className={styles.accesoTexto}>
              <span>{a.nombre}</span>
              <span>{[a.empresa ? sinSociedad(a.empresa) : 'Administrador', navegador(a.agente)].filter(Boolean).join(' · ')}</span>
            </div>
            <span className={styles.accesoHora}>{relativo(a.fecha)}</span>
          </div>
        ))}
      </div>
    ) : (
      <span className={styles.estadoTexto}>Aún no hay inicios de sesión registrados.</span>
    )}
  </div>
);

const Altas: React.FC<{ d?: Datos; cargando: boolean; onVer: (id: number) => void }> = ({ d, cargando, onVer }) => (
  <div className={cx(styles.card, styles.mitad)}>
    <div className={styles.cardHeadFila}>
      <span className={styles.cardTitle}>Altas recientes</span>
      <span className={styles.cardSub}>Últimas 5 empresas</span>
    </div>
    {cargando ? (
      [0, 1, 2].map((i) => <div key={i} className={styles.skel} style={{ height: 44 }} />)
    ) : (
      <div className={styles.lista}>
        {d?.altas.map((a) => (
          <button key={a.id} type="button" className={styles.alta} onClick={() => onVer(a.id)}>
            <span className={styles.empresaIni}>{iniciales(a.razonSocial)}</span>
            <div className={styles.accesoTexto}>
              <span>{a.razonSocial}</span>
              <span>Alta {fechaCorta(a.fecha)}</span>
            </div>
            <span className={styles.altaUsuarios}>
              <LuUsers />
              {a.usuarios} {a.usuarios === 1 ? 'usuario' : 'usuarios'}
            </span>
          </button>
        ))}
      </div>
    )}
  </div>
);
