import { useState } from "react";
import styles from "./FormEntidad.module.scss";
import type {
 Entidad,
 EntidadParcial,
 EntidadToUpdate,
} from "../../services/entitiesService";
import { Text, ComboBox, Input, Button } from "@/components";
import { useUpdateEntityMutation } from "../../api/entitiesApi";

type FormEntidadProps = {
 entidad: Entidad | EntidadParcial;
 error: string;
 setError: (error: string) => void;
 loading: boolean;
 setLoading: (loading: boolean) => void;
 readOnly?: boolean;
 onChange: (field: keyof Entidad, value: string | number | boolean) => void;
 onSubmit?: () => void;
};

export const FormEntidad = ({
 entidad,
 error,
 setError,
 loading,
 setLoading,
 readOnly = false,
 onChange,
 onSubmit,
}: FormEntidadProps) => {
 const [updateEntity, { isLoading: isUpdating }] = useUpdateEntityMutation();

 const [entidadToUpdate, setEntidadToUpdate] = useState<EntidadToUpdate>({
  nombre: entidad.nombre,
  apellidoMaterno: entidad.apellidoMaterno,
  apellidoPaterno: entidad.apellidoPaterno,
  razonSocial: entidad.razonSocial,
  direccion: entidad.direccion,
  telefono: entidad.telefono,
 });

 const [isEdit, setIsEdit] = useState(false);

 const handleUpdateEntidad = async () => {
  setLoading(true);
  try {
   const response = await updateEntity({
    id: entidad.id!,
    data: entidadToUpdate,
   }).unwrap();
   if (response.success) {
    setIsEdit(false);
   } else {
    setError(response.message);
   }
  } catch {
   setError("Error al actualizar la entidad");
  }
  setLoading(false);
 };

 return (
  <div className={styles.FormEntidad__Form}>
   {error && (
    <Text as="p" color="danger" size="xs">
     {error}
    </Text>
   )}

   {/* Tipo de Entidad */}
   <div className={styles.FormEntidad__FormField}>
    <Text size="xs" color="neutral-primary">
     Tipo de Entidad
    </Text>
    <ComboBox
     options={[
      { label: "JURIDICA", value: "JURIDICA" },
      { label: "NATURAL", value: "NATURAL" },
     ]}
     placeholder="Selecciona tipo de entidad"
     size="xs"
     variant="createSale"
     value={entidad.tipo}
     onChange={(value) => onChange("tipo", value)}
     disabled={readOnly}
    />
   </div>

   {/* Número de Documento */}
   <div className={styles.FormEntidad__FormField}>
    <Text size="xs" color="neutral-primary">
     Número de Documento
    </Text>
    <Input
     placeholder="Ingresa número de documento"
     disabled={readOnly || !entidad.tipo}
     size="xs"
     variant="createSale"
     value={entidad.numeroDocumento}
     onChange={(e) => onChange("numeroDocumento", e.target.value)}
    />
   </div>

   {/* Razon Social o Datos Naturales */}
   {entidad.tipo === "JURIDICA" && (
    <div className={styles.FormEntidad__FormField}>
     <Text size="xs" color="neutral-primary">
      Razón Social
     </Text>
     <Input
      placeholder="Ingresa razón social"
      size="xs"
      variant="createSale"
      value={
       isEdit
        ? (entidadToUpdate.razonSocial ?? "")
        : (entidad.razonSocial ?? "")
      }
      onChange={(e) => {
       if (isEdit) {
        setEntidadToUpdate({
         ...entidadToUpdate,
         razonSocial: e.target.value,
        });
       } else {
        onChange("razonSocial", e.target.value);
       }
      }}
      disabled={isEdit ? false : readOnly}
     />
    </div>
   )}

   {entidad.tipo === "NATURAL" && (
    <>
     <div className={styles.FormEntidad__FormField}>
      <Text size="xs" color="neutral-primary">
       Nombre
      </Text>
      <Input
       placeholder="Ingresa nombre"
       size="xs"
       variant="createSale"
       value={isEdit ? (entidadToUpdate.nombre ?? "") : (entidad.nombre ?? "")}
       onChange={(e) => {
        if (isEdit) {
         setEntidadToUpdate({
          ...entidadToUpdate,
          nombre: e.target.value,
         });
        } else {
         onChange("nombre", e.target.value);
        }
       }}
       disabled={isEdit ? false : readOnly}
      />
     </div>
     <div className={styles.FormEntidad__FormField}>
      <Text size="xs" color="neutral-primary">
       Apellido Paterno
      </Text>
      <Input
       placeholder="Ingresa apellido paterno"
       size="xs"
       variant="createSale"
       value={
        isEdit
         ? (entidadToUpdate.apellidoPaterno ?? "")
         : (entidad.apellidoPaterno ?? "")
       }
       onChange={(e) => {
        if (isEdit) {
         setEntidadToUpdate({
          ...entidadToUpdate,
          apellidoPaterno: e.target.value,
         });
        } else {
         onChange("apellidoPaterno", e.target.value);
        }
       }}
       disabled={isEdit ? false : readOnly}
      />
     </div>
     <div className={styles.FormEntidad__FormField}>
      <Text size="xs" color="neutral-primary">
       Apellido Materno
      </Text>
      <Input
       placeholder="Ingresa apellido materno"
       size="xs"
       variant="createSale"
       value={
        isEdit
         ? (entidadToUpdate.apellidoMaterno ?? "")
         : (entidad.apellidoMaterno ?? "")
       }
       onChange={(e) => {
        if (isEdit) {
         setEntidadToUpdate({
          ...entidadToUpdate,
          apellidoMaterno: e.target.value,
         });
        } else {
         onChange("apellidoMaterno", e.target.value);
        }
       }}
       disabled={isEdit ? false : readOnly}
      />
     </div>
    </>
   )}

   {/* Direccion */}
   <div className={styles.FormEntidad__FormField}>
    <Text size="xs" color="neutral-primary">
     Direccion (opcional)
    </Text>
    <Input
     placeholder="Ingresa dirección"
     size="xs"
     variant="createSale"
     value={isEdit ? entidadToUpdate.direccion : entidad.direccion}
     onChange={(e) => {
      if (isEdit) {
       setEntidadToUpdate({
        ...entidadToUpdate,
        direccion: e.target.value,
       });
      } else {
       onChange("direccion", e.target.value);
      }
     }}
     disabled={isEdit ? false : readOnly}
    />
   </div>

   {/* Telefono */}
   <div className={styles.FormEntidad__FormField}>
    <Text size="xs" color="neutral-primary">
     Telefono (opcional)
    </Text>
    <Input
     placeholder="Ingresa telefono"
     size="xs"
     variant="createSale"
     value={
      isEdit ? (entidadToUpdate.telefono ?? "") : (entidad.telefono ?? "")
     }
     onChange={(e) => {
      // Validar que solo contenga dígitos (0-9) y el símbolo +
      const phoneRegex = /^[+0-9]*$/;
      const value = e.target.value;

      if (phoneRegex.test(value)) {
       if (isEdit) {
        setEntidadToUpdate({
         ...entidadToUpdate,
         telefono: value,
        });
       } else {
        onChange("telefono", value);
       }
      }
     }}
     disabled={isEdit ? false : readOnly}
    />
   </div>

   {!readOnly || isEdit ? (
    <Button
     disabled={loading || isUpdating}
     size="medium"
     onClick={isEdit ? handleUpdateEntidad : onSubmit}
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
