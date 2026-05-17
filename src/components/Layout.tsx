import { useEffect, useRef } from "react";
import { Outlet } from "react-router-dom";
import { Toast } from "primereact/toast";
import { useTheme } from "../contexts/ThemeContext";
import { setToastRef } from "../services/toast";
import { InspectProvider } from "../contexts/InspectContext";
import { useInspectDetect } from "../utils/useInspectDetect";

const Layout = () => {
  const { theme, toggleTheme } = useTheme();
  const toastRef = useRef<Toast>(null);

  useEffect(() => {
    if (toastRef.current) {
      setToastRef(toastRef.current);
    }
  }, []);

  const { isInspectOpen } = useInspectDetect();

  return (
    <div className="flex min-h-screen flex-col bg-gray-100 transition-colors duration-200 dark:bg-gray-900">
      <Toast ref={toastRef} />
      {/* Header */}
      <header className="p-2 flex flex-row items-center justify-between shadow-lg z-10 bg-[#1E88E5] dark:bg-gray-800 w-full fixed top-0 transition-all duration-300 ease-in-out">
        {/* Tombol Toggle Theme */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-white/20 dark:bg-white/10 hover:bg-white/30 dark:hover:bg-white/20 backdrop-blur-sm transition-colors duration-200"
          aria-label="Toggle theme"
        >
          {theme === "light" ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-yellow-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          )}
        </button>

        <img width="25" src="/logo.svg" alt="logo-eddg" />
      </header>

      {/* Main Content */}
      <main className="flex flex-1 w-full flex-col items-stretch justify-start px-4 py-6 pt-24 sm:px-6 lg:px-8">
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
