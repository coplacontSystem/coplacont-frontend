import React, { createContext, useContext } from "react";
import { createPortal } from "react-dom";

/**
 * Espacio del pie del modal donde los formularios pueden colocar sus
 * acciones principales (por ejemplo, "Guardar") junto al botón "Cancelar".
 */
export const ModalFooterContext = createContext<{
  inModal: boolean;
  slot: HTMLElement | null;
}>({ inModal: false, slot: null });

export const useModalFooterSlot = () => useContext(ModalFooterContext);

/**
 * Renderiza sus hijos en el pie del modal cuando está dentro de un `Modal`;
 * fuera de un modal los renderiza en su lugar.
 */
export const ModalActions: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { inModal, slot } = useModalFooterSlot();
  if (!inModal) return <>{children}</>;
  if (!slot) return null;
  return createPortal(children, slot);
};
