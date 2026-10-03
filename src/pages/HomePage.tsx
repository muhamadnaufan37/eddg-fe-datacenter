import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowUp,
  FiChevronRight,
  FiMap,
  FiMessageCircle,
  FiSearch,
  FiX,
  FiServer,
  FiShield,
  FiZap,
  FiActivity,
  FiDatabase,
  FiCpu,
  FiLayers,
  FiGrid,
  FiList,
} from "react-icons/fi";
import { BiUser, BiWater } from "react-icons/bi";
import { AiFillCar } from "react-icons/ai";
// import { MdOutlineEventAvailable } from "react-icons/md";

interface MenuItem {
  id: string;
  code: string;
  title: string;
  category: "Layanan Utama" | "Layanan Khusus" | "Data Referensi" | "Layanan Tambahan";
  description: string;
  icon: React.ReactNode;
  path: string;
  tags: string[];
  status: "Operational" | "Active";
  gradient: string;
  accentColor: string;
}

const menus: MenuItem[] = [
  {
    id: "sensus",
    code: "SRV-01",
    title: "Menu Sensus",
    category: "Layanan Utama",
    description:
      "Pusat pencatatan, verifikasi, dan pencarian data sensus generus secara real-time dan terstruktur.",
    icon: <BiUser className="text-2xl" />,
    path: "/digital-data/sensus",
    tags: ["Pencarian Data", "Registrasi Baru", "Validasi UUID"],
    status: "Operational",
    gradient: "from-[#2373f4] to-[#578ef5]",
    accentColor: "#2373f4",
  },
  {
    id: "cai",
    code: "SRV-02",
    title: "Menu CAI",
    category: "Layanan Utama",
    description:
      "Pengelolaan terpadu data kegiatan CAI, pendaftaran peserta, dan pelaporan kegiatan terpusat.",
    icon: <BiWater className="text-2xl" />,
    path: "/digital-data/cai",
    tags: ["Data Kegiatan", "Registrasi Peserta", "Verifikasi"],
    status: "Operational",
    gradient: "from-[#578ef5] to-[#65d0f4]",
    accentColor: "#578ef5",
  },
  {
    id: "pengaduan",
    code: "SRV-03",
    title: "Menu Pengaduan",
    category: "Layanan Khusus",
    description:
      "Helpdesk terpusat untuk pelaporan kendala, permohonan bantuan, dan pelacakan e-ticket secara transparan.",
    icon: <FiMessageCircle className="text-2xl" />,
    path: "/digital-data/pengaduan",
    tags: ["Buat Tiket", "Pelacakan E-Ticket", "Helpdesk"],
    status: "Active",
    gradient: "from-[#2373f4] to-[#65d0f4]",
    accentColor: "#2373f4",
  },
  {
    id: "wilayah",
    code: "SRV-04",
    title: "Data Wilayah",
    category: "Data Referensi",
    description:
      "Eksplorasi direktori spasial hierarkis Daerah, Desa, dan Kelompok dengan validasi kode wilayah terpusat.",
    icon: <FiMap className="text-2xl" />,
    path: "/digital-data/wilayah",
    tags: ["Hierarki Daerah", "Tingkat Desa", "Kelompok"],
    status: "Operational",
    gradient: "from-[#65d0f4] to-[#2373f4]",
    accentColor: "#65d0f4",
  },
  // {
  //   id: "presensi",
  //   code: "SRV-05",
  //   title: "Absensi Online",
  //   category: "Layanan Tambahan",
  //   description:
  //     "Pencatatan presensi kegiatan digital otomatis dengan verifikasi waktu dan kehadiran secara presisi.",
  //   icon: <MdOutlineEventAvailable className="text-2xl" />,
  //   path: "/digital-data/presensi",
  //   tags: ["Presensi Digital", "Log Real-Time", "Validasi Kehadiran"],
  //   status: "Operational",
  //   gradient: "from-[#578ef5] to-[#65d0f4]",
  //   accentColor: "#578ef5",
  // },
  {
    id: "sambara",
    code: "SRV-06",
    title: "SAMBARA (Pajak Kendaraan)",
    category: "Layanan Tambahan",
    description:
      "Integrasi layanan cek informasi Pajak Kendaraan Bermotor (PKB) Jawa Barat secara langsung dan akurat.",
    icon: <AiFillCar className="text-2xl" />,
    path: "/digital-data/sambara/cek-pajak-kendaraan",
    tags: ["Cek Pajak Jabar", "Info Kendaraan", "Nomor Polisi"],
    status: "Active",
    gradient: "from-[#2373f4] to-[#578ef5]",
    accentColor: "#2373f4",
  },
];

const categories = [
  "Semua Layanan",
  "Layanan Utama",
  "Layanan Khusus",
  "Data Referensi",
  "Layanan Tambahan",
] as const;

const HomePage = () => {
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua Layanan");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 180);
    return () => clearTimeout(t);
  }, [search]);

  // Global keyboard shortcut: press '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "Escape" && document.activeElement === searchInputRef.current) {
        setSearch("");
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filtered menu items
  const filteredMenus = useMemo(() => {
    const keyword = debounced.toLowerCase();
    return menus.filter((menu) => {
      const matchCategory =
        selectedCategory === "Semua Layanan" || menu.category === selectedCategory;
      if (!matchCategory) return false;

      if (!keyword) return true;
      return (
        menu.title.toLowerCase().includes(keyword) ||
        menu.description.toLowerCase().includes(keyword) ||
        menu.tags.some((tag) => tag.toLowerCase().includes(keyword)) ||
        menu.code.toLowerCase().includes(keyword)
      );
    });
  }, [debounced, selectedCategory]);

  const handleCardActivate = (path: string) => navigate(path);
  const resetSearch = () => {
    setSearch("");
    searchInputRef.current?.focus();
  };

  return (
    <div className="relative min-h-screen overflow-hidden pb-16 font-sans text-slate-900 transition-colors duration-200 dark:text-[#dde6ed]">
      {/* Dynamic Data Center Tech Background Mesh */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {/* Soft radial gradients using user requested colors */}
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#2373f4]/20 via-[#65d0f4]/15 to-transparent blur-3xl dark:from-[#2373f4]/10 dark:via-[#526d82]/15" />
        <div className="absolute top-20 right-[-100px] h-[550px] w-[550px] rounded-full bg-gradient-to-bl from-[#578ef5]/20 via-[#65d0f4]/15 to-transparent blur-3xl dark:from-[#526d82]/20 dark:via-[#27374d]/30" />
        <div className="absolute bottom-10 left-1/3 h-[450px] w-[450px] rounded-full bg-gradient-to-tr from-[#f2f7a0]/25 via-[#65d0f4]/10 to-transparent blur-3xl dark:from-[#65d0f4]/5" />
        {/* Subtle grid pattern overlay */}
        <div className="dc-grid-pattern absolute inset-0 opacity-40 dark:opacity-20" />
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        {/* Hero Section: Scalable Modern Data Center Architecture */}
        <section className="relative overflow-hidden rounded-3xl border-2 border-[#578ef5]/40 bg-gradient-to-br from-[#2373f4] via-[#578ef5] to-[#2373f4] p-6 text-white shadow-xl shadow-[#2373f4]/20 transition-all dark:border-[#526d82]/70 dark:from-[#27374d] dark:via-[#2f435c] dark:to-[#1c2736] dark:shadow-2xl dark:shadow-[#0a121e]/70 sm:p-8 lg:p-10">
          {/* Subtle Decorative Glow Orbs in Hero */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#65d0f4]/35 blur-2xl dark:bg-[#65d0f4]/10" />
          <div className="pointer-events-none absolute -bottom-16 left-1/3 h-52 w-52 rounded-full bg-[#f2f7a0]/30 blur-2xl dark:bg-[#526d82]/30" />

          <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="space-y-4">
              {/* Cluster Status Chip with #F2F7A0 accent */}
              <div className="inline-flex items-center gap-2.5 rounded-full border border-white/30 bg-[#f2f7a0] px-3.5 py-1.5 text-slate-900 shadow-sm dark:border-[#526d82] dark:bg-[#27374d] dark:text-[#dde6ed]">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2373f4] opacity-75 dark:bg-[#65d0f4]" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#2373f4] dark:bg-[#65d0f4]" />
                </span>
                <span className="text-[11px] font-extrabold tracking-widest uppercase text-slate-900 dark:text-[#dde6ed]">
                  SIPANDA CLUSTER v2.4 • HIGH AVAILABILITY HUB
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Pusat Data & Layanan Digital Terpadu
              </h1>

              {/* Subtitle */}
              <p className="max-w-2xl text-sm leading-relaxed text-white/90 sm:text-base lg:text-lg">
                Sistem informasi terintegrasi generasi modern untuk pengelolaan sensus, CAI, presensi,
                pengaduan, dan hierarki wilayah dalam satu ekosistem cloud yang cepat, aman, dan scalable.
              </p>

              {/* Telemetry quick badges */}
              <div className="flex flex-wrap items-center gap-2 pt-2 text-xs font-semibold text-white">
                <div className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-black/25 px-3 py-1.5 backdrop-blur-xs dark:bg-white/10">
                  <FiServer className="text-[#f2f7a0] dark:text-[#65d0f4]" />
                  <span>Node: DC-JKT-01</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-black/25 px-3 py-1.5 backdrop-blur-xs dark:bg-white/10">
                  <FiZap className="text-[#f2f7a0] dark:text-[#65d0f4]" />
                  <span>Latency: &lt; 15ms</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-black/25 px-3 py-1.5 backdrop-blur-xs dark:bg-white/10">
                  <FiShield className="text-[#f2f7a0] dark:text-[#65d0f4]" />
                  <span>TLS 1.3 End-to-End</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-black/25 px-3 py-1.5 backdrop-blur-xs dark:bg-white/10">
                  <FiActivity className="text-[#f2f7a0] dark:text-[#65d0f4]" />
                  <span>Uptime: 99.98%</span>
                </div>
              </div>
            </div>

            {/* Quick Stat Telemetry Widget on Hero */}
            {/* <div className="hidden flex-col gap-3 rounded-2xl border-2 border-white/30 bg-black/20 p-5 backdrop-blur-md dark:border-[#526d82] dark:bg-[#1c2736]/85 lg:flex lg:w-72">
              <div className="flex items-center justify-between border-b border-white/20 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-white/90 dark:text-[#9db2bf]">
                  Status Jaringan
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#f2f7a0] px-2.5 py-0.5 text-[10px] font-extrabold text-slate-900 dark:bg-[#65d0f4]/20 dark:text-[#65d0f4]">
                  OPTIMAL
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 py-1">
                <div>
                  <div className="text-3xl font-black text-white">6</div>
                  <div className="text-[11px] font-medium text-white/80 dark:text-[#9db2bf]">
                    Modul Terpasang
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-black text-white">100%</div>
                  <div className="text-[11px] font-medium text-white/80 dark:text-[#9db2bf]">
                    Sinkronisasi Data
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/15 bg-black/30 p-2.5 text-[11px] font-medium leading-tight text-white/90 dark:bg-black/40">
                🚀 Semua modul operasional siap diakses dengan ketersediaan penuh.
              </div>
            </div> */}
          </div>
        </section>

        {/* MAIN MENU HUB - The Core Centerpiece of the Application */}
        <section id="main-menu-hub" className="space-y-6">
          {/* Section Header with Search and Interactive Filter Bar */}
          <div className="flex flex-col gap-5 rounded-3xl border-2 border-[#cbdcf5] bg-white p-5 shadow-sm transition-colors dark:border-[#526d82]/60 dark:bg-[#27374d] sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#2373f4] text-xs font-bold text-white shadow-xs dark:bg-[#65d0f4] dark:text-[#1c2736]">
                    <FiLayers className="text-sm" />
                  </span>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-[#dde6ed] sm:text-2xl">
                    Katalog Menu Layanan Utama
                  </h2>
                </div>
                <p className="mt-1 text-xs font-medium text-slate-600 dark:text-[#9db2bf] sm:text-sm">
                  Pilih salah satu modul layanan data center di bawah ini untuk memulai operasi
                </p>
              </div>

              {/* View Mode Toggle Button */}
              <div className="flex items-center gap-1 self-start rounded-xl border border-[#cbdcf5] bg-[#edf2f9] p-1 dark:border-[#526d82] dark:bg-[#1c2736] sm:self-auto">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${viewMode === "grid"
                    ? "bg-[#2373f4] text-white shadow-xs dark:bg-[#578ef5]"
                    : "text-slate-600 hover:text-slate-900 dark:text-[#9db2bf] dark:hover:text-[#dde6ed]"
                    }`}
                  aria-label="Tampilan Grid Card"
                >
                  <FiGrid className="text-sm" />
                  <span className="hidden sm:inline">Grid</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${viewMode === "list"
                    ? "bg-[#2373f4] text-white shadow-xs dark:bg-[#578ef5]"
                    : "text-slate-600 hover:text-slate-900 dark:text-[#9db2bf] dark:hover:text-[#dde6ed]"
                    }`}
                  aria-label="Tampilan List Compact"
                >
                  <FiList className="text-sm" />
                  <span className="hidden sm:inline">List</span>
                </button>
              </div>
            </div>

            {/* Smart Search Bar with Clear Contrast */}
            <div className="relative w-full">
              <label htmlFor="menu-search-input" className="sr-only">
                Cari modul layanan
              </label>
              <FiSearch
                className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-[#2373f4] dark:text-[#65d0f4]"
                aria-hidden
              />
              <input
                ref={searchInputRef}
                id="menu-search-input"
                name="menu-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari layanan (misal: Sensus, CAI, Pajak, Wilayah, Pengaduan)..."
                className="w-full rounded-2xl border-2 border-[#cbdcf5] bg-[#f8fafd] py-3.5 pl-11 pr-24 text-sm font-semibold text-slate-900 shadow-2xs outline-none transition placeholder:text-slate-400 focus:border-[#2373f4] focus:bg-white focus:ring-4 focus:ring-[#2373f4]/15 dark:border-[#526d82] dark:bg-[#1c2736] dark:text-[#dde6ed] dark:placeholder:text-[#9db2bf]/70 dark:focus:border-[#65d0f4] dark:focus:ring-[#65d0f4]/20"
              />

              <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
                {search ? (
                  <button
                    type="button"
                    onClick={resetSearch}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-slate-700 transition hover:bg-slate-300 dark:bg-[#27374d] dark:text-[#9db2bf] dark:hover:bg-[#526d82]"
                    title="Hapus pencarian (Esc)"
                  >
                    <FiX className="text-sm" />
                  </button>
                ) : (
                  <kbd className="hidden rounded-md border border-[#cbdcf5] bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:border-[#526d82] dark:bg-[#27374d] dark:text-[#9db2bf] md:inline-block">
                    /
                  </kbd>
                )}
              </div>
            </div>

            {/* Interactive Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="shrink-0 font-bold text-slate-700 dark:text-[#9db2bf]">
                Kategori:
              </span>
              {categories.map((cat) => {
                const count =
                  cat === "Semua Layanan"
                    ? menus.length
                    : menus.filter((m) => m.category === cat).length;
                const isSelected = selectedCategory === cat;

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-1.5 font-bold transition-all ${isSelected
                      ? "bg-[#2373f4] text-white shadow-md shadow-[#2373f4]/25 dark:bg-[#578ef5]"
                      : "border border-[#cbdcf5] bg-white text-slate-700 shadow-2xs hover:border-[#2373f4] hover:bg-[#eef4fc] dark:border-[#526d82] dark:bg-[#1c2736] dark:text-[#9db2bf] dark:hover:border-[#65d0f4] dark:hover:text-[#dde6ed]"
                      }`}
                  >
                    <span>{cat}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${isSelected
                        ? "bg-[#f2f7a0] text-slate-900"
                        : "bg-[#edf2f9] text-slate-700 dark:bg-[#27374d] dark:text-[#dde6ed]"
                        }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* MAIN MENU BLADES / CARDS GRID VIEW */}
          {viewMode === "grid" ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredMenus.map((menu) => (
                <div
                  key={menu.id}
                  onClick={() => handleCardActivate(menu.path)}
                  className="group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-3xl border-2 border-[#cbdcf5] bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-[#2373f4] hover:shadow-xl hover:shadow-[#2373f4]/15 dark:border-[#526d82] dark:bg-[#27374d] dark:hover:border-[#65d0f4] dark:hover:shadow-2xl dark:hover:shadow-[#0a121e]/80"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleCardActivate(menu.path);
                    }
                  }}
                >
                  {/* Top Header Accent Strip */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${menu.gradient}`}
                  />

                  {/* Card Content Top Section */}
                  <div>
                    {/* Header Row: Service Code & Status Indicator */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md border border-[#cbdcf5] bg-[#edf2f9] px-2.5 py-0.5 text-[11px] font-extrabold tracking-wider text-[#2373f4] dark:border-[#526d82] dark:bg-[#1c2736] dark:text-[#65d0f4]">
                          {menu.code}
                        </span>
                        <span className="text-[11px] font-bold text-slate-600 dark:text-[#9db2bf]">
                          {menu.category}
                        </span>
                      </div>

                      {/* Live Status Pill with #F2F7A0 highlight */}
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#cbdcf5] bg-[#f2f7a0]/90 px-2.5 py-0.5 text-[10px] font-extrabold text-slate-900 shadow-2xs dark:border-[#526d82] dark:bg-emerald-500/15 dark:text-emerald-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#2373f4] dark:bg-emerald-400" />
                        {menu.status}
                      </span>
                    </div>

                    {/* Icon & Title */}
                    <div className="mt-5 flex items-center gap-3.5">
                      <div
                        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${menu.gradient} text-white shadow-md shadow-[#2373f4]/25 transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-[#2373f4]/40`}
                      >
                        {menu.icon}
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-extrabold tracking-tight text-slate-900 transition-colors group-hover:text-[#2373f4] dark:text-[#dde6ed] dark:group-hover:text-[#65d0f4]">
                          {menu.title}
                        </h3>
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-[#9db2bf]">
                          Modul Terpusat
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="mt-4 line-clamp-3 text-xs font-medium leading-relaxed text-slate-600 dark:text-[#9db2bf] sm:text-sm">
                      {menu.description}
                    </p>

                    {/* Module Feature Tags */}
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {menu.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-lg border border-[#cbdcf5] bg-[#edf2f9] px-2.5 py-1 text-[11px] font-bold text-[#1b5ecc] transition group-hover:border-[#2373f4]/40 group-hover:bg-[#e0effe] dark:border-[#526d82] dark:bg-[#1c2736] dark:text-[#65d0f4]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="mt-6 flex items-center justify-between border-t border-[#cbdcf5]/70 pt-4 dark:border-[#526d82]/60">
                    <span className="text-xs font-bold text-[#2373f4] transition group-hover:text-[#195ac7] dark:text-[#65d0f4] dark:group-hover:text-white">
                      Buka Modul Layanan
                    </span>

                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#edf2f9] text-[#2373f4] transition-all duration-300 group-hover:translate-x-1 group-hover:bg-[#2373f4] group-hover:text-white dark:bg-[#1c2736] dark:text-[#dde6ed] dark:group-hover:bg-[#65d0f4] dark:group-hover:text-[#1c2736]">
                      <FiChevronRight className="text-base" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* COMPACT LIST VIEW */
            <div className="divide-y-2 divide-[#cbdcf5] overflow-hidden rounded-3xl border-2 border-[#cbdcf5] bg-white shadow-sm dark:divide-[#526d82]/60 dark:border-[#526d82] dark:bg-[#27374d]">
              {filteredMenus.map((menu) => (
                <div
                  key={menu.id}
                  onClick={() => handleCardActivate(menu.path)}
                  className="group flex cursor-pointer items-center justify-between gap-4 p-5 transition hover:bg-[#edf2f9] dark:hover:bg-[#223043]/70"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleCardActivate(menu.path);
                    }
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${menu.gradient} text-white shadow-sm transition group-hover:scale-105`}
                    >
                      {menu.icon}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-[#2373f4] dark:text-[#dde6ed] dark:group-hover:text-[#65d0f4]">
                          {menu.title}
                        </h3>
                        <span className="rounded-md border border-[#cbdcf5] bg-[#edf2f9] px-2 py-0.5 text-[10px] font-bold text-[#2373f4] dark:border-[#526d82] dark:bg-[#1c2736] dark:text-[#9db2bf]">
                          {menu.code}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-xs font-medium text-slate-600 dark:text-[#9db2bf]">
                        {menu.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <span className="hidden text-xs font-bold text-[#2373f4] group-hover:underline dark:text-[#65d0f4] sm:inline">
                      Buka Modul
                    </span>
                    <FiChevronRight className="text-lg text-slate-500 transition group-hover:translate-x-1 group-hover:text-[#2373f4] dark:text-[#9db2bf] dark:group-hover:text-[#65d0f4]" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State when search returns no match */}
          {filteredMenus.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[#cbdcf5] bg-white p-12 text-center dark:border-[#526d82] dark:bg-[#27374d]">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#edf2f9] text-[#2373f4] dark:bg-[#1c2736] dark:text-[#65d0f4]">
                <FiSearch className="text-3xl" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-[#dde6ed]">
                Layanan tidak ditemukan
              </h3>
              <p className="mt-1 max-w-sm text-xs font-medium text-slate-600 dark:text-[#9db2bf]">
                Tidak ada modul yang cocok dengan kata kunci &quot;{debounced}&quot;. Coba cari dengan kata kunci lain.
              </p>
              <button
                type="button"
                onClick={resetSearch}
                className="mt-4 rounded-xl bg-[#2373f4] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#195ac7] dark:bg-[#578ef5]"
              >
                Reset Pencarian
              </button>
            </div>
          )}
        </section>

        {/* Scalable Data Center Architecture & Feature Highlights */}
        <section className="space-y-4 pt-4">
          <div className="text-center sm:text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2373f4] dark:text-[#65d0f4]">
              INFRASTRUCTURE CAPABILITY
            </span>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900 dark:text-[#dde6ed] sm:text-2xl">
              Arsitektur Data Modern & Skalabilitas Tinggi
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {/* Feature 1 */}
            <div className="rounded-3xl border-2 border-[#cbdcf5] bg-white p-5 shadow-xs transition hover:border-[#2373f4] hover:shadow-md dark:border-[#526d82] dark:bg-[#27374d]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2373f4] text-white shadow-xs dark:bg-[#65d0f4] dark:text-[#1c2736]">
                <FiDatabase className="text-lg" />
              </div>
              <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-[#dde6ed]">
                Sinkronisasi Terpusat Real-Time
              </h3>
              <p className="mt-1.5 text-xs font-medium leading-relaxed text-slate-600 dark:text-[#9db2bf]">
                Mekanisme penyimpanan data yang terpusat memastikan setiap entri sensus, CAI, dan presensi terverifikasi dengan integritas tinggi.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-3xl border-2 border-[#cbdcf5] bg-white p-5 shadow-xs transition hover:border-[#2373f4] hover:shadow-md dark:border-[#526d82] dark:bg-[#27374d]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#578ef5] text-white shadow-xs dark:bg-[#578ef5] dark:text-white">
                <FiCpu className="text-lg" />
              </div>
              <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-[#dde6ed]">
                Struktur Wilayah Bertingkat
              </h3>
              <p className="mt-1.5 text-xs font-medium leading-relaxed text-slate-600 dark:text-[#9db2bf]">
                Hierarki spasial Daerah, Desa, dan Kelompok dipetakan dengan rapi untuk menjamin ketepatan pelaporan data generus.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-3xl border-2 border-[#cbdcf5] bg-white p-5 shadow-xs transition hover:border-[#2373f4] hover:shadow-md dark:border-[#526d82] dark:bg-[#27374d]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#65d0f4] text-[#1c2736] shadow-xs dark:bg-[#65d0f4] dark:text-[#1c2736]">
                <FiShield className="text-lg" />
              </div>
              <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-[#dde6ed]">
                Validasi & Keamanan Berlapis
              </h3>
              <p className="mt-1.5 text-xs font-medium leading-relaxed text-slate-600 dark:text-[#9db2bf]">
                Dilengkapi dengan validasi kode UUID unik, sistem pelacakan tiket pengaduan, dan enkripsi transmisi data standar data center.
              </p>
            </div>
          </div>
        </section>

        {/* Back to Top Smooth Scroll Action */}
        <div className="flex justify-center pt-4">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="inline-flex items-center gap-2 rounded-full border-2 border-[#cbdcf5] bg-white px-5 py-2.5 text-xs font-extrabold text-[#2373f4] shadow-xs transition hover:-translate-y-0.5 hover:border-[#2373f4] hover:bg-[#edf2f9] hover:shadow-md dark:border-[#526d82] dark:bg-[#27374d] dark:text-[#65d0f4] dark:hover:border-[#65d0f4]"
          >
            <FiArrowUp />
            Kembali ke Atas
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
