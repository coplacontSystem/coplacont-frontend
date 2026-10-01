import React, { useEffect } from 'react';
import { LuInfo, LuTriangleAlert } from 'react-icons/lu';
import { Button } from '@/components/atoms';
import styles from './ConfirmationModal.module.scss';

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  className?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  confirmVariant = 'primary',
  loading = false
}) => {
  // Cerrar con Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose, loading]);

  if (!isOpen) return null;

  const isDanger = confirmVariant === 'danger';

  const handleConfirm = () => {
    if (!loading) {
      onConfirm();
    }
  };

  return (
    <div className={styles.backdrop} role="alertdialog" aria-modal="true">
      <div className={styles.dialog}>
        <div className={styles.body}>
          <div className={`${styles.icon} ${isDanger ? styles.iconDanger : ''}`}>
            {isDanger ? <LuTriangleAlert size={20} /> : <LuInfo size={20} />}
          </div>
          <div className={styles.text}>
            <span className={styles.title}>{title}</span>
            <div className={styles.message}>{message}</div>
          </div>
        </div>
        <div className={styles.buttonGroup}>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
            size="medium"
          >
            {cancelText}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={handleConfirm}
            disabled={loading}
            size="medium"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
