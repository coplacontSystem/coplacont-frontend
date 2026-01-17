import React, { useState, useMemo } from "react";
import styles from "./Main.module.scss";
import { Modal, FormField, Button } from "@/components";
import type { Category } from "@/domains/maintainers/types";
import { useGetCategoriesQuery } from "@/domains/maintainers/api/categoryApi";

interface CreateServiceModalProps {
 isOpen: boolean;
 onClose: () => void;
 onSubmit: (data: {
  nombre: string;
  descripcion: string;
  categoriaId: number;
  precio: string;
 }) => void;
}

export const Main: React.FC<CreateServiceModalProps> = ({
 isOpen,
 onClose,
 onSubmit,
}) => {
 const [nombre, setNombre] = useState("");
 const [descripcion, setDescripcion] = useState("");
 const [precio, setPrecio] = useState("");
 const [categoriaId, setCategoriaId] = useState("");

 const {
  data: allCategories = [],
  isLoading,
  isFetching,
 } = useGetCategoriesQuery(undefined, {
  skip: !isOpen,
 });

 // Filtrar categorías de tipo 'servicio'
 const categories = useMemo(
  () =>
   allCategories.filter((category: Category) => category.tipo === "servicio"),
  [allCategories],
 );

 const categoryOptions = categories.map((cat) => ({
  value: cat.id.toString(),
  label: cat.nombre,
 }));

 const handleSubmit = () => {
  if (!nombre.trim() || !categoriaId) return;

  onSubmit({
   nombre: nombre.trim(),
   descripcion: descripcion.trim(),
   categoriaId: parseInt(categoriaId),
   precio: precio.trim(),
  });

  // Reset form
  setNombre("");
  setDescripcion("");
  setPrecio("");
  setCategoriaId("");
  onClose();
 };

 const handleClose = () => {
  // Reset form
  setNombre("");
  setDescripcion("");
  setPrecio("");
  setCategoriaId("");
  onClose();
 };

 const isFormValid = nombre.trim() && categoriaId;

 return (
  <Modal
   isOpen={isOpen}
   title="Creación de nuevo servicio"
   description="Ingresa los siguientes datos para registrar un servicio."
   onClose={handleClose}
   loading={isLoading || isFetching}
   footer={
    <Button
     variant="primary"
     size="large"
     onClick={handleSubmit}
     disabled={!isFormValid}
    >
     Guardar
    </Button>
   }
  >
   <div className={styles.form}>
    <FormField
     type="text"
     label="Nombre del servicio"
     value={nombre}
     onChange={(e) => setNombre(e.target.value)}
     placeholder="Ingresa el nombre del servicio"
     required
    />

    <FormField
     type="text"
     label="Descripción"
     value={descripcion}
     onChange={(e) => setDescripcion(e.target.value)}
     placeholder="Ingresa una descripción"
    />

    <FormField
     type="combobox"
     label="Categoría"
     options={categoryOptions}
     value={categoriaId}
     onChange={(v) => setCategoriaId(v as string)}
     placeholder="Seleccionar"
     required
    />

    <FormField
     type="text"
     label="Precio"
     value={precio}
     onChange={(e) => setPrecio(e.target.value)}
     placeholder="0.00"
    />
   </div>
  </Modal>
 );
};
