import { FiSearch, FiArrowLeft, FiChevronRight } from "react-icons/fi";
import { MdAppRegistration } from "react-icons/md";
import { useNavigate } from "react-router-dom";

const CaiMenuPage = () => {
  const navigate = useNavigate();

  const menus = [
    {
      code: "CAI-SEARCH",
      title: "Cari Data Peserta CAI",
      description:
        "Cari peserta kegiatan CAI berdasarkan nama lengkap, tanggal lahir, dan jenis kelamin.",
      icon: <FiSearch size={24} />,
      path: "/digital-data/cai/search",
      gradient: "from-[#2373f4] to-[#578ef5]",
    },
    {
      code: "CAI-REGISTER",
      title: "Registrasi Peserta Baru",
      description:
        "Tambahkan data peserta kegiatan CAI baru ke dalam database terpusat dengan registrasi instan.",
      icon: <MdAppRegistration size={24} />,
      path: "/digital-data/cai/registration",
      gradient: "from-[#578ef5] to-[#65d0f4]",
    },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Header Banner */}
      <div className="overflow-hidden rounded-3xl border-2 border-[#cbdcf5] bg-white p-6 shadow-sm dark:border-[#526d82] dark:bg-[#27374d]">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md border border-[#cbdcf5] bg-[#edf2f9] px-2.5 py-0.5 text-[11px] font-extrabold tracking-wider text-[#2373f4] dark:border-[#526d82] dark:bg-[#1c2736] dark:text-[#65d0f4]">
                OPERATIONS
              </span>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#2373f4] dark:text-[#65d0f4]">
                Menu CAI
              </p>
            </div>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-[#dde6ed] sm:text-3xl">
              Pusat Data Kegiatan CAI
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-600 dark:text-[#9db2bf]">
              Kelola pencarian peserta dan pendaftaran data kegiatan CAI secara terpusat
            </p>
          </div>
          <div>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 rounded-2xl border-2 border-[#cbdcf5] bg-white px-4 py-2.5 text-xs font-bold text-[#2373f4] shadow-xs transition hover:border-[#2373f4] hover:bg-[#edf2f9] dark:border-[#526d82] dark:bg-[#1c2736] dark:text-[#65d0f4] dark:hover:border-[#65d0f4]"
            >
              <FiArrowLeft />
              Kembali ke Menu Utama
            </button>
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {menus.map((menu) => (
          <button
            key={menu.path}
            onClick={() => navigate(menu.path)}
            className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border-2 border-[#cbdcf5] bg-white p-7 text-left shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-[#2373f4] hover:shadow-xl hover:shadow-[#2373f4]/15 dark:border-[#526d82] dark:bg-[#27374d] dark:hover:border-[#65d0f4]"
          >
            <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${menu.gradient}`} />

            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-md border border-[#cbdcf5] bg-[#edf2f9] px-2.5 py-0.5 text-[10px] font-extrabold tracking-wider text-[#2373f4] dark:border-[#526d82] dark:bg-[#1c2736] dark:text-[#65d0f4]">
                  {menu.code}
                </span>
                <span className="text-xs font-bold text-[#2373f4] dark:text-[#65d0f4]">
                  Akses Modul →
                </span>
              </div>

              <div className="mt-5 flex items-center gap-4">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${menu.gradient} text-white shadow-md shadow-[#2373f4]/25 transition-transform duration-300 group-hover:scale-105`}
                >
                  {menu.icon}
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 group-hover:text-[#2373f4] dark:text-[#dde6ed] dark:group-hover:text-[#65d0f4]">
                    {menu.title}
                  </h2>
                  <span className="text-xs font-semibold text-slate-400 dark:text-[#9db2bf]">
                    SIPANDA CAI Service
                  </span>
                </div>
              </div>

              <p className="mt-4 text-sm font-medium leading-relaxed text-slate-600 dark:text-[#9db2bf]">
                {menu.description}
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-[#cbdcf5]/60 pt-4 dark:border-[#526d82]/60">
              <span className="text-xs font-bold text-[#2373f4] dark:text-[#65d0f4]">
                Mulai Operasi
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#edf2f9] text-[#2373f4] transition group-hover:bg-[#2373f4] group-hover:text-white dark:bg-[#1c2736] dark:text-[#dde6ed] dark:group-hover:bg-[#65d0f4] dark:group-hover:text-[#1c2736]">
                <FiChevronRight />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CaiMenuPage;
