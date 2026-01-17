import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./CreateOperationForm.module.scss";

import {
 Text,
 Input,
 ComboBox,
 Divider,
 Button,
 Loader,
 Modal,
} from "@/components";
import {
 useGetNextCorrelativoQuery,
 useCreateOperationMutation,
} from "../../api/transactionsApi";
import { useGetTablaDetallesQuery } from "../../api/tablaApi";
import {
 useGetClientsQuery,
 useGetSuppliersQuery,
 useCreateEntityMutation,
} from "@/domains/maintainers/api/entitiesApi/entitiesApi";
import type {
 Entidad,
 EntidadParcial,
} from "@/domains/maintainers/services/entitiesService";
import { FormEntidad } from "@/domains/maintainers/organisms/FormEntidad/FormEntidad";
import { MAIN_ROUTES, TRANSACTIONS_ROUTES } from "@/router";
import type { IApiError } from "@/shared";

const MonedaEnum = {
 SOL: "sol",
 DOLAR: "dol",
} as const;

type TipoComprobanteType =
 | "FACTURA"
 | "BOLETA"
 | "NOTA DE CRÉDITO"
 | "NOTA DE DÉBITO"
 | "RECIBO"
 | "COMPROBANTE DE RETENCIÓN";
type MonedaType = (typeof MonedaEnum)[keyof typeof MonedaEnum];

interface CreateOperationFormState {
 correlativo: string;
 entidad: string | "";
 tipoOperacion: string | "";
 tipoComprobante: TipoComprobanteType | "";
 fechaEmision: string;
 moneda: MonedaType | "";
 tipoCambio: string;
 serie: string;
 numero: string;
 fechaVencimiento: string;
 total: string;
 descripcion: string;
}

/**
 * Formulario para crear operaciones
 * Permite registrar operaciones sin detalles, solo datos de comprobante
 */
export const CreateOperationForm = () => {
 const navigate = useNavigate();
 const [formState, setFormState] = useState<CreateOperationFormState>({
  correlativo: "",
  entidad: "",
  tipoOperacion: "",
  tipoComprobante: "",
  fechaEmision: "",
  moneda: "",
  tipoCambio: "",
  serie: "",
  numero: "",
  fechaVencimiento: "",
  total: "",
  descripcion: "",
 });

 // RTK Query hooks para datos
 const { data: correlativoData } = useGetNextCorrelativoQuery(12);
 const { data: tiposOperacion = [], isLoading: loadingTiposOperacion } =
  useGetTablaDetallesQuery(12);
 const { data: tiposComprobante = [], isLoading: loadingTiposComprobante } =
  useGetTablaDetallesQuery(10);
 const [createOperation, { isLoading: isCreating }] =
  useCreateOperationMutation();

 // Hooks para entidades
 const { data: clients = [], isLoading: loadingClients } = useGetClientsQuery();
 const { data: suppliers = [], isLoading: loadingSuppliers } =
  useGetSuppliersQuery();

 // Combinar clientes y proveedores para la lista de opciones
 const entidades = [...clients, ...suppliers];
 const loadingEntidades = loadingClients || loadingSuppliers;

 // Estado de carga combinado
 const isLoading =
  loadingTiposOperacion || loadingTiposComprobante || loadingEntidades;
 const [apiError, setApiError] = useState<IApiError | null>(null);

 // Estados para el modal de entidad
 const [newEntity, setNewEntity] = useState<EntidadParcial>({
  esProveedor: false,
  esCliente: true,
  tipo: "NATURAL",
  numeroDocumento: "",
  nombre: "",
  apellidoPaterno: "",
  apellidoMaterno: "",
  razonSocial: "",
  direccion: "",
  telefono: "",
 });
 const [entityError, setEntityError] = useState("");
 const [createEntity, { isLoading: isCreatingEntity }] =
  useCreateEntityMutation();
 const [isModalEntidadOpen, setIsModalEntidadOpen] = useState(false);

 // Actualizar correlativo cuando se obtiene de la API
 useEffect(() => {
  if (correlativoData?.correlativo) {
   setFormState((prev) => ({
    ...prev,
    correlativo: correlativoData.correlativo,
   }));
  }
 }, [correlativoData]);

 // Manejadores de cambio
 const handleInputChange =
  (field: keyof CreateOperationFormState) =>
  (e: React.ChangeEvent<HTMLInputElement>) => {
   setFormState((prev) => ({ ...prev, [field]: e.target.value }));
  };

 const handleComboBoxChange =
  (field: keyof CreateOperationFormState) => (value: string | number) => {
   setFormState((prev) => ({ ...prev, [field]: String(value) }));
  };

 // Opciones para los ComboBox
 const getEntidadesOptions = () => {
  return entidades.map((entidad) => ({
   value: entidad.id.toString(),
   label:
    entidad.nombreCompleto ||
    `${entidad.nombre || ""} ${entidad.apellidoPaterno || ""} ${entidad.apellidoMaterno || ""}`.trim() ||
    entidad.razonSocial ||
    "Sin nombre",
  }));
 };

 const getTiposOperacionOptions = () => {
  return tiposOperacion.map((tipo) => ({
   value: tipo.idTablaDetalle.toString(),
   label: tipo.descripcion,
  }));
 };

 const getTiposComprobanteOptions = () => {
  return tiposComprobante.map((tipo) => ({
   value: tipo.idTablaDetalle.toString(),
   label: tipo.descripcion,
  }));
 };

 const monedaOptions = [{ value: MonedaEnum.SOL, label: "Soles" }];

 // Manejar envío del formulario
 const handleSubmit = async () => {
  try {
   setApiError(null);
   // Validar campos requeridos
   if (
    !formState.entidad ||
    !formState.tipoOperacion ||
    !formState.tipoComprobante ||
    !formState.fechaEmision ||
    !formState.moneda ||
    !formState.serie ||
    !formState.numero ||
    !formState.total
   ) {
    console.error("Faltan campos requeridos");
    return;
   }

   // Preparar payload para la API
   const payload = {
    correlativo: formState.correlativo,
    idPersona: parseInt(formState.entidad),
    idTipoOperacion: parseInt(formState.tipoOperacion),
    idTipoComprobante: parseInt(formState.tipoComprobante),
    fechaEmision: formState.fechaEmision,
    moneda: formState.moneda === MonedaEnum.SOL ? "PEN" : "USD", // Mapear moneda al formato del backend
    tipoCambio: parseFloat(formState.tipoCambio) || 1.0,
    serie: formState.serie,
    numero: formState.numero,
    fechaVencimiento: formState.fechaVencimiento || undefined,
    total: parseFloat(formState.total),
    descripcion: formState.descripcion,
   };

   // Crear la operación usando RTK Query mutation
   await createOperation(payload).unwrap();

   console.log("Operación creada exitosamente");

   // Navegar de vuelta a la lista
   navigate(`${MAIN_ROUTES.TRANSACTIONS}${TRANSACTIONS_ROUTES.OPERATIONS}`);
  } catch (error) {
   setApiError(error as IApiError);
  }
 };

 // Maneja la cancelación
 const handleCancel = () => {
  navigate(`${MAIN_ROUTES.TRANSACTIONS}${TRANSACTIONS_ROUTES.OPERATIONS}`);
 };

 // Manejar creación de nueva entidad
 const handleCreateEntidad = async () => {
  try {
   setEntityError("");

   const response = await createEntity(newEntity as EntidadParcial).unwrap();

   if (response.success && response.data) {
    // Cerrar el modal
    setIsModalEntidadOpen(false);

    // Seleccionar la nueva entidad
    setTimeout(() => {
     setFormState((prev) => ({
      ...prev,
      entidad: response.data!.id.toString(),
     }));
    }, 100);
   } else {
    setEntityError(response.message || "Error al crear la entidad");
   }
  } catch (error) {
   console.error("Error al crear entidad:", error);
   setEntityError("Error al crear la entidad");
  }
 };

 if (isLoading) {
  return <Loader />;
 }

 return (
  <div className={styles.CreatePurchaseForm}>
   <div className={styles.CreatePurchaseForm__Form}>
    {apiError && (
     <div
      style={{
       padding: "12px",
       borderRadius: "8px",
       background: "#FEE2E2",
       border: "1px solid #FCA5A5",
       marginBottom: "12px",
      }}
     >
      <Text size="sm" color="danger">
       {apiError.message}
      </Text>
      {(apiError.fechaEmision || apiError.periodo) && (
       <Text size="xs" color="danger">
        {[
         apiError.fechaEmision
          ? `Emisión: ${apiError.fechaEmision}`
          : undefined,
         apiError.periodo
          ? `Período: ${apiError.periodo.inicio} → ${apiError.periodo.fin}`
          : undefined,
        ]
         .filter(Boolean)
         .join(" • ")}
       </Text>
      )}
     </div>
    )}
    {/** Fila 1: Correlativo y Entidad */}
    <div className={styles.CreatePurchaseForm__FormRow}>
     <div
      className={`${styles.CreatePurchaseForm__FormField} ${styles["CreatePurchaseForm__FormField--correlativo"]}`}
     >
      <Text size="xs" color="neutral-primary">
       Correlativo
      </Text>
      <Input
       size="xs"
       variant="createSale"
       value={formState.correlativo}
       onChange={handleInputChange("correlativo")}
       disabled
      />
     </div>

     <div
      className={`${styles.CreatePurchaseForm__FormField} ${styles["CreatePurchaseForm__FormField--proveedor"]}`}
     >
      <Text size="xs" color="neutral-primary">
       Entidad
      </Text>
      <div style={{ display: "flex", gap: "8px" }}>
       <ComboBox
        size="xs"
        options={getEntidadesOptions()}
        variant="createSale"
        name="entidad"
        value={formState.entidad}
        onChange={handleComboBoxChange("entidad")}
        placeholder="Seleccionar entidad"
       />
       <Button
        size="small"
        variant="secondary"
        onClick={() => setIsModalEntidadOpen(true)}
       >
        +
       </Button>
      </div>
     </div>
    </div>

    {/** Fila 2: Tipo de Operación y Tipo de Comprobante */}
    <div className={styles.CreatePurchaseForm__FormRow}>
     <div
      className={`${styles.CreatePurchaseForm__FormField} ${styles["CreatePurchaseForm__FormField--half"]}`}
     >
      <Text size="xs" color="neutral-primary">
       Tipo de Operación
      </Text>
      <ComboBox
       size="xs"
       options={getTiposOperacionOptions()}
       variant="createSale"
       name="tipoOperacion"
       value={formState.tipoOperacion}
       onChange={handleComboBoxChange("tipoOperacion")}
       placeholder="Seleccionar tipo"
      />
     </div>

     <div
      className={`${styles.CreatePurchaseForm__FormField} ${styles["CreatePurchaseForm__FormField--half"]}`}
     >
      <Text size="xs" color="neutral-primary">
       Tipo de comprobante
      </Text>
      <ComboBox
       size="xs"
       options={getTiposComprobanteOptions()}
       variant="createSale"
       name="tipoComprobante"
       value={formState.tipoComprobante}
       onChange={handleComboBoxChange("tipoComprobante")}
       placeholder="Seleccionar tipo"
      />
     </div>
    </div>

    {/** Fila 3: Fecha de emisión, Moneda y Tipo de cambio */}
    <div className={styles.CreatePurchaseForm__FormRow}>
     <div
      className={`${styles.CreatePurchaseForm__FormField} ${styles["CreatePurchaseForm__FormField--third"]}`}
     >
      <Text size="xs" color="neutral-primary">
       Fecha de emisión
      </Text>
      <Input
       size="xs"
       type="date"
       variant="createSale"
       value={formState.fechaEmision}
       onChange={handleInputChange("fechaEmision")}
      />
     </div>

     <div
      className={`${styles.CreatePurchaseForm__FormField} ${styles["CreatePurchaseForm__FormField--third"]}`}
     >
      <Text size="xs" color="neutral-primary">
       Moneda
      </Text>
      <ComboBox
       size="xs"
       options={monedaOptions}
       variant="createSale"
       name="moneda"
       value={formState.moneda}
       onChange={handleComboBoxChange("moneda")}
      />
     </div>
    </div>

    {/** Fila 4: Serie, Número y Fecha de vencimiento */}
    <div className={styles.CreatePurchaseForm__FormRow}>
     <div
      className={`${styles.CreatePurchaseForm__FormField} ${styles["CreatePurchaseForm__FormField--third"]}`}
     >
      <Text size="xs" color="neutral-primary">
       Serie
      </Text>
      <Input
       size="xs"
       variant="createSale"
       value={formState.serie}
       onChange={handleInputChange("serie")}
       maxLength={4}
      />
     </div>

     <div
      className={`${styles.CreatePurchaseForm__FormField} ${styles["CreatePurchaseForm__FormField--third"]}`}
     >
      <Text size="xs" color="neutral-primary">
       Número
      </Text>
      <Input
       size="xs"
       variant="createSale"
       value={formState.numero}
       onChange={handleInputChange("numero")}
       maxLength={20}
      />
     </div>

     <div
      className={`${styles.CreatePurchaseForm__FormField} ${styles["CreatePurchaseForm__FormField--third"]}`}
     >
      <Text size="xs" color="neutral-primary">
       Fecha de vencimiento (opcional)
      </Text>
      <Input
       size="xs"
       type="date"
       variant="createSale"
       value={formState.fechaVencimiento}
       onChange={handleInputChange("fechaVencimiento")}
      />
     </div>
    </div>

    {/** Fila 5: Total y Descripción */}
    <div className={styles.CreatePurchaseForm__FormRow}>
     <div
      className={`${styles.CreatePurchaseForm__FormField} ${styles["CreatePurchaseForm__FormField--third"]}`}
     >
      <Text size="xs" color="neutral-primary">
       Total
      </Text>
      <Input
       size="xs"
       type="number"
       variant="createSale"
       value={formState.total}
       onChange={handleInputChange("total")}
       placeholder="0.00"
      />
     </div>

     <div
      className={`${styles.CreatePurchaseForm__FormField} ${styles["CreatePurchaseForm__FormField--descripcion"]}`}
     >
      <Text size="xs" color="neutral-primary">
       Descripción
      </Text>
      <Input
       size="xs"
       variant="createSale"
       value={formState.descripcion}
       onChange={handleInputChange("descripcion")}
       placeholder="Descripción de la operación"
      />
     </div>
    </div>
   </div>

   <Divider />

   {/** Acciones */}
   <div className={styles.CreatePurchaseForm__Actions}>
    <Button variant="secondary" onClick={handleCancel}>
     Cancelar
    </Button>
    <Button variant="primary" onClick={handleSubmit} disabled={isCreating}>
     Guardar Operación
    </Button>
   </div>

   {/** Modal para crear entidad */}
   <Modal
    isOpen={isModalEntidadOpen}
    onClose={() => setIsModalEntidadOpen(false)}
    title="Crear nueva entidad"
   >
    <FormEntidad
     entidad={newEntity as Entidad}
     error={entityError}
     setError={setEntityError}
     loading={isCreatingEntity}
     setLoading={() => {}}
     onChange={(field, value) => {
      setNewEntity((prev) => ({
       ...prev,
       [field]: value,
      }));
     }}
     onSubmit={handleCreateEntidad}
    />
   </Modal>
  </div>
 );
};
