import { useState } from "react";
import styles from "./FormWarehouse.module.scss";
import { Text, Input, Button } from "@/components";
import type { Warehouse, WarehouseParcial } from "../../types";
import { useUpdateWarehouseMutation } from "../../api/warehouseApi";

type FormWarehouseProps = {
 warehouse: Warehouse | WarehouseParcial;
 error: string;
 setError: (error: string) => void;
 loading: boolean;
 setLoading: (loading: boolean) => void;
 readOnly?: boolean;
 onChange: (field: keyof WarehouseParcial, value: string) => void;
 onSubmit?: () => void;
 isCreate?: boolean;
};

export const FormWarehouse = ({
 warehouse,
 error,
 loading,
 setLoading,
 readOnly = false,
 onChange,
 onSubmit,
 isCreate = false,
}: FormWarehouseProps) => {
 const [updateWarehouse, { isLoading: isUpdating }] =
  useUpdateWarehouseMutation();
 const [warehouseToUpdate, setWarehouseToUpdate] = useState<WarehouseParcial>({
  nombre: warehouse.nombre,
  ubicacion: warehouse.ubicacion,
  descripcion: warehouse.descripcion,
  responsable: warehouse.responsable,
  telefono: warehouse.telefono,
  estado: warehouse.estado,
 });

 const [isEdit, setIsEdit] = useState(false);

 const handleUpdateWarehouse = async () => {
  setLoading(true);
  try {
   await updateWarehouse({
    id: warehouse.id!,
    data: warehouseToUpdate,
   }).unwrap();
   setIsEdit(false);
  } catch (err) {
   console.error("Error al actualizar almacén:", err);
  }
  setLoading(false);
 };

 return (
  <div className={styles.FormWarehouse__Form}>
   {error && (
    <Text as="p" color="danger" size="xs">
     {error}
    </Text>
   )}

   <div className={styles.FormWarehouse__FormField}>
    <Text size="xs" color="neutral-primary">
     Nombre de almacén
    </Text>
    <Input
     placeholder="Ingresa nombre de almacén"
     disabled={isEdit ? false : readOnly}
     size="xs"
     variant="createSale"
     value={isCreate ? warehouse.nombre : (warehouseToUpdate.nombre ?? "")}
     onChange={(e) => {
      if (isEdit) {
       setWarehouseToUpdate({
        ...warehouseToUpdate,
        nombre: e.target.value,
       });
      } else {
       onChange("nombre", e.target.value);
      }
     }}
    />
   </div>

   {/* Número de Documento */}
   <div className={styles.FormWarehouse__FormField}>
    <Text size="xs" color="neutral-primary">
     Ubicación de almacén
    </Text>
    <Input
     placeholder="Ingresa ubicación de almacén"
     disabled={isEdit ? false : readOnly}
     size="xs"
     variant="createSale"
     value={isCreate ? warehouse.ubicacion : warehouseToUpdate.ubicacion}
     onChange={(e) => {
      if (isEdit) {
       setWarehouseToUpdate({
        ...warehouseToUpdate,
        ubicacion: e.target.value,
       });
      } else {
       onChange("ubicacion", e.target.value);
      }
     }}
    />
   </div>

   <div className={styles.FormWarehouse__FormField}>
    <Text size="xs" color="neutral-primary">
     Responsable de almacén
    </Text>
    <Input
     placeholder="Ingresa responsable de almacén"
     size="xs"
     variant="createSale"
     value={
      isCreate ? warehouse.responsable : (warehouseToUpdate.responsable ?? "")
     }
     onChange={(e) => {
      if (isEdit) {
       setWarehouseToUpdate({
        ...warehouseToUpdate,
        responsable: e.target.value,
       });
      } else {
       onChange("responsable", e.target.value);
      }
     }}
     disabled={isEdit ? false : readOnly}
    />
   </div>

   {/* Telefono */}
   <div className={styles.FormWarehouse__FormField}>
    <Text size="xs" color="neutral-primary">
     Telefono (Opcional)
    </Text>
    <Input
     placeholder="Ingresa telefono"
     size="xs"
     variant="createSale"
     value={isCreate ? warehouse.telefono : (warehouseToUpdate.telefono ?? "")}
     onChange={(e) => {
      // Validar que solo contenga dígitos (0-9) y el símbolo +
      const phoneRegex = /^[+0-9]*$/;
      const value = e.target.value;

      if (phoneRegex.test(value)) {
       if (isEdit) {
        setWarehouseToUpdate({
         ...warehouseToUpdate,
         telefono: value,
        });
        onChange("telefono", value);
       } else {
        onChange("telefono", value);
       }
      }
     }}
     disabled={isEdit ? false : readOnly}
    />
   </div>
   {/* Dirección */}
   <div className={styles.FormWarehouse__FormField}>
    <Text size="xs" color="neutral-primary">
     Descripción (Opcional)
    </Text>
    <Input
     placeholder="Ingresa descripción"
     size="xs"
     variant="createSale"
     value={
      isCreate ? warehouse.descripcion : (warehouseToUpdate.descripcion ?? "")
     }
     onChange={(e) => {
      if (isEdit) {
       setWarehouseToUpdate({
        ...warehouseToUpdate,
        descripcion: e.target.value,
       });
      } else {
       onChange("descripcion", e.target.value);
      }
     }}
     disabled={isEdit ? false : readOnly}
    />
   </div>

   {!readOnly || isEdit ? (
    <Button
     disabled={loading || isUpdating}
     size="medium"
     onClick={isEdit ? handleUpdateWarehouse : onSubmit}
    >
     Guardar {isEdit ? "actualización" : "nuevo registro"}
    </Button>
   ) : (
    <Button
     disabled={loading || isUpdating}
     size="medium"
     onClick={() => setIsEdit(true)}
    >
     Activar edición
    </Button>
   )}
  </div>
 );
};
