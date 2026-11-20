import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiHeart,
  FiLogOut,
  FiRefreshCw,
  FiShield,
  FiX,
  FiGift,
  FiArrowRight,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import {
  createDonation,
  fetchDonation,
  getRetryAfterSeconds,
  getZiswafErrorMessage,
  getZiswafStatusCode,
  type Donation,
  type DonationStatus,
  type DonationType,
} from "../../../services/ziswaf";

const donationTypes: Array<{
  value: DonationType;
  title: string;
  description: string;
}> = [
  {
    value: "sodakoh",
    title: "sodakoh",
    description: "Raih pahala melalui sodakoh online",
  },
];

const donationPresets = [
  1_000, 5_000, 10_000, 20_000, 50_000, 100_000, 200_000, 300_000, 500_000,
];

const formatRupiah = (value: number | undefined) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value ?? 0);

const statusClass: Record<DonationStatus, string> = {
  processing:
    "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-400/10 dark:text-blue-300 dark:ring-blue-400/20",
  pending:
    "bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20",
  success:
    "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20",
  expired:
    "bg-slate-100 text-slate-700 ring-slate-500/20 dark:bg-slate-700 dark:text-slate-300 dark:ring-slate-500/30",
  failed:
    "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-400/10 dark:text-rose-300 dark:ring-rose-400/20",
};

const statusLabel: Record<DonationStatus, string> = {
  processing: "Diproses",
  pending: "Menunggu pembayaran",
  success: "Berhasil",
  expired: "Kedaluwarsa",
  failed: "Gagal",
};

const StatusBadge = ({ status }: { status: DonationStatus }) => (
  <span
    className={`relative inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${statusClass[status]}`}
  >
    {status === "pending" && (
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
    )}
    {status === "success" && <FiCheckCircle className="h-3 w-3" />}
    {status === "processing" && (
      <FiRefreshCw className="h-3 w-3 animate-spin" />
    )}
    {statusLabel[status]}
  </span>
);

const PaymentStatusAnimation = ({ status }: { status: DonationStatus }) => {
  if (status === "success") {
    return (
      <div className="relative flex h-28 items-center justify-center overflow-hidden rounded-2xl border border-emerald-200 bg-linear-to-br from-emerald-50 via-white to-teal-50 dark:border-emerald-800/60 dark:from-emerald-950/50 dark:via-slate-900 dark:to-teal-950/30">
        <span className="absolute h-24 w-24 animate-ping rounded-full border border-emerald-300/50" />
        <span className="absolute h-20 w-20 animate-pulse rounded-full bg-emerald-200/40 dark:bg-emerald-400/10" />
        <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
          <FiCheckCircle className="h-7 w-7" />
        </span>
        <div className="absolute inset-x-0 bottom-2 text-center">
          <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-300">
            PEMBAYARAN BERHASIL
          </span>
        </div>
      </div>
    );
  }

  if (status === "failed" || status === "expired") {
    const isExpired = status === "expired";
    return (
      <div className={`relative flex h-28 items-center justify-center overflow-hidden rounded-2xl border ${
        isExpired
          ? "border-slate-200 bg-linear-to-br from-slate-50 via-white to-slate-100 dark:border-slate-700 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800"
          : "border-rose-200 bg-linear-to-br from-rose-50 via-white to-orange-50 dark:border-rose-900/60 dark:from-rose-950/40 dark:via-slate-900 dark:to-orange-950/20"
      }`}>
        <span className={`absolute h-20 w-20 animate-pulse rounded-full ${
          isExpired ? "bg-slate-200/70 dark:bg-slate-700/40" : "bg-rose-200/60 dark:bg-rose-500/10"
        }`} />
        <span className={`relative flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg ${
          isExpired
            ? "bg-slate-500 shadow-slate-500/20"
            : "bg-rose-500 shadow-rose-500/25"
        }`}>
          {isExpired ? (
            <FiClock className="h-7 w-7" />
          ) : (
            <FiX className="h-7 w-7" />
          )}
        </span>
        <div className="absolute inset-x-0 bottom-2 text-center">
          <span className={`text-xs font-extrabold ${
            isExpired
              ? "text-slate-600 dark:text-slate-300"
              : "text-rose-700 dark:text-rose-300"
          }`}>
            {isExpired ? "TRANSAKSI KEDALUWARSA" : "PEMBAYARAN GAGAL"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-28 items-center justify-center overflow-hidden rounded-2xl border border-amber-200 bg-linear-to-br from-amber-50 via-white to-orange-50 dark:border-amber-900/60 dark:from-amber-950/30 dark:via-slate-900 dark:to-orange-950/20">
      <span className="absolute h-20 w-20 animate-pulse rounded-full bg-amber-200/60 dark:bg-amber-500/10" />
      <span className="absolute h-14 w-14 rounded-full border-4 border-transparent border-t-amber-500 border-r-amber-300 animate-spin" />
      <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white text-amber-600 shadow-md dark:bg-slate-900 dark:text-amber-300">
        <FiClock className="h-4 w-4" />
      </span>
      <div className="absolute inset-x-0 bottom-2 text-center">
        <span className="text-xs font-extrabold text-amber-700 dark:text-amber-300">
          {status === "processing" ? "MEMPROSES PEMBAYARAN" : "MENUNGGU PEMBAYARAN"}
        </span>
      </div>
    </div>
  );
};

const Panel = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => (
  <section
    className={`rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 ${className}`}
  >
    {children}
  </section>
);

const ZiswafPage = () => {
  const {
    user,
    status: sessionStatus,
    error: sessionError,
    isAuthenticated,
    startSession,
    refreshSession,
    logout,
  } = useAuth();
  const didStartSession = useRef(false);
  const [donationType, setDonationType] = useState<DonationType>("sodakoh");
  const [amount, setAmount] = useState("10000");
  const [donationError, setDonationError] = useState("");
  const [isCreatingDonation, setIsCreatingDonation] = useState(false);
  const [requestAttempt, setRequestAttempt] = useState<{
    id: string;
    type: DonationType;
    amount: number;
  } | null>(null);
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(
    null,
  );
  const [lastStatusCheck, setLastStatusCheck] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [statusCheckError, setStatusCheckError] = useState("");
  const [logoutError, setLogoutError] = useState("");

  useEffect(() => {
    if (didStartSession.current) return;
    didStartSession.current = true;
    void startSession().catch(() => undefined);
  }, [startSession]);

  useEffect(() => {
    if (!selectedDonation || selectedDonation.status !== "pending") return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [selectedDonation]);

  useEffect(() => {
    if (!selectedDonation) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedDonation(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedDonation]);

  const nextStatusCheck = lastStatusCheck + 20_000;
  const secondsUntilStatusCheck = Math.max(
    0,
    Math.ceil((nextStatusCheck - now) / 1000),
  );
  const canCheckStatus =
    selectedDonation?.status === "pending" && secondsUntilStatusCheck === 0;

  const handleCreateDonation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAuthenticated) return;

    const numericAmount = Number(amount);
    if (
      !Number.isInteger(numericAmount) ||
      numericAmount < 1000 ||
      numericAmount > 5_000_000
    ) {
      setDonationError(
        "Masukkan nominal bulat antara Rp1.000 dan Rp5.000.000.",
      );
      return;
    }

    if (!globalThis.crypto?.randomUUID) {
      setDonationError(
        "Browser ini tidak mendukung pembuatan ID transaksi yang aman.",
      );
      return;
    }

    setDonationError("");
    setIsCreatingDonation(true);
    const attempt =
      requestAttempt?.type === donationType &&
      requestAttempt.amount === numericAmount
        ? requestAttempt
        : {
            id: crypto.randomUUID(),
            type: donationType,
            amount: numericAmount,
          };
    setRequestAttempt(attempt);

    try {
      const response = await createDonation({
        request_id: attempt.id,
        donation_type: attempt.type,
        amount: attempt.amount,
      });
      if (!response.success || !response.data) {
        throw new Error(response.message || "QRIS donasi gagal dibuat.");
      }
      setSelectedDonation(response.data);
      setRequestAttempt(null);
      setDonationType("sodakoh");
      setAmount("10000");
    } catch (error) {
      const status = getZiswafStatusCode(error);
      if (status === 401) {
        setDonationError(
          "Sesi tidak valid. Pembayaran tidak diulang otomatis. Mulai sesi baru, lalu pastikan status percobaan ini sebelum memulai pembayaran baru.",
        );
      } else if (status === 409) {
        setDonationError(
          "ID percobaan pembayaran bentrok dengan sesi lain. Pastikan transaksi sebelumnya tidak sedang dibuat sebelum mencoba pembayaran baru.",
        );
      } else if (status === 422) {
        setDonationError(getZiswafErrorMessage(error));
      } else if (status === 502 || status === 503) {
        setDonationError(
          `Layanan pembayaran sedang bermasalah. Jika hasil transaksi belum diketahui, coba kembali dengan nominal dan jenis yang sama agar ID percobaan tetap digunakan. ${getZiswafErrorMessage(error)}`,
        );
      } else {
        setDonationError(getZiswafErrorMessage(error));
      }
    } finally {
      setIsCreatingDonation(false);
    }
  };

  const handleRefreshStatus = async (donation: Donation) => {
    if (!canCheckStatus) return;
    setStatusCheckError("");
    try {
      const updated = await fetchDonation(donation.uuid, refreshSession);
      setLastStatusCheck(Date.now());
      setSelectedDonation(updated);
    } catch (error) {
      const retryAfter = getRetryAfterSeconds(error);
      if (retryAfter) {
        setLastStatusCheck(Date.now() + (retryAfter - 20) * 1000);
      }
      setStatusCheckError(
        retryAfter
          ? `Pengecekan terlalu cepat. Coba lagi dalam ${retryAfter} detik.`
          : getZiswafErrorMessage(error),
      );
    }
  };

  const handleLogout = async () => {
    setLogoutError("");
    try {
      await logout();
      setSelectedDonation(null);
      setRequestAttempt(null);
    } catch (error) {
      setLogoutError(getZiswafErrorMessage(error));
    }
  };

  const sessionIsLoading =
    sessionStatus === "idle" || sessionStatus === "loading";

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-8">
      <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-emerald-700 via-teal-700 to-cyan-800 p-5 text-white shadow-xl shadow-emerald-950/10 sm:p-8 lg:p-10">
        <div className="pointer-events-none absolute -right-14 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="absolute right-0 top-0 h-full w-2/5 bg-linear-to-l from-white/5 to-transparent" />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_260px] lg:items-end">
          <div className="max-w-2xl">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-sm transition hover:-translate-x-0.5 hover:bg-white/20"
            >
              <FiArrowLeft />
              Menu utama
            </Link>
            <p className="mt-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-100">
              <FiHeart />
              SIPANDA · Layanan sosial
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
              ZISWAF Digital
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-emerald-50 sm:text-base">
              Orang-orang yang menginfakkan hartanya malam dan siang hari secara
              sembunyi-sembunyi maupun terang-terangan, mereka mendapat pahala
              di sisi Tuhannya." QS. Al-Baqarah ayat 274
            </p>
          </div>
          <div className="hidden rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md lg:block">
            <div className="flex items-center justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-emerald-100">
                <FiGift className="h-5 w-5" />
              </span>
              <span className="rounded-full bg-emerald-300/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-100">
                QRIS Aktif
              </span>
            </div>
            <p className="mt-4 text-lg font-extrabold">Berbagi Lebih Mudah</p>
            <p className="mt-1 text-xs leading-relaxed text-emerald-50/85">
              Pilih nominal, pindai QRIS, dan salurkan kebaikan dalam hitungan
              menit.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full space-y-4">
        <div hidden>
          <Panel className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <span
                className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition ${
                  isAuthenticated
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"
                    : sessionStatus === "error"
                      ? "bg-rose-50 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {isAuthenticated && (
                  <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 shadow-sm dark:border-slate-900" />
                )}
                {sessionIsLoading ? (
                  <FiRefreshCw className="animate-spin" />
                ) : isAuthenticated ? (
                  <FiCheckCircle />
                ) : (
                  <FiAlertCircle />
                )}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                  {sessionIsLoading
                    ? "Menghubungkan sesi pembayaran…"
                    : isAuthenticated
                      ? `Halo, ${user?.nama_lengkap || "Donatur"}`
                      : "Sesi pembayaran belum tersedia"}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {sessionIsLoading
                    ? "Backend sedang menyiapkan sesi aman."
                    : isAuthenticated
                      ? `Sesi aman aktif${user?.nm_role ? ` · ${user.nm_role}` : ""}. Siap menerima donasi.`
                      : "Pastikan endpoint sesi ZISWAF di backend sudah aktif."}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {!isAuthenticated && sessionStatus === "error" && (
                <button
                  type="button"
                  onClick={() => void startSession().catch(() => undefined)}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-3 text-xs font-bold text-white hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                >
                  <FiRefreshCw />
                  Coba lagi
                </button>
              )}
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <FiLogOut />
                  Akhiri sesi
                </button>
              )}
            </div>
          </Panel>
        </div>

        {(sessionError || logoutError) && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-200"
          >
            <FiAlertCircle className="mt-0.5 shrink-0" />
            {logoutError || sessionError}
          </p>
        )}

        <Panel className="overflow-hidden">
          <div className="border-b border-slate-200 p-5 dark:border-slate-700 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
                <FiHeart className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-extrabold text-slate-900 dark:text-white">
                  Buat donasi
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pilih kategori dan nominal kontribusi
                </p>
              </div>
            </div>
          </div>
          <form
            onSubmit={handleCreateDonation}
            className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_300px]"
          >
            <div className="space-y-5">
              <fieldset>
                <legend className="mb-3 text-sm font-extrabold text-slate-800 dark:text-slate-100">
                  1. Pilih Kategori
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  {donationTypes.map((item) => {
                    const isSelected = donationType === item.value;
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setDonationType(item.value)}
                        aria-pressed={isSelected}
                        className={`group min-h-19 rounded-2xl border p-3 text-left transition-all ${
                          isSelected
                            ? "border-emerald-500 bg-linear-to-br from-emerald-50 to-teal-50 shadow-md shadow-emerald-500/10 ring-2 ring-emerald-500/10 dark:border-emerald-500 dark:from-emerald-400/10 dark:to-teal-400/5"
                            : "border-slate-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-sm dark:border-slate-700 dark:hover:border-emerald-700"
                        }`}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-sm font-extrabold capitalize text-slate-900 dark:text-white">
                            {item.title}
                          </span>
                          {isSelected && (
                            <FiCheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                          )}
                        </span>
                        <span className="mt-1 block text-[11px] leading-snug text-slate-500 dark:text-slate-400">
                          {item.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset className="space-y-3">
                <legend className="mb-1 text-sm font-extrabold text-slate-800 dark:text-slate-100">
                  2. Pilih Nominal
                </legend>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {donationPresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(String(preset))}
                      aria-pressed={Number(amount) === preset}
                      className={`min-h-11 rounded-xl border px-2 text-xs font-bold transition-all ${
                        Number(amount) === preset
                          ? "-translate-y-px border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                          : "border-slate-200 text-slate-700 hover:-translate-y-px hover:border-emerald-300 hover:bg-emerald-50/60 dark:border-slate-700 dark:text-slate-200 dark:hover:border-emerald-700 dark:hover:bg-emerald-400/5"
                      }`}
                    >
                      {formatRupiah(preset)}
                    </button>
                  ))}
                </div>

                <label className="block space-y-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-800/40">
                  <span className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <span>Geser untuk mengubah nominal</span>
                    <output className="font-extrabold text-emerald-700 dark:text-emerald-300">
                      {formatRupiah(Number(amount))}
                    </output>
                  </span>
                  <input
                    type="range"
                    min={1000}
                    max={500000}
                    step={1000}
                    value={Math.min(
                      500000,
                      Math.max(1000, Number(amount) || 1000),
                    )}
                    onChange={(event) => setAmount(event.target.value)}
                    aria-label="Atur nominal donasi dalam kelipatan seribu rupiah"
                    className="h-2 w-full cursor-pointer accent-emerald-600"
                  />
                  <span className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
                    <span>Rp1.000</span>
                    <span>Kelipatan Rp1.000</span>
                    <span>Rp500.000</span>
                  </span>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Atau masukkan nominal sendiri
                  </span>
                  <span className="flex min-h-12 items-center overflow-hidden rounded-xl border border-slate-300 transition focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 dark:border-slate-700">
                    <span className="border-r border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      Rp
                    </span>
                    <input
                      required
                      type="number"
                      min={1000}
                      max={5_000_000}
                      step={1}
                      inputMode="numeric"
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                      onBlur={() => {
                        if (amount && Number(amount) < 1000) setAmount("1000");
                      }}
                      className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm font-extrabold text-slate-900 outline-none dark:text-white"
                      aria-label="Nominal donasi khusus dalam rupiah"
                    />
                  </span>
                </label>
              </fieldset>
            </div>

            <aside className="flex flex-col rounded-2xl border border-emerald-100 bg-linear-to-b from-emerald-50/90 to-white p-4 dark:border-emerald-900/50 dark:from-emerald-950/30 dark:to-slate-900 lg:sticky lg:top-24 lg:self-start">
              <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                Ringkasan donasi
              </p>
              <div className="mt-4 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white">
                  <FiHeart />
                </span>
                <div>
                  <p className="text-sm font-extrabold capitalize text-slate-900 dark:text-white">
                    {donationType}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Pembayaran via QRIS
                  </p>
                </div>
              </div>
              <div className="my-4 h-px bg-emerald-100 dark:bg-emerald-900/50" />
              <div className="flex items-end justify-between gap-3">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Nominal dasar
                </span>
                <strong className="text-xl font-extrabold text-emerald-800 dark:text-emerald-200">
                  {formatRupiah(Number(amount))}
                </strong>
              </div>
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-white/70 p-3 text-[11px] leading-relaxed text-slate-600 dark:bg-slate-800/70 dark:text-slate-300">
                <FiShield className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                Nominal final dapat dipengaruhi kode unik atau konfigurasi
                gateway.
              </div>

              {donationError && (
                <p
                  role="alert"
                  className="mt-3 flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-400/10 dark:text-rose-300"
                >
                  <FiAlertCircle className="mt-0.5 shrink-0" />
                  {donationError}
                </p>
              )}
              <button
                type="submit"
                disabled={!isAuthenticated || isCreatingDonation}
                className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white shadow-lg shadow-emerald-700/15 transition hover:-translate-y-px hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-500"
              >
                {isCreatingDonation ? (
                  <FiRefreshCw className="animate-spin" />
                ) : (
                  <FiCreditCard />
                )}
                {isCreatingDonation
                  ? "Menyiapkan QRIS..."
                  : sessionIsLoading
                    ? "Menyiapkan sesi..."
                    : isAuthenticated
                      ? "Lanjutkan Pembayaran"
                      : "Pembayaran Belum Tersedia"}
                {isAuthenticated && !isCreatingDonation && (
                  <FiArrowRight className="h-4 w-4" />
                )}
              </button>
            </aside>
          </form>
        </Panel>
      </div>

      {selectedDonation && (
        <div
          className="fixed inset-0 z-60 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedDonation(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="donation-details-title"
            className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:rounded-2xl"
          >
            <div className="relative overflow-hidden flex items-start justify-between gap-3 border-b border-emerald-100 bg-linear-to-r from-emerald-50 via-teal-50/70 to-cyan-50/60 p-4 dark:border-emerald-900/50 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-cyan-950/20 sm:p-5">
              <div className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-emerald-300/20 blur-xl" />
              <div>
                <p className="relative text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  Transaksi donasi
                </p>
                <p
                  id="donation-details-title"
                  className="relative mt-1 text-sm font-extrabold capitalize text-slate-900 dark:text-white"
                >
                  {selectedDonation.donation_type}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedDonation.status} />
                <button
                  type="button"
                  onClick={() => setSelectedDonation(null)}
                  aria-label="Tutup detail transaksi"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  <FiX />
                </button>
              </div>
            </div>
            <div className="space-y-4 p-4 sm:p-5">
              <PaymentStatusAnimation status={selectedDonation.status} />

              {(selectedDonation.status === "pending" ||
                selectedDonation.status === "processing") &&
              (selectedDonation.qris_image || selectedDonation.qr_url) ? (
                <div className="relative flex flex-col items-center gap-4 overflow-hidden rounded-2xl border border-slate-200 bg-linear-to-b from-slate-50 to-white p-5 dark:border-slate-700 dark:from-slate-800 dark:to-slate-900">
                  <div className="absolute left-1/2 top-24 h-44 w-44 -translate-x-1/2 rounded-full bg-emerald-300/15 blur-2xl" />
                  <div className="relative rounded-2xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-900/10 dark:border-slate-600">
                    {selectedDonation.status === "pending" && (
                      <span className="absolute -right-2 -top-2 flex h-5 w-5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                        <span className="relative inline-flex h-5 w-5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
                      </span>
                    )}
                    <img
                      src={
                        selectedDonation.qris_image ??
                        selectedDonation.qr_url ??
                        undefined
                      }
                      alt="QRIS pembayaran donasi"
                      className="aspect-square w-52 max-w-full rounded-lg object-contain"
                    />
                  </div>
                  <p className="relative text-center text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Pindai QRIS menggunakan aplikasi pembayaran pilihan Anda
                  </p>
                </div>
              ) : (selectedDonation.status === "pending" ||
                selectedDonation.status === "processing") ? (
                <div className="flex items-start gap-3 rounded-xl bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-400/10 dark:text-blue-200">
                  <FiClock className="mt-0.5 shrink-0" />
                  Transaksi sedang diproses. QRIS akan tampil setelah informasi
                  pembayaran tersedia.
                </div>
              ) : null}
              <dl className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                  <dt className="text-[11px] text-slate-500 dark:text-slate-400">
                    Nominal dasar donasi
                  </dt>
                  <dd className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                    {formatRupiah(selectedDonation.amount)}
                  </dd>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                  <dt className="text-[11px] text-slate-500 dark:text-slate-400">
                    Biaya layanan organisasi
                  </dt>
                  <dd className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                    {selectedDonation.admin_fee === undefined
                      ? "Menunggu gateway"
                      : formatRupiah(selectedDonation.admin_fee)}
                  </dd>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                  <dt className="text-[11px] text-slate-500 dark:text-slate-400">
                    Kode unik tagihan
                  </dt>
                  <dd className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                    {selectedDonation.amount_uniq === undefined
                      ? "Menunggu gateway"
                      : formatRupiah(selectedDonation.amount_uniq)}
                  </dd>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                  <dt className="text-[11px] text-slate-500 dark:text-slate-400">
                    Kredit saldo organisasi
                  </dt>
                  <dd className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                    {selectedDonation.credit_amount === undefined
                      ? "Menunggu gateway"
                      : formatRupiah(selectedDonation.credit_amount)}
                  </dd>
                </div>
                <div className="col-span-2 rounded-xl bg-emerald-50 p-3 dark:bg-emerald-400/10">
                  <dt className="text-[11px] text-emerald-800 dark:text-emerald-300">
                    Total yang harus dibayar
                  </dt>
                  <dd className="mt-1 text-lg font-extrabold text-emerald-900 dark:text-emerald-200">
                    {selectedDonation.total_amount === undefined
                      ? "Menunggu gateway"
                      : formatRupiah(selectedDonation.total_amount)}
                  </dd>
                </div>
              </dl>
              <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Biaya layanan dipotong dari saldo organisasi, sedangkan kode
                unik ditambahkan ke tagihan donatur. Jangan anggap pembayaran
                berhasil hanya karena QRIS berhasil dibuat.
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedDonation.payment_url && (
                  <a
                    href={selectedDonation.payment_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-10 items-center justify-center rounded-lg bg-emerald-700 px-4 text-xs font-bold text-white hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                  >
                    Buka halaman pembayaran
                  </a>
                )}
                {selectedDonation.status === "pending" && (
                  <button
                    type="button"
                    onClick={() => void handleRefreshStatus(selectedDonation)}
                    disabled={!canCheckStatus}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-xs font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"
                  >
                    <FiRefreshCw />
                    {secondsUntilStatusCheck > 0
                      ? `Cek lagi ${secondsUntilStatusCheck} dtk`
                      : "Perbarui status"}
                  </button>
                )}
              </div>
              {statusCheckError && (
                <p
                  role="alert"
                  className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-400/10 dark:text-rose-300"
                >
                  {statusCheckError}
                </p>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default ZiswafPage;
