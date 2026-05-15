import Layout from "../components/Layout";
import HomePage from "../pages/HomePage";
import CaiRegistrationPage from "../pages/data-center/cai/RegistrationPage";
import CaiShowPage from "../pages/data-center/cai/ShowPage";
import SensusRegistrationPage from "../pages/data-center/sensus/RegistrationPage";
import SensusShowPage from "../pages/data-center/sensus/ShowPage";
import PresensiPage from "../pages/data-center/presensi";
import EticketPage from "../pages/data-center/eticket";
import CekPajakKendaraanPage from "../pages/digital-data/sambara/CekPajakKendaraanPage";

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
        path: "digital-data/cai/registration",
        element: <CaiRegistrationPage />,
      },
      {
        path: "digital-data/cai/:kodeUuid",
        element: <CaiShowPage />,
      },
      {
        path: "digital-data/sensus/registration",
        element: <SensusRegistrationPage />,
      },
      {
        path: "digital-data/sensus/:kodeUuid",
        element: <SensusShowPage />,
      },
      {
        path: "digital-data/presensi",
        element: <PresensiPage />,
      },
      {
        path: "digital-data/eticket",
        element: <EticketPage />,
      },
      {
        path: "digital-data/sambara/cek-pajak-kendaraan",
        element: <CekPajakKendaraanPage />,
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
