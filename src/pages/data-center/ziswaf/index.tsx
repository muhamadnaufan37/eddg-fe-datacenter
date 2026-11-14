import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  FiAlertCircle,
  FiArrowDownCircle,
  FiArrowLeft,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiCreditCard,
  FiHeart,
  FiLogIn,
  FiLogOut,
  FiRefreshCw,
  FiShield,
  FiTrendingUp,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import {
  createDonation,
  createWithdrawal,
  fetchAdminDonations,
  fetchAdminWithdrawal,
  fetchAdminWithdrawals,
  fetchDonation,
  fetchMyDonations,
  getRetryAfterSeconds,
  getZiswafErrorMessage,
  type Donation,
  type DonationStatus,
  type DonationType,
  type Pagination,
  type Withdrawal,
} from "../../../services/ziswaf";

type ViewTab = "donations" | "admin";
type AdminTab = "donations" | "withdrawals";

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

const defaultPagination: Pagination = {
  current_page: 1,
  last_page: 1,
  per_page: 15,
  total: 0,
};

const formatRupiah = (value: number | undefined) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value ?? 0);

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
};

const normalizeList = <T,>(
  value: { items: T[]; pagination?: Pagination } | T[] | undefined,
) => ({
  items: Array.isArray(value) ? value : (value?.items ?? []),
  pagination: Array.isArray(value)
    ? defaultPagination
    : (value?.pagination ?? defaultPagination),
});

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

const StatusBadge = ({ status }: { status: string }) => {
  const knownStatus = status in statusClass ? (status as DonationStatus) : null;
  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${
        knownStatus
          ? statusClass[knownStatus]
          : "bg-slate-100 text-slate-700 ring-slate-500/20 dark:bg-slate-700 dark:text-slate-300"
      }`}
    >
      {knownStatus ? statusLabel[knownStatus] : status}
    </span>
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
  const { token, user, isAuthenticated, login, logout } = useAuth();
  const isAdmin = user?.role_id === "1" || user?.role_id === "3";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [tab, setTab] = useState<ViewTab>("donations");
  const [adminTab, setAdminTab] = useState<AdminTab>("donations");
  const [donationType, setDonationType] = useState<DonationType>("infaq");
  const [amount, setAmount] = useState("10000");
  const [donationError, setDonationError] = useState("");
  const [isCreatingDonation, setIsCreatingDonation] = useState(false);
  const [requestAttempt, setRequestAttempt] = useState<{
    id: string;
    type: DonationType;
    amount: number;
  } | null>(null);
  const [createdDonation, setCreatedDonation] = useState<Donation | null>(null);
  const [myDonations, setMyDonations] = useState<Donation[]>([]);
  const [myPagination, setMyPagination] = useState(defaultPagination);
  const [myPage, setMyPage] = useState(1);
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(
    null,
  );
  const [lastStatusCheck, setLastStatusCheck] = useState<
    Record<string, number>
  >({});
  const [now, setNow] = useState(Date.now());
  const [donationListError, setDonationListError] = useState("");
  const [isLoadingDonations, setIsLoadingDonations] = useState(false);
  const [adminDonations, setAdminDonations] = useState<Donation[]>([]);
  const [adminDonationPagination, setAdminDonationPagination] =
    useState(defaultPagination);
  const [adminDonationPage, setAdminDonationPage] = useState(1);
  const [adminStatusFilter, setAdminStatusFilter] = useState("");
  const [adminTypeFilter, setAdminTypeFilter] = useState<DonationType | "">("");
  const [adminWithdrawals, setAdminWithdrawals] = useState<Withdrawal[]>([]);
  const [withdrawalPagination, setWithdrawalPagination] =
    useState(defaultPagination);
  const [withdrawalPage, setWithdrawalPage] = useState(1);
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isCreatingWithdrawal, setIsCreatingWithdrawal] = useState(false);
  const [withdrawalResult, setWithdrawalResult] = useState<Withdrawal | null>(
    null,
  );
  const [selectedWithdrawal, setSelectedWithdrawal] =
    useState<Withdrawal | null>(null);

  const loadMyDonations = useCallback(async () => {
    if (!token) return;
    setIsLoadingDonations(true);
    setDonationListError("");
    try {
      const result = await fetchMyDonations(token, myPage);
      setMyDonations(result.items);
      setMyPagination(result.pagination);
    } catch (error) {
      setDonationListError(getZiswafErrorMessage(error));
    } finally {
      setIsLoadingDonations(false);
    }
  }, [token, myPage]);

  const loadAdminData = useCallback(async () => {
    if (!token || !isAdmin) return;
    setIsLoadingAdmin(true);
    setAdminError("");
    try {
      if (adminTab === "donations") {
        const result = await fetchAdminDonations(token, {
          status: adminStatusFilter,
          donation_type: adminTypeFilter,
          page: adminDonationPage,
        });
        const list = normalizeList(result);
        setAdminDonations(list.items);
        setAdminDonationPagination(list.pagination);
      } else {
        const result = await fetchAdminWithdrawals(token, withdrawalPage);
        const list = normalizeList(result);
        setAdminWithdrawals(list.items);
        setWithdrawalPagination(list.pagination);
      }
    } catch (error) {
      setAdminError(getZiswafErrorMessage(error));
    } finally {
      setIsLoadingAdmin(false);
    }
  }, [
    token,
    isAdmin,
    adminTab,
    adminStatusFilter,
    adminTypeFilter,
    adminDonationPage,
    withdrawalPage,
  ]);

  useEffect(() => {
    if (isAuthenticated && tab === "donations") void loadMyDonations();
  }, [isAuthenticated, tab, loadMyDonations]);

  useEffect(() => {
    if (isAuthenticated && tab === "admin") void loadAdminData();
  }, [isAuthenticated, tab, loadAdminData]);

  useEffect(() => {
    if (!selectedDonation || selectedDonation.status !== "pending") return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [selectedDonation]);

  const nextStatusCheck = selectedDonation
    ? (lastStatusCheck[selectedDonation.uuid] ?? 0) + 20_000
    : 0;
  const secondsUntilStatusCheck = Math.max(
    0,
    Math.ceil((nextStatusCheck - now) / 1000),
  );
  const canCheckStatus =
    selectedDonation?.status === "pending" && secondsUntilStatusCheck === 0;

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError("");
    setIsLoggingIn(true);
    try {
      await login(username.trim(), password);
      setPassword("");
    } catch (error) {
      setLoginError(
        error instanceof Error ? error.message : "Login gagal. Silakan coba lagi.",
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleCreateDonation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

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
      const response = await createDonation(token, {
        request_id: attempt.id,
        donation_type: attempt.type,
        amount: attempt.amount,
      });
      setCreatedDonation(response.data);
      setSelectedDonation(response.data);
      setRequestAttempt(null);
      setMyPage(1);
      setDonationType("infaq");
      setAmount("10000");
      await loadMyDonations();
    } catch (error) {
      setDonationError(getZiswafErrorMessage(error));
    } finally {
      setIsCreatingDonation(false);
    }
  };

  const handleRefreshStatus = async (donation: Donation) => {
    if (!token || !canCheckStatus) return;
    setDonationListError("");
    try {
      const updated = await fetchDonation(token, donation.uuid);
      setLastStatusCheck((previous) => ({
        ...previous,
        [donation.uuid]: Date.now(),
      }));
      setSelectedDonation(updated);
      setCreatedDonation((previous) =>
        previous?.uuid === updated.uuid ? updated : previous,
      );
      setMyDonations((previous) =>
        previous.map((item) => (item.uuid === updated.uuid ? updated : item)),
      );
    } catch (error) {
      const retryAfter = getRetryAfterSeconds(error);
      setLastStatusCheck((previous) => ({
        ...previous,
        [donation.uuid]: Date.now() + (retryAfter ?? 20) * 1000 - 20_000,
      }));
      setDonationListError(
        retryAfter
          ? `Pengecekan terlalu cepat. Coba lagi dalam ${retryAfter} detik.`
          : getZiswafErrorMessage(error),
      );
    }
  };

  const handleCreateWithdrawal = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;
    const numericAmount = Number(withdrawAmount);
    if (!Number.isInteger(numericAmount) || numericAmount <= 0) {
      setAdminError("Masukkan nominal penarikan dalam rupiah bulat.");
      return;
    }

    setIsCreatingWithdrawal(true);
    setAdminError("");
    try {
      const response = await createWithdrawal(token, numericAmount);
      setWithdrawalResult(response.data);
      setWithdrawAmount("");
      await loadAdminData();
    } catch (error) {
      setAdminError(getZiswafErrorMessage(error));
    } finally {
      setIsCreatingWithdrawal(false);
    }
  };

  const refreshSelectedWithdrawal = async (withdrawal: Withdrawal) => {
    if (!token) return;
    try {
      const updated = await fetchAdminWithdrawal(token, withdrawal.uuid);
      setSelectedWithdrawal(updated);
      setAdminWithdrawals((previous) =>
        previous.map((item) => (item.uuid === updated.uuid ? updated : item)),
      );
    } catch (error) {
      setAdminError(getZiswafErrorMessage(error));
    }
  };

  const donationSummary = useMemo(() => {
    const successful = myDonations.filter((item) => item.status === "success");
    return {
      count: successful.length,
      amount: successful.reduce((total, item) => total + item.amount, 0),
    };
  }, [myDonations]);

  const renderPagination = (
    pagination: Pagination,
    page: number,
    setPage: (page: number) => void,
  ) => (
    <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {pagination.total} data · Halaman {page} dari{" "}
        {Math.max(pagination.last_page, 1)}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
          className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-200"
        >
          <FiChevronLeft />
          Sebelumnya
        </button>
        <button
          type="button"
          disabled={page >= pagination.last_page}
          onClick={() => setPage(page + 1)}
          className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-200"
        >
          Berikutnya
          <FiChevronRight />
        </button>
      </div>
    </div>
  );

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
              QRIS. Riwayat dan status transaksi tercatat di akun Anda.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
              <FiShield className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-xs font-bold text-white">
                Pembayaran terlindungi
              </span>
              <span className="mt-1 block max-w-48 text-[11px] leading-relaxed text-emerald-100">
                Transaksi diproses backend dan status dikonfirmasi gateway.
              </span>
            </span>
          </div>
        </div>
      </section>

      {!isAuthenticated ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
          <Panel className="p-5 sm:p-7">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
                <FiLogIn className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Masuk untuk melanjutkan
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  Gunakan akun SIPANDA Anda untuk berdonasi dan melihat riwayat
                  transaksi.
                </p>
              </div>
            </div>
            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Username
                </span>
                <input
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  placeholder="Masukkan username"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Password
                </span>
                <input
                  autoComplete="current-password"
                  required
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  placeholder="Masukkan password"
                />
              </label>
              {loginError && (
                <p
                  role="alert"
                  className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-400/10 dark:text-rose-300"
                >
                  <FiAlertCircle className="mt-0.5 shrink-0" />
                  {loginError}
                </p>
              )}
              <button
                type="submit"
                disabled={isLoggingIn}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60 dark:bg-emerald-600 dark:hover:bg-emerald-500"
              >
                {isLoggingIn ? (
                  <FiRefreshCw className="animate-spin" />
                ) : (
                  <FiLogIn />
                )}
                {isLoggingIn ? "Memverifikasi..." : "Masuk"}
              </button>
              <p className="text-center text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                Sesi login hanya disimpan di memori aplikasi dan akan berakhir
                saat halaman dimuat ulang.
              </p>
            </form>
          </Panel>

          <Panel className="overflow-hidden">
            <div className="bg-slate-50 p-5 dark:bg-slate-800/60 sm:p-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
                Pilihan kebaikan
              </p>
              <h2 className="mt-2 text-xl font-extrabold text-slate-900 dark:text-white">
                Satu niat baik, banyak manfaat
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Pilih jenis kontribusi yang ingin Anda salurkan. Pembayaran
                dilakukan dengan memindai QRIS setelah transaksi dibuat.
              </p>
            </div>
            <div className="grid grid-cols-1 divide-y divide-slate-100 dark:divide-slate-800 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              {donationTypes.map((item) => (
                <div key={item.value} className="p-4 sm:p-5">
                  <p className="font-bold capitalize text-slate-900 dark:text-white">
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300">
                {user?.nama_lengkap?.slice(0, 1).toUpperCase() ?? "U"}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                  {user?.nama_lengkap}
                </p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {user?.nm_role}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setTab("donations")}
                className={`min-h-10 rounded-xl px-4 text-xs font-bold transition ${
                  tab === "donations"
                    ? "bg-emerald-700 text-white dark:bg-emerald-600"
                    : "border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                Donasi saya
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setTab("admin")}
                  className={`min-h-10 rounded-xl px-4 text-xs font-bold transition ${
                    tab === "admin"
                      ? "bg-emerald-700 text-white dark:bg-emerald-600"
                      : "border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  }`}
                >
                  Panel admin
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  logout();
                  setSelectedDonation(null);
                  setCreatedDonation(null);
                }}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-600 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-rose-400/10 dark:hover:text-rose-300"
              >
                <FiLogOut />
                Keluar
              </button>
            </div>
          </div>

          {tab === "donations" ? (
            <div className="grid items-start gap-6 xl:grid-cols-[0.88fr_1.12fr]">
              <div className="space-y-6">
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
                  <form onSubmit={handleCreateDonation} className="space-y-5 p-5 sm:p-6">
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
                    <label className="block space-y-2">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        Nominal donasi
                      </span>
                      <span className="flex min-h-12 items-center overflow-hidden rounded-xl border border-slate-300 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 dark:border-slate-700">
                        <span className="border-r border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          Rp
                        </span>
                        <input
                          required
                          type="number"
                          min={1000}
                          max={5000000}
                          step={1}
                          inputMode="numeric"
                          value={amount}
                          onChange={(event) => setAmount(event.target.value)}
                          className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm font-bold text-slate-900 outline-none dark:text-white"
                          aria-label="Nominal donasi dalam rupiah"
                        />
                      </span>
                      <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                        Batas default Rp1.000–Rp5.000.000. Nominal final mengikuti
                        konfigurasi merchant.
                      </span>
                    </label>
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
                      disabled={isCreatingDonation}
                      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                    >
                      {isCreatingDonation ? (
                        <FiRefreshCw className="animate-spin" />
                      ) : (
                        <FiCreditCard />
                      )}
                      {isCreatingDonation ? "Menyiapkan QRIS..." : "Lanjutkan ke pembayaran"}
                    </button>
                    <p className="text-center text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                      Nominal ini adalah nilai dasar donasi. Biaya layanan
                      gateway dipotong dari saldo organisasi, sedangkan kode
                      unik dapat menambah tagihan donatur. Jangan mengurangi
                      nominal secara perkiraan; gunakan total dari QRIS.
                    </p>
                  </form>
                </Panel>

                {createdDonation && (
                  <Panel className="overflow-hidden border-emerald-200 dark:border-emerald-900">
                    <div className="flex items-start justify-between gap-3 border-b border-emerald-100 bg-emerald-50/70 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20 sm:p-5">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                          Transaksi donasi
                        </p>
                        <p className="mt-1 text-sm font-extrabold capitalize text-slate-900 dark:text-white">
                          {createdDonation.donation_type}
                        </p>
                      </div>
                      <StatusBadge status={createdDonation.status} />
                    </div>
                    <div className="p-4 sm:p-5">
                      {createdDonation.qr_url || createdDonation.qris_image ? (
                        <div className="flex flex-col items-center gap-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
                          <img
                            src={
                              createdDonation.qris_image ??
                              createdDonation.qr_url ??
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
                          Transaksi sedang diproses. QRIS akan tampil setelah
                          informasi pembayaran tersedia.
                        </div>
                      )}
                      <dl className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                          <dt className="text-[11px] text-slate-500 dark:text-slate-400">
                            Nominal dasar donasi
                          </dt>
                          <dd className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                            {formatRupiah(createdDonation.amount)}
                          </dd>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                          <dt className="text-[11px] text-slate-500 dark:text-slate-400">
                            Biaya layanan (dipotong dari organisasi)
                          </dt>
                          <dd className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                            {createdDonation.admin_fee === undefined
                              ? "Menunggu gateway"
                              : formatRupiah(createdDonation.admin_fee)}
                          </dd>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                          <dt className="text-[11px] text-slate-500 dark:text-slate-400">
                            Kode unik (ditambahkan ke tagihan)
                          </dt>
                          <dd className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                            {createdDonation.amount_uniq === undefined
                              ? "Menunggu gateway"
                              : formatRupiah(createdDonation.amount_uniq)}
                          </dd>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                          <dt className="text-[11px] text-slate-500 dark:text-slate-400">
                            Kredit saldo organisasi
                          </dt>
                          <dd className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                            {createdDonation.credit_amount === undefined
                              ? "Menunggu gateway"
                              : formatRupiah(createdDonation.credit_amount)}
                          </dd>
                        </div>
                        <div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-400/10">
                          <dt className="text-[11px] text-emerald-800 dark:text-emerald-300">
                            Total yang harus dibayar
                          </dt>
                          <dd className="mt-1 text-sm font-extrabold text-emerald-900 dark:text-emerald-200">
                            {createdDonation.total_amount === undefined
                              ? "Menunggu gateway"
                              : formatRupiah(createdDonation.total_amount)}
                          </dd>
                        </div>
                      </dl>
                      <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        Kode unik menambah total tagihan dan berbeda dari biaya
                        layanan yang dipotong dari saldo organisasi. Total
                        pembayaran selalu mengikuti nilai gateway; nominal QRIS
                        yang sudah dibuat tidak dapat diubah.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {createdDonation.payment_url && (
                          <a
                            href={createdDonation.payment_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-emerald-700 px-4 text-xs font-bold text-white hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                          >
                            Buka halaman pembayaran
                          </a>
                        )}
                        {createdDonation.status === "pending" && (
                          <button
                            type="button"
                            onClick={() => void handleRefreshStatus(createdDonation)}
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
                    </div>
                  </Panel>
                )}
              </div>

              <Panel className="overflow-hidden">
                <div className="flex flex-col gap-3 border-b border-slate-200 p-5 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div>
                    <h2 className="font-extrabold text-slate-900 dark:text-white">
                      Riwayat donasi
                    </h2>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Hanya transaksi milik akun Anda yang ditampilkan.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void loadMyDonations()}
                    disabled={isLoadingDonations}
                    className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 sm:self-auto"
                  >
                    <FiRefreshCw className={isLoadingDonations ? "animate-spin" : ""} />
                    Muat ulang
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 p-4 sm:p-5">
                  <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Donasi berhasil di halaman ini
                    </p>
                    <p className="mt-1 text-sm font-extrabold text-slate-900 dark:text-white">
                      {donationSummary.count}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Total nominal berhasil
                    </p>
                    <p className="mt-1 truncate text-sm font-extrabold text-slate-900 dark:text-white">
                      {formatRupiah(donationSummary.amount)}
                    </p>
                  </div>
                </div>
                {donationListError && (
                  <p
                    role="alert"
                    className="mx-4 mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-400/10 dark:text-rose-300 sm:mx-5"
                  >
                    {donationListError}
                  </p>
                )}
                {isLoadingDonations ? (
                  <div className="p-10 text-center text-sm text-slate-500">
                    Memuat riwayat donasi…
                  </div>
                ) : myDonations.length === 0 ? (
                  <div className="px-5 py-10 text-center">
                    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      <FiHeart className="h-5 w-5" />
                    </span>
                    <p className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-200">
                      Belum ada donasi
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Donasi Anda akan muncul di daftar ini.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {myDonations.map((donation) => (
                      <article
                        key={donation.uuid}
                        className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold capitalize text-slate-900 dark:text-white">
                              {donation.donation_type}
                            </span>
                            <StatusBadge status={donation.status} />
                            {donation.is_test && (
                              <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700 dark:bg-violet-400/10 dark:text-violet-300">
                                SANDBOX
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {formatDate(donation.created_at)}
                            {donation.total_amount !== undefined &&
                              ` · Dibayar ${formatRupiah(donation.total_amount)}`}
                          </p>
                        </div>
                        <div className="flex items-center justify-between gap-3 sm:justify-end">
                          <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                            {formatRupiah(donation.amount)}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDonation(donation);
                              setCreatedDonation(donation);
                            }}
                            className="min-h-9 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            Detail
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
                {renderPagination(myPagination, myPage, setMyPage)}
              </Panel>
            </div>
          ) : (
            <div className="space-y-5">
              <Panel className="overflow-hidden">
                <div className="flex flex-col gap-4 border-b border-slate-200 p-5 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-700 dark:text-emerald-300">
                      Administrasi ZISWAF
                    </p>
                    <h2 className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">
                      Panel pengelolaan
                    </h2>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Akses dibatasi untuk Superadmin dan Bendahara/KU. Server
                      tetap memvalidasi setiap permintaan.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setAdminTab("donations")}
                      className={`min-h-10 rounded-lg px-4 text-xs font-bold ${
                        adminTab === "donations"
                          ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                          : "border border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-200"
                      }`}
                    >
                      Rekap donasi
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdminTab("withdrawals")}
                      className={`min-h-10 rounded-lg px-4 text-xs font-bold ${
                        adminTab === "withdrawals"
                          ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                          : "border border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-200"
                      }`}
                    >
                      Penarikan saldo
                    </button>
                    <button
                      type="button"
                      onClick={() => void loadAdminData()}
                      disabled={isLoadingAdmin}
                      aria-label="Muat ulang data admin"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"
                    >
                      <FiRefreshCw className={isLoadingAdmin ? "animate-spin" : ""} />
                    </button>
                  </div>
                </div>

                {adminTab === "donations" ? (
                  <>
                    <div className="grid gap-3 border-b border-slate-200 p-4 dark:border-slate-700 sm:grid-cols-[1fr_1fr_auto] sm:px-5">
                      <label className="space-y-1">
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          Filter status
                        </span>
                        <select
                          value={adminStatusFilter}
                          onChange={(event) => {
                            setAdminStatusFilter(event.target.value);
                            setAdminDonationPage(1);
                          }}
                          className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        >
                          <option value="">Semua status</option>
                          <option value="processing">Diproses</option>
                          <option value="pending">Menunggu</option>
                          <option value="success">Berhasil</option>
                          <option value="expired">Kedaluwarsa</option>
                          <option value="failed">Gagal</option>
                        </select>
                      </label>
                      <label className="space-y-1">
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          Jenis donasi
                        </span>
                        <select
                          value={adminTypeFilter}
                          onChange={(event) => {
                            setAdminTypeFilter(event.target.value as DonationType | "");
                            setAdminDonationPage(1);
                          }}
                          className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        >
                          <option value="">Semua jenis</option>
                          {donationTypes.map((item) => (
                            <option key={item.value} value={item.value}>
                              {item.title}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="flex items-end">
                        <span className="min-h-10 content-center text-xs text-slate-500 dark:text-slate-400">
                          {adminDonationPagination.total} donasi
                        </span>
                      </div>
                    </div>
                    {adminError && (
                      <p role="alert" className="m-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-400/10 dark:text-rose-300">
                        {adminError}
                      </p>
                    )}
                    {isLoadingAdmin ? (
                      <div className="p-10 text-center text-sm text-slate-500">
                        Memuat rekap donasi…
                      </div>
                    ) : adminDonations.length === 0 ? (
                      <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
                        Tidak ada data untuk filter ini.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {adminDonations.map((donation) => (
                          <div
                            key={donation.uuid}
                            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                          >
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-bold capitalize text-slate-900 dark:text-white">
                                  {donation.donation_type}
                                </span>
                                <StatusBadge status={donation.status} />
                              </div>
                              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                {formatDate(donation.created_at)} · ID{" "}
                                <span className="break-all">{donation.uuid}</span>
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                              <span className="font-bold text-slate-900 dark:text-white">
                                {formatRupiah(donation.amount)}
                              </span>
                              {donation.total_amount !== undefined && (
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  Total bayar {formatRupiah(donation.total_amount)}
                                </span>
                              )}
                              {donation.amount_uniq !== undefined && (
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  Kode unik {formatRupiah(donation.amount_uniq)}
                                </span>
                              )}
                              {donation.admin_fee !== undefined && (
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  Biaya organisasi {formatRupiah(donation.admin_fee)}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {renderPagination(
                      adminDonationPagination,
                      adminDonationPage,
                      setAdminDonationPage,
                    )}
                  </>
                ) : (
                  <div className="grid gap-0 xl:grid-cols-[0.8fr_1.2fr]">
                    <div className="border-b border-slate-200 p-5 dark:border-slate-700 xl:border-b-0 xl:border-r sm:p-6">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">
                          <FiArrowDownCircle className="h-5 w-5" />
                        </span>
                        <div>
                          <h3 className="font-extrabold text-slate-900 dark:text-white">
                            Ajukan penarikan
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Rekening dan PIN dikelola di server
                          </p>
                        </div>
                      </div>
                      <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-900 dark:bg-amber-400/10 dark:text-amber-200">
                        Frontend hanya mengirim nominal. Nomor rekening, PIN,
                        dan kredensial gateway tidak diminta atau dikirim dari
                        browser.
                      </p>
                      <form
                        onSubmit={handleCreateWithdrawal}
                        className="mt-4 space-y-3"
                      >
                        <label className="block space-y-1.5">
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                            Nominal penarikan
                          </span>
                          <input
                            type="number"
                            min={1}
                            step={1}
                            inputMode="numeric"
                            required
                            value={withdrawAmount}
                            onChange={(event) =>
                              setWithdrawAmount(event.target.value)
                            }
                            placeholder="Contoh: 100000"
                            className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                          />
                        </label>
                        <button
                          type="submit"
                          disabled={isCreatingWithdrawal}
                          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-xs font-bold text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                        >
                          {isCreatingWithdrawal && (
                            <FiRefreshCw className="animate-spin" />
                          )}
                          Ajukan penarikan
                        </button>
                      </form>
                      {adminError && (
                        <p role="alert" className="mt-3 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-400/10 dark:text-rose-300">
                          {adminError}
                        </p>
                      )}
                      {withdrawalResult && (
                        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm dark:border-emerald-900 dark:bg-emerald-950/20">
                          <p className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300">
                            <FiCheckCircle />
                            Permintaan penarikan diterima
                          </p>
                          <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                            {formatRupiah(withdrawalResult.amount)} ·{" "}
                            {withdrawalResult.status}
                          </p>
                          {withdrawalResult.uuid && (
                            <p className="mt-1 break-all text-[11px] text-slate-500">
                              ID {withdrawalResult.uuid}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-3 p-5 sm:px-6">
                        <div>
                          <h3 className="font-extrabold text-slate-900 dark:text-white">
                            Riwayat penarikan
                          </h3>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Biaya dan nominal bersih mengikuti respons gateway.
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                          <FiTrendingUp />
                          {withdrawalPagination.total}
                        </span>
                      </div>
                      {adminWithdrawals.length === 0 && !isLoadingAdmin ? (
                        <div className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                          Belum ada data penarikan.
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                          {adminWithdrawals.map((withdrawal) => (
                            <div
                              key={withdrawal.uuid}
                              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                            >
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-900 dark:text-white">
                                  {formatRupiah(withdrawal.amount)}
                                </p>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                  {formatDate(withdrawal.created_at)}
                                </p>
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <StatusBadge status={withdrawal.status} />
                                <button
                                  type="button"
                                  onClick={() => void refreshSelectedWithdrawal(withdrawal)}
                                  className="min-h-9 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200"
                                >
                                  Cek status
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {selectedWithdrawal && (
                        <div className="m-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800 sm:m-5">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                            Detail penarikan · {selectedWithdrawal.status}
                          </p>
                          <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
                            <span className="text-slate-500 dark:text-slate-400">
                              Biaya
                              <strong className="mt-1 block text-slate-900 dark:text-white">
                                {formatRupiah(selectedWithdrawal.fee)}
                              </strong>
                            </span>
                            <span className="text-slate-500 dark:text-slate-400">
                              Nominal bersih
                              <strong className="mt-1 block text-slate-900 dark:text-white">
                                {formatRupiah(selectedWithdrawal.net_amount)}
                              </strong>
                            </span>
                          </div>
                        </div>
                      )}
                      {renderPagination(
                        withdrawalPagination,
                        withdrawalPage,
                        setWithdrawalPage,
                      )}
                    </div>
                  </div>
                )}
              </Panel>
              <p className="flex items-start gap-2 px-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                <FiShield className="mt-0.5 shrink-0" />
                Aksi admin pada antarmuka bukan pengganti otorisasi server.
                Server wajib memverifikasi role dan izin pada setiap endpoint.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ZiswafPage;
