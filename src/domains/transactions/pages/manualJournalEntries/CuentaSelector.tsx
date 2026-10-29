import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LuChevronDown, LuSearch } from 'react-icons/lu';
import { cx } from '@/domains/settings/pages/Configuracion/util';
import { useGetCuentasContablesQuery } from '@/domains/accounting/pages/chartOfAccount/planContableApi';
import styles from './Asientos.module.scss';

export interface CuentaElegida {
  codigo: string;
  nombre: string;
}

/**
 * Busca cuentas de movimiento por código o nombre. La lista se abre en un
 * portal para que no la recorte la tabla de líneas.
 */
export const CuentaSelector: React.FC<{
  valor: CuentaElegida | null;
  error?: boolean;
  onChange: (c: CuentaElegida | null) => void;
}> = ({ valor, error, onChange }) => {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [activo, setActivo] = useState(0);
  // Enter antes de que lleguen los resultados: elige el primero al llegar
  const [pendiente, setPendiente] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const cajaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listaId = useId();

  useEffect(() => {
    const t = setTimeout(() => setBusqueda(texto.trim()), 250);
    return () => clearTimeout(t);
  }, [texto]);

  const r = useGetCuentasContablesQuery(
    { q: busqueda, imputables: true },
    { skip: !abierto || busqueda.length < 1 },
  );
  const opciones = (r.data ?? []).slice(0, 40);

  useEffect(() => {
    if (!pendiente || r.isFetching || texto.trim() !== busqueda) return;
    setPendiente(false);
    const o = opciones[0];
    if (o) elegir({ codigo: o.codigo, nombre: o.nombre });
    // elegir y opciones salen del mismo render: basta con reaccionar a los datos
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendiente, r.isFetching, r.data, busqueda, texto]);

  const ubicar = () => {
    const el = cajaRef.current;
    if (!el) return;
    const b = el.getBoundingClientRect();
    setPos({ top: b.bottom + 4, left: b.left, width: Math.max(b.width, 320) });
  };

  const abrir = () => {
    ubicar();
    setAbierto(true);
    setActivo(0);
  };

  useEffect(() => {
    if (!abierto) return;
    const cerrar = (e: MouseEvent) => {
      const t = e.target as Node;
      if (cajaRef.current?.contains(t) || document.getElementById(listaId)?.contains(t)) return;
      setAbierto(false);
      setTexto('');
    };
    const mover = () => ubicar();
    document.addEventListener('mousedown', cerrar);
    window.addEventListener('scroll', mover, true);
    window.addEventListener('resize', mover);
    return () => {
      document.removeEventListener('mousedown', cerrar);
      window.removeEventListener('scroll', mover, true);
      window.removeEventListener('resize', mover);
    };
  }, [abierto, listaId]);

  function elegir(c: CuentaElegida) {
    onChange(c);
    setAbierto(false);
    setTexto('');
    setPendiente(false);
  }

  return (
    <div ref={cajaRef} className={cx(styles.selector, error && styles.selectorError)}>
      {abierto ? (
        <>
          <LuSearch className={styles.selectorIcono} />
          <input
            ref={inputRef}
            autoFocus
            role="combobox"
            aria-expanded
            aria-controls={listaId}
            aria-autocomplete="list"
            value={texto}
            placeholder="Código o nombre (p. ej. 6211, sueldos)"
            onChange={(e) => {
              setTexto(e.target.value);
              setActivo(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActivo((a) => Math.min(a + 1, opciones.length - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActivo((a) => Math.max(a - 1, 0));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                const o = opciones[activo];
                const alDia = texto.trim() === busqueda && !r.isFetching;
                if (o && alDia) elegir({ codigo: o.codigo, nombre: o.nombre });
                else if (texto.trim()) setPendiente(true);
              } else if (e.key === 'Escape') {
                setAbierto(false);
                setTexto('');
              }
            }}
          />
        </>
      ) : (
        <button type="button" className={styles.selectorBoton} onClick={abrir}>
          {valor ? (
            <>
              <span className={styles.selectorCodigo}>{valor.codigo}</span>
              <span className={styles.selectorNombre}>{valor.nombre}</span>
            </>
          ) : (
            <span className={styles.selectorVacio}>Elegir cuenta</span>
          )}
          <LuChevronDown className={styles.selectorFlecha} />
        </button>
      )}

      {abierto &&
        pos &&
        createPortal(
          <ul
            id={listaId}
            role="listbox"
            className={styles.opciones}
            style={{ top: pos.top, left: pos.left, width: pos.width }}
          >
            {busqueda.length < 1 ? (
              <li className={styles.opcionInfo}>Escribe un código o parte del nombre.</li>
            ) : r.isFetching && !r.data ? (
              <li className={styles.opcionInfo}>Buscando…</li>
            ) : opciones.length === 0 ? (
              <li className={styles.opcionInfo}>
                No hay cuentas de movimiento que coincidan. Las cuentas que agrupan no reciben asientos.
              </li>
            ) : (
              opciones.map((o, i) => (
                <li
                  key={o.id}
                  role="option"
                  aria-selected={i === activo}
                  className={cx(styles.opcion, i === activo && styles.opcionActiva)}
                  onMouseEnter={() => setActivo(i)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    elegir({ codigo: o.codigo, nombre: o.nombre });
                  }}
                >
                  <span className={styles.selectorCodigo}>{o.codigo}</span>
                  <span className={styles.opcionNombre}>
                    {o.nombre}
                    {o.codigoPadre && <span>en {o.codigoPadre}</span>}
                  </span>
                </li>
              ))
            )}
          </ul>,
          document.body,
        )}
    </div>
  );
};
