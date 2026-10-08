import { Link } from "react-router-dom";
import { LuArrowLeft, LuCheck, LuReceipt } from "react-icons/lu";
import styles from "./AuthLayout.module.scss";

const BrandMark = ({ className }: { className?: string }) => (
  <div className={className}>
    <img
      className={styles.AuthLayout__markImg}
      src="/images/brand/logo-mark.png"
      alt=""
    />
    <img
      className={styles.AuthLayout__wordImg}
      src="/images/brand/logo-wordmark.png"
      alt="Coplacont"
    />
  </div>
);

export const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className={styles.AuthLayout}>
      <div className={styles.AuthLayout__main}>
        <header className={styles.AuthLayout__header}>
          {/* El logo del formulario solo se muestra cuando el panel de marca está oculto */}
          <BrandMark className={styles.AuthLayout__brandCompact} />
          <Link to="/welcome" className={styles.AuthLayout__back}>
            <LuArrowLeft size={16} />
            Volver
          </Link>
        </header>

        <div className={styles.AuthLayout__content}>
          <div className={styles.AuthLayout__inner}>{children}</div>
        </div>

        <footer className={styles.AuthLayout__footer}>
          <span>© 2026 Coplacont</span>
        </footer>
      </div>

      <aside className={styles.AuthLayout__panelWrap} aria-hidden="true">
        <div className={styles.AuthLayout__panel}>
          <span className={styles.AuthLayout__glow} />
          <span className={styles.AuthLayout__ring1} />
          <span className={styles.AuthLayout__ring2} />
          <span className={styles.AuthLayout__dots} />

          <div className={styles.AuthLayout__panelBrand}>
            <span className={styles.AuthLayout__panelBadge}>
              <img src="/images/brand/logo-mark.png" alt="" />
            </span>
            <img
              className={styles.AuthLayout__panelWord}
              src="/images/brand/logo-wordmark.png"
              alt=""
            />
          </div>

          <div className={styles.AuthLayout__cards}>
            <div className={`${styles.AuthLayout__card} ${styles.AuthLayout__cardSales}`}>
              <div className={styles.AuthLayout__cardRow}>
                <span className={styles.AuthLayout__cardLabel}>Ventas del mes</span>
                <span className={styles.AuthLayout__pill}>+12%</span>
              </div>
              <span className={styles.AuthLayout__cardValue}>S/ 184 250</span>
              <div className={styles.AuthLayout__bars}>
                {[38, 52, 44, 66, 72, 100].map((h, i) => (
                  <span
                    key={i}
                    style={{ height: `${h}%` }}
                    className={i === 5 ? styles.AuthLayout__barOn : i === 4 ? styles.AuthLayout__barMid : undefined}
                  />
                ))}
              </div>
            </div>

            <div className={`${styles.AuthLayout__card} ${styles.AuthLayout__cardIgv}`}>
              <span className={styles.AuthLayout__igvIcon}>
                <LuReceipt size={17} />
              </span>
              <div className={styles.AuthLayout__igvText}>
                <span>IGV del periodo</span>
                <strong>S/ 18 420</strong>
              </div>
            </div>

            <div className={`${styles.AuthLayout__card} ${styles.AuthLayout__cardBalance}`}>
              <div className={styles.AuthLayout__cardRow}>
                <span className={styles.AuthLayout__cardLabelSm}>Balance General · Sep</span>
                <span className={styles.AuthLayout__okDot}>
                  <LuCheck size={12} />
                </span>
              </div>
              <div className={styles.AuthLayout__balanceRow}>
                <span>Activo</span>
                <strong>1 304 600</strong>
              </div>
              <div className={styles.AuthLayout__balanceRow}>
                <span>Pasivo + Patrimonio</span>
                <strong>1 304 600</strong>
              </div>
            </div>
          </div>

          <div className={styles.AuthLayout__panelCopy}>
            <h2>Cierra cada periodo contable con confianza.</h2>
            <p>Kardex valorizado, libros y estados financieros siempre al día.</p>
          </div>
        </div>
      </aside>
    </div>
  );
};
