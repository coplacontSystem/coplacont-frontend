import React, { useEffect } from "react";
import styles from "./Modal.module.scss";
import { Button, Text } from "@/components/atoms";

export interface ModalProps {
 isOpen: boolean;
 title?: string;
 description?: string | React.ReactNode;
 onClose: () => void;
 children?: React.ReactNode;
 /** Contenido opcional para el pie del modal. Si se provee, reemplaza el footer por defecto. */
 footer?: React.ReactNode;
 loading?: boolean;
 buttonText?: string;
}

export const Modal: React.FC<ModalProps> = ({
 isOpen,
 title,
 description,
 onClose,
 children,
 footer,
 loading,
 buttonText = "Cancelar",
}) => {
 // Close on Escape
 useEffect(() => {
  if (!isOpen) return;
  const handler = (e: KeyboardEvent) => {
   if (e.key === "Escape") onClose();
  };
  document.addEventListener("keydown", handler);
  return () => document.removeEventListener("keydown", handler);
 }, [isOpen, onClose]);

 if (!isOpen) return null;

 return (
  <div className={styles.backdrop} role="dialog" aria-modal="true">
   <div className={styles.modal}>
    {(title || description) && (
     <div className={styles.header}>
      <div className={styles.titleContainer}>
       {title && (
        <Text as="h2" color="neutral-primary" size="2xl">
         {title}
        </Text>
       )}
       {description && (
        <Text as="p" className={styles.description} color="neutral-secondary">
         {description}
        </Text>
       )}
      </div>
      <button
       className={styles.closeButton}
       aria-label="Cerrar"
       onClick={onClose}
      >
       ×
      </button>
     </div>
    )}

    <div className={styles.content}>{children}</div>

    <div className={styles.footer}>
     {footer !== undefined ? (
      footer
     ) : (
      <Button
       disabled={loading}
       size="medium"
       variant="secondary"
       onClick={onClose}
      >
       {buttonText}
      </Button>
     )}
    </div>
   </div>
  </div>
 );
};

export default Modal;
