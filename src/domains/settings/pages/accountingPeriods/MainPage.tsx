import { useEffect, useState, useMemo } from "react";
import styles from "./MainPage.module.scss";
import { PageLayout } from "@/components";
import {
  Table,
  Button,
  StateTag,
  CloseIcon,
  CheckIcon,
  Modal,
  Text,
  Input,
  ComboBox,
  Loader,
} from "@/components";
import { PeriodosApi } from "../../api";
import type {
  ConfiguracionPeriodo,
  CreateConfiguracionPeriodoDto,
} from "../../types";
import {
  ESTADO_PERIODO_OPTIONS,
  formatPeriodoLabel,
} from "../../types";
import { useAuth } from "@/domains/auth/hooks";
import { FormPeriodo } from "../../organisms/FormPeriodo";

export const MainPage: React.FC = () => {
  const { user } = useAuth();
  const [periodos, setPeriodos] = useState<ConfiguracionPeriodo[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isView, setIsView] = useState(false);
  const [isCreate, setIsCreate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [newPeriodo, setNewPeriodo] = useState<CreateConfiguracionPeriodoDto>({
    año: new Date().getFullYear(),
    fechaInicio: "",
    fechaFin: "",
    idPersona: user?.persona?.id || 0,
    observaciones: "",
  });

  const [selectedPeriodo, setSelectedPeriodo] = useState<ConfiguracionPeriodo | null>(
    null
  );

  // Estados para filtros
  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");
  const [anioFilter, setAnioFilter] = useState("");

  // Opciones para ComboBox
  const estadoOptions = [
    { label: "Todos", value: "" },
    ...ESTADO_PERIODO_OPTIONS,
  ];

  // Generar opciones de años (últimos 10 años + próximos 2)
  const currentYear = new Date().getFullYear();
  const anioOptions = [
    { label: "Todos", value: "" },
    ...Array.from({ length: 12 }, (_, i) => {
      const year = currentYear - 8 + i;
      return { label: year.toString(), value: year.toString() };
    }),
  ];

  const handlePeriodoChange = (
    field: keyof CreateConfiguracionPeriodoDto,
    value: string | number
  ) => {
    setNewPeriodo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setNewPeriodo({
      año: new Date().getFullYear(),
      fechaInicio: "",
      fechaFin: "",
      idPersona: 1, // TODO: Obtener del contexto de usuario
      observaciones: "",
    });
  };

  const fetchPeriodos = async () => {
    try {
      setIsLoading(true);
      const response = await PeriodosApi.getPeriodos();
      console.log("Respuesta completa del API:", response);
      console.log("response.data:", response.data);
      
      // Intentar diferentes estructuras de respuesta
      let periodosData: ConfiguracionPeriodo[] = [];
      if (Array.isArray(response.data)) {
        periodosData = response.data;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        periodosData = response.data.data;
      }
      
      console.log("Periodos procesados:", periodosData);
      setPeriodos(periodosData);
    } catch (error) {
      console.error("Error al obtener periodos:", error);
      setPeriodos([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPeriodos();
  }, []);

  // Actualizar idPersona cuando cambie el usuario
  useEffect(() => {
    if (user?.persona?.id) {
      setNewPeriodo(prev => ({
        ...prev,
        idPersona: user.persona.id
      }));
    }
  }, [user?.persona?.id]);

  const handleStateChange = async (id: number, currentActive: boolean) => {
    try {
      setIsLoading(true);
      const newActiveState = !currentActive;
      
      await PeriodosApi.patchPeriodo(id, { activo: newActiveState });
      setPeriodos((prev) =>
        prev.map((periodo) =>
          periodo.id === id ? { ...periodo, activo: newActiveState } : periodo
        )
      );
    } catch (error) {
      console.error("Error al cambiar estado del periodo:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!user?.persona?.id) {
      setError("Error: Usuario no autenticado o sin empresa asignada.");
      return;
    }

    if (!newPeriodo.año) {
      setError("El año es obligatorio.");
      return;
    }

    if (!newPeriodo.fechaInicio.trim()) {
      setError("La fecha de inicio es obligatoria.");
      return;
    }

    if (!newPeriodo.fechaFin.trim()) {
      setError("La fecha de fin es obligatoria.");
      return;
    }

    if (new Date(newPeriodo.fechaInicio) >= new Date(newPeriodo.fechaFin)) {
      setError("La fecha de inicio debe ser anterior a la fecha de fin.");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      await PeriodosApi.postPeriodo(newPeriodo);
      setIsCreate(false);
      setIsOpen(false);
      fetchPeriodos();
      resetForm();
    } catch (error) {
      console.error("Error al crear periodo:", error);
      setError("Error al crear el periodo. Verifique que no exista un periodo duplicado.");
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrado
  const filteredPeriodos = useMemo(() => {
    return periodos.filter((p) => {
      const periodoLabel = formatPeriodoLabel(p);
      const matchesSearch = periodoLabel
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesEstado = estadoFilter === "" || 
        (estadoFilter === "ACTIVO" && p.activo) || 
        (estadoFilter === "CERRADO" && p.cerrado);
      const matchesAnio = anioFilter === "" || p.año.toString() === anioFilter;
      return matchesSearch && matchesEstado && matchesAnio;
    });
  }, [periodos, search, estadoFilter, anioFilter]);

  const rows = filteredPeriodos.map((p) => ({
    id: p.id,
    cells: [
      p.año,
      formatPeriodoLabel(p),
      p.fechaInicio,
      p.fechaFin,
      p.persona.razonSocial,
      <StateTag state={p.activo} />,
      <div style={{ display: "flex", gap: "8px" }}>
        <Button
          size="tableItemSize"
          variant="tableItemStyle"
          onClick={() => {
            setSelectedPeriodo(p);
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
            handleStateChange(p.id, p.activo);
          }}
        >
          {p.activo ? <CloseIcon /> : <CheckIcon />}
        </Button>
      </div>,
    ],
  }));

  const headers = [
    "Año",
    "Periodo",
    "Fecha Inicio",
    "Fecha Fin",
    "Empresa",
    "Estado",
    "Acciones",
  ];
  const gridTemplate = "0.6fr 1fr 1fr 1fr 1.2fr 0.8fr 1fr";

  return (
    <PageLayout
      title="Periodos Contables"
      subtitle="Gestión de periodos contables y métodos de valoración"
      header={
        <Button
          size="large"
          onClick={() => {
            setIsOpen(true);
            setIsView(false);
            setIsCreate(true);
          }}
        >
          + Agregar nuevo periodo
        </Button>
      }
    >
      {/* Filtros */}
      <section className={styles.MainPage}>
        <div className={styles.MainPage__Filter}>
          <Text size="xs" color="neutral-primary">
            Año
          </Text>
          <ComboBox
            options={anioOptions}
            size="xs"
            variant="createSale"
            value={anioFilter}
            onChange={(v) => setAnioFilter(v as string)}
            placeholder="Seleccionar"
          />
        </div>
        <div className={styles.MainPage__Filter}>
          <Text size="xs" color="neutral-primary">
            Buscar periodo
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
            options={estadoOptions}
            size="xs"
            variant="createSale"
            value={estadoFilter}
            onChange={(v) => setEstadoFilter(v as string)}
            placeholder="Seleccionar"
          />
        </div>

      </section>

      <Table headers={headers} rows={rows} gridTemplate={gridTemplate} />

      <Modal
        isOpen={isOpen}
        onClose={() => {
          fetchPeriodos();
          setIsOpen(false);
          setIsCreate(false);
          setIsView(false);
          setError("");
          resetForm();
        }}
        title={isView ? "Detalles del periodo" : "Agregar nuevo periodo"}
        description={
          isView
            ? "Información del periodo contable seleccionado."
            : "Ingresa los siguientes datos para registrar un periodo contable."
        }
        loading={isLoading}
        buttonText="Cerrar"
      >
        <FormPeriodo
          periodo={isView && selectedPeriodo ? selectedPeriodo : newPeriodo}
          onChange={(field, value) => {
            if (field === 'año' || field === 'idPersona') {
              handlePeriodoChange(field, parseInt(String(value), 10));
            } else {
              handlePeriodoChange(field, String(value));
            }
          }}
          onSubmit={handleCreate}
          readOnly={isView}
          error={error}
          setError={setError}
          loading={isLoading}
          setLoading={setIsLoading}
          isCreate={isCreate}
        />
      </Modal>
      
      {isLoading && <Loader text="Procesando..." />}
    </PageLayout>
  );
};