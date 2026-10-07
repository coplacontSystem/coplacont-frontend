import React, { useState } from 'react';
import {
  LuArrowRight,
  LuBan,
  LuCalendar,
  LuCalendarCheck,
  LuCalendarPlus,
  LuCircleDot,
  LuClock,
  LuInfo,
  LuLock,
  LuLockOpen,
  LuPackage,
  LuPlus,
  LuTriangleAlert,
} from 'react-icons/lu';
import {
  mensajeError,
  useCerrarPeriodoMutation,
  useCrearPeriodoMutation,
  useGetConfiguracionQuery,
  useGetInventarioAlQuery,
  useGetPeriodosQuery,
  useReabrirPeriodoMutation,
  type EstadoPeriodo,
  type Metodo,
  type Periodo,
} from './configuracionApi';
import { Drawer, ErrorCampo, Modal, RadioCard } from './ui';
import { cx, fecha, MESES, miles, soles, useToast, METODOS, NOMBRE_METODO } from './util';
import { CargandoSeccion, ErrorSeccion, type SeccionProps } from './comun';
import styles from './Configuracion.module.scss';

const CHIP: Record<EstadoPeriodo, { label: string; clase: string; icono: React.ReactNode }> = {
  activo: { label: 'Activo', clase: styles.chipActivo, icono: <LuCircleDot /> },
  reabierto: { label: 'Reabierto', clase: styles.chipReabierto, icono: <LuLockOpen /> },
  futuro: { label: 'Futuro', clase: styles.chipFuturo, icono: <LuClock /> },
  pendiente: { label: 'Sin cerrar', clase: styles.chipReabierto, icono: <LuClock /> },
  cerrado: { label: 'Cerrado', clase: styles.chipCerrado, icono: <LuLock /> },
};

const rango = (p: Periodo) => `${fecha(p.fechaInicio)} – ${fecha(p.fechaFin)}`;
const dia = (iso: string) => new Date(`${iso}T00:00:00`);

export const SeccionPeriodos: React.FC<SeccionProps> = ({ irA }) => {
  const q = useGetPeriodosQuery();
  const cfg = useGetConfiguracionQuery();
  const [cerrando, setCerrando] = useState<Periodo | null>(null);
  const [reabriendo, setReabriendo] = useState<Periodo | null>(null);
  const [nuevo, setNuevo] = useState(false);

  if (q.isLoading) return <CargandoSeccion />;
  if (q.isError || !q.data) return <ErrorSeccion onRetry={q.refetch} />;
  const pers = q.data;
  const act = pers.find((p) => p.estado === 'activo' || p.estado === 'reabierto');

  const accion = (p: Periodo) =>
    p.puedeCerrar
      ? { label: 'Cerrar periodo', icono: <LuLock />, peligro: true, on: () => setCerrando(p) }
      : p.puedeReabrir
        ? { label: 'Reabrir', icono: <LuLockOpen />, peligro: false, on: () => setReabriendo(p) }
        : null;

  return (
    <>
      {pers.length === 0 ? (
        <div className={styles.vacio}>
          <div className={styles.vacioIcono}>
            <LuCalendarPlus />
          </div>
          <span className={styles.estadoTitulo}>Aún no tienes periodos.</span>
          <span className={styles.estadoTexto}>Crea el primero para empezar a registrar compras y ventas.</span>
          <button type="button" className={cx(styles.btnPrimary, styles.anchoMovil)} onClick={() => setNuevo(true)}>
            <LuPlus /> Nuevo periodo
          </button>
        </div>
      ) : (
        <>
          {act ? (
            <PeriodoCard p={act} onCerrar={() => setCerrando(act)} onParametros={() => irA?.('parametros')} />
          ) : (
            <div className={styles.alertWarn}>
              <LuTriangleAlert />
              <span>No hay un periodo activo. Crea o reabre uno para seguir registrando compras y ventas.</span>
            </div>
          )}

          <section className={cx(styles.card, styles.cardLista)}>
            <div className={styles.listaHead}>
              <div className={styles.cardHead}>
                <span className={styles.cardTitle}>Todos los periodos</span>
                <span className={styles.cardSub}>{pers.length === 1 ? '1 periodo' : `${pers.length} periodos`}</span>
              </div>
              <button type="button" className={cx(styles.btnPrimary, styles.anchoMovil)} onClick={() => setNuevo(true)}>
                <LuPlus /> Nuevo periodo
              </button>
            </div>

            <table className={styles.tabla}>
              <thead>
                <tr>
                  <th>Periodo</th>
                  <th>Estado</th>
                  <th>Método</th>
                  <th>Cierre</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pers.map((p) => {
                  const a = accion(p);
                  return (
                    <tr key={p.id}>
                      <td>
                        <div className={styles.celdaPeriodo}>
                          <span>{p.año}</span>
                          <span>{rango(p)}</span>
                        </div>
                      </td>
                      <td>
                        <Chip estado={p.estado} />
                      </td>
                      <td>{NOMBRE_METODO[p.metodoValoracion]}</td>
                      <td>
                        {p.fechaCierre ? (
                          <div className={styles.celdaCierre}>
                            <span>{fecha(p.fechaCierre)}</span>
                            {p.cerradoPor && <span>por {p.cerradoPor}</span>}
                          </div>
                        ) : (
                          <span className={styles.guion}>—</span>
                        )}
                      </td>
                      <td>
                        {a ? (
                          <button type="button" className={cx(styles.btnFila, a.peligro && styles.textoPeligro)} onClick={a.on}>
                            {a.icono} {a.label}
                          </button>
                        ) : (
                          <span className={styles.guion}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className={styles.cardsMovil}>
              {pers.map((p) => {
                const a = accion(p);
                return (
                  <div key={p.id} className={styles.periodoMovil}>
                    <div className={styles.periodoMovilHead}>
                      <div className={styles.celdaPeriodo}>
                        <span>{p.año}</span>
                        <span>{rango(p)}</span>
                      </div>
                      <Chip estado={p.estado} />
                    </div>
                    <div className={styles.periodoMovilDatos}>
                      <div>
                        <span>Método</span>
                        <span>{NOMBRE_METODO[p.metodoValoracion]}</span>
                      </div>
                      <div>
                        <span>Cierre</span>
                        <span>{p.fechaCierre ? [fecha(p.fechaCierre), p.cerradoPor].filter(Boolean).join(' · ') : '—'}</span>
                      </div>
                    </div>
                    {a && (
                      <button type="button" className={cx(styles.btnSecondary, styles.anchoTotal, a.peligro && styles.textoPeligro)} onClick={a.on}>
                        {a.icono} {a.label}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      {cerrando && <CerrarModal p={cerrando} pers={pers} onClose={() => setCerrando(null)} />}
      {reabriendo && <ReabrirModal p={reabriendo} pers={pers} onClose={() => setReabriendo(null)} />}
      {nuevo && (
        <NuevoPeriodo
          pers={pers}
          metodo={cfg.data?.metodoValoracion ?? 'promedio'}
          mesInicio={cfg.data?.mesInicio ?? 1}
          onClose={() => setNuevo(false)}
        />
      )}
    </>
  );
};

const Chip: React.FC<{ estado: EstadoPeriodo }> = ({ estado }) => {
  const c = CHIP[estado];
  return (
    <span className={cx(styles.chip, c.clase)}>
      {c.icono}
      {c.label}
    </span>
  );
};

const PeriodoCard: React.FC<{ p: Periodo; onCerrar: () => void; onParametros: () => void }> = ({ p, onCerrar, onParametros }) => {
  const ini = dia(p.fechaInicio);
  const fin = dia(p.fechaFin);
  const hoy = new Date();
  const total = (fin.getTime() - ini.getTime()) / 864e5 + 1;
  const transcurrido = Math.max(0, Math.min(total, (hoy.getTime() - ini.getTime()) / 864e5 + 1));
  const dias = Math.max(0, Math.ceil((fin.getTime() - hoy.getTime()) / 864e5));
  const pct = Math.round((transcurrido / total) * 100);
  return (
    <section data-component="PeriodoCard" className={cx(styles.card, styles.periodoCard)}>
      <div className={styles.periodoCardHead}>
        <div className={styles.periodoCardTitulo}>
          <span className={cx(styles.chip, p.estado === 'reabierto' ? styles.chipReabierto : styles.chipActivo)}>
            <span className={styles.punto} />
            {p.estado === 'reabierto' ? 'Periodo reabierto' : 'Periodo activo'}
          </span>
          <span className={styles.periodoAnio}>{p.año}</span>
          <span className={styles.periodoRango}>{rango(p)}</span>
        </div>
        <button type="button" className={cx(styles.btnSecondary, styles.textoPeligro, styles.anchoMovil)} onClick={onCerrar}>
          <LuLock /> Cerrar periodo
        </button>
      </div>
      <div className={styles.statGrid}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Días para el cierre</span>
          <span className={styles.statValor}>{dias === 1 ? '1 día' : `${dias} días`}</span>
          <div role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Avance del ejercicio" className={styles.barra}>
            <div style={{ width: `${pct}%` }} />
          </div>
          <span className={styles.statNota}>
            {pct}% del ejercicio · cierra el {fecha(p.fechaFin)}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Método de valoración</span>
          <span className={styles.metodoPill}>{NOMBRE_METODO[p.metodoValoracion]}</span>
          <button type="button" className={styles.linkFlecha} onClick={onParametros}>
            Ver parámetros <LuArrowRight />
          </button>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Movimientos de inventario</span>
          <span className={styles.statValor}>{miles(p.movimientos)}</span>
          <span className={styles.statNota}>{p.movimientos ? 'Compras, ventas y ajustes' : 'Aún no hay compras ni ventas'}</span>
        </div>
      </div>
    </section>
  );
};

const CerrarModal: React.FC<{ p: Periodo; pers: Periodo[]; onClose: () => void }> = ({ p, pers, onClose }) => {
  const toast = useToast();
  const [cerrar, { isLoading }] = useCerrarPeriodoMutation();
  const inv = useGetInventarioAlQuery(p.fechaFin);
  const [txt, setTxt] = useState('');
  const [err, setErr] = useState('');
  const frase = `CERRAR ${p.año}`;
  const ok = txt.trim().toUpperCase() === frase;
  const eraActivo = p.estado === 'activo' || p.estado === 'reabierto';
  const siguiente = eraActivo
    ? pers.filter((x) => x.año > p.año && x.estado !== 'cerrado').sort((a, b) => a.año - b.año)[0]
    : undefined;

  const confirmar = async () => {
    try {
      await cerrar(p.id).unwrap();
      toast(`Periodo ${p.año} cerrado`);
      onClose();
    } catch (e) {
      setErr(mensajeError(e, 'No se pudo cerrar el periodo.'));
    }
  };

  return (
    <Modal label="Cerrar periodo" alert onClose={onClose}>
      <div className={styles.modalIconoFila}>
        <span className={cx(styles.modalIcono, styles.modalIconoPeligro)}>
          <LuLock />
        </span>
        <div className={styles.modalIconoTexto}>
          <span className={styles.modalTitle}>Cerrar el periodo {p.año}</span>
          <span className={styles.textoPeligroFuerte}>Esta acción bloquea los movimientos del periodo.</span>
        </div>
      </div>
      <ul className={styles.listaModal}>
        <li>
          <LuBan />
          <span>No podrás registrar ni editar compras, ventas, ajustes ni transferencias con fecha de {p.año}.</span>
        </li>
        <li>
          <LuPackage />
          <span>
            El inventario final queda fijado en{' '}
            <strong>{inv.data ? soles(inv.data.valor) : inv.isError ? '—' : '…'}</strong> y pasa como saldo inicial de {p.año + 1}.
          </span>
        </li>
        {siguiente && (
          <li>
            <LuCalendarCheck />
            <span>El periodo {siguiente.año} pasará a ser el activo.</span>
          </li>
        )}
      </ul>
      <label className={styles.campo}>
        <span className={styles.hintFuerte}>
          Para confirmar, escribe <strong>{frase}</strong>
        </span>
        <input
          className={cx(styles.input, styles.inputConfirmar)}
          value={txt}
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => setTxt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && ok && void confirmar()}
        />
      </label>
      {err && <ErrorCampo>{err}</ErrorCampo>}
      <span className={styles.nota}>Excepción: el último periodo cerrado puede reabrirse.</span>
      <div className={styles.btnRowEnd}>
        <button type="button" className={styles.btnPeligro} disabled={!ok || isLoading} onClick={() => void confirmar()}>
          <LuLock /> {isLoading ? 'Cerrando…' : `Cerrar periodo ${p.año}`}
        </button>
        <button type="button" className={styles.btnSecondary} onClick={onClose}>
          Cancelar
        </button>
      </div>
    </Modal>
  );
};

const ReabrirModal: React.FC<{ p: Periodo; pers: Periodo[]; onClose: () => void }> = ({ p, pers, onClose }) => {
  const toast = useToast();
  const [reabrir, { isLoading }] = useReabrirPeriodoMutation();
  const [err, setErr] = useState('');
  const activo = pers.find((x) => x.estado === 'activo');

  const confirmar = async () => {
    try {
      await reabrir(p.id).unwrap();
      toast(`Periodo ${p.año} reabierto`);
      onClose();
    } catch (e) {
      setErr(mensajeError(e, 'No se pudo reabrir el periodo.'));
    }
  };

  return (
    <Modal label="Reabrir periodo" alert onClose={onClose}>
      <div className={styles.modalIconoFila}>
        <span className={cx(styles.modalIcono, styles.modalIconoAviso)}>
          <LuLockOpen />
        </span>
        <div className={styles.modalIconoTexto}>
          <span className={styles.modalTitle}>Reabrir el periodo {p.año}</span>
          <span className={styles.modalTexto}>
            Los movimientos de {p.año} volverán a ser editables. Cualquier cambio altera el saldo inicial de {p.año + 1}, así
            que ciérralo de nuevo cuando termines.
            {activo && ` Mientras tanto, ${activo.año} queda en espera y no recibe registros.`}
          </span>
        </div>
      </div>
      {err && <ErrorCampo>{err}</ErrorCampo>}
      <div className={styles.btnRowEnd}>
        <button type="button" className={styles.btnPrimary} disabled={isLoading} onClick={() => void confirmar()}>
          <LuLockOpen /> {isLoading ? 'Reabriendo…' : 'Reabrir periodo'}
        </button>
        <button type="button" className={styles.btnSecondary} onClick={onClose}>
          Cancelar
        </button>
      </div>
    </Modal>
  );
};

const NuevoPeriodo: React.FC<{ pers: Periodo[]; metodo: Metodo; mesInicio: number; onClose: () => void }> = ({
  pers,
  metodo: metodoInicial,
  mesInicio,
  onClose,
}) => {
  const toast = useToast();
  const [crear, { isLoading }] = useCrearPeriodoMutation();
  const sugerido = Math.max(new Date().getFullYear() - 1, ...pers.map((p) => p.año)) + 1;
  const [anio, setAnio] = useState(String(sugerido));
  const [metodo, setMetodo] = useState<Metodo>(metodoInicial);
  const [intentado, setIntentado] = useState(false);
  const [errServidor, setErrServidor] = useState('');

  const n = /^\d{4}$/.test(anio) ? Number(anio) : null;
  let err = '';
  if (!n || n < 2000 || n > 2100) err = 'Ingresa un año entre 2000 y 2100.';
  else if (pers.some((p) => p.año === n)) err = `Ya existe el periodo ${n}. Elige otro año.`;
  const verErr = (intentado && err) || errServidor;

  // Mismo cálculo que el backend: el ejercicio empieza en el mes de inicio
  const ini = n ? new Date(n, mesInicio - 1, 1) : null;
  const fin = n ? new Date(n + (mesInicio > 1 ? 1 : 0), mesInicio > 1 ? mesInicio - 1 : 12, 0) : null;
  const f = (d: Date | null) => (d ? `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}` : '—');
  const hayActivo = pers.some((p) => p.estado === 'activo' || p.estado === 'reabierto');

  const enviar = async () => {
    setIntentado(true);
    setErrServidor('');
    if (err || !n) return;
    try {
      await crear({ año: n, metodoValoracion: metodo }).unwrap();
      toast(`Periodo ${n} creado`);
      onClose();
    } catch (e) {
      setErrServidor(mensajeError(e, 'No se pudo crear el periodo.'));
    }
  };

  return (
    <Drawer
      titulo="Nuevo periodo"
      onClose={onClose}
      pie={
        <div className={styles.btnRowEnd}>
          <button type="button" className={styles.btnPrimary} disabled={isLoading} onClick={() => void enviar()}>
            {isLoading ? 'Creando…' : 'Crear periodo'}
          </button>
          <button type="button" className={styles.btnSecondary} onClick={onClose}>
            Cancelar
          </button>
        </div>
      }
    >
      <label className={styles.campo}>
        <span className={styles.campoLabel}>Año del ejercicio</span>
        <input
          className={cx(styles.input, styles.inputAnio, verErr && styles.inputError)}
          inputMode="numeric"
          value={anio}
          aria-invalid={!!verErr}
          onChange={(e) => {
            setAnio(e.target.value.replace(/\D/g, '').slice(0, 4));
            setIntentado(false);
            setErrServidor('');
          }}
          onKeyDown={(e) => e.key === 'Enter' && void enviar()}
        />
        {verErr && <ErrorCampo>{verErr}</ErrorCampo>}
      </label>
      <div className={styles.fechasGrid}>
        <div className={styles.campo}>
          <span className={styles.campoLabel}>Inicio</span>
          <span className={styles.fechaFija}>
            <LuCalendar /> {f(ini)}
          </span>
        </div>
        <div className={styles.campo}>
          <span className={styles.campoLabel}>Fin</span>
          <span className={styles.fechaFija}>
            <LuCalendar /> {f(fin)}
          </span>
        </div>
      </div>
      <span className={styles.notaFechas}>
        Según el mes de inicio del ejercicio ({MESES[mesInicio - 1].toLowerCase()}). Puedes cambiarlo en Parámetros.
      </span>
      <div role="radiogroup" aria-label="Método de valoración" className={styles.radioCol}>
        <span className={styles.campoLabel}>Método de valoración</span>
        {METODOS.map((m) => (
          <RadioCard key={m.id} compacto label={m.label} desc={m.desc} sel={metodo === m.id} onPick={() => setMetodo(m.id)} />
        ))}
      </div>
      <div className={styles.alertInfo}>
        <LuInfo />
        <span>
          {hayActivo
            ? 'Se crea como Futuro y se activa cuando cierres el periodo actual. Usa las reglas de Parámetros.'
            : 'Será tu periodo activo: podrás registrar compras y ventas de inmediato.'}
        </span>
      </div>
    </Drawer>
  );
};
