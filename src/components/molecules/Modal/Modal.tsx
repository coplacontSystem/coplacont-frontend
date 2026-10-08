import React, { useEffect, useState } from "react";
import { LuX } from "react-icons/lu";
import styles from "./Modal.module.scss";
import { Button } from "@/components/atoms";
import { ModalFooterContext } from "./ModalActions";

export interface ModalProps {
 isOpen: boolean;
 title?: string;
 description?: string | React.ReactNode;
 onClose: () => void;
 children?: React.ReactNode;
 /** Contenido opcional para el pie del modal. Si se provee, reemplaza el footer por defecto. */
 footer?: React.ReactNode | null;
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

 const [footerSlot, setFooterSlot] = useState<HTMLElement | null>(null);

 if (!isOpen) return null;

 return (
  <div className={styles.backdrop} role="dialog" aria-modal="true">
   <div className={styles.modal}>
    {(title || description) && (
     <div className={styles.header}>
      <div className={styles.titleContainer}>
       {title && <h2 className={styles.title}>{title}</h2>}
       {description && <div className={styles.description}>{description}</div>}
      </div>
      <button
       type="button"
       className={styles.closeButton}
       aria-label="Cerrar"
       onClick={onClose}
      >
       <LuX size={20} />
      </button>
     </div>
    )}

    <ModalFooterContext.Provider value={{ inModal: true, slot: footerSlot }}>
     <div className={styles.content}>{children}</div>

     {footer !== null && (
      <div className={styles.footer}>
       {footer !== undefined ? (
        footer
       ) : (
        <>
         <Button
          disabled={loading}
          size="medium"
          variant="secondary"
          onClick={onClose}
         >
          {buttonText}
         </Button>
         {/* Aquí aparecen las acciones enviadas por los formularios (ModalActions) */}
         <span ref={setFooterSlot} className={styles.footerSlot} />
        </>
       )}
      </div>
     )}
    </ModalFooterContext.Provider>
   </div>
  </div>
 );
};

export default Modal;
