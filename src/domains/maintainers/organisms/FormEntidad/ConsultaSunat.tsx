import { useEffect } from "react";
import { LuCircleAlert, LuCircleCheck, LuLoaderCircle, LuSearch, LuTriangleAlert } from "react-icons/lu";
import { erroresDe } from "@/domains/transactions/pages/manualJournalEntries/asientosApi";
import { useLazyConsultarContribuyenteQuery, type Contribuyente } from "../../api/contribuyentesApi";
import styles from "./FormEntidad.module.scss";

const largoDe = (tipo?: string) => (tipo === "JURIDICA" ? 11 : tipo === "NATURAL" ? 8 : 0);

/**
 * Consulta el RUC (SUNAT) o DNI (RENIEC) en cuanto el número está completo y
 * muestra su estado. Con `onDatos` el formulario se autocompleta.
 */
export const ConsultaSunat = ({
 tipo,
 numero,
 onDatos,
}: {
 tipo?: string;
 numero?: string;
 onDatos?: (c: Contribuyente) => void;
}) => {
 const [consultar, { data, error, isFetching, originalArgs }] = useLazyConsultarContribuyenteQuery();
 const completo = !!numero && numero.length === largoDe(tipo) && /^\d+$/.test(numero);

 useEffect(() => {
  if (!completo) return;
  consultar(numero!, true)
   .unwrap()
   .then((c) => c.encontrado && onDatos?.(c))
   .catch(() => undefined);
  // onDatos cambia en cada render; solo importa el número
  // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [completo, numero, consultar]);

 if (!completo || originalArgs !== numero) return null;
 if (isFetching) {
  return (
   <p className={styles.FormEntidad__Sunat}>
    <LuLoaderCircle className={styles.FormEntidad__Girando} /> Consultando {tipo === "JURIDICA" ? "SUNAT" : "RENIEC"}…
   </p>
  );
 }
 if (error) {
  return (
   <p className={`${styles.FormEntidad__Sunat} ${styles["FormEntidad__Sunat--error"]}`}>
    <LuCircleAlert /> {erroresDe(error)[0]}
   </p>
  );
 }
 if (!data) return null;
 if (data.fuente === "sin-servicio") {
  return (
   <p className={styles.FormEntidad__Sunat}>
    <LuSearch /> No se pudo consultar ahora; completa los datos a mano.
   </p>
  );
 }
 if (data.avisos.length) {
  return (
   <div className={`${styles.FormEntidad__Sunat} ${styles["FormEntidad__Sunat--aviso"]}`}>
    <LuTriangleAlert />
    <span>{data.avisos.join(" · ")}</span>
   </div>
  );
 }
 return (
  <p className={`${styles.FormEntidad__Sunat} ${styles["FormEntidad__Sunat--ok"]}`}>
   <LuCircleCheck />
   {data.tipo === "RUC" ? `${data.estado ?? "ACTIVO"} · ${data.condicion ?? "HABIDO"}` : "DNI encontrado en RENIEC"}
   {onDatos && " · datos completados"}
  </p>
 );
};
