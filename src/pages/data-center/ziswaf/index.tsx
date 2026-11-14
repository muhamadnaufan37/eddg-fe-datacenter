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
  { value: "zakat", title: "Zakat", description: "Tunaikan kewajiban zakat" },
  { value: "infaq", title: "Infaq", description: "Berbagi untuk kebaikan" },
  { value: "sedekah", title: "Sedekah", description: "Bantu sesama dengan ikhlas" },
  { value: "wakaf", title: "Wakaf", description: "Dukungan manfaat berkelanjutan" },
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
    className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${statusClass[status]}`}
  >
    {statusLabel[status]}
  </span>
);

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
  const [donationType, setDonationType] = useState<DonationType>("infaq");
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
      setDonationError("Masukkan nominal bulat antara Rp1.000 dan Rp5.000.000.");
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
        : { id: crypto.randomUUID(), type: donationType, amount: numericAmount };
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
      setDonationType("infaq");
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

  const sessionIsLoading = sessionStatus === "idle" || sessionStatus === "loading";

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-teal-700 to-cyan-800 p-5 text-white shadow-xl shadow-emerald-950/10 sm:p-8 lg:p-10">
        <div className="pointer-events-none absolute -right-14 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 transition hover:bg-white/15"
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
              Salurkan zakat, infaq, sedekah, dan wakaf secara praktis melalui
              QRIS. Pembayaran diproses dengan sesi aman dari backend.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
              <FiShield className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-xs font-bold text-white">
                Sesi otomatis aman
              </span>
              <span className="mt-1 block max-w-48 text-[11px] leading-relaxed text-emerald-100">
                Kredensial dan JWT tetap berada di server.
              </span>
            </span>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-2xl space-y-4">
        <Panel className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                isAuthenticated
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"
                  : sessionStatus === "error"
                    ? "bg-rose-50 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
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
                    ? user?.nama_lengkap || "Sesi pembayaran aktif"
                    : "Sesi pembayaran belum tersedia"}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {sessionIsLoading
                  ? "Backend sedang menyiapkan sesi aman."
                  : isAuthenticated
                    ? `Sesi aman aktif${user?.nm_role ? ` · ${user.nm_role}` : ""}`
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
            className="space-y-5 p-5 sm:p-6"
          >
            <fieldset>
              <legend className="mb-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
                Jenis donasi
              </legend>
              <div className="grid grid-cols-2 gap-2">
                {donationTypes.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setDonationType(item.value)}
                    aria-pressed={donationType === item.value}
                    className={`min-h-[76px] rounded-xl border p-3 text-left transition ${
                      donationType === item.value
                        ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/10 dark:border-emerald-500 dark:bg-emerald-400/10"
                        : "border-slate-200 hover:border-emerald-300 dark:border-slate-700 dark:hover:border-emerald-700"
                    }`}
                  >
                    <span className="block text-sm font-bold capitalize text-slate-900 dark:text-white">
                      {item.title}
                    </span>
                    <span className="mt-1 block text-[11px] leading-snug text-slate-500 dark:text-slate-400">
                      {item.description}
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Pilih nominal donasi
              </legend>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {donationPresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(String(preset))}
                    aria-pressed={Number(amount) === preset}
                    className={`min-h-11 rounded-xl border px-2 text-xs font-bold transition ${
                      Number(amount) === preset
                        ? "border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-600/10 dark:border-emerald-500 dark:bg-emerald-400/10 dark:text-emerald-200"
                        : "border-slate-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/60 dark:border-slate-700 dark:text-slate-200 dark:hover:border-emerald-700 dark:hover:bg-emerald-400/5"
                    }`}
                  >
                    {formatRupiah(preset)}
                  </button>
                ))}
              </div>
              <label className="block space-y-2">
                <span className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <span>Atur nominal hingga Rp500.000</span>
                  <output className="font-extrabold text-emerald-700 dark:text-emerald-300">
                    {formatRupiah(Number(amount))}
                  </output>
                </span>
                <input
                  type="range"
                  min={1000}
                  max={500000}
                  step={1000}
                  value={Math.min(500000, Math.max(1000, Number(amount) || 1000))}
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
                <span className="flex min-h-12 items-center overflow-hidden rounded-xl border border-slate-300 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 dark:border-slate-700">
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
                    className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm font-bold text-slate-900 outline-none dark:text-white"
                    aria-label="Nominal donasi khusus dalam rupiah"
                  />
                </span>
                <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                  Minimum Rp1.000. Batas maksimum default Rp5.000.000 mengikuti
                  konfigurasi backend.
                </span>
              </label>
            </fieldset>

            {donationError && (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-400/10 dark:text-rose-300"
              >
                <FiAlertCircle className="mt-0.5 shrink-0" />
                {donationError}
              </p>
            )}
            <button
              type="submit"
              disabled={!isAuthenticated || isCreatingDonation}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-500"
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
                    ? "Lanjutkan ke pembayaran"
                    : "Pembayaran belum tersedia"}
            </button>
            <p className="text-center text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              Nominal ini adalah nilai dasar donasi. Biaya layanan gateway
              dipotong dari saldo organisasi, sedangkan kode unik dapat
              menambah tagihan. Total pembayaran mengikuti nilai gateway.
            </p>
          </form>
        </Panel>
      </div>

      {selectedDonation && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
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
            <div className="flex items-start justify-between gap-3 border-b border-emerald-100 bg-emerald-50/70 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20 sm:p-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  Transaksi donasi
                </p>
                <p
                  id="donation-details-title"
                  className="mt-1 text-sm font-extrabold capitalize text-slate-900 dark:text-white"
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
              {selectedDonation.qris_image || selectedDonation.qr_url ? (
                <div className="flex flex-col items-center gap-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
                  <img
                    src={
                      selectedDonation.qris_image ??
                      selectedDonation.qr_url ??
                      undefined
                    }
                    alt="QRIS pembayaran donasi"
                    className="aspect-square w-52 max-w-full rounded-lg bg-white object-contain p-2 shadow-sm"
                  />
                  <p className="text-center text-xs text-slate-600 dark:text-slate-300">
                    Pindai QRIS menggunakan aplikasi pembayaran Anda.
                  </p>
                </div>
              ) : (
                <div className="flex items-start gap-3 rounded-xl bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-400/10 dark:text-blue-200">
                  <FiClock className="mt-0.5 shrink-0" />
                  Transaksi sedang diproses. QRIS akan tampil setelah informasi
                  pembayaran tersedia.
                </div>
              )}
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
