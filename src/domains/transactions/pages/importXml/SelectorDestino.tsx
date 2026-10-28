import React, { useId, useState } from 'react';
import { cx } from '@/domains/settings/pages/Configuracion/util';
import { CuentaSelector } from '../manualJournalEntries/CuentaSelector';
import type { Destino } from './decision';
import base from '../manualJournalEntries/Asientos.module.scss';
import styles from './ImportarXml.module.scss';

export interface Catalogos {
  productos: { id: number; nombre: string; codigo: string; unidadMedida: string }[];
  categorias: { id: number; nombre: string }[];
  areas: { id: number; nombre: string }[];
}

/**
 * Elige a dónde va una línea: producto existente, producto nuevo, o gasto /
 * ingreso con su cuenta y área. `extra` se muestra junto a los controles de
 * producto (p. ej. el factor de conversión del XML).
 */
export const SelectorDestino: React.FC<{
  destino: Destino;
  marcarFalta: boolean;
  catalogos: Catalogos;
  onChange: (c: Partial<Destino>) => void;
  extra?: React.ReactNode;
}> = ({ destino: d, marcarFalta, catalogos, onChange, extra }) => {
  const { productos, categorias, areas } = catalogos;
  const etiqueta = (p: { codigo: string; nombre: string }) => (p.codigo ? `${p.codigo} · ${p.nombre}` : p.nombre);
  const elegido = productos.find((p) => p.id === d.idProducto);
  const [texto, setTexto] = useState<string | null>(null);
  const listaId = useId();

  return (
    <>
      <div className={base.segmento} role="group" aria-label="Tipo de línea">
        {(['producto', 'servicio'] as const).map((t) => (
          <button
            key={t}
            type="button"
            className={cx(d.tipo === t && base.segmentoOn)}
            onClick={() => onChange({ tipo: t })}
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
                className={cx(base.input, styles.crece, marcarFalta && !d.idProducto && base.inputError)}
                list={listaId}
                placeholder="Buscar producto por código o nombre"
                value={texto ?? (elegido ? etiqueta(elegido) : '')}
                onChange={(e) => {
                  const v = e.target.value;
                  setTexto(v);
                  const p = productos.find((x) => etiqueta(x) === v);
                  if (p) {
                    onChange({ idProducto: p.id });
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
                placeholder="Nombre del producto nuevo"
                onChange={(e) => onChange({ nombre: e.target.value })}
              />
              <select
                className={cx(base.input, styles.medio, marcarFalta && !d.idCategoria && base.inputError)}
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
          {extra}
          <button
            type="button"
            className={base.btnLink}
            onClick={() =>
              onChange({
                modo: d.modo === 'nuevo' ? 'existente' : 'nuevo',
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
              error={marcarFalta && !d.cuenta}
              onChange={(c) => onChange({ cuenta: c })}
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
    </>
  );
};
