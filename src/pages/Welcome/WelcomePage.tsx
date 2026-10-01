import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  LuArrowRight,
  LuCalendarCheck,
  LuCheck,
  LuFileText,
  LuLogIn,
  LuMoon,
  LuPackage,
  LuReceipt,
  LuShoppingCart,
  LuSun,
} from "react-icons/lu";
import { ThemeContext } from "@/shared/context";
import { AUTH_ROUTES } from "@/router/routes";
import styles from "./WelcomePage.module.scss";

const FEATURES = [
  { icon: LuShoppingCart, label: "Compras" },
  { icon: LuReceipt, label: "Ventas" },
  { icon: LuPackage, label: "Inventario y kardex" },
  { icon: LuFileText, label: "Estados financieros" },
  { icon: LuCalendarCheck, label: "Periodos contables" },
];

const MONTHS: { label: string; h: number; tone?: "mid" | "on" }[] = [
  { label: "Abr", h: 42 },
  { label: "May", h: 55 },
  { label: "Jun", h: 48 },
  { label: "Jul", h: 64 },
  { label: "Ago", h: 70, tone: "mid" },
  { label: "Sep", h: 82, tone: "on" },
];

/**
 * Página de bienvenida: primera pantalla para usuarios sin sesión.
 * Slogan, imagen y acceso al login.
 */
export const WelcomePage = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const goLogin = () => navigate(`${AUTH_ROUTES.AUTH}/${AUTH_ROUTES.LOGIN}`);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <img
            className={styles.brandMark}
            src="/images/brand/logo-mark.png"
            alt=""
          />
          <img
            className={styles.brandWord}
            src="/images/brand/logo-wordmark.png"
            alt="Coplacont"
          />
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.themeBtn}
            onClick={toggleTheme}
            title={theme === "dark" ? "Tema claro" : "Tema oscuro"}
            aria-label="Cambiar tema"
          >
            {theme === "dark" ? <LuSun size={18} /> : <LuMoon size={18} />}
          </button>
          <button type="button" className={styles.loginBtn} onClick={goLogin}>
            <LuLogIn size={16} />
            Iniciar sesión
          </button>
        </div>
      </header>

      <main className={styles.hero}>
        <div className={styles.copy}>
          <span className={styles.eyebrow}>
            <span className={styles.eyebrowDot} />
            Contabilidad para empresas peruanas
          </span>
          <h1 className={styles.title}>
            La contabilidad de tu empresa, sin sorpresas.
          </h1>
          <p className={styles.subtitle}>
            Compras, ventas, kardex y estados financieros en un solo sistema,
            alineado a SUNAT.
          </p>
          <button type="button" className={styles.cta} onClick={goLogin}>
            Ingresar
            <span className={styles.ctaIcon}>
              <LuArrowRight size={17} />
            </span>
          </button>
        </div>

        <div className={styles.visual}>
          <div className={styles.frameDash} />
          <div className={styles.photo}>
            <img src="/images/brand/hero-mujer.jpg" alt="Profesional trabajando" />
          </div>

          <div className={styles.summary} aria-hidden="true">
            <div className={styles.summaryTop}>
              <span>Resumen · Septiembre</span>
              <strong>+12%</strong>
            </div>
            <div className={styles.summaryBars}>
              {MONTHS.map((m) => (
                <div key={m.label} className={styles.summaryCol}>
                  <span
                    className={`${styles.summaryBar} ${
                      m.tone === "on"
                        ? styles.summaryBarOn
                        : m.tone === "mid"
                          ? styles.summaryBarMid
                          : ""
                    }`}
                    style={{ height: `${m.h}%` }}
                  />
                  <em className={m.tone === "on" ? styles.summaryNow : undefined}>
                    {m.label}
                  </em>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.badge} aria-hidden="true">
            <span className={styles.badgeIcon}>
              <LuCheck size={15} />
            </span>
            IGV listo para declarar
          </div>
        </div>
      </main>

      <footer className={styles.features}>
        {FEATURES.map(({ icon: Icon, label }) => (
          <div key={label} className={styles.feature}>
            <Icon size={20} />
            {label}
          </div>
        ))}
      </footer>
    </div>
  );
};

export default WelcomePage;
