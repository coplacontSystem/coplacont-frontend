import { useState, useMemo } from "react";
import styles from "./MainPage.module.scss";
import {
 PageLayout,
 Table,
 Button,
 Modal,
 CloseIcon,
 CheckIcon,
 StateTag,
 Input,
 Text,
 ComboBox,
} from "@/components";
import {
 useGetClientsQuery,
 useCreateEntityMutation,
 useDeleteEntityMutation,
 useRestoreEntityMutation,
} from "../../api/entitiesApi";
import type { Entidad } from "../../services";
import { FormEntidad } from "../../organisms/FormEntidad";

export const MainPage: React.FC = () => {
 const {
  data: clients = [],
  isLoading: isFetching,
  isError,
 } = useGetClientsQuery(true);
 const [createEntity, { isLoading: isCreating }] = useCreateEntityMutation();
 const [deleteEntity, { isLoading: isDeleting }] = useDeleteEntityMutation();
 const [restoreEntity, { isLoading: isRestoring }] = useRestoreEntityMutation();

 const loading = isFetching || isCreating || isDeleting || isRestoring;

 const [status, setStatus] = useState("all");
 const [search, setSearch] = useState("");
 const [isOpen, setIsOpen] = useState(false);
 const [isView, setIsView] = useState(false);
 const [error, setError] = useState("");
 const [selectedClient, setSelectedClient] = useState<Entidad | null>(null);

 const [newClient, setNewClient] = useState({
  esProveedor: false,
  esCliente: true,
  tipo: "" as Entidad["tipo"],
  numeroDocumento: "",
  nombre: "",
  apellidoMaterno: "",
  apellidoPaterno: "",
  razonSocial: "",
  direccion: "",
  telefono: "",
 });

 const handleClientChange = (
  field: keyof Entidad,
  value: string | number | boolean,
 ) => {
  setNewClient((prev) => ({
   ...prev,
   [field]: value,
  }));
 };

 const resetForm = () => {
  setNewClient({
   esProveedor: false,
   esCliente: true,
   tipo: "" as Entidad["tipo"],
   numeroDocumento: "",
   nombre: "",
   apellidoMaterno: "",
   apellidoPaterno: "",
   razonSocial: "",
   direccion: "",
   telefono: "",
  });
 };

 const handleCreateClient = async () => {
  setError("");

  if (!newClient.tipo) {
   setError("Debe seleccionar el tipo de entidad.");
   return;
  }

  if (newClient.tipo === "JURIDICA") {
   if (newClient.numeroDocumento.length !== 11) {
    setError("El número de documento para JURIDICA debe tener 11 caracteres.");
    return;
   }
   if (!newClient.razonSocial.trim()) {
    setError("Debe ingresar la razón social.");
    return;
   }
  }

  if (newClient.tipo === "NATURAL") {
   if (newClient.numeroDocumento.length !== 8) {
    setError("El número de documento para NATURAL debe tener 8 caracteres.");
    return;
   }
   if (!newClient.nombre.trim()) {
    setError("Debe ingresar el nombre.");
    return;
   }
   if (!newClient.apellidoPaterno.trim()) {
    setError("Debe ingresar el apellido paterno.");
    return;
   }
   if (!newClient.apellidoMaterno.trim()) {
    setError("Debe ingresar el apellido materno.");
    return;
   }
  }

  try {
   const response = await createEntity(newClient).unwrap();
   if (response.success) {
    resetForm();
    setIsOpen(false);
   } else {
    setError(response.message);
   }
  } catch {
   setError("Error al crear el cliente");
  }
 };

 const handleStateClient = async (id: number, state: boolean) => {
  try {
   if (state) {
    const response = await deleteEntity(id).unwrap();
    if (!response.success) {
     setError(response.message);
    }
   } else {
    const response = await restoreEntity(id).unwrap();
    if (!response.success) {
     setError(response.message);
    }
   }
  } catch {
   setError("Error al cambiar estado del cliente");
  }
 };

 const handleModal = () => {
  setIsOpen(!isOpen);
 };

 const filteredClients = useMemo(() => {
  return clients.filter((c) => {
   const bySearch = search
    ? c.nombreCompleto?.toLowerCase().includes(search.toLowerCase()) ||
      c.numeroDocumento.includes(search)
    : true;

   const byStatus =
    status === "all" ? true : status === "active" ? c.activo : !c.activo;

   return bySearch && byStatus;
  });
 }, [clients, search, status]);

 const headers = [
  "Tipo",
  "Número de Documento",
  "Nombre Completo",
  "Dirección",
  "Teléfono",
  "Estado",
  "Acciones",
 ];

 const rows = filteredClients.map((c) => ({
  id: c.id,
  cells: [
   c.tipo,
   c.numeroDocumento,
   c.nombreCompleto,
   c.direccion !== "" ? c.direccion : "No especificado",
   c.telefono !== "" ? c.telefono : "No especificado",
   <StateTag state={c.activo} />,
   <div style={{ display: "flex", gap: "8px" }}>
    <Button
     size="tableItemSize"
     variant="tableItemStyle"
     onClick={() => {
      setSelectedClient(c);
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
      handleStateClient(c.id, c.activo);
     }}
    >
     {c.activo ? <CloseIcon /> : <CheckIcon />}
    </Button>
   </div>,
  ],
 }));

 const gridTemplate = "1fr 1.5fr 2fr 2fr 1fr 1fr 2fr";

 return (
  <PageLayout
   title="Clientes"
   subtitle="Listado de clientes registrados"
   header={
    <Button
     onClick={() => {
      resetForm();
      setIsView(false);
      setIsOpen(true);
     }}
     size="large"
    >
     + Nuevo cliente
    </Button>
   }
  >
   <section className={styles.MainPage}>
    <div className={styles.MainPage__Filter}>
     <Text size="xs" color="neutral-primary">
      Buscar por nombre o número de documento
     </Text>
     <Input
      placeholder="Buscar..."
      size="xs"
      variant="createSale"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
     />
    </div>
    <div className={styles.MainPage__Filter}>
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
    onClose={handleModal}
    title="Agregar nuevo cliente"
    description="Ingresa los siguientes datos para registrar un cliente."
    loading={loading}
    buttonText={"Cerrar"}
   >
    <FormEntidad
     setError={setError}
     setLoading={() => {}}
     entidad={isView && selectedClient ? selectedClient : newClient}
     error={error}
     loading={loading}
     onChange={handleClientChange}
     onSubmit={isView ? undefined : handleCreateClient}
     readOnly={isView}
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
