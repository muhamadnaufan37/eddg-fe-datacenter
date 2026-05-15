import { useEffect, useMemo, useState } from "react";
import { Button } from "primereact/button";
import { useNavigate } from "react-router-dom";
import {
  FiMessageCircle,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

import { AiFillCar } from "react-icons/ai";

import { MdAppRegistration, MdOutlineEventAvailable } from "react-icons/md";

const menus = [
  {
    title: "Cari Data Generus",
    description: "Menu untuk melakukan pencarian data generus / sensus.",
    icon: <FiSearch size={22} />,
    path: "/digital-data/sensus/search",
  },
  {
    title: "Cari Data Peserta CAI",
    description: "Menu untuk melakukan pencarian data peserta CAI.",
    icon: <FiSearch size={22} />,
    path: "/digital-data/cai/search",
  },
  {
    title: "Registrasi Data Sensus",
    description: "Menu pendaftaran data sensus.",
    icon: <MdAppRegistration size={22} />,
    path: "/digital-data/sensus/registration",
  },
  {
    title: "Registrasi Data Peserta CAI",
    description: "Menu pendaftaran data peserta CAI.",
    icon: <MdAppRegistration size={22} />,
    path: "/digital-data/cai/registration",
  },
  {
    title: "Absensi Online",
    description:
      "Menu untuk melakukan absensi online untuk kegiatan dan acara tertentu.",
    icon: <MdOutlineEventAvailable size={22} />,
    path: "/digital-data/presensi",
  },
  {
    title: "E-TICKET",
    description: "Menu untuk melakukan aduan, saran, atau pertanyaan lainnya.",
    icon: <FiMessageCircle size={22} />,
    path: "/digital-data/eticket",
  },
  {
    title: "Cek Pajak Kendaraan",
    description:
      "Kelola data pajak kendaraan dan informasi terkait dengan mudah dan cepat.",
    icon: <AiFillCar size={22} />,
    path: "/digital-data/sambara/cek-pajak-kendaraan",
  },
];

const banners = [
  {
    title: "Sistem Informasi Pengelolaan Data",
    description:
      "SIPANDA adalah platform yang dirancang untuk memudahkan pengelolaan data sensus, CAI, absensi online, e-ticket, dan cek pajak kendaraan dengan antarmuka yang intuitif dan fitur lengkap.",
    button: "Mulai Sekarang",
    gradient: "from-blue-600 to-cyan-500",
  },
];

const HomePage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [currentBanner, setCurrentBanner] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const filteredMenus = useMemo(() => {
    return menus.filter((menu) => {
      const keyword = search.toLowerCase();

      return (
        menu.title.toLowerCase().includes(keyword) ||
        menu.description.toLowerCase().includes(keyword)
      );
    });
  }, [search]);

  const nextBanner = () => {
    setCurrentBanner((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
  };

  const prevBanner = () => {
    setCurrentBanner((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 transition-colors duration-300 dark:bg-[#0f172a] dark:text-white">
      {/* HEADER */}
      {/* <div className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-lg dark:border-slate-700 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-lg font-bold sm:text-2xl">SIPANDA</h1>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Sistem Informasi Pengelolaan Data
            </p>
          </div>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white transition hover:scale-105 dark:border-slate-700 dark:bg-slate-800"
          >
            {darkMode ? <FiSun size={18} /> : <FiMoon size={18} />}
          </button>
        </div>
      </div> */}

      {/* BANNER CAROUSEL */}
      <div className="relative overflow-hidden rounded-2xl">
        <div
          className={`relative bg-linear-to-r ${banners[currentBanner].gradient}`}
        >
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="max-w-2xl text-white">
              <h2 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
                {banners[currentBanner].title}
              </h2>

              <p className="mt-4 text-sm leading-relaxed text-white/90 sm:text-base">
                {banners[currentBanner].description}
              </p>
            </div>
          </div>

          {/* DECORATION */}
          <div className="absolute -right-10 -top-10 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-cyan-300/20 blur-3xl" />
        </div>

        {/* CONTROL */}
        <button
          onClick={prevBanner}
          className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition hover:bg-white/30"
        >
          <FiChevronLeft />
        </button>

        <button
          onClick={nextBanner}
          className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition hover:bg-white/30"
        >
          <FiChevronRight />
        </button>

        {/* INDICATOR */}
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentBanner(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentBanner === index ? "w-8 bg-white" : "w-2 bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* SEARCH */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold sm:text-2xl">Menu Utama</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
              Cari dan pilih menu yang ingin Anda akses.
            </p>
          </div>

          <div className="relative w-full sm:max-w-sm">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari menu..."
              className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
        </div>

        {/* MENU GRID */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredMenus.length > 0 ? (
            filteredMenus.map((menu, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl dark:border-slate-700 dark:bg-slate-900"
              >
                {/* ICON */}
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-all duration-300 group-hover:bg-blue-600 group-hover:text-white dark:bg-slate-800">
                  {menu.icon}
                </div>

                {/* CONTENT */}
                <h3 className="text-base font-semibold sm:text-lg">
                  {menu.title}
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-slate-400">
                  {menu.description}
                </p>

                {/* ACTION */}
                <div className="mt-5">
                  <Button
                    label="Buka Menu"
                    size="small"
                    outlined
                    onClick={() => navigate(menu.path)}
                  />
                </div>

                {/* EFFECT */}
                <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-blue-100/40 opacity-0 blur-2xl transition-all duration-500 group-hover:opacity-100" />
              </div>
            ))
          ) : (
            <div className="col-span-full rounded-2xl border border-dashed border-gray-300 py-12 text-center dark:border-slate-700">
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Menu tidak ditemukan.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
