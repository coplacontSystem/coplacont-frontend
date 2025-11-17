import { useState } from "react";
import styles from "./UserManagement.module.scss";
import { 
  Text, 
  Button, 
  Table, 
  type TableRow, 
  CheckIcon, 
  CloseIcon,
  Modal,
  Input
} from "@/components";
import type { PersonaWithUsersResponse, CreateUserForPersonaDto } from "../../types";
import { usersApi } from "../../api/usersApi/api";

type UserManagementProps = {
  persona: PersonaWithUsersResponse;
  onUpdate?: () => void;
};

/**
 * Componente para gestionar usuarios de una empresa
 */
export const UserManagement = ({ persona, onUpdate }: UserManagementProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Estado para crear nuevo usuario
  const [newUser, setNewUser] = useState<CreateUserForPersonaDto>({
    nombre: "",
    email: "",
    idRol: 2, // Contador por defecto
    esPrincipal: false,
  });

  /**
   * Maneja la activación/desactivación de un usuario
   */
  const handleToggleUserStatus = async (userId: number, isEnabled: boolean) => {
    setLoading(true);
    setError("");
    
    try {
      if (isEnabled) {
        await usersApi.disableUser(userId);
      } else {
        await usersApi.enableUser(userId);
      }
      onUpdate?.();
    } catch (error) {
      console.error('Error al cambiar estado del usuario:', error);
      setError('Error al cambiar el estado del usuario');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Verifica si el email ya existe en el sistema
   */
  const checkEmailExists = (email: string): boolean => {
    return persona.usuarios.some(user => 
      user.email.toLowerCase() === email.toLowerCase()
    );
  };

  /**
   * Maneja la creación de un nuevo usuario
   */
  const handleCreateUser = async () => {
    if (!newUser.nombre.trim() || !newUser.email.trim()) {
      setError('Nombre y email son requeridos');
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      setError('Por favor ingresa un email válido');
      return;
    }

    // Verificar si el email ya existe
    if (checkEmailExists(newUser.email)) {
      setError('Ya existe un usuario con este email en esta empresa');
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      await usersApi.createUserForPersona(persona.id, newUser);
      setIsCreateModalOpen(false);
      resetNewUserForm();
      onUpdate?.();
    } catch (error) {
      console.error('Error al crear usuario:', error);
      
      // Manejar errores específicos del backend
      if (error?.response?.status === 409 || 
          error?.message?.includes('duplicate') || 
          error?.message?.includes('already exists')) {
        setError('Este email ya está registrado en el sistema');
      } else if (error?.response?.status === 400) {
        setError('Datos inválidos. Verifica la información ingresada');
      } else {
        setError('Error al crear el usuario. Inténtalo nuevamente');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Resetea el formulario de nuevo usuario
   */
  const resetNewUserForm = () => {
    setNewUser({
      nombre: "",
      email: "",
      idRol: 2,
      esPrincipal: false,
    });
    setError("");
  };

  /**
   * Maneja los cambios en el formulario de nuevo usuario
   */
  const handleNewUserChange = (field: keyof CreateUserForPersonaDto, value: string | number | boolean) => {
    setNewUser(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Preparar datos para la tabla
  const tableRows: TableRow[] = persona.usuarios.map((user) => ({
    id: user.id.toString(),
    cells: [
      user.id.toString(),
      user.nombre,
      user.email,
      user.esPrincipal ? "Sí" : "No",
      user.habilitado ? "Activo" : "Inactivo",
      <div key={`actions-${user.id}`} className={styles.UserManagement__Actions}>
        <Button
          size="tableItemSize"
          variant="tableItemStyle"
          onClick={() => handleToggleUserStatus(user.id, user.habilitado)}
          disabled={loading || user.esPrincipal} // No permitir desactivar usuario principal
        >
          {user.habilitado ? <CloseIcon /> : <CheckIcon />}
        </Button>
      </div>,
    ],
  }));

  const headers = ["ID", "Nombre", "Email", "Principal", "Estado", "Acciones"];
  const gridTemplate = "0.3fr 1.2fr 1.2fr 0.5fr 0.6fr 0.8fr";

  return (
    <div className={styles.UserManagement}>
      <div className={styles.UserManagement__Header}>
        <div>
          <Text size="sm" weight={600} color="neutral-primary">
            Usuarios de {persona.nombreEmpresa}
          </Text>
          <Text size="xs" color="neutral-secondary">
            {persona.usuariosActivos} de {persona.totalUsuarios} usuarios activos
          </Text>
        </div>
        
        <Button
          size="medium"
          onClick={() => setIsCreateModalOpen(true)}
          disabled={loading}
        >
          + Agregar usuario
        </Button>
      </div>

      {error && (
        <Text as="p" color="danger" size="xs">
          {error}
        </Text>
      )}

      <Table 
        headers={headers} 
        rows={tableRows} 
        gridTemplate={gridTemplate}
      />

      {/* Modal para crear nuevo usuario */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          resetNewUserForm();
        }}
        title="Agregar nuevo usuario"
        description={`Crear un nuevo usuario para ${persona.nombreEmpresa}`}
        loading={loading}
        buttonText="Cancelar"
      >
        <div className={styles.UserManagement__CreateForm}>
          {error && (
            <Text as="p" color="danger" size="xs">
              {error}
            </Text>
          )}

          <div className={styles.UserManagement__FormField}>
            <Text size="xs" color="neutral-primary">
              Nombre completo *
            </Text>
            <Input
              placeholder="Ingresa el nombre completo"
              size="xs"
              variant="createSale"
              value={newUser.nombre}
              onChange={(e) => handleNewUserChange("nombre", e.target.value)}
              disabled={loading}
            />
          </div>

          <div className={styles.UserManagement__FormField}>
            <Text size="xs" color="neutral-primary">
              Email *
            </Text>
            <Input
              placeholder="Ingresa el email"
              size="xs"
              variant="createSale"
              type="email"
              value={newUser.email}
              onChange={(e) => handleNewUserChange("email", e.target.value)}
              disabled={loading}
            />
          </div>

          <div className={styles.UserManagement__Actions}>
            <Button
              disabled={loading || !newUser.nombre.trim() || !newUser.email.trim()}
              size="medium"
              onClick={handleCreateUser}
              variant="primary"
            >
              Crear usuario
            </Button>
            <Button
              disabled={loading}
              size="medium"
              onClick={() => {
                setIsCreateModalOpen(false);
                resetNewUserForm();
              }}
              variant="secondary"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};