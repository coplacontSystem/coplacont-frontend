import React, { useState, useEffect } from 'react';
import { Button, Modal, FormField, Text } from '@/components';
import { useNavigate } from 'react-router-dom';
import { MAIN_ROUTES, SETTINGS_ROUTES } from '@/router';
import { ConfigurationService } from '../../services/ConfigurationService';
import { formatMetodoValoracion, METODO_VALORACION_OPTIONS } from '../../types';
import type { MetodoValoracion, ConfiguracionPeriodoResponse } from '../../types';
import styles from './MainPage.module.scss';

/**
 * Página principal de parámetros del sistema
 * Permite visualizar y configurar el método de valoración de inventario
 */
export const MainPage: React.FC = () => {
  const navigate = useNavigate();
  const [configuration, setConfiguration] = useState<ConfiguracionPeriodoResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<MetodoValoracion>('promedio');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carga la configuración actual del sistema
   */
  const loadConfiguration = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const config = await ConfigurationService.getConfiguration();
      setConfiguration(config);
      setSelectedMethod(config.metodoValoracion);
    } catch (error) {
      console.error('Error al cargar la configuración:', error);
      setError('Error al cargar la configuración del sistema');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Actualiza el método de valoración
   */
  const handleUpdateMethod = async () => {
    try {
      setIsUpdating(true);
      setError(null);
      
      await ConfigurationService.updateValuationMethod(selectedMethod);
      
      // Actualizar la configuración local
      if (configuration) {
        setConfiguration({
          ...configuration,
          metodoValoracion: selectedMethod
        });
      }
      
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error al actualizar el método de valoración:', error);
      const msg = (error as { message?: string })?.message || 'Error al actualizar el método de valoración';
      setError(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * Abre el modal para cambiar el método de valoración
   */
  const handleOpenModal = () => {
    if (configuration) {
      setSelectedMethod(configuration.metodoValoracion);
    }
    setIsModalOpen(true);
  };

  /**
   * Cierra el modal y resetea el estado
   */
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setError(null);
  };

  // Cargar configuración al montar el componente
  useEffect(() => {
    loadConfiguration();
  }, []);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <Text size="lg" color="neutral-secondary">
            Cargando configuración...
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text as="h1" size="2xl" color="neutral-primary">
          Parámetros del Sistema
        </Text>
        <Text size="md" color="neutral-secondary">
          Configuración general del sistema contable
        </Text>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          <Text size="sm" color="danger">
            {error}
          </Text>
        </div>
      )}

      <div className={styles.content}>
        <div className={styles.configSection}>
          <div className={styles.configItem}>
            <div className={styles.configInfo}>
              <Text as="h3" size="lg" color="neutral-primary">
                Método de Valoración de Inventario
              </Text>
              <Text size="sm" color="neutral-secondary">
                Método utilizado para el cálculo del costo de inventario
              </Text>
              <div className={styles.currentValue}>
                <Text size="md" color="neutral-primary">
                  <strong>MÉTODO CONFIGURADO:</strong>{' '}
                  {configuration ? formatMetodoValoracion(configuration.metodoValoracion) : 'No disponible'}
                </Text>
              </div>
            </div>
            <Button
              variant="primary"
              size="medium"
              onClick={handleOpenModal}
              disabled={!configuration}
            >
              Cambiar Método de Valoración
            </Button>
          </div>
        </div>
      </div>

      {/* Modal para cambiar método de valoración */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Cambiar Método de Valoración"
        description="Seleccione el nuevo método de valoración de inventario. Este cambio afectará el cálculo de costos futuros."
        loading={isUpdating}
        buttonText="Cancelar"
      >
        <div className={styles.modalContent}>
          {error && (
            <div className={styles.errorMessage}>
              <Text size="sm" color="danger">
                {error}
              </Text>
              {error.includes('No se puede cambiar el método') && (
                <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                  <Button
                    variant="primary"
                    size="small"
                    onClick={() => navigate(`${MAIN_ROUTES.SETTINGS}${SETTINGS_ROUTES.ACCOUNTING_PERIODS}`)}
                  >
                    Gestionar Periodos
                  </Button>
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => setError(null)}
                  >
                    Ocultar aviso
                  </Button>
                </div>
              )}
            </div>
          )}
          
          <FormField
            type="combobox"
            label="Método de Valoración"
            value={selectedMethod}
            onChange={(value) => setSelectedMethod(value as MetodoValoracion)}
            options={METODO_VALORACION_OPTIONS}
            placeholder="Seleccione un método"
            required
          />

          <div className={styles.modalActions}>
            <Button
              variant="secondary"
              size="medium"
              onClick={handleCloseModal}
              disabled={isUpdating}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="medium"
              onClick={handleUpdateMethod}
              disabled={isUpdating || selectedMethod === configuration?.metodoValoracion}
            >
              {isUpdating ? 'Actualizando...' : 'Actualizar Método'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MainPage;