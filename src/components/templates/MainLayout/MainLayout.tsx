import React, { useEffect, useState } from "react";
import styles from "./MainLayout.module.scss";
import { Outlet, useLocation } from "react-router-dom";
import { LuMenu } from "react-icons/lu";

import { Sidebar } from "@/components/organisms/Sidebar/Sidebar";

const MOBILE_QUERY = "(max-width: 767px)";
const TABLET_QUERY = "(max-width: 1099px)";

/** Devuelve si la ventana cumple la media query y se actualiza al redimensionar. */
const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = () => setMatches(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [query]);

  return matches;
};

export const MainLayout: React.FC = () => {
  const location = useLocation();
  const isMobile = useMediaQuery(MOBILE_QUERY);

  // En escritorio se respeta la preferencia guardada; en tablet arranca colapsado.
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const savedState = localStorage.getItem("sidebar_collapsed");
    if (savedState) return JSON.parse(savedState);
    return window.matchMedia(TABLET_QUERY).matches;
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Cierra el menú lateral al navegar o al pasar a una pantalla grande.
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [location.pathname, isMobile]);

  const toggleSidebar = () => {
    if (isMobile) {
      setIsDrawerOpen(false);
      return;
    }
    setIsSidebarCollapsed((prev: boolean) => {
      const newState = !prev;
      localStorage.setItem("sidebar_collapsed", JSON.stringify(newState));
      return newState;
    });
  };

  return (
    <div className={styles.mainLayout}>
      <header className={styles.mobileBar}>
        <button
          type="button"
          className={styles.menuBtn}
          onClick={() => setIsDrawerOpen(true)}
          aria-label="Abrir menú"
        >
          <LuMenu size={22} />
        </button>
        <img
          className={styles.mobileMark}
          src="/images/brand/logo-mark.png"
          alt=""
        />
        <img
          className={styles.mobileWord}
          src="/images/brand/logo-wordmark.png"
          alt="Coplacont"
        />
      </header>

      {isMobile && isDrawerOpen && (
        <div
          className={styles.backdrop}
          onClick={() => setIsDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className={`${styles.drawer} ${isDrawerOpen ? styles.open : ""}`}>
        <Sidebar
          isCollapsed={isMobile ? false : isSidebarCollapsed}
          onToggle={toggleSidebar}
        />
      </div>

      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
};
