import React, { useState, useEffect, useMemo } from "react";
import styles from "./Main.module.scss";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");
import { Modal, ModalActions, Button, Text, Input, ComboBox } from "@/components";
import type { Category } from "@/domains/maintainers/types";
import { useGetCategoriesQuery } from "@/domains/maintainers/api/categoryApi";
import {
 useGetTiposExistenciaQuery,
 useGetUnidadesSunatQuery,
} from "@/domains/maintainers/api/catalogosApi";
import { CcnuSelector } from "./CcnuSelector";

interface CreateProductModalProps {
 isOpen: boolean;
 onClose: () => void;
 onSubmit: (data: DatosProducto) => void | Promise<void>;
 title?: string;
 description?: string;
 submitLabel?: string;
 isService?: boolean;
 initialValues?: {
  nombre: string;
  descripcion: string;
  unidadMedida: string;
  categoriaId: number;
  codigoSunat?: string | null;
  tipoExistencia?: string | null;
  codigoUnidad?: string | null;
 };
}

export interface DatosProducto {
 nombre: string;
 descripcion: string;
 unidadMedida: string;
 idCategoria: number;
 /** null quita el código */
 codigoSunat: string | null;
 tipoExistencia: string | null;
 codigoUnidad: string | null;
}

export const Main: React.FC<CreateProductModalProps> = ({
 isOpen,
 onClose,
 onSubmit,
 title = "Creación de nuevo producto",
 description = "Ingresa los siguientes datos para registrar un producto.",
 submitLabel = "Guardar",
 isService = false,
 initialValues,
}) => {
 const [nombre, setNombre] = useState("");
 const [descripcion, setDescripcion] = useState("");
 const [unidadMedida, setUnidadMedida] = useState("");
 const [categoriaId, setCategoriaId] = useState("");
 const [codigoSunat, setCodigoSunat] = useState("");
 const [tipoExistencia, setTipoExistencia] = useState("01");
 const [codigoUnidad, setCodigoUnidad] = useState("");

 const tiposExistencia = useGetTiposExistenciaQuery(undefined, { skip: !isOpen });
 const unidades = useGetUnidadesSunatQuery(undefined, { skip: !isOpen });

 const {
  data: allCategories = [],
  isLoading,
  isFetching,
 } = useGetCategoriesQuery(undefined, {
  skip: !isOpen,
 });

 const categories = useMemo(() => {
  let filtered = allCategories.filter((category: Category) =>
   isService ? category.tipo === "servicio" : category.tipo === "producto",
  );

  if (initialValues && initialValues.categoriaId) {
   const currentCategory = allCategories.find(
    (cat) => cat.id === initialValues.categoriaId,
   );
   if (
    currentCategory &&
    !filtered.find((cat) => cat.id === currentCategory.id)
   ) {
    filtered = [...filtered, currentCategory];
   }
  }

  return filtered;
 }, [allCategories, isService, initialValues]);

 useEffect(() => {
  if (initialValues) {
   setNombre(initialValues.nombre || "");
   setDescripcion(initialValues.descripcion || "");
   setUnidadMedida(initialValues.unidadMedida || "");
   setCategoriaId(initialValues.categoriaId?.toString() || "");
   setCodigoSunat(initialValues.codigoSunat || "");
   setTipoExistencia(initialValues.tipoExistencia || "01");
   setCodigoUnidad(initialValues.codigoUnidad || "");
  } else {
   setNombre("");
   setDescripcion("");
   setUnidadMedida("");
   setCategoriaId("");
   setCodigoSunat("");
   setTipoExistencia("01");
   setCodigoUnidad("");
  }
 }, [initialValues, isOpen]);

 const categoryOptions = categories.map((cat) => ({
  value: cat.id.toString(),
  label: cat.nombre,
 }));

 // Tabla 6 de SUNAT; la unidad visible (unidadMedida) sale de la elegida
 const unitOptions = (unidades.data ?? [])
  .filter((u) => u.codigo !== "ZZ")
  .map((u) => ({ label: `${u.nombre} (${u.codigo})`, value: u.codigo }));
 const existenciaOptions = (tiposExistencia.data ?? []).map((t) => ({
  label: `${t.codigo} · ${t.nombre}`,
  value: t.codigo,
 }));
 const elegirUnidad = (codigo: string) => {
  setCodigoUnidad(codigo);
  const u = unidades.data?.find((x) => x.codigo === codigo);
  if (u) setUnidadMedida(u.corto);
 };

 const handleSubmit = async () => {
  if (!nombre?.trim() || (!isService && !unidadMedida) || !categoriaId) return;

  const dataToSubmit: DatosProducto = {
   nombre: nombre?.trim() || "",
   descripcion: descripcion?.trim() || "",
   unidadMedida: isService
    ? unidadMedida?.trim() || "servicio"
    : unidadMedida?.trim() || "",
   idCategoria: parseInt(categoriaId),
   codigoSunat: codigoSunat || null,
   tipoExistencia: isService ? null : tipoExistencia || null,
   codigoUnidad: isService ? "ZZ" : codigoUnidad || null,
  };

  await onSubmit(dataToSubmit);
 };

 const handleClose = () => {
  setNombre("");
  setDescripcion("");
  setUnidadMedida("");
  setCategoriaId("");
  onClose();
 };

 const isFormValid =
  nombre?.trim() && (isService || unidadMedida) && categoriaId;

 return (
  <Modal
   isOpen={isOpen}
   title={title}
   description={description}
   onClose={handleClose}
   loading={isLoading || isFetching}
  >
   <div className={styles.form}>
    <div className={styles.formField}>
     <Text size="xs" color="neutral-primary">
      Nombre del producto
     </Text>
     <Input
      size="xs"
      variant="createSale"
      value={nombre}
      onChange={(e) => setNombre(e.target.value)}
      placeholder="Ingresa el nombre del producto"
     />
    </div>

    {!isService && (
     <div className={styles.formField}>
      <Text size="xs" color="neutral-primary">
       Unidad de medida
      </Text>
      <ComboBox
       options={unitOptions}
       size="xs"
       variant="createSale"
       value={codigoUnidad}
       onChange={(v) => elegirUnidad(v as string)}
       placeholder={unidadMedida && !codigoUnidad ? `${unidadMedida} (elige la de SUNAT)` : "Seleccionar"}
      />
     </div>
    )}

    {!isService && (
     <div className={styles.formField}>
      <Text size="xs" color="neutral-primary">
       Tipo de existencia (Tabla 5)
      </Text>
      <ComboBox
       options={existenciaOptions}
       size="xs"
       variant="createSale"
       value={tipoExistencia}
       onChange={(v) => setTipoExistencia(v as string)}
       placeholder="Seleccionar"
      />
     </div>
    )}

    <div className={cx(styles.formField, styles.ancho)}>
     <Text size="xs" color="neutral-primary">
      Código de producto SUNAT (CCNU) <span className={styles.opcional}>(opcional)</span>
     </Text>
     <CcnuSelector value={codigoSunat} onChange={setCodigoSunat} />
    </div>

    <div className={styles.formField}>
     <Text size="xs" color="neutral-primary">
      Categoría
     </Text>
     <ComboBox
      options={categoryOptions}
      size="xs"
      variant="createSale"
      value={categoriaId}
      onChange={(v) => setCategoriaId(v as string)}
      placeholder="Seleccionar"
     />
    </div>

    <div className={styles.formField}>
     <Text size="xs" color="neutral-primary">
      Descripción (opcional)
     </Text>
     <Input
      placeholder="Ingresa descripción"
      size="xs"
      variant="createSale"
      value={descripcion}
      onChange={(e) => setDescripcion(e.target.value)}
     />
    </div>

    <ModalActions>
     <Button
      variant="primary"
      size="medium"
      onClick={handleSubmit}
      disabled={!isFormValid}
     >
      {submitLabel}
     </Button>
    </ModalActions>
   </div>
  </Modal>
 );
};
