import { FiMessageCircle, FiSearch } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const PengaduanMenuPage = () => {
  const navigate = useNavigate();

  const menus = [
    {
      title: "Cari Data",
      description: "Cari pengaduan cukup dengan kontak pelapor.",
      icon: <FiSearch size={22} />,
      path: "/digital-data/pengaduan/search",
    },
    {
      title: "Buat Data",
      description: "Buat pengaduan baru melalui form e-ticket.",
      icon: <FiMessageCircle size={22} />,
      path: "/digital-data/pengaduan/eticket",
    },
  ];

  return (
    <div className="w-full space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600 dark:text-sky-400">
              Menu Pengaduan
            </p>
            <h1 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
              Pilih aksi yang ingin dilakukan
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Menu dipisah agar pencarian dan pengisian pengaduan tidak
              bercampur.
            </p>
          </div>
          <div>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              ← Kembali
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {menus.map((menu) => (
          <button
            key={menu.path}
            onClick={() => navigate(menu.path)}
            className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-sky-300 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 transition group-hover:bg-sky-600 group-hover:text-white dark:bg-slate-800">
              {menu.icon}
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {menu.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              {menu.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PengaduanMenuPage;
