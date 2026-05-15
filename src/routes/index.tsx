import Layout from "../components/Layout";
import HomePage from "../pages/HomePage";

export const routes = [
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "*",
        element: (
          <div className="flex flex-col gap-2 w-full max-w-xl">
            <div className="flex flex-col gap-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 text-center">
              <img
                src="/emptyState.svg"
                className="mx-auto"
                alt="Ilustrasi Scan SKPD"
              />
              <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">
                404 - Halaman Tidak Ditemukan
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Halaman yang Anda cari tidak ditemukan
              </p>
            </div>
          </div>
        ),
      },
    ],
  },
];
