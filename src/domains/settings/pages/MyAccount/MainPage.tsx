import React, { useCallback, useMemo, useState } from "react";
import styles from "./MainPage.module.scss";

import { PageLayout, Button, Text, Divider } from "@/components";
import { FormField } from "@/components/molecules/FormField/FormField";
import { Modal } from "@/components/molecules/Modal/Modal";
import { useAuth } from "@/domains/auth";
import { usersApi } from "../../api/usersApi/api";
import type { User } from "../../types";

type UpdateTarget = "nombre" | "email" | "password";

/**
 * Página "Mi Cuenta"
 * Muestra datos básicos del usuario y permite actualizar nombre, email y contraseña
 */
export const MainPage: React.FC = () => {
  const { user, login, token } = useAuth();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [target, setTarget] = useState<UpdateTarget>("nombre");
  const [value, setValue] = useState<string>("");
  const [confirmValue, setConfirmValue] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const currentNombre = user?.nombre ?? "";
  const currentEmail = user?.email ?? "";

  /**
   * Obtiene el ID del usuario actual a partir del email
   */
  const resolveCurrentUserId = useCallback(async (): Promise<number | null> => {
    try {
      const response = await usersApi.getUsers();
      const users: User[] = Array.isArray(response.data) ? response.data : [];
      const match = users.find((u) => u.email === currentEmail);
      return match?.id ?? null;
    } catch {
      return null;
    }
  }, [currentEmail]);

  /**
   * Abre el modal para actualizar un campo específico
   */
  const openModal = (t: UpdateTarget) => {
    setTarget(t);
    setError("");
    setSuccess("");
    setValue("");
    setConfirmValue("");
    setIsOpen(true);
  };

  /**
   * Valida el valor ingresado según el campo a actualizar
   */
  const isValid = useMemo(() => {
    if (target === "nombre") {
      return value.trim().length > 0;
    }
    if (target === "email") {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(value);
    }
    if (target === "password") {
      return value.length >= 8 && value === confirmValue;
    }
    return false;
  }, [target, value, confirmValue]);

  /**
   * Envía actualización al backend y sincroniza el estado de autenticación
   */
  const handleUpdate = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const id = await resolveCurrentUserId();
      if (!id) {
        setError("No se pudo obtener el identificador de usuario.");
        return;
      }

      if (target === "password") {
        await usersApi.updatePassword(id, { password: value });
        setSuccess("Contraseña actualizada exitosamente");
      } else {
        const payload =
          target === "nombre" ? { nombre: value } : { email: value };
        await usersApi.updateUser(id, payload);

        // sincroniza el contexto de autenticación con los nuevos datos
        if (user) {
          const newNombre = target === "nombre" ? value : user.nombre;
          const newEmail = target === "email" ? value : user.email;
          login(newNombre, newEmail, token ?? "", user.persona, user.roles);
        }
        setSuccess("Datos actualizados exitosamente");
      }

      setTimeout(() => {
        setIsOpen(false);
      }, 400);
    } catch (e) {
      setError("No se pudo actualizar. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout
      title="Mi cuenta"
      subtitle="Consulta y actualiza tus datos básicos de usuario."
    >
      <div className={styles.container}>
        <section className={styles.section}>
          <div className={styles.cardContent}>
            <div className={styles.fieldRow}>
              <div className={styles.valueContainer}>
                <FormField
                  label="Nombre"
                  type="text"
                  id="field-nombre"
                  value={currentNombre}
                  onChange={() => {}}
                  disabled={true}
                />
              </div>
              <div className={styles.updateButton}>
                <Button onClick={() => openModal("nombre")}>Actualizar</Button>
              </div>
            </div>
          </div>
          <Divider />
          <div className={styles.cardContent}>
            <div className={styles.fieldRow}>
              <div className={styles.valueContainer}>
                <FormField
                  label="Email"
                  type="email"
                  id="field-email"
                  value={currentEmail}
                  onChange={() => {}}
                  disabled={true}
                />
              </div>
              <div className={styles.updateButton}>
                <Button onClick={() => openModal("email")}>Actualizar</Button>
              </div>
            </div>
          </div>

          <Divider />
          <div className={styles.cardContent}>
            <div className={styles.fieldRow}>
              <div className={styles.valueContainer}>
                <FormField
                  label="Contraseña"
                  type="password"
                  id="field-password"
                  value={"••••••••"}
                  onChange={() => {}}
                  disabled={true}
                />
              </div>
              <div className={styles.updateButton}>
                <Button onClick={() => openModal("password")}>
                  Actualizar
                </Button>
              </div>
            </div>
          </div>
          <Divider />
        </section>
      </div>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={
          target === "password"
            ? "Actualizar contraseña"
            : `Actualizar ${target}`
        }
        description={
          target === "password"
            ? "Ingresa y confirma tu nueva contraseña."
            : "Ingresa el nuevo valor."
        }
        loading={loading}
        buttonText="Cerrar"
      >
        <div className={styles.modalContent}>
          {target === "password" ? (
            <>
              <FormField
                label="Nueva contraseña"
                type="password"
                id="new-password"
                value={value}
                onChange={(e) => setValue((e.target as HTMLInputElement).value)}
                helperText="Mínimo 8 caracteres"
                error={!!error && !isValid}
                errorMessage={error || undefined}
                required
              />
              <FormField
                label="Confirmar contraseña"
                type="password"
                id="confirm-password"
                value={confirmValue}
                onChange={(e) =>
                  setConfirmValue((e.target as HTMLInputElement).value)
                }
                error={!!error && !isValid}
                required
              />
            </>
          ) : (
            <FormField
              label={target === "nombre" ? "Nombre" : "Email"}
              type={target === "nombre" ? "text" : "email"}
              id={`update-${target}`}
              placeholder={target === "nombre" ? "Nuevo nombre" : "Nuevo email"}
              value={value}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setValue(e.target.value)
              }
              required
            />
          )}

          {error && !loading && (
            <Text as="p" size="sm" color="danger">
              {error}
            </Text>
          )}
          {success && !loading && (
            <Text as="p" size="sm" color="success">
              {success}
            </Text>
          )}

          <div className={styles.modalActions}>
            <Button
              variant="primary"
              disabled={!isValid || loading}
              onClick={handleUpdate}
              size="small"
            >
              Guardar cambios
            </Button>
          </div>
        </div>
      </Modal>
    </PageLayout>
  );
};

export default MainPage;
