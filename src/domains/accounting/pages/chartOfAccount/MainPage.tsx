import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  LuChevronDown,
  LuChevronRight,
  LuChevronsDownUp,
  LuChevronsUpDown,
  LuCloudOff,
  LuPencil,
  LuPlus,
  LuRotateCw,
  LuSearch,
  LuSearchX,
  LuX,
} from 'react-icons/lu';
import { Switch, ToastProvider } from '@/domains/settings/pages/Configuracion/ui';
import { cx } from '@/domains/settings/pages/Configuracion/util';
import {
  useGetCuentasContablesQuery,
  useGetResumenPlanContableQuery,
  type Cuenta,
  type Naturaleza,
} from './planContableApi';
import { SubcuentaDrawer, type DrawerEstado } from './SubcuentaDrawer';
import { CambiarPlanDrawer } from './CambiarPlanDrawer';
import styles from './PlanDeCuentas.module.scss';

const NATURALEZA: Record<Naturaleza, { label: string; tono: string }> = {
  deudora: { label: 'Deudora', tono: styles.tonoAccent },
  acreedora: { label: 'Acreedora', tono: styles.tonoWarning },
  mixta: { label: 'Mixta', tono: styles.tonoNeutral },
};

/** Plan de cuentas de la empresa: PCGE oficial + subcuentas propias. */
export const MainPage: React.FC = () => (
  <ToastProvider>
    <PlanDeCuentas />
  </ToastProvider>
);

const PlanDeCuentas: React.FC = () => {
  const resumen = useGetResumenPlanContableQuery();
  const [elemento, setElemento] = useState('1');
  const [texto, setTexto] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [soloMovimiento, setSoloMovimiento] = useState(false);
  const [drawer, setDrawer] = useState<DrawerEstado | null>(null);
  const [resaltada, setResaltada] = useState<string | null>(null);
  const [cambiandoPlan, setCambiandoPlan] = useState(false);

  // Búsqueda con pausa para no consultar en cada tecla
  useEffect(() => {
    const t = setTimeout(() => setBusqueda(texto.trim()), 300);
    return () => clearTimeout(t);
  }, [texto]);

  const plan = resumen.data?.plan;
  const elementos = resumen.data?.elementos ?? [];
  const actual = elementos.find((e) => e.elemento === elemento);

  const irACuenta = (c: Cuenta) => {
    setTexto('');
    setBusqueda('');
    setSoloMovimiento(false);
    setElemento(c.elemento);
    setResaltada(c.codigo);
  };

  return (
    <div className={styles.pagina}>
      <div className={styles.header}>
        <div className={styles.headerTexto}>
          <h1 className={styles.titulo}>Plan de cuentas</h1>
          <span className={styles.subtitulo}>
            {plan ? (
              <>
                {plan.nombre}
                <span className={styles.norma}>{plan.norma}</span>
              </>
            ) : (
              'Cuentas oficiales del PCGE y las subcuentas propias de tu empresa.'
            )}
          </span>
        </div>
        <div className={styles.accionesHeader}>
          {plan && (
            <button type="button" className={styles.btnSecondary} onClick={() => setCambiandoPlan(true)}>
              Cambiar de plan
            </button>
          )}
          <button
            type="button"
            className={cx(styles.btnPrimary, styles.anchoMovil)}
            onClick={() => setDrawer({ modo: 'crear' })}
          >
            <LuPlus /> Nueva subcuenta
          </button>
        </div>
      </div>
      {cambiandoPlan && plan && <CambiarPlanDrawer actual={plan} onClose={() => setCambiandoPlan(false)} />}

      {resumen.isError ? (
        <ErrorCarga onRetry={resumen.refetch} />
      ) : (
        <>
          <nav aria-label="Elementos del plan" className={styles.elementos}>
            {(elementos.length ? elementos : Array.from({ length: 10 }, () => null)).map((e, i) =>
              e ? (
                <button
                  key={e.elemento}
                  type="button"
                  aria-current={!busqueda && e.elemento === elemento ? 'true' : undefined}
                  className={cx(styles.elemento, !busqueda && e.elemento === elemento && styles.elementoOn)}
                  onClick={() => {
                    setTexto('');
                    setBusqueda('');
                    setElemento(e.elemento);
                  }}
                  title={e.nombre}
                >
                  <span className={styles.elementoNum}>{e.elemento}</span>
                  <span className={styles.elementoNombre}>{e.nombre}</span>
                  <span className={styles.elementoCant}>{e.cuentas}</span>
                </button>
              ) : (
                <div key={i} className={cx(styles.elemento, styles.skel)} />
              ),
            )}
          </nav>

          <label className={styles.selectElemento}>
            <span>Elemento</span>
            <span className={styles.selectCaja}>
              <select value={elemento} onChange={(ev) => setElemento(ev.target.value)}>
                {elementos.map((e) => (
                  <option key={e.elemento} value={e.elemento}>
                    {e.elemento} · {e.nombre} ({e.cuentas})
                  </option>
                ))}
              </select>
              <LuChevronDown />
            </span>
          </label>

          <section className={styles.card}>
            <div className={styles.barra}>
              <label className={styles.buscador}>
                <LuSearch className={styles.buscadorIcono} />
                <input
                  value={texto}
                  placeholder="Buscar por código o nombre (p. ej. 4011, IGV, caja)"
                  aria-label="Buscar cuenta"
                  onChange={(ev) => setTexto(ev.target.value)}
                />
                {texto && (
                  <button type="button" aria-label="Limpiar búsqueda" onClick={() => setTexto('')}>
                    <LuX />
                  </button>
                )}
              </label>
              {!busqueda && (
                <div className={styles.check}>
                  <Switch on={soloMovimiento} label="Solo cuentas de movimiento" onChange={setSoloMovimiento} />
                  <span>Solo cuentas de movimiento</span>
                </div>
              )}
            </div>

            {busqueda ? (
              <Resultados q={busqueda} onElegir={irACuenta} />
            ) : (
              <ArbolElemento
                key={elemento}
                elemento={elemento}
                titulo={actual ? `${actual.elemento} · ${actual.nombre}` : ''}
                soloMovimiento={soloMovimiento}
                resaltada={resaltada}
                onAgregar={(padre) => setDrawer({ modo: 'crear', padre })}
                onEditar={(cuenta) => setDrawer({ modo: 'editar', cuenta })}
              />
            )}
          </section>

          <div className={styles.leyendaPie}>
            <span>
              <span className={cx(styles.badge, styles.tonoSuccess)}>Movimiento</span> recibe asientos
            </span>
            <span>
              <span className={cx(styles.badge, styles.tonoNeutral)}>Agrupa</span> suma sus subcuentas
            </span>
            <span>
              <span className={cx(styles.badge, styles.tonoPropia)}>Propia</span> creada por tu empresa
            </span>
          </div>
        </>
      )}

      {drawer && (
        <SubcuentaDrawer
          estado={drawer}
          onClose={() => setDrawer(null)}
          onGuardada={(c) => {
            setDrawer(null);
            irACuenta(c);
          }}
        />
      )}
    </div>
  );
};

/* ---------- Árbol de un elemento ---------- */

const ArbolElemento: React.FC<{
  elemento: string;
  titulo: string;
  soloMovimiento: boolean;
  resaltada: string | null;
  onAgregar: (padre: Cuenta) => void;
  onEditar: (c: Cuenta) => void;
}> = ({ elemento, titulo, soloMovimiento, resaltada, onAgregar, onEditar }) => {
  const q = useGetCuentasContablesQuery({ elemento });
  const cuentas = useMemo(() => q.data ?? [], [q.data]);

  const hijas = useMemo(() => {
    const m = new Map<number | null, Cuenta[]>();
    const ids = new Set(cuentas.map((c) => c.id));
    for (const c of cuentas) {
      // Una cuenta cuyo padre no está en la lista se muestra como raíz
      const k = c.idPadre != null && ids.has(c.idPadre) ? c.idPadre : null;
      m.set(k, [...(m.get(k) ?? []), c]);
    }
    return m;
  }, [cuentas]);

  // Por defecto se ven las cuentas (2 dígitos) abiertas a sus subcuentas
  const [abiertas, setAbiertas] = useState<Set<number>>(new Set());
  const iniciado = useRef(false);
  useEffect(() => {
    if (!cuentas.length || iniciado.current) return;
    iniciado.current = true;
    const base = new Set(cuentas.filter((c) => c.nivel === 1).map((c) => c.id));
    // Abre los ancestros de la cuenta a resaltar
    if (resaltada) {
      for (const c of cuentas) {
        if (resaltada.startsWith(c.codigo) && c.codigo !== resaltada) base.add(c.id);
      }
    }
    setAbiertas(base);
  }, [cuentas, resaltada]);

  useEffect(() => {
    if (!resaltada || !cuentas.length) return;
    const t = setTimeout(() => {
      document.querySelector(`[data-codigo="${resaltada}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 100);
    return () => clearTimeout(t);
  }, [resaltada, cuentas.length, abiertas]);

  if (q.isLoading) {
    return (
      <div className={styles.skelLista}>
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className={styles.skel} style={{ height: 40, marginLeft: (i % 3) * 24 }} />
        ))}
      </div>
    );
  }
  if (q.isError) return <ErrorCarga onRetry={q.refetch} />;

  const toggle = (id: number) =>
    setAbiertas((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const conHijas = cuentas.filter((c) => hijas.has(c.id));
  const todoAbierto = conHijas.length > 0 && conHijas.every((c) => abiertas.has(c.id));

  if (soloMovimiento) {
    const lista = cuentas.filter((c) => c.imputable);
    return (
      <>
        <div className={styles.cabeceraLista}>
          <span>{titulo}</span>
          <span className={styles.cardSub}>{lista.length} cuentas de movimiento</span>
        </div>
        <div className={styles.lista}>
          {lista.map((c) => (
            <Fila key={c.id} c={c} nivelVisual={0} resaltada={resaltada === c.codigo} onAgregar={onAgregar} onEditar={onEditar} conRuta />
          ))}
        </div>
      </>
    );
  }

  const render = (padre: number | null, prof: number): React.ReactNode =>
    (hijas.get(padre) ?? []).map((c) => {
      const tiene = hijas.has(c.id);
      const abierta = abiertas.has(c.id);
      return (
        <React.Fragment key={c.id}>
          <Fila
            c={c}
            nivelVisual={prof}
            resaltada={resaltada === c.codigo}
            plegable={tiene}
            abierta={abierta}
            onToggle={() => toggle(c.id)}
            onAgregar={onAgregar}
            onEditar={onEditar}
          />
          {tiene && abierta && render(c.id, prof + 1)}
        </React.Fragment>
      );
    });

  return (
    <>
      <div className={styles.cabeceraLista}>
        <span>{titulo}</span>
        {conHijas.length > 0 && (
          <button
            type="button"
            className={styles.btnLink}
            onClick={() => setAbiertas(todoAbierto ? new Set() : new Set(conHijas.map((c) => c.id)))}
          >
            {todoAbierto ? <LuChevronsDownUp /> : <LuChevronsUpDown />}
            {todoAbierto ? 'Contraer todo' : 'Expandir todo'}
          </button>
        )}
      </div>
      {cuentas.length === 0 ? (
        <div className={styles.vacio}>
          <span className={styles.estadoTitulo}>Este elemento no tiene cuentas oficiales</span>
          <span className={styles.estadoTexto}>
            {elemento === '9'
              ? 'El PCGE deja el elemento 9 a criterio de cada empresa. Crea tus cuentas 90–99 para costos y gastos por función.'
              : 'No hay cuentas para mostrar.'}
          </span>
        </div>
      ) : (
        <div role="tree" className={styles.lista}>
          {render(null, 0)}
        </div>
      )}
    </>
  );
};

/* ---------- Fila ---------- */

const Fila: React.FC<{
  c: Cuenta;
  nivelVisual: number;
  resaltada: boolean;
  plegable?: boolean;
  abierta?: boolean;
  conRuta?: boolean;
  onToggle?: () => void;
  onAgregar: (padre: Cuenta) => void;
  onEditar: (c: Cuenta) => void;
}> = ({ c, nivelVisual, resaltada, plegable, abierta, conRuta, onToggle, onAgregar, onEditar }) => {
  const nat = NATURALEZA[c.naturaleza];
  const puedeAgregar = c.activa && c.codigo.length <= 8;
  return (
    <div
      role="treeitem"
      aria-expanded={plegable ? abierta : undefined}
      data-codigo={c.codigo}
      className={cx(styles.fila, !c.activa && styles.filaInactiva, resaltada && styles.filaResaltada, c.nivel === 1 && styles.filaCuenta)}
      style={{ '--sangria': `${nivelVisual * 20}px` } as React.CSSProperties}
    >
      <div className={styles.filaPrincipal}>
        {plegable ? (
          <button type="button" className={styles.plegar} aria-label={abierta ? 'Contraer' : 'Expandir'} onClick={onToggle}>
            {abierta ? <LuChevronDown /> : <LuChevronRight />}
          </button>
        ) : (
          <span className={styles.plegarVacio} />
        )}
        <span className={styles.codigo}>{c.codigo}</span>
        <span className={styles.nombre}>
          {c.nombre}
          {conRuta && c.codigoPadre && <span className={styles.ruta}>en {c.codigoPadre}</span>}
        </span>
      </div>
      <div className={styles.filaMeta}>
        {c.propia && <span className={cx(styles.badge, styles.tonoPropia)}>Propia</span>}
        {!c.activa ? (
          <span className={cx(styles.badge, styles.tonoNeutral)}>Inactiva</span>
        ) : c.imputable ? (
          <span className={cx(styles.badge, styles.tonoSuccess)}>Movimiento</span>
        ) : (
          <span className={cx(styles.badge, styles.tonoNeutral)}>Agrupa</span>
        )}
        <span className={cx(styles.badge, styles.badgeNat, nat.tono)}>{nat.label}</span>
        <div className={styles.acciones}>
          {c.propia && (
            <button type="button" className={styles.btnIcono} aria-label={`Editar ${c.codigo}`} title="Editar subcuenta" onClick={() => onEditar(c)}>
              <LuPencil />
            </button>
          )}
          {puedeAgregar && (
            <button type="button" className={styles.btnIcono} aria-label={`Agregar subcuenta a ${c.codigo}`} title="Agregar subcuenta" onClick={() => onAgregar(c)}>
              <LuPlus />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ---------- Resultados de búsqueda ---------- */

const Resultados: React.FC<{ q: string; onElegir: (c: Cuenta) => void }> = ({ q, onElegir }) => {
  const r = useGetCuentasContablesQuery({ q });
  if (r.isFetching && !r.data) {
    return (
      <div className={styles.skelLista}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={styles.skel} style={{ height: 44 }} />
        ))}
      </div>
    );
  }
  if (r.isError) return <ErrorCarga onRetry={r.refetch} />;
  const lista = r.data ?? [];
  if (!lista.length) {
    return (
      <div className={styles.vacio}>
        <LuSearchX className={styles.vacioIcono} />
        <span className={styles.estadoTitulo}>No hay cuentas que coincidan con “{q}”</span>
      </div>
    );
  }
  const mostradas = lista.slice(0, 100);
  return (
    <>
      <div className={styles.cabeceraLista}>
        <span>Resultados</span>
        <span className={styles.cardSub}>
          {lista.length > 100 ? `Primeras 100 de ${lista.length}` : `${lista.length} cuentas`}
        </span>
      </div>
      <div className={styles.lista}>
        {mostradas.map((c) => (
          <button key={c.id} type="button" className={styles.resultado} onClick={() => onElegir(c)}>
            <span className={styles.codigo}>{c.codigo}</span>
            <span className={styles.nombre}>
              {c.nombre}
              <span className={styles.ruta}>Elemento {c.elemento}{c.codigoPadre ? ` · en ${c.codigoPadre}` : ''}</span>
            </span>
            <span className={styles.filaMeta}>
              {c.propia && <span className={cx(styles.badge, styles.tonoPropia)}>Propia</span>}
              <span className={cx(styles.badge, c.imputable ? styles.tonoSuccess : styles.tonoNeutral)}>
                {c.imputable ? 'Movimiento' : c.activa ? 'Agrupa' : 'Inactiva'}
              </span>
            </span>
          </button>
        ))}
      </div>
    </>
  );
};

const ErrorCarga: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div role="alert" className={styles.vacio}>
    <LuCloudOff className={styles.vacioIcono} />
    <span className={styles.estadoTitulo}>No se pudo cargar el plan de cuentas</span>
    <button type="button" className={styles.btnSecondary} onClick={onRetry}>
      <LuRotateCw /> Reintentar
    </button>
  </div>
);
