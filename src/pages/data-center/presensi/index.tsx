import { useEffect, useRef, useState } from "react";
import { useFormik } from "formik";
import { useNavigate, useSearchParams } from "react-router-dom";
import * as Yup from "yup";
import type { InputActionMeta } from "react-select";
import { Dialog } from "primereact/dialog";
import { FiAlertTriangle, FiMapPin } from "react-icons/fi";

import {
  PrimeInputText,
  PrimeSelect,
  StepperHeader,
  TextareaField,
} from "../../../components/forms/FormFields";
import {
  fetchNamaPesertaCaiReference,
  fetchNamaPesertaSensusReference,
  searchKegiatanPresensi,
  type PresensiKegiatan,
  submitPresensi,
} from "../../../services/dataCenter";
import { showToast } from "../../../services/toast";
import { resolveImageUrl } from "../../../utils/text";

type CaiAttendanceMode = "list" | "rfid";

type PresensiFormValues = {
  kode_kegiatan: string;
  id_peserta: string;
  latitude: string;
  longitude: string;
  status_presensi: string;
  keterangan: string;
};

interface ReactSelectOption {
  label: string;
  value: string;
}

const attendanceOptions = [
  {
    value: "hadir",
    label: "Hadir",
    description: "Datang dan mengikuti kegiatan sesuai jadwal.",
    accent:
      "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
  },
  {
    value: "izin",
    label: "Izin",
    description: "Berhalangan hadir dan menyampaikan alasan.",
    accent:
      "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4m0 4h.01M10.293 3.293l-7 7A1 1 0 003 11v6a1 1 0 001 1h16a1 1 0 001-1v-6a1 1 0 00-.293-.707l-7-7a1 1 0 00-1.414 0z"
      />
    ),
  },
  {
    value: "sakit",
    label: "Sakit",
    description: "Tidak dapat hadir karena kondisi kesehatan.",
    accent:
      "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4m0 4h.01M5.07 19H18.93a2 2 0 001.74-3L13.74 5a2 2 0 00-3.48 0L3.33 16a2 2 0 001.74 3z"
      />
    ),
  },
] as const;

const locationDefault = "";

const formatDateTime = (value: string) => {
  if (!value) return "-";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(parsed);
};

const getVenueDetails = (activity: PresensiKegiatan | null) => {
  if (!activity) {
    return {
      title: "-",
      address: "-",
      latitude: "-",
      longitude: "-",
      label: "Tempat kegiatan",
    };
  }

  const type = String(activity.type_kegiatan || "").toUpperCase();
  const venue =
    type === "DAERAH"
      ? activity.daerah
      : type === "DESA"
        ? activity.desa
        : type === "KELOMPOK"
          ? activity.kelompok
          : null;

  return {
    label:
      type === "DAERAH"
        ? "Daerah"
        : type === "DESA"
          ? "Desa"
          : type === "KELOMPOK"
            ? "Kelompok"
            : "Tempat kegiatan",
    title:
      venue?.nama_daerah ??
      venue?.nama_desa ??
      venue?.nama_kelompok ??
      activity.tmpt_kegiatan ??
      "-",
    address: venue?.alamat ?? "-",
    latitude: venue?.latitude ?? "-",
    longitude: venue?.longitude ?? "-",
  };
};

const MiniDetail = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => {
  return (
    <div className="rounded-2xl bg-white p-3 shadow-sm dark:bg-slate-900">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
        {value}
      </p>
    </div>
  );
};

const sectionCardClassName =
  "overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/85";

// ─── CAI Method Selector Card ────────────────────────────────────────────────
const CAI_METHODS = [
  {
    value: "list" as CaiAttendanceMode,
    title: "Daftar Nama",
    description: "Cari dan pilih peserta dari daftar yang dimuat dari server.",
    badge: "Paling cepat untuk operator",
    accentActive:
      "border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
    icon: (
      <>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 20h5v-2a4 4 0 00-5-5m-4 7H2v-2a6 6 0 0112 0m0-5a4 4 0 100-8 4 4 0 000 8zm9 0h-3m1.5-1.5v3"
        />
      </>
    ),
  },
  {
    value: "rfid" as CaiAttendanceMode,
    title: "Tapping RFID",
    description: "Tap kartu ke reader — peserta teridentifikasi otomatis.",
    badge: "Untuk perangkat reader",
    accentActive:
      "border-cyan-500 bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300",
    icon: (
      <>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"
        />
      </>
    ),
  },
] as const;

const CaiMethodCard = ({
  active,
  method,
  onClick,
}: {
  active: boolean;
  method: (typeof CAI_METHODS)[number];
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`group relative overflow-hidden rounded-[1.75rem] border p-5 text-left transition duration-300 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-sky-500/10 ${
      active
        ? `${method.accentActive} shadow-md`
        : "border-slate-200 bg-white text-slate-700 hover:border-sky-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
    }`}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 shadow-sm ring-1 ring-inset ring-slate-200 transition group-hover:scale-105 dark:bg-slate-800/90 dark:ring-slate-700">
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {method.icon}
        </svg>
      </div>
      <span
        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${
          active
            ? "bg-white/70 text-current"
            : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"
        }`}
      >
        {active ? "Aktif" : "Pilih"}
      </span>
    </div>
    <div className="mt-4 space-y-1.5">
      <h3 className="text-base font-bold text-slate-900 dark:text-white">
        {method.title}
      </h3>
      <p className="text-sm leading-relaxed opacity-90">{method.description}</p>
    </div>
    <div className="mt-4">
      <span className="rounded-full bg-white/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-current dark:bg-slate-800/80">
        {method.badge}
      </span>
    </div>
    <div
      className={`mt-5 h-1.5 w-full rounded-full ${
        active ? "bg-current" : "bg-slate-200 dark:bg-slate-700"
      }`}
    />
  </button>
);

// ─── RFID Tapping Panel ───────────────────────────────────────────────────────
type RfidScanState = "idle" | "ready" | "success" | "error";

const RFID_SCAN_CONFIG: Record<
  RfidScanState,
  { ring: string; glow: string; label: string }
> = {
  idle: {
    ring: "border-slate-300 dark:border-slate-600",
    glow: "",
    label: "Menunggu tap",
  },
  ready: {
    ring: "border-cyan-400",
    glow: "shadow-cyan-500/20",
    label: "Siap membaca",
  },
  success: {
    ring: "border-emerald-400",
    glow: "shadow-emerald-500/20",
    label: "Kartu terbaca",
  },
  error: {
    ring: "border-rose-400",
    glow: "shadow-rose-500/20",
    label: "Kode tidak valid",
  },
};

const RfidTappingPanel = ({
  rfidCode,
  scanState,
  statusMessage,
}: {
  rfidCode: string;
  scanState: RfidScanState;
  statusMessage: string | null;
}) => {
  const cfg = RFID_SCAN_CONFIG[scanState];
  return (
    <div className="space-y-5">
      {/* Status badge */}
      <div className="flex items-center gap-2">
        <div
          className={`h-2.5 w-2.5 rounded-full ${
            scanState === "success"
              ? "bg-emerald-500"
              : scanState === "error"
                ? "bg-rose-500"
                : scanState === "ready"
                  ? "bg-cyan-500 animate-pulse"
                  : "bg-slate-400"
          }`}
        />
        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
          {cfg.label}
        </span>
      </div>

      {/* Reader visual + input */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* Radar circle */}
        <div
          className={`relative flex flex-col items-center justify-center gap-6 overflow-hidden rounded-[2rem] border p-8 shadow-xl transition-all duration-500 ${
            cfg.ring
          } ${cfg.glow} ${
            scanState === "success"
              ? "bg-emerald-50/60 dark:bg-emerald-500/5"
              : scanState === "error"
                ? "bg-rose-50/60 dark:bg-rose-500/5"
                : scanState === "ready"
                  ? "bg-cyan-50/60 dark:bg-cyan-500/5"
                  : "bg-slate-50 dark:bg-slate-900"
          }`}
        >
          {/* Decorative radial rings */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-56 w-56 rounded-full border border-slate-200/50 dark:border-slate-700/40" />
            <div className="absolute h-40 w-40 rounded-full border border-slate-200/60 dark:border-slate-700/50" />
            <div className="absolute h-24 w-24 rounded-full border border-dashed border-cyan-300/70 dark:border-cyan-500/30" />
          </div>

          {/* Center icon */}
          <div
            className={`relative z-9 flex h-24 w-24 items-center justify-center rounded-full border-2 shadow-lg transition-all duration-500 ${
              scanState === "success"
                ? "border-emerald-400 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"
                : scanState === "error"
                  ? "border-rose-400 bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300"
                  : scanState === "ready"
                    ? "border-cyan-400 bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-300"
                    : "border-slate-300 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400"
            }`}
          >
            {scanState === "success" ? (
              <svg
                className="h-10 w-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : scanState === "error" ? (
              <svg
                className="h-10 w-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="h-10 w-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"
                />
              </svg>
            )}
          </div>

          <div className="relative z-9 text-center">
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              {scanState === "success"
                ? "RFID terhubung ke peserta"
                : scanState === "error"
                  ? "Kode belum valid"
                  : "Tempel kartu pada reader"}
            </h4>
            <p className="mt-1 max-w-xs text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              {scanState === "success"
                ? "Lanjutkan mengisi status kehadiran dan lokasi."
                : "Atau ketik kode RFID secara manual sebagai fallback."}
            </p>
          </div>

          {statusMessage ? (
            <p
              className={`relative z-9 rounded-2xl px-4 py-2 text-sm font-semibold ${
                scanState === "success"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                  : scanState === "error"
                    ? "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
                    : "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300"
              }`}
            >
              {statusMessage}
            </p>
          ) : null}
        </div>

        {/* Right column: input + checklist */}
        <div className="flex flex-col gap-4">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
              Auto Scan RFID
            </p>
            <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Tempel kartu ke reader. Kode akan terbaca otomatis tanpa input
              manual.
            </p>
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/40">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Kode terbaca terakhir
              </p>
              <p className="mt-2 min-h-6 break-all text-sm font-semibold tracking-[0.18em] text-slate-900 dark:text-white">
                {rfidCode || "-"}
              </p>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
              Checklist
            </p>
            <ul className="space-y-2.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {[
                "Pastikan reader RFID aktif dan terhubung ke perangkat.",
                "Tap kartu, tunggu bunyi konfirmasi, lalu tekan hubungkan.",
                "Gunakan mode daftar nama jika reader tidak tersedia.",
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-300">
                    <svg
                      className="h-2.5 w-2.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const PresensiPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const kodeKegiatanFromUrl = searchParams.get("no_kegiatan")?.trim() ?? "";

  const [activityData, setActivityData] = useState<PresensiKegiatan | null>(
    null,
  );
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);

  const [participantOptions, setParticipantOptions] = useState<
    ReactSelectOption[]
  >([]);
  const [attendanceType, setAttendanceType] = useState<"cai" | "sensus" | null>(
    null,
  );
  const [caiAttendanceMode, setCaiAttendanceMode] =
    useState<CaiAttendanceMode>("list");
  const [rfidCode, setRfidCode] = useState("");
  const [rfidScanState, setRfidScanState] = useState<RfidScanState>("idle");
  const [rfidStatusMessage, setRfidStatusMessage] = useState<string | null>(
    null,
  );
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationAccuracy, setLocationAccuracy] = useState<string | null>(null);
  const [participantSearchTerm, setParticipantSearchTerm] = useState("");
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const currentYear = new Date().getFullYear();
  const rfidBufferRef = useRef("");
  const rfidBufferTimerRef = useRef<number | null>(null);

  const formik = useFormik<PresensiFormValues>({
    initialValues: {
      kode_kegiatan: "",
      id_peserta: "",
      latitude: locationDefault,
      longitude: locationDefault,
      status_presensi: "",
      keterangan: "",
    },
    validationSchema: Yup.object({
      kode_kegiatan: Yup.string().required("Kode kegiatan wajib diisi"),
      id_peserta: Yup.string().required("Peserta wajib dipilih"),
      latitude: Yup.string().required("Lokasi harus dicari terlebih dahulu"),
      longitude: Yup.string().required("Lokasi harus dicari terlebih dahulu"),
      status_presensi: Yup.string().required("Status kehadiran wajib diisi"),
      keterangan: Yup.string().when("status_presensi", {
        is: (val: string) => val === "sakit" || val === "izin",
        then: (schema) => schema.required("Keterangan wajib diisi"),
        otherwise: (schema) => schema.notRequired(),
      }),
    }),
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values, helpers) => {
      try {
        setIsSubmitting(true);

        const response = await submitPresensi({
          ...values,
          add_by_petugas: "124fe53d-64da-4647-8c30-87aea6ac23bd",
          radius_meter: 3540,
          category: attendanceType,
        });

        showToast(
          "success",
          "Berhasil",
          response?.message ?? "Presensi berhasil disimpan.",
        );

        helpers.resetForm();
        setLocationAccuracy(null);
      } catch (error: any) {
        showToast(
          "error",
          "Gagal",
          error?.response?.data?.message ||
            error?.message ||
            "Gagal menyimpan presensi.",
        );
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const formikRef = useRef(formik);

  formikRef.current = formik;

  useEffect(() => {
    let cancelled = false;

    const resetAttendanceState = () => {
      const currentFormik = formikRef.current;

      currentFormik.setFieldValue("kode_kegiatan", "", false);
      currentFormik.setFieldValue("id_peserta", "", false);
      currentFormik.setFieldValue("status_presensi", "", false);
      currentFormik.setFieldValue("keterangan", "", false);
      currentFormik.setFieldValue("latitude", locationDefault, false);
      currentFormik.setFieldValue("longitude", locationDefault, false);
      setAttendanceType(null);
      setParticipantOptions([]);
      setParticipantSearchTerm("");
      setLocationAccuracy(null);
      setIsActivityModalOpen(false);
      setCaiAttendanceMode("list");
      setRfidCode("");
      setRfidScanState("idle");
      setRfidStatusMessage(null);
    };

    const loadKegiatan = async () => {
      if (!kodeKegiatanFromUrl) {
        setActivityData(null);
        setActivityError(
          "Kode kegiatan belum ditemukan di URL. Buka halaman ini dari tautan kegiatan.",
        );
        resetAttendanceState();
        return;
      }

      setActivityLoading(true);
      setActivityError(null);

      try {
        const response = await searchKegiatanPresensi(kodeKegiatanFromUrl);
        const kegiatan = response.data?.[0] ?? null;

        if (cancelled) return;

        if (!kegiatan) {
          setActivityData(null);
          setActivityError("Data kegiatan tidak ditemukan.");
          resetAttendanceState();
          return;
        }

        setActivityData(kegiatan);
        formikRef.current.setFieldValue(
          "kode_kegiatan",
          kegiatan.kode_kegiatan,
          false,
        );
      } catch (error: any) {
        if (cancelled) return;

        setActivityData(null);
        setActivityError(
          error?.response?.data?.message ||
            error?.message ||
            "Gagal memuat data kegiatan.",
        );
        resetAttendanceState();
      } finally {
        if (!cancelled) setActivityLoading(false);
      }
    };

    void loadKegiatan();

    return () => {
      cancelled = true;
    };
  }, [kodeKegiatanFromUrl]);

  useEffect(() => {
    if (!attendanceType) return;

    let cancelled = false;

    const loadParticipants = async () => {
      try {
        setLoadingParticipants(true);

        const options =
          attendanceType === "cai"
            ? await fetchNamaPesertaCaiReference({
                tahun: currentYear,
                search: participantSearchTerm,
              })
            : await fetchNamaPesertaSensusReference({
                search: participantSearchTerm,
              });

        if (!cancelled) {
          setParticipantOptions(options);
        }
      } catch {
        if (!cancelled) {
          showToast("error", "Gagal", "Gagal memuat referensi peserta.");
        }
      } finally {
        if (!cancelled) {
          setLoadingParticipants(false);
        }
      }
    };

    const timeoutId = window.setTimeout(() => {
      void loadParticipants();
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [attendanceType, currentYear, participantSearchTerm]);

  const connectRfidCode = (rawCode: string) => {
    const v = rawCode.trim().toUpperCase();
    if (!v) {
      setRfidScanState("error");
      setRfidStatusMessage("Kode RFID tidak terbaca. Coba tap ulang.");
      return;
    }
    setRfidCode(v);
    formikRef.current.setFieldValue("id_peserta", v, true);
    formikRef.current.setFieldTouched("id_peserta", true, false);
    setRfidScanState("success");
    setRfidStatusMessage(`RFID ${v} terbaca otomatis dan siap dipakai.`);
  };

  useEffect(() => {
    const isRfidMode = attendanceType === "cai" && caiAttendanceMode === "rfid";
    if (!isRfidMode) return;

    const flushBuffer = () => {
      const scanned = rfidBufferRef.current;
      rfidBufferRef.current = "";
      if (rfidBufferTimerRef.current) {
        window.clearTimeout(rfidBufferTimerRef.current);
        rfidBufferTimerRef.current = null;
      }
      if (scanned.trim()) {
        connectRfidCode(scanned);
      }
    };

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.altKey || event.metaKey) return;

      const target = event.target as HTMLElement | null;
      const isTypingField =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable;

      // Jangan menangkap ketikan normal pada field form lain.
      if (isTypingField) return;

      if (event.key === "Enter") {
        if (rfidBufferRef.current.trim()) {
          flushBuffer();
        }
        return;
      }

      if (event.key.length !== 1) return;

      if (!rfidBufferRef.current) {
        setRfidScanState("ready");
        setRfidStatusMessage("Membaca kartu RFID...");
      }

      rfidBufferRef.current += event.key;

      if (rfidBufferTimerRef.current) {
        window.clearTimeout(rfidBufferTimerRef.current);
      }

      // Scanner umumnya mengirim burst cepat; jeda pendek menandai akhir data scan.
      rfidBufferTimerRef.current = window.setTimeout(flushBuffer, 120);
    };

    window.addEventListener("keydown", handleKeydown);

    return () => {
      window.removeEventListener("keydown", handleKeydown);
      if (rfidBufferTimerRef.current) {
        window.clearTimeout(rfidBufferTimerRef.current);
        rfidBufferTimerRef.current = null;
      }
      rfidBufferRef.current = "";
    };
  }, [attendanceType, caiAttendanceMode]);

  const searchCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast(
        "error",
        "Gagal",
        "Browser Anda tidak mendukung fitur geolocation.",
      );
      return;
    }

    if (
      window.location.protocol !== "https:" &&
      window.location.hostname !== "localhost"
    ) {
      showToast(
        "error",
        "Gagal",
        "Geolocation memerlukan koneksi HTTPS. Gunakan HTTPS atau localhost untuk testing.",
      );
      return;
    }

    setSearchingLocation(true);

    const options = {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        formikRef.current.setFieldValue(
          "latitude",
          position.coords.latitude.toFixed(6),
        );
        formikRef.current.setFieldValue(
          "longitude",
          position.coords.longitude.toFixed(6),
        );
        formikRef.current.setFieldTouched("latitude", true);
        formikRef.current.setFieldTouched("longitude", true);
        setLocationAccuracy(
          `Akurasi sekitar ${Math.round(position.coords.accuracy)} meter`,
        );
        setSearchingLocation(false);
        showToast(
          "success",
          "Berhasil",
          "Lokasi berhasil diambil dari perangkat.",
        );
      },
      (error) => {
        setSearchingLocation(false);
        let errorMessage = "Gagal mengambil lokasi saat ini.";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              "Izin akses lokasi ditolak. Aktifkan izin lokasi di pengaturan browser Anda.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage =
              "Informasi lokasi tidak tersedia. Pastikan GPS aktif atau koneksi internet stabil.";
            break;
          case error.TIMEOUT:
            errorMessage =
              "Waktu pencarian lokasi habis. Coba lagi atau pastikan GPS aktif.";
            break;
          default:
            errorMessage = `Gagal mengambil lokasi: ${error.message || "Kesalahan tidak diketahui"}`;
        }

        showToast("error", "Gagal", errorMessage);
      },
      options,
    );
  };

  const venue = getVenueDetails(activityData);
  const isExpired = Boolean(activityData?.is_expired);
  const canFillAttendance = Boolean(activityData && !isExpired);

  const imageUrl = resolveImageUrl(activityData?.daerah?.img_url);

  return (
    <>
      <div className="relative overflow-hidden text-slate-900 transition-colors duration-300 dark:text-white">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-9 h-96 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_46%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.14),transparent_42%),linear-gradient(to_bottom,rgba(248,250,252,0.92),rgba(248,250,252,0.4),transparent)] dark:bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.16),transparent_46%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_42%),linear-gradient(to_bottom,rgba(2,6,23,0.92),rgba(2,6,23,0.55),transparent)]" />

        <div className="mx-auto flex w-full flex-col gap-6 p-3">
          {activityLoading ? (
            <section
              className={`${sectionCardClassName} grid gap-4 p-5 sm:p-6`}
            >
              <div className="h-6 w-48 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="h-28 animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-800" />
                <div className="h-28 animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-800" />
              </div>
              <div className="h-24 animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-800" />
            </section>
          ) : null}

          {!activityLoading && activityError && !activityData ? (
            <section className={`${sectionCardClassName} p-5 sm:p-6`}>
              <div className="grid items-center gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-[1.75rem] bg-slate-50 p-6 text-center dark:bg-slate-800/70">
                  <img
                    src="/emptyDataKegiatan.png"
                    alt="Data kegiatan tidak ditemukan"
                    className="mx-auto w-full max-w-sm opacity-90"
                  />
                </div>

                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                    <FiAlertTriangle />
                    Gagal memuat kegiatan
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                      Data kegiatan tidak tersedia
                    </h2>
                    <p className="max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                      {activityError}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => navigate("/")}
                      className="rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
                    >
                      Kembali ke beranda
                    </button>
                    {kodeKegiatanFromUrl ? (
                      <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        Muat ulang
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {activityData ? (
            <div className="grid gap-6">
              <div className="space-y-6">
                <section className={`${sectionCardClassName} p-5 sm:p-6`}>
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
                          {activityData.type_kegiatan}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${
                            isExpired
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
                              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                          }`}
                        >
                          {isExpired ? "Kedaluwarsa" : "Aktif"}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                          {activityData.nama_kegiatan}
                        </h2>
                        <p className="max-w-3xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                          {activityData.category} • Usia{" "}
                          {activityData.usia_mode}
                          {activityData.usia_min || activityData.usia_max
                            ? ` ${activityData.usia_min}-${activityData.usia_max} tahun`
                            : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                      <button
                        type="button"
                        onClick={() => setIsActivityModalOpen(true)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
                      >
                        <FiMapPin />
                        Lihat detail kegiatan
                      </button>
                      {isExpired ? (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200 lg:max-w-xs">
                          <div className="flex items-start gap-2">
                            <FiAlertTriangle className="mt-0.5 shrink-0" />
                            <p className="leading-relaxed">
                              {activityData.expired_message ||
                                "Kegiatan ini tidak lagi bisa dipakai untuk presensi."}
                            </p>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </section>

                {canFillAttendance ? (
                  <>
                    {!attendanceType ? (
                      <>
                        <StepperHeader
                          title="Absensi Online"
                          description="Pilih jenis absensi yang ingin Anda lakukan. No. kegiatan sudah terisi otomatis dari URL."
                          steps={["Pilih Tipe", "Data Presensi"]}
                          activeStep={0}
                        />

                        <div className="grid gap-4 md:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => setAttendanceType("cai")}
                            className="group relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-sky-300 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900"
                          >
                            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 transition group-hover:bg-sky-600 group-hover:text-white dark:bg-slate-800">
                              <svg
                                className="h-6 w-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                              Absen CAI
                            </h2>
                            <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                              Absensi untuk peserta CAI.
                            </p>
                          </button>

                          <button
                            type="button"
                            onClick={() => setAttendanceType("sensus")}
                            className="group relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-sky-300 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900"
                          >
                            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 transition group-hover:bg-sky-600 group-hover:text-white dark:bg-slate-800">
                              <svg
                                className="h-6 w-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 4.354a4 4 0 110 8.048M7.5 9.5H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2h-2.5M7.5 9.5H16.5"
                                />
                              </svg>
                            </div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                              Absen Muda/i
                            </h2>
                            <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                              Absensi untuk peserta Sensus (Muda/i).
                            </p>
                          </button>
                        </div>

                        <div className="flex justify-center">
                          <button
                            type="button"
                            onClick={() => navigate("/")}
                            className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            ← Kembali
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <StepperHeader
                          title="Absensi Online"
                          description="Lokasi harus diambil otomatis dari perangkat, bukan diketik manual. Radius meter dan petugas input ditetapkan oleh sistem."
                          steps={["Pilih Tipe", "Data Presensi"]}
                          activeStep={1}
                        />

                        {/* CAI Method Selector — hanya tampil saat tipe CAI */}
                        {attendanceType === "cai" && (
                          <div className={sectionCardClassName}>
                            <div className="p-5 sm:p-6">
                              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                                Metode presensi
                              </p>
                              <h3 className="mb-4 text-base font-bold text-slate-900 dark:text-white">
                                Pilih cara mengidentifikasi peserta
                              </h3>
                              <div className="grid gap-4 sm:grid-cols-2">
                                {CAI_METHODS.map((method) => (
                                  <CaiMethodCard
                                    key={method.value}
                                    method={method}
                                    active={caiAttendanceMode === method.value}
                                    onClick={() => {
                                      setCaiAttendanceMode(method.value);
                                      formikRef.current.setFieldValue(
                                        "id_peserta",
                                        "",
                                        false,
                                      );
                                      setRfidCode("");
                                      setRfidScanState("idle");
                                      setRfidStatusMessage(null);
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
                          <form
                            onSubmit={formik.handleSubmit}
                            className="space-y-5 rounded-4xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6"
                          >
                            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                  Data Presensi{" "}
                                  {attendanceType === "cai" ? "CAI" : "Muda/i"}
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                  Lengkapi identitas peserta, status presensi,
                                  dan lokasi perangkat.
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setAttendanceType(null);
                                  formikRef.current.resetForm();
                                  formikRef.current.setFieldValue(
                                    "kode_kegiatan",
                                    activityData?.kode_kegiatan ?? "",
                                    false,
                                  );
                                  setLocationAccuracy(null);
                                }}
                                className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                              >
                                ← Ubah tipe
                              </button>
                            </div>

                            <div className="grid gap-4 md:grid-cols-1">
                              {attendanceType === "cai" &&
                              caiAttendanceMode === "rfid" ? (
                                <RfidTappingPanel
                                  rfidCode={rfidCode}
                                  scanState={rfidScanState}
                                  statusMessage={rfidStatusMessage}
                                />
                              ) : (
                                <PrimeSelect
                                  label="Nama peserta"
                                  name="id_peserta"
                                  formik={formikRef.current}
                                  required
                                  options={participantOptions}
                                  isLoading={loadingParticipants}
                                  placeholder={
                                    loadingParticipants
                                      ? "Memuat peserta..."
                                      : "Pilih Nama Peserta"
                                  }
                                  onInputChange={(
                                    inputValue: string,
                                    actionMeta: InputActionMeta,
                                  ) => {
                                    if (actionMeta.action === "input-change") {
                                      setParticipantSearchTerm(inputValue);
                                    }

                                    return inputValue;
                                  }}
                                />
                              )}

                              <div className="hidden">
                                <PrimeInputText
                                  label="Latitude"
                                  name="latitude"
                                  formik={formikRef.current}
                                  readOnly
                                  required
                                />
                                <PrimeInputText
                                  label="Longitude"
                                  name="longitude"
                                  formik={formikRef.current}
                                  readOnly
                                  required
                                />
                              </div>

                              <div className="md:col-span-2">
                                <div className="mb-2 flex items-center justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                      Kehadiran{" "}
                                      <span className="text-rose-500">*</span>
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                      Pilih salah satu status presensi di bawah
                                      ini.
                                    </p>
                                  </div>
                                  {formikRef.current.touched.status_presensi &&
                                  formikRef.current.errors.status_presensi ? (
                                    <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
                                      {formikRef.current.errors.status_presensi}
                                    </p>
                                  ) : null}
                                </div>

                                <div className="grid gap-3 sm:grid-cols-3">
                                  {attendanceOptions.map((option) => {
                                    const isActive =
                                      formikRef.current.values
                                        .status_presensi === option.value;

                                    return (
                                      <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => {
                                          formikRef.current.setFieldValue(
                                            "status_presensi",
                                            option.value,
                                            true,
                                          );
                                          formikRef.current.setFieldTouched(
                                            "status_presensi",
                                            true,
                                            false,
                                          );
                                        }}
                                        className={`group flex h-full flex-col gap-3 rounded-[1.75rem] border p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-sky-500/10 ${
                                          isActive
                                            ? `${option.accent} border-current shadow-md`
                                            : "border-slate-200 bg-white text-slate-700 hover:border-sky-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                        }`}
                                        aria-pressed={isActive}
                                      >
                                        <div className="flex items-start justify-between gap-3">
                                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70 shadow-sm ring-1 ring-inset ring-slate-200 dark:bg-slate-800/80 dark:ring-slate-700">
                                            <svg
                                              className="h-5 w-5"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              {option.icon}
                                            </svg>
                                          </div>
                                          <span
                                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${
                                              isActive
                                                ? "bg-white/70 text-current"
                                                : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"
                                            }`}
                                          >
                                            {isActive ? "Dipilih" : "Pilih"}
                                          </span>
                                        </div>

                                        <div className="space-y-1">
                                          <h3 className="text-base font-bold">
                                            {option.label}
                                          </h3>
                                          <p className="text-sm leading-relaxed opacity-90">
                                            {option.description}
                                          </p>
                                        </div>

                                        <div
                                          className={`mt-auto h-1.5 w-full rounded-full ${
                                            isActive
                                              ? "bg-current"
                                              : "bg-slate-200 dark:bg-slate-700"
                                          }`}
                                        />
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {(formikRef.current.values.status_presensi ===
                                "sakit" ||
                                formikRef.current.values.status_presensi ===
                                  "izin") && (
                                <TextareaField
                                  label="Keterangan"
                                  name="keterangan"
                                  formik={formikRef.current}
                                  required
                                  className="md:col-span-2"
                                  rows={4}
                                />
                              )}
                            </div>

                            <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/40">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                    Cari lokasi otomatis
                                  </p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Tekan tombol untuk mengambil koordinat
                                    perangkat.
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={searchCurrentLocation}
                                  disabled={searchingLocation}
                                  className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {searchingLocation
                                    ? "Mencari..."
                                    : "Cari lokasi"}
                                </button>
                              </div>
                              {locationAccuracy ? (
                                <p className="mt-3 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                  {locationAccuracy}
                                </p>
                              ) : null}
                            </div>

                            <div className="flex justify-end border-t border-slate-200 pt-5 dark:border-slate-700">
                              <button
                                type="submit"
                                className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                                disabled={
                                  isSubmitting ||
                                  searchingLocation ||
                                  formikRef.current.values.latitude ===
                                    locationDefault ||
                                  formikRef.current.values.longitude ===
                                    locationDefault
                                }
                              >
                                {isSubmitting
                                  ? "Menyimpan..."
                                  : "Simpan Presensi"}
                              </button>
                            </div>
                          </form>

                          <aside className="space-y-4 self-start lg:sticky lg:top-6">
                            <div className={`${sectionCardClassName} p-5`}>
                              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                                Panduan
                              </p>
                              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                <li>
                                  Pastikan izin lokasi browser sudah aktif
                                  sebelum menyimpan.
                                </li>
                                <li>
                                  Pilih status presensi yang sesuai agar
                                  validasi keterangan berjalan otomatis.
                                </li>
                                <li>
                                  Gunakan tombol ubah tipe jika memilih kategori
                                  absensi yang salah.
                                </li>
                              </ul>
                            </div>
                          </aside>
                        </div>
                      </>
                    )}
                  </>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <Dialog
        visible={isActivityModalOpen}
        onHide={() => setIsActivityModalOpen(false)}
        header="Detail Kegiatan"
        modal
        dismissableMask
        blockScroll
        contentStyle={{ overflow: "auto" }}
        breakpoints={{
          "768px": "100vw",
          "640px": "100vw",
        }}
        className="activity-dialog w-[min(96vw,60rem)] max-md:w-screen max-md:h-screen max-md:max-w-none max-md:m-0"
      >
        {activityData ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4">
              <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/40">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">
                    Rincian Kegiatan
                  </p>
                </div>

                <div className="flex flex-col gap-4">
                  <div>
                    {isImagePreviewOpen && imageUrl ? (
                      <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                        onClick={() => setIsImagePreviewOpen(false)}
                      >
                        <div
                          className="relative w-full max-w-5xl"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => setIsImagePreviewOpen(false)}
                            className="absolute -top-12 right-0 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
                          >
                            Tutup
                          </button>
                          <img
                            src={imageUrl}
                            alt="Preview foto"
                            className="max-h-[85vh] w-full rounded-3xl object-contain shadow-2xl"
                          />
                        </div>
                      </div>
                    ) : null}
                    {imageUrl ? (
                      <button
                        type="button"
                        onClick={() => setIsImagePreviewOpen(true)}
                        className="mt-4 block w-full overflow-hidden rounded-3xl text-left transition hover:scale-[1.01] focus:outline-none focus:ring-4 focus:ring-sky-500/20"
                      >
                        <img
                          src={imageUrl}
                          alt="Foto CAI"
                          className="h-80 w-full rounded-3xl object-cover"
                        />
                      </button>
                    ) : (
                      <div className="mt-4 flex h-80 items-center justify-center rounded-3xl border border-dashed border-slate-300 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                        Foto tidak tersedia
                      </div>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <MiniDetail
                      label="No. Kegiatan"
                      value={activityData.kode_kegiatan}
                    />
                    <MiniDetail
                      label="Nama Kegiatan"
                      value={activityData.nama_kegiatan}
                    />
                    <MiniDetail
                      label="Jenis Kegiatan"
                      value={activityData.type_kegiatan}
                    />
                    <MiniDetail
                      label="Alamat"
                      value={
                        activityData.daerah?.alamat ||
                        activityData.desa?.alamat ||
                        activityData.kelompok?.alamat
                      }
                    />
                    <MiniDetail
                      label="Tanggal Kegiatan"
                      value={`${formatDateTime(activityData.jam_kegiatan)} s.d Selesai`}
                    />
                    <MiniDetail
                      label="Batas Presensi"
                      value={formatDateTime(activityData.expired_date_time)}
                    />
                  </div>

                  <div>
                    {(() => {
                      const lon = Number(venue.longitude);
                      const lat = Number(venue.latitude);
                      const hasCoords =
                        !Number.isNaN(lon) && !Number.isNaN(lat);

                      if (!hasCoords) {
                        return (
                          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-10 flex items-center justify-center text-sm text-gray-500">
                            <FiMapPin className="h-4 w-4 mr-2" />
                            Titik koordinat tidak tersedia
                          </div>
                        );
                      }

                      const delta = 0.005;
                      const left = lon - delta;
                      const right = lon + delta;
                      const bottom = lat - delta;
                      const top = lat + delta;
                      const iframeSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${lat}%2C${lon}`;
                      const openUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;

                      return (
                        <div>
                          <div className="overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-700">
                            <iframe
                              title="Peta lokasi"
                              src={iframeSrc}
                              loading="lazy"
                              className="w-full h-56 border-0"
                            />
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            <a
                              href={openUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="underline"
                            >
                              Buka Maps
                            </a>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {isExpired ? (
              <div className="rounded-3xl border border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300 p-4">
                <div className="flex items-start gap-3">
                  <FiAlertTriangle className="mt-1 shrink-0" />
                  <div>
                    <h4 className="text-base font-bold">
                      Kegiatan sudah kedaluwarsa
                    </h4>
                    <p className="mt-1 text-sm leading-relaxed opacity-90">
                      {activityData.expired_message ||
                        "Kegiatan ini tidak lagi bisa dipakai untuk presensi."}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </Dialog>
    </>
  );
};

export default PresensiPage;
