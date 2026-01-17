import React, { useMemo, useState, useCallback } from "react";
import styles from "./MainPage.module.scss";

import {
 Button,
 PageLayout,
 Table,
 type TableRow,
 StateTag,
 CloseIcon,
 CheckIcon,
 Modal,
 Text,
 Input,
 ComboBox,
} from "@/components";

import type { Warehouse, WarehouseParcial } from "@/domains/maintainers/types";
import {
 useGetWarehousesQuery,
 useCreateWarehouseMutation,
 useUpdateWarehouseMutation,
 useDeleteWarehouseMutation,
} from "@/domains/maintainers/api/warehouseApi";
import { FormWarehouse } from "../../organisms/FormWarehouse/FormWarehouse";

export const MainPage: React.FC = () => {
 const {
  data: warehouses = [],
  isLoading: isFetching,
  isError,
 } = useGetWarehousesQuery();
 const [createWarehouse, { isLoading: isCreating }] =
  useCreateWarehouseMutation();
 const [updateWarehouse, { isLoading: isUpdating }] =
  useUpdateWarehouseMutation();
 const [deleteWarehouse, { isLoading: isDeleting }] =
  useDeleteWarehouseMutation();

 const loading = isFetching || isCreating || isUpdating || isDeleting;

 const [code, setCode] = useState("");
 const [status, setStatus] = useState("all");
 const [isOpen, setIsOpen] = useState(false);
 const [isView, setIsView] = useState(false);
 const [isCreate, setIsCreate] = useState(false);
 const [error, setError] = useState("");

 const [newWarehouse, setNewWarehouse] = useState<WarehouseParcial>({
  nombre: "",
  ubicacion: "",
  descripcion: "",
  responsable: "",
  telefono: "",
 });

 const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(
  null,
 );

 const handleWarehouseChange = (
  field: keyof Warehouse,
  value: string | number | boolean,
 ) => {
  setNewWarehouse((prev) => ({
   ...prev,
   [field]: value,
  }));
 };

 const resetForm = () => {
  setNewWarehouse({
   nombre: "",
   ubicacion: "",
   descripcion: "",
   capacidadMaxima: 0,
   responsable: "",
   telefono: "",
  });
 };

 const handleCreate = async () => {
  if (!newWarehouse.nombre.trim()) {
   setError("El nombre del almacén es obligatorio.");
   return;
  }
  if (!newWarehouse.ubicacion.trim()) {
   setError("La ubicación del almacén es obligatoria.");
   return;
  }
  if (!newWarehouse.responsable.trim()) {
   setError("El responsable es obligatorio.");
   return;
  }

  try {
   setError("");
   await createWarehouse({
    nombre: newWarehouse.nombre,
    ubicacion: newWarehouse.ubicacion,
    descripcion: newWarehouse.descripcion,
    responsable: newWarehouse.responsable,
    telefono: newWarehouse.telefono,
   }).unwrap();
   resetForm();
   setIsOpen(false);
  } catch (err) {
   console.error("Error al crear almacén:", err);
   setError("No se pudo crear el almacén. Inténtalo de nuevo.");
  }
 };

 const filtered = useMemo(() => {
  return warehouses.filter((w) => {
   const searchTerm = code.trim().toLowerCase();
   const byCodeOrName = searchTerm
    ? String(w.id).toLowerCase().includes(searchTerm) ||
      w.nombre.toLowerCase().includes(searchTerm)
    : true;

   const byStatus =
    status === "all" ? true : status === "active" ? w.estado : !w.estado;

   return byCodeOrName && byStatus;
  });
 }, [warehouses, code, status]);

 const handleChangeState = useCallback(
  async (id: number, estado: boolean) => {
   try {
    if (estado) {
     await deleteWarehouse(id).unwrap();
    } else {
     await updateWarehouse({ id, data: { estado: true } }).unwrap();
    }
   } catch (err) {
    console.error("Error al cambiar estado del almacén:", err);
   }
  },
  [deleteWarehouse, updateWarehouse],
 );

 const rows: TableRow[] = useMemo(
  () =>
   filtered.map((w) => ({
    id: w.id,
    cells: [
     w.id,
     w.nombre,
     w.ubicacion,
     w.responsable,
     <StateTag state={w.estado} />,
     <div style={{ display: "flex", gap: "8px" }}>
      <Button
       size="tableItemSize"
       variant="tableItemStyle"
       onClick={() => {
        setSelectedWarehouse(w);
        setIsCreate(false);
        setIsView(true);
        setIsOpen(true);
       }}
      >
       Ver detalles
      </Button>

      <Button
       size="tableItemSize"
       variant="tableItemStyle"
       onClick={() => {
        handleChangeState(w.id, w.estado);
       }}
      >
       {w.estado ? <CloseIcon /> : <CheckIcon />}
      </Button>
     </div>,
    ],
   })),
  [filtered, handleChangeState],
 );

 const headers = [
  "Código",
  "Nombre",
  "Ubicación",
  "Responsable",
  "Estado",
  "Acciones",
 ];
 const gridTemplate = "0.6fr 1.2fr 1.2fr 1fr 0.8fr 1fr";

 return (
  <PageLayout
   title="Almacenes"
   subtitle="Muestra los almacenes registrados."
   header={
    <Button
     size="large"
     onClick={() => {
      setIsCreate(true);
      setIsOpen(true);
      setIsView(false);
     }}
    >
     + Agregar nuevo almacén
    </Button>
   }
  >
   <section className={styles.filtersRow}>
    <div className={styles.formField}>
     <Text size="xs" color="neutral-primary">
      Busca por código o nombre
     </Text>
     <Input
      placeholder="Buscar..."
      size="xs"
      variant="createSale"
      value={code}
      onChange={(e) => setCode(e.target.value)}
     />
    </div>
    <div className={styles.formField}>
     <Text size="xs" color="neutral-primary">
      Estado
     </Text>
     <ComboBox
      options={statusOptions}
      size="xs"
      variant="createSale"
      value={status}
      onChange={(v) => setStatus(v as string)}
      placeholder="Seleccionar"
     />
    </div>
   </section>

   <Table
    headers={headers}
    rows={rows}
    gridTemplate={gridTemplate}
    isLoading={loading}
    loadingText="Procesando..."
    isError={isError}
    errorTitle="Error"
    errorSubtitle="No se pudieron cargar las compras. Por favor, intente nuevamente."
   />

   <Modal
    isOpen={isOpen}
    onClose={() => {
     resetForm();
     setIsCreate(false);
     setIsView(false);
     setIsOpen(!isOpen);
    }}
    title="Agregar nuevo almacén"
    description="Ingresa los siguientes datos para registrar un almacén."
    loading={loading}
    buttonText={"Cerrar"}
   >
    <FormWarehouse
     warehouse={isView && selectedWarehouse ? selectedWarehouse : newWarehouse}
     error={error}
     loading={loading}
     setError={setError}
     setLoading={() => {}}
     onChange={handleWarehouseChange}
     onSubmit={handleCreate}
     readOnly={isView}
     isCreate={isCreate}
    />
   </Modal>
  </PageLayout>
 );
};

const statusOptions = [
 { value: "all", label: "Todos" },
 { value: "active", label: "Activos" },
 { value: "inactive", label: "Inactivos" },
];
