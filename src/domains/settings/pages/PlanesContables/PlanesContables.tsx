import React, { useMemo, useRef, useState } from 'react';
import { LuCircleAlert, LuCircleCheck, LuDownload, LuTriangleAlert, LuUpload } from 'react-icons/lu';
import { Drawer, ToastProvider } from '@/domains/settings/pages/Configuracion/ui';
import { cx, useToast } from '@/domains/settings/pages/Configuracion/util';
import { erroresDe } from '@/domains/transactions/pages/manualJournalEntries/asientosApi';
import { aBase64 } from '@/domains/transactions/pages/importXml/importacionApi';
import { descargarArchivo } from '@/shared/utils';
import base from '@/domains/transactions/pages/manualJournalEntries/Asientos.module.scss';
import {
  useGetEquivalenciasPlanQuery,
  useGetPlanesAdminQuery,
  usePrevisualizarPlanMutation,
  usePublicarPlanMutation,
  useRevisarEquivalenciaMutation,
  type Equivalencia,
  type ImportarPlan,
  type PlanAdmin,
  type PreviaPlan,
  type TipoEquivalencia,
} from './planesApi';
import styles from './PlanesContables.module.scss';

const TIPO: Record<TipoEquivalencia, string> = {
  igual: 'Igual',
  renombrada: 'Renombrada',
  cambio: 'Otro significado',
  eliminada: 'Eliminada',
};

export const PlanesContables: React.FC = () => (
  <ToastProvider>
    <Pagina />
  </ToastProvider>
);

/** Panel del administrador: planes de cuentas como datos (sin tocar código) */
const Pagina: React.FC = () => {
  const planes = useGetPlanesAdminQuery();
  const [importando, setImportando] = useState<'nuevo' | PlanAdmin | null>(null);
  const lista = planes.data ?? [];

  return (
    <div className={base.pagina}>
      <div className={base.header}>
        <div className={base.headerTexto}>
          <h1 className={base.titulo}>Planes de cuentas</h1>
          <span className={base.subtitulo}>
            Carga un plan nuevo o la actualización de uno existente desde Excel, CSV o JSON, sin cambiar el sistema. Las
            empresas lo adoptan desde un período en su Plan de cuentas.
          </span>
        </div>
        <button type="button" className={base.btnPrimary} onClick={() => setImportando('nuevo')}>
          <LuUpload /> Importar plan
        </button>
      </div>

      <section className={styles.planes}>
        {lista.map((p) => (
          <article key={p.id} className={cx(base.card, styles.plan)}>
            <div className={styles.planCab}>
              <b>{p.nombre}</b>
              {p.porDefecto && <span className={cx(base.badge, base.tonoSuccess)}>Por defecto</span>}
              <span className={cx(base.badge, base.tonoNeutral)}>
                {p.origen === 'importado' ? 'Importado' : 'Incluido'} · v{p.version}
              </span>
            </div>
            <span className={base.hint}>
              {p.codigo} · {p.norma} · desde {p.vigenteDesde.split('-').reverse().join('/')}
            </span>
            {p.nota && <span className={base.hint}>{p.nota}</span>}
            <dl className={styles.cifras}>
              <div>
                <dt>Cuentas</dt>
                <dd>{p.cuentas}</dd>
              </div>
              <div>
                <dt>Empresas que lo usan</dt>
                <dd>{p.empresas}</dd>
              </div>
            </dl>
            <button type="button" className={base.btnLink} onClick={() => setImportando(p)}>
              <LuUpload /> Subir actualización
            </button>
          </article>
        ))}
      </section>

      {lista.length >= 2 && <Equivalencias planes={lista} />}

      {importando && (
        <ImportarPlanDrawer actualizar={importando === 'nuevo' ? null : importando} onClose={() => setImportando(null)} />
      )}
    </div>
  );
};

const ImportarPlanDrawer: React.FC<{ actualizar: PlanAdmin | null; onClose: () => void }> = ({
  actualizar,
  onClose,
}) => {
  const toast = useToast();
  const [previsualizar, { isLoading: revisando }] = usePrevisualizarPlanMutation();
  const [publicar, { isLoading: publicando }] = usePublicarPlanMutation();
  const [datos, setDatos] = useState({
    codigo: actualizar?.codigo ?? '',
    nombre: actualizar?.nombre ?? '',
    norma: actualizar?.norma ?? '',
    codigoSunat: actualizar?.codigoSunat ?? '01',
    vigenteDesde: actualizar?.vigenteDesde ?? '',
    nota: actualizar?.nota ?? '',
  });
  const [archivo, setArchivo] = useState<{ nombre: string; contenido: string } | null>(null);
  const [previa, setPrevia] = useState<PreviaPlan | null>(null);
  const [errores, setErrores] = useState<string[]>([]);
  const entrada = useRef<HTMLInputElement>(null);

  const cuerpo = (): ImportarPlan => ({
    modo: actualizar ? 'actualizar' : 'nuevo',
    ...datos,
    nota: datos.nota || undefined,
    archivo: archivo!,
  });
  const cambiar = (c: Partial<typeof datos>) => {
    setDatos((d) => ({ ...d, ...c }));
    setPrevia(null);
  };

  const revisar = async () => {
    setErrores([]);
    if (!archivo) return setErrores(['Elige el archivo del plan']);
    try {
      setPrevia(await previsualizar(cuerpo()).unwrap());
    } catch (e) {
      setErrores(erroresDe(e));
    }
  };
  const confirmar = async () => {
    try {
      const r = await publicar(cuerpo()).unwrap();
      toast(`Plan publicado: ${r.creadas} cuentas nuevas, ${r.renombradas} renombradas, ${r.desactivadas} desactivadas`);
      onClose();
    } catch (e) {
      setErrores(erroresDe(e));
    }
  };

  const listo = previa && previa.errores.length === 0;
  const d = previa?.diferencias;

  return (
    <Drawer
      titulo={actualizar ? `Actualizar ${actualizar.nombre}` : 'Importar un plan de cuentas'}
      onClose={onClose}
      pie={
        <div className={base.botonesFin}>
          {listo ? (
            <button type="button" className={base.btnPrimary} disabled={publicando} onClick={() => void confirmar()}>
              {publicando ? 'Publicando…' : 'Publicar plan'}
            </button>
          ) : (
            <button type="button" className={base.btnPrimary} disabled={revisando} onClick={() => void revisar()}>
              {revisando ? 'Revisando…' : 'Revisar archivo'}
            </button>
          )}
          <button type="button" className={base.btnSecondary} onClick={onClose}>
            Cancelar
          </button>
        </div>
      }
    >
      <p className={base.hint}>
        El archivo necesita dos columnas: <b>Código</b> (o Cuenta) y <b>Denominación</b> (o Nombre o Descripción). Primero
        se revisa: no se guarda nada hasta publicar.
        {actualizar && ' Las cuentas que el archivo ya no traiga quedarán inactivas (no se borran).'}
      </p>
      <div className={styles.formulario}>
        <label className={base.campo}>
          <span>Código del plan</span>
          <input
            className={base.input}
            value={datos.codigo}
            disabled={!!actualizar}
            placeholder="PCGE2030"
            onChange={(e) => cambiar({ codigo: e.target.value.toUpperCase() })}
          />
        </label>
        <label className={base.campo}>
          <span>Vigente desde</span>
          <input
            type="date"
            className={base.input}
            value={datos.vigenteDesde}
            onChange={(e) => cambiar({ vigenteDesde: e.target.value })}
          />
        </label>
        <label className={cx(base.campo, styles.ancho)}>
          <span>Nombre</span>
          <input
            className={base.input}
            value={datos.nombre}
            placeholder="Plan Contable General Empresarial 2030"
            onChange={(e) => cambiar({ nombre: e.target.value })}
          />
        </label>
        <label className={base.campo}>
          <span>Norma</span>
          <input
            className={base.input}
            value={datos.norma}
            placeholder="Resolución N° …-EF/30"
            onChange={(e) => cambiar({ norma: e.target.value })}
          />
        </label>
        <label className={base.campo}>
          <span>Código SUNAT (Tabla 17)</span>
          <input
            className={base.input}
            value={datos.codigoSunat}
            maxLength={2}
            onChange={(e) => cambiar({ codigoSunat: e.target.value.replace(/\D/g, '') })}
          />
        </label>
        <label className={cx(base.campo, styles.ancho)}>
          <span>
            Nota <span className={base.opcional}>(opcional)</span>
          </span>
          <input className={base.input} value={datos.nota} onChange={(e) => cambiar({ nota: e.target.value })} />
        </label>
        <div className={cx(styles.archivo, styles.ancho)}>
          <button type="button" className={base.btnSecondary} onClick={() => entrada.current?.click()}>
            <LuUpload /> {archivo ? 'Cambiar archivo' : 'Elegir archivo'}
          </button>
          <span className={base.hint}>{archivo?.nombre ?? '.xlsx, .csv o .json'}</span>
          <input
            ref={entrada}
            type="file"
            hidden
            accept=".xlsx,.csv,.json"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (!f) return;
              setArchivo({ nombre: f.name, contenido: await aBase64(f) });
              setPrevia(null);
            }}
          />
        </div>
      </div>

      {previa && (
        <div className={styles.previa}>
          {previa.errores.length > 0 ? (
            <div role="alert" className={base.alertaError}>
              <LuCircleAlert />
              <ul>
                {previa.errores.slice(0, 15).map((e) => (
                  <li key={e}>{e}</li>
                ))}
                {previa.errores.length > 15 && <li>… y {previa.errores.length - 15} más</li>}
              </ul>
            </div>
          ) : (
            <div className={styles.ok}>
              <LuCircleCheck /> El archivo es válido: {d?.total} cuentas.
            </div>
          )}
          {previa.avisos.map((a) => (
            <div key={a} className={styles.aviso}>
              <LuTriangleAlert /> {a}
            </div>
          ))}
          {d && (
            <>
              <span className={base.cardSub}>
                {d.comparadoCon ? `Comparado con ${d.comparadoCon}:` : 'Plan nuevo:'} {d.nuevas.length} nuevas ·{' '}
                {d.renombradas.length} renombradas · {d.quitadas.length} que salen
              </span>
              <Cambios titulo="Nuevas" filas={d.nuevas.map(([c, n]) => [c, n])} />
              <Cambios titulo="Renombradas" filas={d.renombradas.map(([c, a, n]) => [c, `${a} → ${n}`])} />
              <Cambios titulo="Salen del plan" filas={d.quitadas.map(([c, n]) => [c, n])} />
            </>
          )}
        </div>
      )}
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
    </Drawer>
  );
};

const Cambios: React.FC<{ titulo: string; filas: [string, string][] }> = ({ titulo, filas }) =>
  filas.length ? (
    <details className={styles.cambios}>
      <summary>
        {titulo} ({filas.length})
      </summary>
      <ul>
        {filas.slice(0, 200).map(([c, n]) => (
          <li key={c}>
            <b>{c}</b> {n}
          </li>
        ))}
        {filas.length > 200 && <li>… y {filas.length - 200} más</li>}
      </ul>
    </details>
  ) : null;

/** Revisión de la tabla de equivalencias entre dos planes */
const Equivalencias: React.FC<{ planes: PlanAdmin[] }> = ({ planes }) => {
  const toast = useToast();
  const [origen, setOrigen] = useState(planes[0].codigo);
  const [destino, setDestino] = useState(planes[1].codigo);
  const [ver, setVer] = useState<'revisar' | 'todas'>('revisar');
  const [texto, setTexto] = useState('');
  const [descargando, setDescargando] = useState(false);
  const q = useGetEquivalenciasPlanQuery({ origen, destino }, { skip: origen === destino });
  const tabla = q.data;

  const filas = useMemo(() => {
    const t = texto.trim().toLowerCase();
    return (tabla?.equivalencias ?? [])
      .filter((e) => (ver === 'revisar' ? !e.revisada : true))
      .filter(
        (e) =>
          !t ||
          e.codigoOrigen.startsWith(t) ||
          e.nombreOrigen?.toLowerCase().includes(t) ||
          e.codigoDestino?.startsWith(t),
      )
      .slice(0, 300);
  }, [tabla, ver, texto]);

  const excel = async () => {
    setDescargando(true);
    try {
      await descargarArchivo(
        '/plan-contable/equivalencias/excel',
        { origen, destino },
        `equivalencias_${origen}_${destino}.xlsx`,
      );
    } catch (e) {
      toast(e instanceof Error ? e.message : 'No se pudo descargar');
    } finally {
      setDescargando(false);
    }
  };

  return (
    <section className={base.card}>
      <div className={styles.eqCab}>
        <div>
          <span className={base.cardTitle}>Equivalencias entre planes</span>
          <span className={base.cardSub}>
            A qué cuenta del plan nuevo va cada cuenta del anterior. Se usan cuando una empresa cambia de plan.
          </span>
        </div>
        <button type="button" className={base.btnSecondary} disabled={descargando} onClick={() => void excel()}>
          <LuDownload /> {descargando ? 'Generando…' : 'Excel para los contadores'}
        </button>
      </div>
      <div className={base.filtros}>
        <label className={base.campoFiltro}>
          <span>De</span>
          <select className={base.input} value={origen} onChange={(e) => setOrigen(e.target.value)}>
            {planes.map((p) => (
              <option key={p.codigo}>{p.codigo}</option>
            ))}
          </select>
        </label>
        <label className={base.campoFiltro}>
          <span>A</span>
          <select className={base.input} value={destino} onChange={(e) => setDestino(e.target.value)}>
            {planes.map((p) => (
              <option key={p.codigo}>{p.codigo}</option>
            ))}
          </select>
        </label>
        <label className={cx(base.campoFiltro, styles.buscar)}>
          <span>Buscar</span>
          <input
            className={base.input}
            value={texto}
            placeholder="Código o nombre"
            onChange={(e) => setTexto(e.target.value)}
          />
        </label>
        <div className={base.segmento} role="tablist">
          <button type="button" className={cx(ver === 'revisar' && base.segmentoOn)} onClick={() => setVer('revisar')}>
            Por revisar {tabla ? `(${tabla.porRevisar})` : ''}
          </button>
          <button type="button" className={cx(ver === 'todas' && base.segmentoOn)} onClick={() => setVer('todas')}>
            Todas
          </button>
        </div>
      </div>
      {tabla && (
        <div className={styles.resumen}>
          {(Object.keys(TIPO) as TipoEquivalencia[]).map((t) => (
            <span key={t} className={cx(base.badge, t === 'igual' || t === 'renombrada' ? base.tonoSuccess : base.tonoNeutral)}>
              {TIPO[t]}: {tabla.resumen[t] ?? 0}
            </span>
          ))}
        </div>
      )}
      {origen === destino ? (
        <p className={styles.vacio}>Elige dos planes distintos.</p>
      ) : !tabla?.equivalencias.length && !q.isFetching ? (
        <p className={styles.vacio}>No hay equivalencias entre estos planes.</p>
      ) : (
        <div className={styles.eqLista}>
          {filas.map((e) => (
            <FilaEquivalencia key={e.id} e={e} destino={destino} />
          ))}
          {filas.length === 300 && <p className={styles.vacio}>Se muestran 300; usa el buscador para ver otras.</p>}
        </div>
      )}
    </section>
  );
};

const FilaEquivalencia: React.FC<{ e: Equivalencia; destino: string }> = ({ e, destino }) => {
  const toast = useToast();
  const [revisar, { isLoading }] = useRevisarEquivalenciaMutation();
  const [codigo, setCodigo] = useState(e.codigoDestino ?? '');
  const guardar = async () => {
    try {
      await revisar({ id: e.id, codigoDestino: codigo.trim() || null }).unwrap();
      toast(`Cuenta ${e.codigoOrigen} revisada`);
    } catch (err) {
      toast(erroresDe(err)[0]);
    }
  };
  return (
    <div className={cx(styles.eqFila, !e.revisada && styles.eqPendiente)}>
      <div className={styles.eqOrigen}>
        <b>{e.codigoOrigen}</b> {e.nombreOrigen}
        <span className={cx(base.badge, e.revisada ? base.tonoSuccess : base.tonoNeutral)}>
          {TIPO[e.tipo]}
          {e.revisada && e.revisadaPor ? ` · ${e.revisadaPor}` : ''}
        </span>
      </div>
      <div className={styles.eqDestino}>
        <input
          className={base.input}
          value={codigo}
          inputMode="numeric"
          placeholder="Cuenta"
          aria-label={`Cuenta ${destino} para ${e.codigoOrigen}`}
          onChange={(ev) => setCodigo(ev.target.value.replace(/\D/g, ''))}
        />
        <span className={styles.eqNombre}>
          {codigo === (e.codigoDestino ?? '') ? (e.nombreDestino ?? 'Sin equivalente') : 'Sin guardar'}
        </span>
        <button type="button" className={base.btnSecondary} disabled={isLoading} onClick={() => void guardar()}>
          {e.revisada && codigo === (e.codigoDestino ?? '') ? 'Revisada' : 'Confirmar'}
        </button>
      </div>
    </div>
  );
};
