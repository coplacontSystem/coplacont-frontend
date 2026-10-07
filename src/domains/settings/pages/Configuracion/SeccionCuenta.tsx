import React, { useEffect, useRef, useState } from 'react';
import {
  LuCamera,
  LuCircle,
  LuCircleCheck,
  LuEye,
  LuEyeOff,
  LuKeyRound,
  LuLogIn,
  LuTrash2,
  LuX,
  LuZoomIn,
  LuZoomOut,
} from 'react-icons/lu';
import { useAuth } from '@/domains/auth';
import {
  mensajeError,
  useActualizarCuentaMutation,
  useCambiarContrasenaMutation,
  useCambiarCorreoMutation,
  useGetCuentaQuery,
  useGuardarAvatarMutation,
  type Perfil,
} from './configuracionApi';
import { Card, ErrorCampo, InlineEditField, Modal, type CampoDef } from './ui';
import { cx, fecha, iniciales, leerImagen, mb, useToast, cargarImagen } from './util';
import { CargandoSeccion, ErrorSeccion, type SeccionProps } from './comun';
import styles from './Configuracion.module.scss';

const CAMPOS: CampoDef[] = [
  {
    k: 'nombre',
    label: 'Nombre completo',
    validar: (v) => (v.split(/\s+/).length < 2 ? 'Escribe tu nombre y al menos un apellido.' : ''),
  },
  {
    k: 'email',
    label: 'Correo electrónico',
    tipo: 'email',
    pideContrasena: true,
    validar: (v) =>
      /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v) ? '' : 'Ingresa un correo válido, p. ej. nombre@empresa.pe',
  },
  {
    k: 'telefono',
    label: 'Teléfono',
    tipo: 'tel',
    opcional: true,
    placeholder: '987 654 321',
    validar: (v) =>
      /^(\+?51)?9\d{8}$/.test(v.replace(/[\s-]/g, '')) ? '' : 'Ingresa un celular de 9 dígitos, p. ej. 987 654 321.',
  },
  {
    k: 'cargo',
    label: 'Cargo',
    opcional: true,
    placeholder: 'p. ej. Contador',
    hint: 'Aparece junto a tu nombre en los reportes.',
    validar: (v) => (v.length > 40 ? 'Máximo 40 caracteres.' : ''),
  },
];

/** "Mozilla/5.0 (Windows NT 10.0…) Chrome/…" → "Chrome en Windows" */
function navegador(ua: string | null): string {
  if (!ua) return '';
  const b = /Edg\//.test(ua)
    ? 'Edge'
    : /OPR\//.test(ua)
      ? 'Opera'
      : /Firefox\//.test(ua)
        ? 'Firefox'
        : /Chrome\//.test(ua)
          ? 'Chrome'
          : /Safari\//.test(ua)
            ? 'Safari'
            : '';
  const so = /Windows/.test(ua)
    ? 'Windows'
    : /iPhone|iPad/.test(ua)
      ? 'iOS'
      : /Android/.test(ua)
        ? 'Android'
        : /Mac OS X/.test(ua)
          ? 'macOS'
          : /Linux/.test(ua)
            ? 'Linux'
            : '';
  return [b, so].filter(Boolean).join(' en ');
}

function cuando(iso: string): string {
  const d = new Date(iso);
  const hoy = new Date();
  const hora = d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false });
  const dias = Math.floor((new Date(hoy.toDateString()).getTime() - new Date(d.toDateString()).getTime()) / 864e5);
  if (dias === 0) return `Hoy, ${hora}`;
  if (dias === 1) return `Ayer, ${hora}`;
  return `${fecha(iso)}, ${hora}`;
}

function haceCuanto(iso: string): string {
  const meses = Math.floor((Date.now() - new Date(iso).getTime()) / (30.4 * 864e5));
  if (meses < 1) return 'este mes';
  return meses === 1 ? 'hace 1 mes' : `hace ${meses} meses`;
}

export const SeccionCuenta: React.FC<SeccionProps> = ({ onDirty }) => {
  const q = useGetCuentaQuery();
  const { user, token, login } = useAuth();
  const toast = useToast();
  const [actualizar] = useActualizarCuentaMutation();
  const [cambiarCorreo] = useCambiarCorreoMutation();
  const [guardarAvatar, { isLoading: subiendo }] = useGuardarAvatarMutation();
  const [editando, setEditando] = useState<string | null>(null);
  const [sucio, setSucio] = useState(false);
  const [pwSucio, setPwSucio] = useState(false);
  const [avErr, setAvErr] = useState('');
  const [recorte, setRecorte] = useState<{ src: string; nombre: string; peso: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => onDirty((sucio ? 1 : 0) + (pwSucio ? 1 : 0)), [sucio, pwSucio, onDirty]);

  if (q.isLoading) return <CargandoSeccion avatar />;
  if (q.isError || !q.data) return <ErrorSeccion onRetry={q.refetch} />;
  const p = q.data;

  // El nombre y el correo también viven en la sesión (cabecera, saludo)
  const sincronizarSesion = (nuevo: Perfil) => {
    if (user) login(nuevo.nombre, nuevo.email, token ?? '', user.persona, user.roles);
  };

  const guardarCampo = async (k: string, v: string, pass: string) => {
    try {
      if (k === 'email') {
        const r = await cambiarCorreo({ email: v, contrasenaActual: pass }).unwrap();
        sincronizarSesion(r);
        toast('Correo actualizado. Úsalo desde tu próximo inicio de sesión.');
      } else {
        const r = await actualizar({ [k]: v }).unwrap();
        if (k === 'nombre') sincronizarSesion(r);
        toast('Datos actualizados');
      }
      setEditando(null);
      setSucio(false);
    } catch (e) {
      throw new Error(mensajeError(e));
    }
  };

  const elegir = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const f = ev.target.files?.[0];
    ev.target.value = '';
    if (!f) return;
    const r = await leerImagen(f);
    if ('error' in r) return setAvErr(r.error);
    setAvErr('');
    setRecorte({ src: r.url, nombre: f.name, peso: f.size });
  };

  const subir = async (url: string | null) => {
    try {
      await guardarAvatar(url).unwrap();
      toast(url ? 'Foto de perfil actualizada' : 'Foto eliminada');
      setRecorte(null);
    } catch (e) {
      setAvErr(mensajeError(e, 'No se pudo guardar la foto.'));
      setRecorte(null);
    }
  };

  const empresa = user?.persona?.razonSocial || user?.persona?.nombreEmpresa || '';

  return (
    <>
      <input ref={fileRef} type="file" accept="image/png,image/jpeg" hidden onChange={elegir} />
      <section data-component="AvatarUploader" data-variant="circle" className={cx(styles.card, styles.avatarCard)}>
        {p.avatar ? (
          <img src={p.avatar} alt={`Foto de perfil de ${p.nombre}`} className={styles.avatar} />
        ) : (
          <div aria-label="Sin foto de perfil" className={cx(styles.avatar, styles.avatarIni)}>
            {iniciales(p.nombre) || '·'}
          </div>
        )}
        <div className={styles.avatarInfo}>
          <div className={styles.avatarNombre}>
            <span>{p.nombre}</span>
            <span>{[p.cargo, empresa].filter(Boolean).join(' · ')}</span>
          </div>
          <div className={styles.btnRow}>
            <button type="button" className={styles.btnSecondary} disabled={subiendo} onClick={() => fileRef.current?.click()}>
              <LuCamera /> Cambiar foto
            </button>
            {p.avatar && (
              <button type="button" className={styles.btnQuitar} disabled={subiendo} onClick={() => void subir(null)}>
                <LuTrash2 /> Quitar
              </button>
            )}
          </div>
          {avErr && <ErrorCampo>{avErr}</ErrorCampo>}
          <span className={styles.nota}>JPG o PNG · máximo 2 MB · se recorta en cuadrado</span>
        </div>
      </section>

      <Card titulo="Datos personales" sub="Se usan en notificaciones y para registrar quién cierra cada periodo.">
        <div className={styles.filas}>
          {CAMPOS.map((c) => (
            <InlineEditField
              key={c.k}
              def={c}
              valor={(p as unknown as Record<string, string | null>)[c.k]}
              editando={editando === c.k}
              otroEditando={!!editando && editando !== c.k}
              onEditar={() => setEditando(c.k)}
              onCancelar={() => {
                setEditando(null);
                setSucio(false);
              }}
              onCambio={setSucio}
              onGuardar={(v, pass) => guardarCampo(c.k, v, pass)}
            />
          ))}
        </div>
      </Card>

      <Card titulo="Seguridad" sub="Protege el acceso a la contabilidad de tu empresa.">
        <Seguridad perfil={p} onSucio={setPwSucio} />
        <div className={styles.segFila}>
          <span className={styles.segIcono}><LuLogIn /></span>
          <div className={styles.segTexto}>
            <span>Último inicio de sesión</span>
            <span>
              {p.ultimoLogin
                ? [cuando(p.ultimoLogin), navegador(p.ultimoAgente)].filter(Boolean).join(' · ')
                : 'Sin registro'}
            </span>
          </div>
        </div>
      </Card>

      {recorte && (
        <Recorte
          {...recorte}
          guardando={subiendo}
          onCancelar={() => setRecorte(null)}
          onGuardar={(url) => void subir(url)}
        />
      )}
    </>
  );
};

/* ---------- Contraseña ---------- */

const Seguridad: React.FC<{ perfil: Perfil; onSucio: (s: boolean) => void }> = ({ perfil, onSucio }) => {
  const toast = useToast();
  const [cambiar, { isLoading }] = useCambiarContrasenaMutation();
  const [abierto, setAbierto] = useState(false);
  const [ver, setVer] = useState(false);
  const [f, setF] = useState({ a: '', n: '', c: '' });
  const [intentado, setIntentado] = useState(false);
  const [errServidor, setErrServidor] = useState('');

  useEffect(() => onSucio(abierto && !!(f.a || f.n || f.c)), [abierto, f, onSucio]);

  const cerrar = () => {
    setAbierto(false);
    setVer(false);
    setF({ a: '', n: '', c: '' });
    setIntentado(false);
    setErrServidor('');
  };

  const ck = {
    len: f.n.length >= 8,
    mix: /[a-z]/.test(f.n) && /[A-Z]/.test(f.n),
    num: /\d/.test(f.n),
    sym: /[^A-Za-z0-9]/.test(f.n),
  };
  const e: { a?: string; n?: string; c?: string } = {};
  if (intentado) {
    if (!f.a) e.a = 'Ingresa tu contraseña actual.';
    if (!ck.len) e.n = 'Debe tener al menos 8 caracteres.';
    else if (f.n === f.a) e.n = 'Debe ser distinta de la actual.';
    if (f.c !== f.n) e.c = 'Las contraseñas no coinciden.';
  }
  if (!e.c && f.c && f.c.length >= f.n.length && f.c !== f.n) e.c = 'Las contraseñas no coinciden.';
  if (errServidor) e.a = errServidor;

  let nivel = 0;
  let etiqueta = 'Sin evaluar';
  if (f.n) nivel = ck.len ? 1 + Number(ck.mix) + Number(ck.num) + Number(ck.sym) : 1;
  if (f.n) etiqueta = ck.len ? ['', 'Débil', 'Aceptable', 'Buena', 'Fuerte'][nivel] : 'Muy corta';
  const tono = !f.n ? '' : !ck.len ? 'n1' : `n${nivel}`;

  const enviar = async () => {
    setIntentado(true);
    setErrServidor('');
    if (!f.a || !ck.len || f.n === f.a || f.c !== f.n) return;
    try {
      await cambiar({ actual: f.a, nueva: f.n }).unwrap();
      cerrar();
      toast('Contraseña actualizada');
    } catch (ex) {
      setErrServidor(mensajeError(ex));
    }
  };

  const tipo = ver ? 'text' : 'password';
  return (
    <>
      <div className={styles.segFila}>
        <span className={styles.segIcono}><LuKeyRound /></span>
        <div className={styles.segTexto}>
          <span>Contraseña</span>
          <span>
            Último cambio:{' '}
            {perfil.contrasenaActualizada
              ? `${fecha(perfil.contrasenaActualizada)} · ${haceCuanto(perfil.contrasenaActualizada)}`
              : 'sin registro'}
          </span>
        </div>
        {!abierto && (
          <button type="button" className={cx(styles.btnSecondary, styles.anchoMovil)} onClick={() => setAbierto(true)}>
            Cambiar contraseña
          </button>
        )}
      </div>
      {abierto && (
        <div className={styles.pwForm}>
          <label className={styles.campo}>
            <span className={styles.campoLabel}>Contraseña actual</span>
            <span className={styles.conOjo}>
              <input
                className={cx(styles.input, e.a && styles.inputError)}
                type={tipo}
                autoComplete="current-password"
                value={f.a}
                onChange={(ev) => {
                  setF({ ...f, a: ev.target.value });
                  setErrServidor('');
                }}
              />
              <button type="button" className={styles.ojo} aria-label={ver ? 'Ocultar contraseñas' : 'Mostrar contraseñas'} onClick={() => setVer(!ver)}>
                {ver ? <LuEyeOff /> : <LuEye />}
              </button>
            </span>
            {e.a && <ErrorCampo>{e.a}</ErrorCampo>}
          </label>
          <label className={styles.campo}>
            <span className={styles.campoLabel}>Nueva contraseña</span>
            <input
              className={cx(styles.input, e.n && styles.inputError)}
              type={tipo}
              autoComplete="new-password"
              value={f.n}
              onChange={(ev) => setF({ ...f, n: ev.target.value })}
            />
            <span className={styles.medidor} aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className={cx(i < nivel && styles[tono])} />
              ))}
            </span>
            <span className={styles.medidorTexto}>
              <span>
                Seguridad: <strong className={tono ? styles[`t${tono}`] : undefined}>{etiqueta}</strong>
              </span>
              <span>{f.n ? `${f.n.length} caracteres` : ''}</span>
            </span>
            <span className={styles.requisitos}>
              {(
                [
                  ['Mínimo 8 caracteres', ck.len, true],
                  ['Mayúsculas y minúsculas', ck.mix],
                  ['Al menos un número', ck.num],
                  ['Al menos un símbolo, p. ej. # o !', ck.sym],
                ] as [string, boolean, boolean?][]
              ).map(([t, ok, req]) => (
                <span key={t} className={cx(styles.requisito, ok && styles.requisitoOk)}>
                  {ok ? <LuCircleCheck /> : <LuCircle />}
                  {t}
                  {req && <span className={styles.obligatorio}>Obligatorio</span>}
                </span>
              ))}
            </span>
            {e.n && <ErrorCampo>{e.n}</ErrorCampo>}
          </label>
          <label className={styles.campo}>
            <span className={styles.campoLabel}>Confirmar nueva contraseña</span>
            <input
              className={cx(styles.input, e.c && styles.inputError)}
              type={tipo}
              autoComplete="new-password"
              value={f.c}
              onChange={(ev) => setF({ ...f, c: ev.target.value })}
              onKeyDown={(ev) => ev.key === 'Enter' && void enviar()}
            />
            {e.c && <ErrorCampo>{e.c}</ErrorCampo>}
            {!e.c && f.c && f.c === f.n && ck.len && (
              <span className={styles.okMsg}>
                <LuCircleCheck /> Las contraseñas coinciden
              </span>
            )}
          </label>
          <div className={styles.btnRow}>
            <button type="button" className={styles.btnPrimary} disabled={isLoading} onClick={() => void enviar()}>
              {isLoading ? 'Actualizando…' : 'Actualizar contraseña'}
            </button>
            <button type="button" className={styles.btnSecondary} onClick={cerrar}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </>
  );
};

/* ---------- Recorte de la foto ---------- */

interface Encuadre {
  zoom: number;
  x: number;
  y: number;
}

function geometria(nw: number, nh: number, c: Encuadre, S: number) {
  const s0 = S / Math.min(nw, nh);
  const dw = nw * s0 * c.zoom;
  const dh = nh * s0 * c.zoom;
  const mx = (dw - S) / 2;
  const my = (dh - S) / 2;
  const x = Math.max(-mx, Math.min(mx, c.x));
  const y = Math.max(-my, Math.min(my, c.y));
  return { dw, dh, x, y, left: (S - dw) / 2 + x, top: (S - dh) / 2 + y };
}

const Recorte: React.FC<{
  src: string;
  nombre: string;
  peso: number;
  guardando: boolean;
  onCancelar: () => void;
  onGuardar: (url: string) => void;
}> = ({ src, nombre, peso, guardando, onCancelar, onGuardar }) => {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [c, setC] = useState<Encuadre>({ zoom: 1, x: 0, y: 0 });
  const arrastre = useRef<{ px: number; py: number; x: number; y: number } | null>(null);
  const S = typeof window !== 'undefined' && window.innerWidth < 560 ? Math.max(200, Math.min(window.innerWidth - 48, 300)) : 320;

  const cancelarRef = useRef(onCancelar);
  cancelarRef.current = onCancelar;
  useEffect(() => {
    cargarImagen(src).then(setImg, () => cancelarRef.current());
  }, [src]);

  if (!img) return null;
  const G = geometria(img.naturalWidth, img.naturalHeight, c, S);
  const r = 48 / S;

  const guardar = () => {
    const out = 320;
    const k = out / S;
    const cv = document.createElement('canvas');
    cv.width = cv.height = out;
    cv.getContext('2d')!.drawImage(img, G.left * k, G.top * k, G.dw * k, G.dh * k);
    onGuardar(cv.toDataURL('image/jpeg', 0.9));
  };

  return (
    <Modal label="Ajustar foto de perfil" onClose={onCancelar}>
      <div className={styles.modalHeadRow}>
        <span className={styles.modalTitle}>Ajusta tu foto</span>
        <button type="button" className={styles.iconBtn} aria-label="Cerrar" onClick={onCancelar}>
          <LuX />
        </button>
      </div>
      <span className={styles.modalTexto}>Arrastra para encuadrar y usa el zoom. Se guarda un recorte cuadrado.</span>
      <div className={styles.recorteCentro}>
        <div
          className={styles.recorte}
          style={{ width: S, height: S }}
          onPointerDown={(ev) => {
            ev.currentTarget.setPointerCapture(ev.pointerId);
            arrastre.current = { px: ev.clientX, py: ev.clientY, x: G.x, y: G.y };
          }}
          onPointerMove={(ev) => {
            const a = arrastre.current;
            if (!a) return;
            const n = geometria(img.naturalWidth, img.naturalHeight, { ...c, x: a.x + ev.clientX - a.px, y: a.y + ev.clientY - a.py }, S);
            setC({ ...c, x: n.x, y: n.y });
          }}
          onPointerUp={() => (arrastre.current = null)}
        >
          <img src={src} alt="" draggable={false} style={{ left: G.left, top: G.top, width: G.dw, height: G.dh }} />
          <div className={styles.recorteMascara} />
        </div>
      </div>
      <div className={styles.zoom}>
        <LuZoomOut />
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={c.zoom}
          aria-label="Zoom"
          onChange={(ev) => {
            const z = Number(ev.target.value);
            const n = geometria(img.naturalWidth, img.naturalHeight, { ...c, zoom: z }, S);
            setC({ zoom: z, x: n.x, y: n.y });
          }}
        />
        <LuZoomIn />
      </div>
      <div className={styles.vistaPrevia}>
        <div className={styles.vistaPreviaImg}>
          <img src={src} alt="" style={{ left: G.left * r, top: G.top * r, width: G.dw * r, height: G.dh * r }} />
        </div>
        <div className={styles.vistaPreviaTexto}>
          <span>Vista previa</span>
          <span>
            {nombre} · {mb(peso)}
          </span>
        </div>
      </div>
      <div className={styles.btnRowEnd}>
        <button type="button" className={styles.btnPrimary} disabled={guardando} onClick={guardar}>
          {guardando ? 'Guardando…' : 'Guardar foto'}
        </button>
        <button type="button" className={styles.btnSecondary} onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </Modal>
  );
};
