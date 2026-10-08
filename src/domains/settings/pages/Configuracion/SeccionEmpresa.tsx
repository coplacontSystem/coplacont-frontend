import React, { useEffect, useRef, useState } from 'react';
import { LuBadgeCheck, LuFileText, LuImageUp, LuTrash2 } from 'react-icons/lu';
import { useAuth } from '@/domains/auth';
import {
  mensajeError,
  useActualizarEmpresaMutation,
  useGetEmpresaQuery,
  useGuardarLogoMutation,
  type Empresa,
} from './configuracionApi';
import { Card, ErrorCampo, InlineEditField, type CampoDef } from './ui';
import { cx, iniciales, leerImagen, reducirLogo, useToast } from './util';
import { CargandoSeccion, ErrorSeccion, type SeccionProps } from './comun';
import styles from './Configuracion.module.scss';

const TELEFONO = (v: string) =>
  /^(\+?51)?\d{7,9}$/.test(v.replace(/[\s()-]/g, '')) ? '' : 'Ingresa un teléfono fijo o celular válido.';

const CAMPOS: CampoDef[] = [
  { k: 'razonSocial', label: 'Razón social' },
  { k: 'nombreComercial', label: 'Nombre comercial', opcional: true },
  { k: 'ruc', label: 'RUC', soloLectura: true },
  { k: 'direccion', label: 'Dirección fiscal' },
  { k: 'telefono', label: 'Teléfono', tipo: 'tel', opcional: true, placeholder: '(01) 345 6789', validar: TELEFONO },
];

export const SeccionEmpresa: React.FC<SeccionProps> = ({ onDirty }) => {
  const q = useGetEmpresaQuery();
  const { user, token, login } = useAuth();
  const toast = useToast();
  const [actualizar] = useActualizarEmpresaMutation();
  const [guardarLogo, { isLoading: subiendo }] = useGuardarLogoMutation();
  const [editando, setEditando] = useState<string | null>(null);
  const [sucio, setSucio] = useState(false);
  const [logoErr, setLogoErr] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => onDirty(sucio ? 1 : 0), [sucio, onDirty]);

  if (q.isLoading) return <CargandoSeccion avatar />;
  if (q.isError || !q.data) return <ErrorSeccion onRetry={q.refetch} />;
  const e = q.data;

  // La cabecera muestra la razón social desde la sesión
  const sincronizarSesion = (nueva: Empresa) => {
    if (user?.persona) {
      login(
        user.nombre,
        user.email,
        token ?? '',
        { ...user.persona, razonSocial: nueva.razonSocial, nombreEmpresa: nueva.nombreComercial },
        user.roles,
      );
    }
  };

  const guardarCampo = async (k: string, v: string) => {
    try {
      const r = await actualizar({ [k]: v }).unwrap();
      sincronizarSesion(r);
      toast('Datos de la empresa actualizados');
      setEditando(null);
      setSucio(false);
    } catch (ex) {
      throw new Error(mensajeError(ex));
    }
  };

  const elegir = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const f = ev.target.files?.[0];
    ev.target.value = '';
    if (!f) return;
    const r = await leerImagen(f);
    if ('error' in r) return setLogoErr(r.error);
    setLogoErr('');
    await subir(await reducirLogo(r.url));
  };

  const subir = async (url: string | null) => {
    try {
      await guardarLogo(url).unwrap();
      toast(url ? 'Logo actualizado' : 'Logo eliminado');
    } catch (ex) {
      setLogoErr(mensajeError(ex, 'No se pudo guardar el logo.'));
    }
  };

  // Si no hay nombre comercial propio, el backend guarda la razón social
  const valores: Record<string, string | null> = {
    ...e,
    nombreComercial: e.nombreComercial === e.razonSocial ? null : e.nombreComercial,
  } as unknown as Record<string, string | null>;

  return (
    <>
      <input ref={fileRef} type="file" accept="image/png,image/jpeg" hidden onChange={elegir} />
      <section data-component="AvatarUploader" data-variant="rect" className={cx(styles.card, styles.avatarCard)}>
        {e.logo ? (
          <div className={styles.logoBox}>
            <img src={e.logo} alt="Logo de la empresa" />
          </div>
        ) : (
          <div aria-label="Sin logo" className={cx(styles.logoBox, styles.logoIni)}>
            {iniciales(e.razonSocial) || '·'}
          </div>
        )}
        <div className={styles.avatarInfo}>
          <div className={styles.avatarNombre}>
            <span className={styles.cardTitle}>Logo de la empresa</span>
            <span className={styles.nota}>JPG o PNG · máximo 2 MB · de preferencia horizontal</span>
          </div>
          <div className={styles.btnRow}>
            <button type="button" className={styles.btnSecondary} disabled={subiendo} onClick={() => fileRef.current?.click()}>
              <LuImageUp /> {subiendo ? 'Subiendo…' : 'Cambiar logo'}
            </button>
            {e.logo && (
              <button type="button" className={styles.btnQuitar} disabled={subiendo} onClick={() => void subir(null)}>
                <LuTrash2 /> Quitar
              </button>
            )}
          </div>
          {logoErr && <ErrorCampo>{logoErr}</ErrorCampo>}
          <span className={styles.notaIcono}>
            <LuFileText /> El logo aparece en el encabezado de tus reportes PDF.
          </span>
        </div>
      </section>

      <Card titulo="Datos de la empresa" sub="Aparecen en tus comprobantes, libros y estados financieros.">
        <div className={styles.filas}>
          {CAMPOS.map((c) => (
            <InlineEditField
              key={c.k}
              def={c}
              valor={valores[c.k]}
              editando={editando === c.k}
              otroEditando={!!editando && editando !== c.k}
              extraLectura={
                c.soloLectura ? (
                  <span className={styles.chipVerificado}>
                    <LuBadgeCheck /> Verificado
                  </span>
                ) : undefined
              }
              onEditar={() => setEditando(c.k)}
              onCancelar={() => {
                setEditando(null);
                setSucio(false);
              }}
              onCambio={setSucio}
              onGuardar={(v) => guardarCampo(c.k, v)}
            />
          ))}
        </div>
      </Card>
    </>
  );
};
