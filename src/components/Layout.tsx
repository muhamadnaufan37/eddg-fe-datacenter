import { useEffect, useRef } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Toast } from "primereact/toast";
import { FiMoon, FiSun, FiHome } from "react-icons/fi";
import { useTheme } from "../contexts/ThemeContext";
import { setToastRef } from "../services/toast";
import { InspectProvider } from "../contexts/InspectContext";
import { useInspectDetect } from "../utils/useInspectDetect";

const Layout = () => {
  const { theme, toggleTheme } = useTheme();
  const toastRef = useRef<Toast>(null);
  const location = useLocation();

  useEffect(() => {
    if (toastRef.current) {
      setToastRef(toastRef.current);
    }
  }, []);

  const { isInspectOpen } = useInspectDetect();
  const isHome = location.pathname === "/";

  return (
    <div className="flex min-h-screen flex-col bg-[#edf2f9] text-slate-900 antialiased transition-colors duration-200 dark:bg-[#1c2736] dark:text-[#dde6ed]">
      <Toast ref={toastRef} />

      {/* Modern Startup Data Center Header */}
      <header className="fixed top-0 z-40 w-full border-b border-[#cbdcf5] bg-white/95 shadow-xs backdrop-blur-md transition-all duration-300 dark:border-[#526d82]/60 dark:bg-[#27374d]/95">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand Logo & Title */}
          <Link
            to="/"
            className="group flex items-center gap-3 transition-transform hover:scale-[1.01]"
          >
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#2373f4] to-[#578ef5] p-2 shadow-md shadow-[#2373f4]/25 transition-all group-hover:shadow-lg group-hover:shadow-[#2373f4]/35 dark:shadow-[#27374d]/50">
              <img
                src="/logo.svg"
                alt="SIPANDA Data Center"
                className="h-full w-full object-contain brightness-0 invert"
              />
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-[#22c55e] dark:border-[#27374d]" />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-[#dde6ed] sm:text-lg">
                  SIPANDA
                </span>
                <span className="rounded-full bg-[#2373f4] px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-white shadow-xs dark:bg-[#65d0f4] dark:text-[#1c2736]">
                  DATA CENTER
                </span>
              </div>
              <span className="hidden text-[11px] font-medium text-slate-500 dark:text-[#9db2bf] sm:block">
                Sistem Informasi Terpadu & Digital Data Generus
              </span>
            </div>
          </Link>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live System Operational Indicator */}
            <div className="hidden items-center gap-2 rounded-full border border-[#cbdcf5] bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-800 shadow-xs dark:border-[#526d82]/70 dark:bg-[#27374d] dark:text-[#dde6ed] md:flex">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22c55e] opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#22c55e]" />
              </span>
              <span className="text-[11px] font-bold tracking-wide">
                SYSTEM OPERATIONAL
              </span>
            </div>

            {/* Quick Home Button (if on subpage) */}
            {!isHome && (
              <Link
                to="/"
                className="flex items-center gap-1.5 rounded-xl border border-[#cbdcf5] bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-xs transition hover:border-[#2373f4] hover:bg-[#e8f1fc] hover:text-[#2373f4] dark:border-[#526d82] dark:bg-[#27374d] dark:text-[#dde6ed] dark:hover:border-[#65d0f4] dark:hover:bg-[#33465e]"
                title="Kembali ke Beranda"
              >
                <FiHome className="text-sm" />
                <span className="hidden sm:inline">Beranda</span>
              </Link>
            )}

            {/* Modern Theme Switcher Button */}
            <button
              onClick={toggleTheme}
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[#cbdcf5] bg-white text-slate-700 shadow-xs transition-all hover:border-[#2373f4] hover:bg-[#e8f1fc] hover:text-[#2373f4] dark:border-[#526d82] dark:bg-[#27374d] dark:text-[#dde6ed] dark:hover:border-[#65d0f4] dark:hover:bg-[#33465e] dark:hover:text-[#65d0f4]"
              aria-label={theme === "light" ? "Beralih ke Dark Mode" : "Beralih ke Light Mode"}
              title={theme === "light" ? "Beralih ke Dark Mode" : "Beralih ke Light Mode"}
            >
              {theme === "light" ? (
                <FiMoon className="h-4 w-4 transition-transform hover:-rotate-12" />
              ) : (
                <FiSun className="h-4 w-4 text-[#f2f7a0] transition-transform hover:rotate-45" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex w-full flex-1 flex-col items-stretch justify-start px-3 py-6 pt-20 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
          <InspectProvider value={{ isInspectOpen }}>
            <Outlet />
          </InspectProvider>
        </div>
      </main>
    </div>
  );
};

export default Layout;
