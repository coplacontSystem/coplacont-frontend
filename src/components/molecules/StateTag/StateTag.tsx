import styles from "./StateTag.module.scss";

export const StateTag: React.FC<{ state: boolean }> = ({ state }) => {
  return (
    <span
      className={`${styles.StateTag} ${styles[`StateTag--${state ? "active" : "inactive"}`]}`}
    >
      <span className={styles["StateTag__dot"]} />
      {state ? "Activo" : "Inactivo"}
    </span>
  );
};
