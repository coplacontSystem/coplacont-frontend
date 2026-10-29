import React, { useEffect, useState } from "react";
import { ComboBox } from "@/components";
import {
 useBuscarCcnuQuery,
 useGetCodigoCcnuQuery,
} from "@/domains/maintainers/api/catalogosApi";
import styles from "./Main.module.scss";

/**
 * Buscador del catálogo CCNU (UNSPSC v14): por código o por palabras del
 * nombre. La búsqueda se hace en el servidor (49 mil códigos).
 */
export const CcnuSelector: React.FC<{
 value: string;
 onChange: (codigo: string) => void;
}> = ({ value, onChange }) => {
 const [texto, setTexto] = useState("");
 const [busqueda, setBusqueda] = useState("");

 useEffect(() => {
  const t = setTimeout(() => setBusqueda(texto.trim()), 300);
  return () => clearTimeout(t);
 }, [texto]);

 const resultados = useBuscarCcnuQuery(busqueda, { skip: busqueda.length < 2 });
 const actual = useGetCodigoCcnuQuery(value, { skip: !value });

 const etiqueta = (c: { codigo: string; nombre: string }) => `${c.codigo} · ${c.nombre}`;
 const opciones = (resultados.data ?? []).map((c) => ({ value: c.codigo, label: etiqueta(c) }));
 if (actual.data && !opciones.some((o) => o.value === value)) {
  opciones.unshift({ value: actual.data.codigo, label: etiqueta(actual.data) });
 }

 return (
  <>
   <ComboBox
    options={opciones}
    size="xs"
    variant="createSale"
    value={value}
    filtroExterno
    onFilterTextChange={setTexto}
    onChange={(v) => onChange(String(v))}
    placeholder="Buscar por código o nombre (p. ej. aceite comestible)"
   />
   {actual.data && (
    <span className={styles.ruta}>
     {actual.data.ruta.map((r) => r.nombre).join(" › ")}
     <button type="button" className={styles.quitar} onClick={() => onChange("")}>
      Quitar
     </button>
    </span>
   )}
   {!value && busqueda.length >= 2 && resultados.data?.length === 0 && (
    <span className={styles.ruta}>No hay códigos con ese texto.</span>
   )}
  </>
 );
};
