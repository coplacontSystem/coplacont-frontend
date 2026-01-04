import React, { useState } from "react";
import styles from "./MainLayout.module.scss";
import { Outlet } from "react-router-dom";

import { Sidebar } from "@/components/organisms/Sidebar/Sidebar";

export const MainLayout: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const savedState = localStorage.getItem("sidebar_collapsed");
    return savedState ? JSON.parse(savedState) : false;
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev: boolean) => {
      const newState = !prev;
      localStorage.setItem("sidebar_collapsed", JSON.stringify(newState));
      return newState;
    });
  };

  return (
    <div className={styles.mainLayout}>
      <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
};
