import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowUp,
  FiBell,
  FiChevronRight,
  FiMessageCircle,
  FiSearch,
  FiX,
} from "react-icons/fi";

import { AiFillCar } from "react-icons/ai";

import { MdOutlineEventAvailable } from "react-icons/md";
import { BiUser, BiWater } from "react-icons/bi";
// import { FiSmartphone } from "react-icons/fi";

const menus = [
  {
    title: "Menu Sensus",
    description: "Masuk ke menu sensus untuk memilih cari data atau buat data.",
    icon: <BiUser size={22} />,
    path: "/digital-data/sensus",
  },
  {
    title: "Menu CAI",
    description: "Masuk ke menu CAI untuk memilih cari data atau buat data.",
    icon: <BiWater size={22} />,
    path: "/digital-data/cai",
  },
  {
    title: "Menu Pengaduan",
    description: "Masuk ke menu pengaduan untuk melakukan pengaduan.",
    icon: <FiMessageCircle size={22} />,
    path: "/digital-data/pengaduan",
  },
  {
    title: "Absensi Online",
    description:
      "Menu untuk melakukan absensi online untuk kegiatan dan acara tertentu.",
    icon: <MdOutlineEventAvailable size={22} />,
    path: "/digital-data/presensi",
  },
  {
    title: "Cek Pajak Kendaraan",
    description:
      "Kelola data pajak kendaraan dan informasi terkait dengan mudah dan cepat.",
    icon: <AiFillCar size={22} />,
    path: "/digital-data/sambara/cek-pajak-kendaraan",
  },
  // {
  //   title: "Device ID Checker",
  //   description:
  //     "Lihat device_id browser saat ini untuk kebutuhan validasi perangkat.",
  //   icon: <FiSmartphone size={22} />,
  //   path: "/digital-data/device-id",
  // },
];

const menuGroups = [
  {
    title: "Layanan Pendukung",
    subtitle: "Fitur tambahan untuk melengkapi operasional utama.",
    items: [menus[3]],
  },
  {
    title: "Layanan Utama",
    subtitle: "Akses cepat ke fitur yang paling sering dipakai.",
    items: [menus[0], menus[1]],
  },
  {
    title: "Layanan Khusus",
    subtitle: "Fitur pendukung untuk yang sudah di sesuaikan.",
    items: [menus[2]],
  },
  {
    title: "Layanan Tambahan",
    subtitle: "Fitur pendukung untuk yang sudah di sesuaikan.",
    items: [menus[4]],
  },
];

const HomePage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  // simple debounce for search to avoid heavy recomputations while typing
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 220);
    return () => clearTimeout(t);
  }, [search]);

  const filteredMenus = useMemo(() => {
    const keyword = debounced.toLowerCase();
    if (!keyword) return menus;
    return menus.filter((menu) => {
      return (
        menu.title.toLowerCase().includes(keyword) ||
        menu.description.toLowerCase().includes(keyword)
      );
    });
  }, [debounced]);

  const handleCardActivate = (path: string) => navigate(path);

  const resetSearch = () => setSearch("");

  return (
    <div
      className="mx-auto flex min-h-screen w-full max-w-md flex-col"
      role="main"
    >
      <section className="overflow-hidden rounded-[28px] bg-linear-to-br from-sky-500 via-cyan-500 to-blue-600 p-5 text-white shadow-[0_18px_50px_rgba(14,116,144,0.25)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-white/80">
              SIPANDA
            </p>
            <h1 className="mt-2 text-2xl font-black leading-tight sm:text-[2.15rem]">
              Menu Layanan
            </h1>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/90">
              Pilih layanan yang ingin Anda gunakan. Tampilan dibuat ringkas
              agar mudah dipindai di layar kecil.
            </p>
          </div>

          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
            <FiBell className="text-2xl" aria-hidden />
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-[28px] bg-white p-4 shadow-sm dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold sm:text-lg">Informasi Menu</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Anda memiliki {filteredMenus.length} layanan yang tersedia.
            </p>
          </div>

          <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            Aktif
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/70">
          <div className="relative w-full">
            <label htmlFor="menu-search" className="sr-only">
              Cari menu
            </label>
            <FiSearch
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              aria-hidden
            />

            <input
              id="menu-search"
              name="menu-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari layanan..."
              aria-label="Cari layanan"
              className="w-full rounded-2xl border border-transparent bg-white py-3 pl-10 pr-10 text-sm outline-none transition focus:border-sky-200 focus:ring-2 focus:ring-sky-100 dark:bg-slate-900 dark:focus:border-sky-500/40 dark:focus:ring-sky-500/10"
            />

            {search && (
              <button
                type="button"
                onClick={resetSearch}
                aria-label="Hapus pencarian"
                className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              >
                <FiX />
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="mt-4 flex flex-col gap-4">
        {menuGroups.map((group) => {
          const items = filteredMenus.filter((menu) =>
            group.items.some((item) => item.path === menu.path),
          );

          if (items.length === 0) return null;

          return (
            <section
              key={group.title}
              className="overflow-hidden rounded-[28px] bg-white shadow-sm dark:bg-slate-900"
            >
              <div className="border-b border-slate-100 px-4 py-4 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {group.title}
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {group.subtitle}
                </p>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((menu) => (
                  <button
                    type="button"
                    key={menu.path}
                    onClick={() => handleCardActivate(menu.path)}
                    className="group flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-slate-50 focus:bg-slate-50 focus:outline-none dark:hover:bg-slate-800/70 dark:focus:bg-slate-800/70"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sky-600 transition group-hover:bg-sky-50 group-hover:text-sky-700 dark:bg-slate-800 dark:text-sky-400">
                      {menu.icon}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="truncate text-sm font-semibold text-slate-900 dark:text-white sm:text-base">
                            {menu.title}
                          </h4>
                          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400 sm:text-sm">
                            {menu.description}
                          </p>
                        </div>

                        <FiChevronRight className="mt-0.5 shrink-0 text-lg text-emerald-600 transition-transform group-hover:translate-x-0.5 dark:text-emerald-400" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          );
        })}

        {filteredMenus.length === 0 && (
          <section className="rounded-[28px] bg-white p-6 text-center shadow-sm dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Menu tidak ditemukan.
            </p>
          </section>
        )}
      </div>

      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-emerald-700 shadow-sm transition hover:shadow-md dark:bg-slate-900 dark:text-emerald-300"
      >
        <FiArrowUp />
        Kembali ke atas
      </button>
    </div>
  );
};

export default HomePage;
