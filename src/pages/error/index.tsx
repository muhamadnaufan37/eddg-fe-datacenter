import { useTheme } from "../../contexts/ThemeContext";
import GlobalTopBar from "../../components/header";
import Alert from "../../components/Alert";

function ErrorPage() {
  const { theme, toggleTheme } = useTheme();
  return (
    <>
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4 pt-15 transition-colors duration-200">
        <GlobalTopBar theme={theme} toggleTheme={toggleTheme} />

        <div className="p-2">
          <Alert />
        </div>

        <div className="flex flex-col gap-2 w-full max-w-xl bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 relative transition-colors duration-200">
          <div>
            <img
              src="/emptyState.svg"
              className="mx-auto"
              alt="Ilustrasi Scan SKPD"
            />
            <div className="mt-4 text-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Halaman Tidak Ditemukan
              </h2>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ErrorPage;
