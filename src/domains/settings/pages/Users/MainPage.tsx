import React, { useEffect, useMemo, useState } from "react";
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
  Loader,
} from "@/components";

import type {
  EmpresaParcial,
  PersonaWithUsersResponse,
} from "../../types";
import { USER_STATUS_OPTIONS } from "../../types";
import { usersApi } from "../../api/usersApi/api";
import { FormUser } from "../../organisms/FormUser/FormUser";
import { FormCompany } from "../../organisms/FormCompany/FormCompany";
import { UserManagement } from "../../organisms/UserManagement/UserManagement";

export const MainPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const [personas, setPersonas] = useState<PersonaWithUsersResponse[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isView, setIsView] = useState(false);
  console.log(isView);
  const [isCreate, setIsCreate] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [newPersona, setNewPersona] = useState<EmpresaParcial>({
    nombreEmpresa: "",
    ruc: "",
    razonSocial: "",
    telefono: "",
    direccion: "",
    nombreUsuario: "",
    emailUsuario: "",
    idRol: 2,
    esPrincipal: true,
  });

  const [selectedPersona, setSelectedPersona] =
    useState<PersonaWithUsersResponse | null>(null);

  /**
   * Maneja los cambios en los campos del formulario
   */
  const handlePersonaChange = (
    field: keyof EmpresaParcial,
    value: string | number | boolean
  ) => {
    setNewPersona((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /**
   * Resetea el formulario a sus valores iniciales
   */
  const resetForm = () => {
    setNewPersona({
      nombreEmpresa: "",
      ruc: "",
      razonSocial: "",
      telefono: "",
      direccion: "",
      nombreUsuario: "",
      emailUsuario: "",
      idRol: 2,
      esPrincipal: true,
    });
  };

  /**
   * Valida los campos obligatorios del formulario
   */
  const validateForm = (): boolean => {
    if (!newPersona.nombreEmpresa.trim()) {
      setError("El nombre de la empresa es obligatorio.");
      return false;
    }
    if (!newPersona.ruc.trim()) {
      setError("El RUC es obligatorio.");
      return false;
    }
    if (!/^\d{11}$/.test(newPersona.ruc)) {
      setError("El RUC debe tener exactamente 11 dígitos.");
      return false;
    }
    if (!newPersona.razonSocial.trim()) {
      setError("La razón social es obligatoria.");
      return false;
    }
    if (!newPersona.nombreUsuario.trim()) {
      setError("El nombre del usuario es obligatorio.");
      return false;
    }
    if (!newPersona.emailUsuario.trim()) {
      setError("El email del usuario es obligatorio.");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newPersona.emailUsuario)) {
      setError("El email no tiene un formato válido.");
      return false;
    }
    return true;
  };

  /**
   * Crea una nueva empresa con usuario principal
   */
  const handleCreate = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const payload = {
        nombreEmpresa: newPersona.nombreEmpresa,
        ruc: newPersona.ruc,
        razonSocial: newPersona.razonSocial,
        telefono: newPersona.telefono,
        direccion: newPersona.direccion,
        nombreUsuario: newPersona.nombreUsuario,
        emailUsuario: newPersona.emailUsuario,
        idRol: newPersona.idRol,
        esPrincipal: newPersona.esPrincipal,
      };
      await usersApi.createEmpresaConUsuario(payload);
      await fetchUsers();
      resetForm();
      setIsOpen(false);
    } catch {
      setError("No se pudo crear la empresa con usuario. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Obtiene todos los usuarios del sistema
   */
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersApi.getPersonasWithUsers();
      const personasData = Array.isArray(response.data) ? response.data : [];
      setPersonas(personasData);
      console.log(personasData);
    } catch {
      setError("Error al cargar los usuarios.");
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePersonaStatus = async (persona: PersonaWithUsersResponse) => {
    try {
      setLoading(true);
      setError("");
      
      // Alternar entre habilitar y deshabilitar según el estado actual
      if (persona.habilitado) {
        await usersApi.disablePersona(persona.id);
      } else {
        await usersApi.enablePersona(persona.id);
      }
      
      await fetchUsers(); // Recargar la lista para reflejar los cambios
    } catch {
      setError(`Error al ${persona.habilitado ? 'desactivar' : 'activar'} la empresa. Inténtalo de nuevo.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  /**
   * Filtra los usuarios según los criterios de búsqueda
   */
  const filtered = useMemo(() => {
    return personas.filter((persona) => {
      const searchTerm = search.trim().toLowerCase();
      const bySearchTerm = searchTerm
        ? persona.nombreEmpresa.toLowerCase().includes(searchTerm) ||
          persona.razonSocial.toLowerCase().includes(searchTerm) ||
          persona.ruc.includes(searchTerm)
        : true;

      const byStatus =
        status === "all"
          ? true
          : status === "active"
          ? persona.habilitado
          : !persona.habilitado;

      return bySearchTerm && byStatus;
    });
  }, [personas, search, status]);

  /**
   * Genera las filas de la tabla
   */
  const rows: TableRow[] = useMemo(
    () =>
      filtered.map((persona) => ({
        id: persona.id,
        cells: [
          persona.id,
          persona.nombreEmpresa || "Sin empresa",
          persona.ruc || "N/A",
          persona.totalUsuarios || 0,
          persona.usuariosActivos || 0,
          <StateTag state={persona.habilitado} />,
          <div style={{ display: "flex", gap: "8px" }}>
            <Button
              size="tableItemSize"
              variant="tableItemStyle"
              onClick={() => {
                setSelectedPersona(persona);
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
              onClick={() => handleTogglePersonaStatus(persona)}
              disabled={loading}
            >
              {persona.habilitado ? <CloseIcon /> : <CheckIcon />}
            </Button>
          </div>,
        ],
      })),
    [filtered]
  );

  const headers = [
    "ID",
    "Empresa",
    "RUC",
    "Usuarios totales",
    "Usuarios activos",
    "Estado",
    "Acciones",
  ];
  const gridTemplate = "0.3fr  1.2fr 0.5fr 0.7fr 0.7fr 0.5fr 1.2fr";

  return (
    <PageLayout
      title="Usuarios y empresas"
      subtitle="Gestiona la creación, edición y asignación de roles a los usuarios del sistema."
      header={
        <Button
          size="large"
          onClick={() => {
            setIsCreate(true);
            setIsOpen(true);
            setIsView(false);
            setError("");
          }}
        >
          + Agregar nueva empresa
        </Button>
      }
    >
      <section className={styles.filtersRow}>
        <div className={styles.formField}>
          <Text size="xs" color="neutral-primary">
            Buscar por nombre, email, empresa o RUC
          </Text>
          <Input
            placeholder="Buscar..."
            size="xs"
            variant="createSale"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.formField}>
          <Text size="xs" color="neutral-primary">
            Estado
          </Text>
          <ComboBox
            options={USER_STATUS_OPTIONS}
            size="xs"
            variant="createSale"
            value={status}
            onChange={(v) => setStatus(v as string)}
            placeholder="Seleccionar"
          />
        </div>
      </section>

      {loading && <Loader text="Procesando..." />}

      {error && !loading && (
        <Text as="p" color="danger" size="sm">
          {error}
        </Text>
      )}

      <Table headers={headers} rows={rows} gridTemplate={gridTemplate} />

      <Modal
        isOpen={isOpen}
        onClose={() => {
          fetchUsers();
          resetForm();
          setIsCreate(false);
          setIsView(false);
          setIsOpen(false);
          setError("");
        }}
        title={isCreate ? "Agregar nueva empresa" : `Gestión de ${selectedPersona?.nombreEmpresa || 'empresa'}`}
        description={
          isCreate
            ? "Ingresa los datos para registrar una nueva empresa con su usuario principal."
            : "Administra los datos de la empresa y gestiona sus usuarios."
        }
        loading={loading}
        buttonText="Cerrar"
      >
        {isCreate ? (
          <FormUser
            persona={newPersona}
            error={error}
            loading={loading}
            setError={setError}
            setLoading={setLoading}
            onChange={handlePersonaChange}
            onSubmit={handleCreate}
            readOnly={false}
            isCreate={true}
          />
        ) : (
          selectedPersona && (
            <div className={styles.managementContainer}>
              <FormCompany
                persona={selectedPersona}
                error={error}
                setError={setError}
                loading={loading}
                setLoading={setLoading}
                readOnly={false}
                onUpdate={fetchUsers}
              />
              
              <UserManagement
                persona={selectedPersona}
                onUpdate={fetchUsers}
              />
            </div>
          )
        )}
      </Modal>
    </PageLayout>
  );
};
