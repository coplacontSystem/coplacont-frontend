import React, { useState, useEffect, useMemo } from "react";
import styles from "./Main.module.scss";
import { Modal, Button, Text, Input, ComboBox } from "@/components";
import type { Category } from "@/domains/maintainers/types";
import { useGetCategoriesQuery } from "@/domains/maintainers/api/categoryApi";

interface CreateProductModalProps {
 isOpen: boolean;
 onClose: () => void;
 onSubmit: (data: {
  nombre: string;
  descripcion: string;
  unidadMedida: string;
  idCategoria: number;
 }) => void | Promise<void>;
 title?: string;
 description?: string;
 submitLabel?: string;
 isService?: boolean;
 initialValues?: {
  nombre: string;
  descripcion: string;
  unidadMedida: string;
  categoriaId: number;
 };
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
  } else {
   setNombre("");
   setDescripcion("");
   setUnidadMedida("");
   setCategoriaId("");
  }
 }, [initialValues, isOpen]);

 const categoryOptions = categories.map((cat) => ({
  value: cat.id.toString(),
  label: cat.nombre,
 }));

 const unitOptions = [
  { label: "Unidad", value: "unidad" },
  { label: "Kilogramo", value: "kg" },
  { label: "Litro", value: "litro" },
  { label: "Tonelada", value: "tonelada" },
 ];

 const handleSubmit = async () => {
  if (!nombre?.trim() || (!isService && !unidadMedida) || !categoriaId) return;

  const dataToSubmit = {
   nombre: nombre?.trim() || "",
   descripcion: descripcion?.trim() || "",
   unidadMedida: isService
    ? unidadMedida?.trim() || "servicio"
    : unidadMedida?.trim() || "",
   idCategoria: parseInt(categoriaId),
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
       value={unidadMedida}
       onChange={(v) => setUnidadMedida(v as string)}
       placeholder="Seleccionar"
      />
     </div>
    )}

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

    <Button
     variant="primary"
     size="large"
     onClick={handleSubmit}
     disabled={!isFormValid}
    >
     {submitLabel}
    </Button>
   </div>
  </Modal>
 );
};
