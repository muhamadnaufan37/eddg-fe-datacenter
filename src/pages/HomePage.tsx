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
  FiHeart,
} from "react-icons/fi";
import { BiUser, BiWater } from "react-icons/bi";
// import { AiFillCar } from "react-icons/ai";
// import { MdOutlineEventAvailable } from "react-icons/md";

interface MenuItem {
  id: string;
  code: string;
  title: string;
  category:
    | "Layanan Utama"
    | "Layanan Khusus"
    | "Data Referensi"
    | "Layanan Tambahan";
  description: string;
  icon: React.ReactNode;
  path: string;
  tags: string[];
  status: "Operational" | "Active";
  gradient: string;
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
    gradient: "from-sky-500 to-brand-secondary",
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
    gradient: "from-brand-secondary to-brand-cyan",
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
    gradient: "from-sky-500 to-brand-cyan",
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
    gradient: "from-brand-cyan to-sky-500",
  },
  {
    id: "ziswaf",
    code: "SRV-05",
    title: "ZISWAF Digital",
    category: "Layanan Tambahan",
    description:
      "Orang-orang yang menginfakkan hartanya malam dan siang hari secara sembunyi-sembunyi maupun terang-terangan, mereka mendapat pahala di sisi Tuhannya." +
      " QS. Al-Baqarah ayat 274",
    icon: <FiHeart className="text-2xl" />,
    path: "/digital-data/ziswaf",
    tags: ["Sodakoh"],
    status: "Active",
    gradient: "from-emerald-600 to-teal-500",
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
  const [selectedCategory, setSelectedCategory] =
    useState<string>("Semua Layanan");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [latency, setLatency] = useState(12);
  const [uptimeStr, setUptimeStr] = useState("99.98%");
  const [activeNode, setActiveNode] = useState("DC-JKT-01");
  const [activeConnections, setActiveConnections] = useState(1243);

  useEffect(() => {
    const t = setInterval(() => {
      setLatency(Math.floor(Math.random() * (25 - 12 + 1)) + 12);
      setActiveConnections(
        Math.floor(Math.random() * (1350 - 1150 + 1)) + 1150,
      );

      const flip = Math.random();
      if (flip > 0.95) setActiveNode("DC-BDG-01");
      else if (flip > 0.9) setActiveNode("DC-SBY-02");
      else setActiveNode("DC-JKT-01");

      const uptimeFlip = Math.random();
      if (uptimeFlip > 0.8) setUptimeStr("99.99%");
      else setUptimeStr("99.98%");
    }, 2000);
    return () => clearInterval(t);
  }, []);

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
      } else if (
        e.key === "Escape" &&
        document.activeElement === searchInputRef.current
      ) {
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
        selectedCategory === "Semua Layanan" ||
        menu.category === selectedCategory;
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
    <div className="relative min-h-screen overflow-hidden pb-16 font-sans text-slate-900 transition-colors duration-200 dark:text-dc-ice">
      {/* Dynamic Data Center Tech Background Mesh */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {/* Soft radial gradients using user requested colors */}
        <div className="absolute -top-40 -left-40 h-125 w-125 rounded-full bg-linear-to-br from-sky-500/20 via-brand-cyan/15 to-transparent blur-3xl dark:from-sky-500/10 dark:via-dc-slate/15" />
        <div className="absolute top-20 -right-25 h-137.5 w-137.5 rounded-full bg-linear-to-bl from-brand-secondary/20 via-brand-cyan/15 to-transparent blur-3xl dark:from-dc-slate/20 dark:via-dc-navy/30" />
        <div className="absolute bottom-10 left-1/3 h-112.5 w-112.5 rounded-full bg-linear-to-tr from-brand-lime/25 via-brand-cyan/10 to-transparent blur-3xl dark:from-brand-cyan/5" />
        {/* Subtle grid pattern overlay */}
        <div className="dc-grid-pattern absolute inset-0 opacity-40 dark:opacity-20" />
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        {/* Hero Section: Scalable Modern Data Center Architecture */}
        <section className="relative overflow-hidden rounded-3xl border-2 border-brand-secondary/40 bg-linear-to-br from-sky-500 via-brand-secondary to-sky-500 p-6 text-white shadow-xl shadow-sky-500/20 transition-all dark:border-dc-slate/70 dark:from-dc-navy dark:via-dc-hero-via dark:to-dc-deep dark:shadow-2xl dark:shadow-dc-shadow/70 sm:p-8 lg:p-10">
          {/* Subtle Decorative Glow Orbs in Hero */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand-cyan/35 blur-2xl dark:bg-brand-cyan/10" />
          <div className="pointer-events-none absolute -bottom-16 left-1/3 h-52 w-52 rounded-full bg-brand-lime/30 blur-2xl dark:bg-dc-slate/30" />

          <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="flex flex-col items-start gap-5">
              {/* Cluster Status Chip with updated colors */}
              <div className="inline-flex items-center gap-2.5 rounded-full border border-white/30 bg-white/20 backdrop-blur-sm px-3.5 py-1.5 text-white shadow-sm dark:border-white/10 dark:bg-black/30">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-75 dark:bg-cyan-400" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400 dark:bg-cyan-500" />
                </span>
                <span className="text-[11px] font-extrabold tracking-widest uppercase text-white">
                  SIPANDA CLUSTER v2.4 • HIGH AVAILABILITY HUB
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Pusat Data & Layanan Digital Terpadu
              </h1>

              {/* Subtitle */}
              <p className="max-w-2xl text-sm leading-relaxed text-white/90 sm:text-base lg:text-lg">
                Sistem informasi terintegrasi generasi modern untuk pengelolaan
                sensus, CAI, presensi, pengaduan, dan hierarki wilayah dalam
                satu ekosistem cloud yang cepat, aman, dan scalable.
              </p>

              {/* Telemetry quick badges */}
              <div className="flex flex-wrap items-center gap-2 pt-2 text-xs font-semibold text-white">
                <div className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-black/25 px-3 py-1.5 backdrop-blur-xs dark:bg-white/10 transition-all duration-300">
                  <FiServer className="text-cyan-300 dark:text-cyan-400" />
                  <span>Node: {activeNode}</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-black/25 px-3 py-1.5 backdrop-blur-xs dark:bg-white/10 transition-all duration-300">
                  <FiZap className="text-cyan-300 dark:text-cyan-400" />
                  <span>Latency: {latency}ms</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-black/25 px-3 py-1.5 backdrop-blur-xs dark:bg-white/10 transition-all duration-300">
                  <FiShield className="text-cyan-300 dark:text-cyan-400" />
                  <span>Conn: {activeConnections.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-black/25 px-3 py-1.5 backdrop-blur-xs dark:bg-white/10 transition-all duration-300">
                  <FiActivity className="text-cyan-300 dark:text-cyan-400" />
                  <span>Uptime: {uptimeStr}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* MAIN MENU HUB - The Core Centerpiece of the Application */}
        <section id="main-menu-hub" className="space-y-6">
          {/* Section Header with Search and Interactive Filter Bar */}
          <div className="flex flex-col gap-5 rounded-3xl border-2 border-dc-border bg-white p-5 shadow-sm transition-colors dark:border-dc-slate/60 dark:bg-dc-navy sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-sky-500 text-xs font-bold text-white shadow-xs dark:bg-brand-cyan dark:text-dc-deep">
                    <FiLayers className="text-sm" />
                  </span>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-dc-ice sm:text-2xl">
                    Katalog Menu Layanan Utama
                  </h2>
                </div>
                <p className="mt-1 text-xs font-medium text-slate-600 dark:text-dc-muted sm:text-sm">
                  Pilih salah satu modul layanan data center di bawah ini untuk
                  memulai operasi
                </p>
              </div>

              {/* View Mode Toggle Button */}
              <div className="flex items-center gap-1 self-start rounded-xl border border-dc-border bg-dc-bg p-1 dark:border-dc-slate dark:bg-dc-deep sm:self-auto">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    viewMode === "grid"
                      ? "bg-sky-500 text-white shadow-xs dark:bg-brand-secondary"
                      : "text-slate-600 hover:text-slate-900 dark:text-dc-muted dark:hover:text-dc-ice"
                  }`}
                  aria-label="Tampilan Grid Card"
                >
                  <FiGrid className="text-sm" />
                  <span className="hidden sm:inline">Grid</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    viewMode === "list"
                      ? "bg-sky-500 text-white shadow-xs dark:bg-brand-secondary"
                      : "text-slate-600 hover:text-slate-900 dark:text-dc-muted dark:hover:text-dc-ice"
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
                className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-sky-500 dark:text-brand-cyan"
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
                className="w-full rounded-2xl border-2 border-dc-border bg-dc-surface py-3.5 pl-11 pr-24 text-sm font-semibold text-slate-900 shadow-2xs outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/15 dark:border-dc-slate dark:bg-dc-deep dark:text-dc-ice dark:placeholder:text-dc-muted/70 dark:focus:border-brand-cyan dark:focus:ring-brand-cyan/20"
              />

              <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
                {search ? (
                  <button
                    type="button"
                    onClick={resetSearch}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-slate-700 transition hover:bg-slate-300 dark:bg-dc-navy dark:text-dc-muted dark:hover:bg-dc-slate"
                    title="Hapus pencarian (Esc)"
                  >
                    <FiX className="text-sm" />
                  </button>
                ) : (
                  <kbd className="hidden rounded-md border border-dc-border bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:border-dc-slate dark:bg-dc-navy dark:text-dc-muted md:inline-block">
                    /
                  </kbd>
                )}
              </div>
            </div>

            {/* Interactive Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="shrink-0 font-bold text-slate-700 dark:text-dc-muted">
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
                    className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-1.5 font-bold transition-all ${
                      isSelected
                        ? "bg-sky-500 text-white shadow-md shadow-sky-500/25 dark:bg-brand-secondary"
                        : "border border-dc-border bg-white text-slate-700 shadow-2xs hover:border-sky-500 hover:bg-dc-hover dark:border-dc-slate dark:bg-dc-deep dark:text-dc-muted dark:hover:border-brand-cyan dark:hover:text-dc-ice"
                    }`}
                  >
                    <span>{cat}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                        isSelected
                          ? "bg-brand-lime text-slate-900"
                          : "bg-dc-bg text-slate-700 dark:bg-dc-navy dark:text-dc-ice"
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
                  className="group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-3xl border-2 border-dc-border bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-sky-500 hover:shadow-xl hover:shadow-sky-500/15 dark:border-dc-slate dark:bg-dc-navy dark:hover:border-brand-cyan dark:hover:shadow-2xl dark:hover:shadow-dc-shadow/80"
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
                    className={`absolute top-0 left-0 right-0 h-2 bg-linear-to-r ${menu.gradient}`}
                  />

                  {/* Card Content Top Section */}
                  <div>
                    {/* Header Row: Service Code & Status Indicator */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md border border-dc-border bg-dc-bg px-2.5 py-0.5 text-[11px] font-extrabold tracking-wider text-sky-500 dark:border-dc-slate dark:bg-dc-deep dark:text-brand-cyan">
                          {menu.code}
                        </span>
                        <span className="text-[11px] font-bold text-slate-600 dark:text-dc-muted">
                          {menu.category}
                        </span>
                      </div>

                      {/* Live status pill */}
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-dc-border bg-brand-lime/90 px-2.5 py-0.5 text-[10px] font-extrabold text-slate-900 shadow-2xs dark:border-dc-slate dark:bg-emerald-500/15 dark:text-emerald-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-sky-500 dark:bg-emerald-400" />
                        {menu.status}
                      </span>
                    </div>

                    {/* Icon & Title */}
                    <div className="mt-5 flex items-center gap-3.5">
                      <div
                        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br ${menu.gradient} text-white shadow-md shadow-sky-500/25 transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-sky-500/40`}
                      >
                        {menu.icon}
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-extrabold tracking-tight text-slate-900 transition-colors group-hover:text-sky-500 dark:text-dc-ice dark:group-hover:text-brand-cyan">
                          {menu.title}
                        </h3>
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-dc-muted">
                          Modul Terpusat
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="mt-4 line-clamp-3 text-xs font-medium leading-relaxed text-slate-600 dark:text-dc-muted sm:text-sm">
                      {menu.description}
                    </p>

                    {/* Module Feature Tags */}
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {menu.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-lg border border-dc-border bg-dc-bg px-2.5 py-1 text-[11px] font-bold text-sky-700 transition group-hover:border-sky-500/40 group-hover:bg-dc-hover-strong dark:border-dc-slate dark:bg-dc-deep dark:text-brand-cyan"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="mt-6 flex items-center justify-between border-t border-dc-border/70 pt-4 dark:border-dc-slate/60">
                    <span className="text-xs font-bold text-sky-500 transition group-hover:text-sky-700 dark:text-brand-cyan dark:group-hover:text-white">
                      Buka Modul Layanan
                    </span>

                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-dc-bg text-sky-500 transition-all duration-300 group-hover:translate-x-1 group-hover:bg-sky-500 group-hover:text-white dark:bg-dc-deep dark:text-dc-ice dark:group-hover:bg-brand-cyan dark:group-hover:text-dc-deep">
                      <FiChevronRight className="text-base" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* COMPACT LIST VIEW */
            <div className="divide-y-2 divide-dc-border overflow-hidden rounded-3xl border-2 border-dc-border bg-white shadow-sm dark:divide-dc-slate/60 dark:border-dc-slate dark:bg-dc-navy">
              {filteredMenus.map((menu) => (
                <div
                  key={menu.id}
                  onClick={() => handleCardActivate(menu.path)}
                  className="group flex cursor-pointer items-center justify-between gap-4 p-5 transition hover:bg-dc-bg dark:hover:bg-dc-list-hover/70"
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
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br ${menu.gradient} text-white shadow-sm transition group-hover:scale-105`}
                    >
                      {menu.icon}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-sky-500 dark:text-dc-ice dark:group-hover:text-brand-cyan">
                          {menu.title}
                        </h3>
                        <span className="rounded-md border border-dc-border bg-dc-bg px-2 py-0.5 text-[10px] font-bold text-sky-500 dark:border-dc-slate dark:bg-dc-deep dark:text-dc-muted">
                          {menu.code}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-xs font-medium text-slate-600 dark:text-dc-muted">
                        {menu.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <span className="hidden text-xs font-bold text-sky-500 group-hover:underline dark:text-brand-cyan sm:inline">
                      Buka Modul
                    </span>
                    <FiChevronRight className="text-lg text-slate-500 transition group-hover:translate-x-1 group-hover:text-sky-500 dark:text-dc-muted dark:group-hover:text-brand-cyan" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State when search returns no match */}
          {filteredMenus.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-dc-border bg-white p-12 text-center dark:border-dc-slate dark:bg-dc-navy">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-dc-bg text-sky-500 dark:bg-dc-deep dark:text-brand-cyan">
                <FiSearch className="text-3xl" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-dc-ice">
                Layanan tidak ditemukan
              </h3>
              <p className="mt-1 max-w-sm text-xs font-medium text-slate-600 dark:text-dc-muted">
                Tidak ada modul yang cocok dengan kata kunci &quot;{debounced}
                &quot;. Coba cari dengan kata kunci lain.
              </p>
              <button
                type="button"
                onClick={resetSearch}
                className="mt-4 rounded-xl bg-sky-500 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-sky-700 dark:bg-brand-secondary"
              >
                Reset Pencarian
              </button>
            </div>
          )}
        </section>

        {/* Scalable Data Center Architecture & Feature Highlights */}
        <section className="space-y-4 pt-4">
          <div className="text-center sm:text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-500 dark:text-brand-cyan">
              INFRASTRUCTURE CAPABILITY
            </span>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900 dark:text-dc-ice sm:text-2xl">
              Arsitektur Data Modern & Skalabilitas Tinggi
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {/* Feature 1 */}
            <div className="rounded-3xl border-2 border-dc-border bg-white p-5 shadow-xs transition hover:border-sky-500 hover:shadow-md dark:border-dc-slate dark:bg-dc-navy">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-dc-hover text-sky-500 shadow-xs dark:bg-dc-deep dark:text-brand-cyan">
                <FiDatabase className="text-lg" />
              </div>
              <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-dc-ice">
                Sinkronisasi Terpusat Real-Time
              </h3>
              <p className="mt-1.5 text-xs font-medium leading-relaxed text-slate-600 dark:text-dc-muted">
                Mekanisme penyimpanan data yang terpusat memastikan setiap entri
                sensus, CAI, dan presensi terverifikasi dengan integritas
                tinggi.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-3xl border-2 border-dc-border bg-white p-5 shadow-xs transition hover:border-sky-500 hover:shadow-md dark:border-dc-slate dark:bg-dc-navy">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-dc-hover text-sky-500 shadow-xs dark:bg-dc-deep dark:text-brand-cyan">
                <FiCpu className="text-lg" />
              </div>
              <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-dc-ice">
                Struktur Wilayah Bertingkat
              </h3>
              <p className="mt-1.5 text-xs font-medium leading-relaxed text-slate-600 dark:text-dc-muted">
                Hierarki spasial Daerah, Desa, dan Kelompok dipetakan dengan
                rapi untuk menjamin ketepatan pelaporan data generus.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-3xl border-2 border-dc-border bg-white p-5 shadow-xs transition hover:border-sky-500 hover:shadow-md dark:border-dc-slate dark:bg-dc-navy">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-dc-hover text-sky-500 shadow-xs dark:bg-dc-deep dark:text-brand-cyan">
                <FiShield className="text-lg" />
              </div>
              <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-dc-ice">
                Validasi & Keamanan Berlapis
              </h3>
              <p className="mt-1.5 text-xs font-medium leading-relaxed text-slate-600 dark:text-dc-muted">
                Dilengkapi dengan validasi kode UUID unik, sistem pelacakan
                tiket pengaduan, dan enkripsi transmisi data standar data
                center.
              </p>
            </div>
          </div>
        </section>

        {/* Back to Top Smooth Scroll Action */}
        <div className="flex justify-center pt-4">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="inline-flex items-center gap-2 rounded-full border-2 border-dc-border bg-white px-5 py-2.5 text-xs font-extrabold text-sky-500 shadow-xs transition hover:-translate-y-0.5 hover:border-sky-500 hover:bg-dc-bg hover:shadow-md dark:border-dc-slate dark:bg-dc-navy dark:text-brand-cyan dark:hover:border-brand-cyan"
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
