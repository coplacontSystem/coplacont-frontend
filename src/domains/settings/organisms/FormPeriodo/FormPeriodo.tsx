import { useState, useEffect } from "react";
import styles from "./FormPeriodo.module.scss";
import { Text, Input, Button } from "@/components";
import type { ConfiguracionPeriodo, CreateConfiguracionPeriodoDto } from "../../types";
import { PeriodosApi } from "../../api";
import { useAuth } from "@/domains/auth";

type FormPeriodoProps = {
  periodo: ConfiguracionPeriodo | CreateConfiguracionPeriodoDto;
  error: string;
  setError: (error: string) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  readOnly?: boolean;
  onChange: (field: keyof CreateConfiguracionPeriodoDto, value: string) => void;
  onSubmit?: () => void;
  isCreate?: boolean;
};

/**
 * Componente de formulario para crear y editar periodos contables
 * Permite gestionar la información de periodos incluyendo fechas, estado y método de valoración
 */
export const FormPeriodo = ({
  periodo,
  error,
  setError,
  loading,
  setLoading,
  readOnly = false,
  onChange,
  onSubmit,
  isCreate,
}: FormPeriodoProps) => {
  const { user } = useAuth();
  
  const [periodoToUpdate, setPeriodoToUpdate] =
    useState<CreateConfiguracionPeriodoDto>({
      año: 'año' in periodo ? periodo.año : new Date().getFullYear(),
      fechaInicio: periodo.fechaInicio,
      fechaFin: periodo.fechaFin,
      idPersona: user?.persona?.id || 0, // Obtener del contexto de usuario
      observaciones: '',
    });

  const [isEdit, setIsEdit] = useState(false);

  // Actualizar idPersona cuando cambie el usuario
  useEffect(() => {
    if (user?.persona?.id) {
      setPeriodoToUpdate(prev => ({
        ...prev,
        idPersona: user.persona.id
      }));
    }
  }, [user?.persona?.id]);

  /**
   * Maneja la actualización de un periodo existente
   */
  const handleUpdatePeriodo = async () => {
    if (!user?.persona?.id) {
      setError("Error: Usuario no autenticado o sin empresa asignada.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      if (!('id' in periodo) || !periodo.id) {
        setError("ID del periodo no encontrado");
        return;
      }

      await PeriodosApi.patchPeriodo(periodo.id, periodoToUpdate);
      setIsEdit(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar el periodo");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Maneja los cambios en los campos del formulario cuando está en modo edición
   */
  const handleFieldChange = (field: keyof CreateConfiguracionPeriodoDto, value: string | number) => {
    if (isEdit) {
      let processedValue: any = value;
      if (field === 'año') {
        processedValue = parseInt(String(value), 10);
      } else if (field === 'idPersona') {
        processedValue = parseInt(String(value), 10);
      } else {
        processedValue = String(value);
      }
      setPeriodoToUpdate({
        ...periodoToUpdate,
        [field]: processedValue,
      });
    } else {
      onChange(field, String(value));
    }
  };



  return (
    <div className={styles.FormPeriodo__Form}>
      {error && (
        <Text as="p" color="danger" size="xs">
          {error}
        </Text>
      )}

      {/* Año */}
      <div className={styles.FormPeriodo__FormField}>
        <Text size="xs" color="neutral-primary">
          Año
        </Text>
        <Input
          placeholder="Ej: 2024"
          disabled={isEdit ? false : readOnly}
          size="xs"
          variant="createSale"
          type="number"
          value={isCreate ? ('año' in periodo ? String(periodo.año) : String(new Date().getFullYear())) : String(periodoToUpdate.año)}
          onChange={(e) => {
            if (isCreate) {
              onChange("año", e.target.value);
            } else {
              handleFieldChange("año", e.target.value);
            }
          }}
        />
      </div>

      {/* Fecha de Inicio */}
      <div className={styles.FormPeriodo__FormField}>
        <Text size="xs" color="neutral-primary">
          Fecha de inicio
        </Text>
        <Input
          placeholder="YYYY-MM-DD"
          disabled={isEdit ? false : readOnly}
          size="xs"
          variant="createSale"
          type="date"
          value={isCreate ? periodo.fechaInicio : periodoToUpdate.fechaInicio}
          onChange={(e) => {
            if (isCreate) {
              onChange("fechaInicio", e.target.value);
            } else {
              handleFieldChange("fechaInicio", e.target.value);
            }
          }}
        />
      </div>

      {/* Fecha de Fin */}
      <div className={styles.FormPeriodo__FormField}>
        <Text size="xs" color="neutral-primary">
          Fecha de fin
        </Text>
        <Input
          placeholder="YYYY-MM-DD"
          disabled={isEdit ? false : readOnly}
          size="xs"
          variant="createSale"
          type="date"
          value={isCreate ? periodo.fechaFin : periodoToUpdate.fechaFin}
          onChange={(e) => {
            if (isCreate) {
              onChange("fechaFin", e.target.value);
            } else {
              handleFieldChange("fechaFin", e.target.value);
            }
          }}
        />
      </div>

      {/* Observaciones */}
      <div className={styles.FormPeriodo__FormField}>
        <Text size="xs" color="neutral-primary">
          Observaciones (Opcional)
        </Text>
        <Input
          placeholder="Observaciones del periodo"
          disabled={isEdit ? false : readOnly}
          size="xs"
          variant="createSale"
          type="text"
          value={isCreate ? ('observaciones' in periodo ? periodo.observaciones : '') : periodoToUpdate.observaciones}
          onChange={(e) => {
            if (isCreate) {
              onChange("observaciones", e.target.value);
            } else {
              handleFieldChange("observaciones", e.target.value);
            }
          }}
        />
      </div>

      {/* Botones de acción */}
      {!readOnly || isEdit ? (
        <Button
          disabled={loading}
          size="medium"
          onClick={isEdit ? handleUpdatePeriodo : onSubmit}
        >
          Guardar {isEdit ? "actualización" : "nuevo periodo"}
        </Button>
      ) : (
        <Button
          disabled={loading}
          size="medium"
          onClick={() => setIsEdit(true)}
        >
          Activar edición
        </Button>
      )}
    </div>
  );
};