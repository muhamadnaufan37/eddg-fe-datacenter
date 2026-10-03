import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiUser,
  FiMapPin,
  FiShield,
  FiMaximize2,
  FiCheckCircle,
  FiCreditCard,
  FiRefreshCw,
} from "react-icons/fi";

import { fetchCaiByUuid, recoverCaiYear } from "../../../services/dataCenter";
import { showToast } from "../../../services/toast";
import {
  formatBooleanLabel,
  maskText,
  resolveImageUrl,
} from "../../../utils/text";
import Sensitive from "../../../components/Sensitive";

interface CaiRecord {
  kode_cari_data?: string;
  id_card?: string;
  uuid?: string;
  nama_lengkap?: string;
  tgl_lahir?: string;
  umur?: string;
  jenis_kelamin?: string;
  utusan?: string;
  nm_daerah?: string;
  nm_desa?: string;
  nm_kelompok?: string;
  tahun?: number;
  is_active?: boolean;
  img_url?: string;
}

const CaiShowPage = () => {
  const { kodeUuid } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isRecovering, setIsRecovering] = useState(false);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [record, setRecord] = useState<CaiRecord | null>(null);

  const currentYear = new Date().getFullYear();
  const isRecoverable = record?.tahun !== currentYear;

  useEffect(() => {
    const loadRecord = async () => {
      if (!kodeUuid) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetchCaiByUuid(kodeUuid);
        setRecord(response?.data ?? response);
      } catch {
        showToast("error", "Gagal", "Gagal mengambil detail CAI.");
      } finally {
        setLoading(false);
      }
    };

    void loadRecord();
  }, [kodeUuid]);

  const handleRecover = async () => {
    if (!record) {
      return;
    }

    try {
      setIsRecovering(true);

      const response = await recoverCaiYear({
        nama_lengkap: record.kode_cari_data ?? "",
        from_year: record.tahun ?? currentYear,
        to_year: currentYear,
      });

      showToast(
        "success",
        "Berhasil",
        response?.message ?? "Data CAI berhasil dipulihkan.",
      );
    } catch (error: any) {
      showToast(
        "error",
        "Gagal",
        error?.response?.data?.message ||
        error?.message ||
        "Gagal memulihkan data CAI.",
      );
    } finally {
      setIsRecovering(false);
    }
  };

  const imageUrl = resolveImageUrl(record?.img_url);

  return (
    <div className="w-full space-y-6 pb-12 print:space-y-4 print:pb-0 print:[color-adjust:exact] print:[-webkit-print-color-adjust:exact]">
      {/* Lightbox Image Preview Modal */}
      {isImagePreviewOpen && imageUrl ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setIsImagePreviewOpen(false)}
        >
          <div
            className="relative w-full max-w-3xl overflow-hidden rounded-3xl border-2 border-white/20 bg-slate-950 p-2 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3">
              <span className="text-xs font-bold text-white/80">Foto Peserta Kegiatan CAI</span>
              <button
                type="button"
                onClick={() => setIsImagePreviewOpen(false)}
                className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-white/20"
              >
                Tutup
              </button>
            </div>
            <img
              src={imageUrl}
              alt="Preview foto CAI"
              className="max-h-[75vh] w-full rounded-2xl object-contain shadow-2xl"
            />
          </div>
        </div>
      ) : null}

      {/* Top Action Nav Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border-2 border-[#cbdcf5] bg-white p-4 shadow-sm dark:border-[#526d82] dark:bg-[#27374d] sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/digital-data/cai")}
            className="inline-flex items-center gap-2 rounded-xl border border-[#2373f4] bg-white px-3.5 py-2 text-xs font-bold text-[#2373f4] transition hover:bg-[#2373f4] hover:text-white dark:border-[#65d0f4] dark:bg-[#27374d] dark:text-[#65d0f4] dark:hover:bg-[#65d0f4] dark:hover:text-[#27374d]"
          >
            <FiArrowLeft />
            Kembali ke CAI
          </button>
          <span className="text-xs font-bold text-slate-400 dark:text-[#9db2bf]">/ Portofolio Peserta</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isRecoverable && (
            <button
              type="button"
              onClick={handleRecover}
              disabled={isRecovering}
              className="inline-flex items-center gap-1.5 rounded-xl border-2 border-emerald-400 bg-emerald-50 px-3.5 py-2 text-xs font-extrabold text-emerald-700 shadow-sm transition hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300"
            >
              <FiRefreshCw className={isRecovering ? "animate-spin" : ""} />
              {isRecovering ? "Memulihkan..." : `Pulihkan ke Tahun ${currentYear}`}
            </button>
          )}

          <Link
            to="/digital-data/cai/registration"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#2373f4] px-4 py-2 text-xs font-bold text-[#ffffff] whitespace-nowrap shadow-md shadow-[#2373f4]/25 transition hover:bg-[#578ef5] hover:text-[#ffffff] dark:bg-[#578ef5] dark:shadow-[#578ef5]/25 dark:text-[#ffffff] dark:hover:bg-[#65d0f4] dark:hover:text-[#27374d]"
          >
            + Registrasi Baru
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-[#cbdcf5] bg-white p-16 text-center shadow-sm dark:border-[#526d82] dark:bg-[#27374d]">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2373f4] border-t-transparent" />
          <p className="mt-4 text-sm font-bold text-slate-700 dark:text-[#dde6ed]">
            Memuat berkas portofolio data peserta CAI...
          </p>
        </div>
      ) : record ? (
        <div className="space-y-6">
          {/* Executive Portfolio Header Dossier Card */}
          <div className="relative overflow-hidden rounded-3xl border border-[#578ef5]/50 bg-gradient-to-br from-[#2373f4] via-[#3a83f6] to-[#1b5ecc] p-6 text-white shadow-2xl shadow-[#2373f4]/20 dark:border-[#526d82]/50 dark:from-[#27374d] dark:via-[#2f435c] dark:to-[#1c2736] sm:p-8">
            <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 left-1/4 h-72 w-72 rounded-full bg-[#f2f7a0]/15 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 right-1/3 h-64 w-64 rounded-full bg-[#65d0f4]/20 blur-3xl" />

            <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-start">
                {/* Profile Photo Avatar Frame */}
                <div className="relative shrink-0">
                  <div className="relative h-32 w-32 overflow-hidden rounded-2xl border-4 border-white/80 bg-white/10 shadow-2xl backdrop-blur-md transition-transform duration-300 hover:scale-105 sm:h-36 sm:w-36">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt="Foto Profil Peserta CAI"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[#2373f4]/40 text-white backdrop-blur-sm">
                        <FiUser className="text-6xl opacity-75" />
                      </div>
                    )}
                  </div>

                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setIsImagePreviewOpen(true)}
                      className="absolute -bottom-3 -right-3 flex h-10 w-10 items-center justify-center rounded-full border-4 border-[#2373f4] bg-white text-[#2373f4] shadow-lg transition-transform hover:scale-110 dark:border-[#27374d]"
                      title="Perbesar Foto"
                    >
                      <FiMaximize2 className="text-sm" />
                    </button>
                  )}
                </div>

                {/* Identity Info */}
                <div className="flex flex-col items-center justify-center space-y-3 sm:items-start">
                  <div className="flex flex-wrap items-center justify-center gap-2.5 sm:justify-start">
                    <span className="rounded-lg bg-[#f2f7a0] px-3 py-1 text-[10px] font-black tracking-widest text-[#1e293b] uppercase shadow-sm">
                      PESERTA CAI TERVERIFIKASI
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white/95">
                      <FiCheckCircle className="text-sm text-[#f2f7a0] dark:text-[#65d0f4]" />
                      Tahun Kegiatan: {record.tahun ?? currentYear}
                    </span>
                  </div>

                  <h1 className="text-center text-2xl font-black tracking-tight text-white drop-shadow-md sm:text-left sm:text-3xl lg:text-4xl">
                    <Sensitive value={record.nama_lengkap ?? "Nama Peserta"} />
                  </h1>

                  <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-white/90 sm:justify-start">
                    <span className="rounded-lg border border-black/10 bg-black/20 px-3 py-1.5 font-mono text-[#f2f7a0] backdrop-blur-sm dark:text-[#65d0f4]">
                      ID Peserta: {maskText(record.kode_cari_data ?? "-")}
                    </span>
                    {record.utusan && (
                      <span className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 font-bold backdrop-blur-sm">
                        Utusan: {record.utusan}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Chips Block */}
              <div className="mt-2 grid w-full grid-cols-2 gap-2.5 sm:grid-cols-2 lg:mt-0 lg:w-auto lg:flex lg:flex-col lg:items-end">
                <div className="col-span-1 flex flex-col items-center justify-center rounded-xl border border-white/10 bg-black/20 p-2.5 text-center backdrop-blur-md lg:w-auto lg:min-w-[170px] lg:px-6 lg:py-2">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-white/80">
                    Status Keaktifan
                  </span>
                  <span className="text-[13px] font-black text-[#f2f7a0] dark:text-[#65d0f4]">
                    {formatBooleanLabel(record.is_active)}
                  </span>
                </div>

                <div className="col-span-1 flex flex-col items-center justify-center rounded-xl border border-white/10 bg-black/20 p-2.5 text-center backdrop-blur-md lg:w-auto lg:min-w-[170px] lg:px-6 lg:py-2">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-white/80">
                    ID Card RFID
                  </span>
                  <span className="font-mono text-[13px] font-black text-white">
                    {maskText(record.id_card || "-")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Elegant Bento Grid Portfolio Sections */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Section 1: Demografi & Biodata Peserta */}
            <div className="flex flex-col justify-between rounded-3xl border-2 border-[#cbdcf5] bg-white p-6 shadow-sm transition hover:shadow-md dark:border-[#526d82] dark:bg-[#27374d]">
              <div>
                <div className="flex items-center gap-2.5 border-b border-[#cbdcf5]/70 pb-3 dark:border-[#526d82]/60">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2373f4] text-white shadow-xs dark:bg-[#65d0f4] dark:text-[#1c2736]">
                    <FiUser className="text-base" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 dark:text-[#dde6ed]">
                      Biodata Peserta CAI
                    </h2>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-[#9db2bf]">
                      Identitas fisik dan tanggal kelahiran
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[#cbdcf5] bg-[#edf2f9] p-3.5 dark:border-[#526d82]/60 dark:bg-[#1c2736]">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#2373f4] dark:text-[#65d0f4]">
                      Jenis Kelamin
                    </span>
                    <p className="mt-1 break-all text-sm font-bold text-slate-900 dark:text-[#dde6ed]">
                      {record.jenis_kelamin ?? "-"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#cbdcf5] bg-[#edf2f9] p-3.5 dark:border-[#526d82]/60 dark:bg-[#1c2736]">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#2373f4] dark:text-[#65d0f4]">
                      Usia / Umur
                    </span>
                    <p className="mt-1 break-all text-sm font-bold text-slate-900 dark:text-[#dde6ed]">
                      {record.umur ? `${record.umur} Tahun` : "-"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#cbdcf5] bg-[#edf2f9] p-3.5 sm:col-span-2 dark:border-[#526d82]/60 dark:bg-[#1c2736]">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#2373f4] dark:text-[#65d0f4]">
                      Tanggal Lahir
                    </span>
                    <p className="mt-1 break-all text-sm font-bold text-slate-900 dark:text-[#dde6ed]">
                      <Sensitive value={maskText(record.tgl_lahir || "-")} />
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Teritori & Wilayah Sambung */}
            <div className="flex flex-col justify-between rounded-3xl border-2 border-[#cbdcf5] bg-white p-6 shadow-sm transition hover:shadow-md dark:border-[#526d82] dark:bg-[#27374d]">
              <div>
                <div className="flex items-center gap-2.5 border-b border-[#cbdcf5]/70 pb-3 dark:border-[#526d82]/60">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#578ef5] text-white shadow-xs">
                    <FiMapPin className="text-base" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 dark:text-[#dde6ed]">
                      Penempatan Wilayah & Kontingen
                    </h2>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-[#9db2bf]">
                      Struktur wilayah terdaftar pada data center
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#cbdcf5] bg-[#edf2f9] p-3.5 dark:border-[#526d82]/60 dark:bg-[#1c2736]">
                    <span className="rounded-md bg-[#2373f4] px-2.5 py-0.5 text-[10px] font-bold text-white">
                      Daerah: {record.nm_daerah ?? "-"}
                    </span>
                    <span className="text-slate-400">›</span>
                    <span className="rounded-md bg-[#578ef5] px-2.5 py-0.5 text-[10px] font-bold text-white">
                      Desa: {record.nm_desa ?? "-"}
                    </span>
                    <span className="text-slate-400">›</span>
                    <span className="rounded-md bg-[#65d0f4] px-2.5 py-0.5 text-[10px] font-bold text-[#1c2736]">
                      Kelompok: {record.nm_kelompok ?? "-"}
                    </span>
                  </div>

                  <div className="rounded-2xl border border-[#cbdcf5] bg-[#edf2f9] p-3.5 dark:border-[#526d82]/60 dark:bg-[#1c2736]">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#2373f4] dark:text-[#65d0f4]">
                      Utusan / Kontingen
                    </span>
                    <p className="mt-1 break-all text-sm font-bold text-slate-900 dark:text-[#dde6ed]">
                      {record.utusan ?? "Kontingen Terdaftar"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Kredensial Pendaftaran & Sistem */}
            <div className="rounded-3xl border-2 border-[#cbdcf5] bg-white p-6 shadow-sm transition hover:shadow-md md:col-span-2 dark:border-[#526d82] dark:bg-[#27374d]">
              <div className="flex items-center gap-2.5 border-b border-[#cbdcf5]/70 pb-3 dark:border-[#526d82]/60">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#65d0f4] text-[#1c2736] shadow-xs">
                  <FiCreditCard className="text-base" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-[#dde6ed]">
                    Kredensial Pendaftaran & Validasi
                  </h2>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-[#9db2bf]">
                    Identifikasi UUID dan data kartu perangkat
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3.5 sm:grid-cols-3">
                <div className="rounded-2xl border border-[#cbdcf5] bg-[#edf2f9] p-3.5 dark:border-[#526d82]/60 dark:bg-[#1c2736]">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#2373f4] dark:text-[#65d0f4]">
                    ID Peserta
                  </span>
                  <p className="mt-1 font-mono text-sm font-bold text-slate-900 dark:text-[#dde6ed]">
                    {maskText(record.kode_cari_data || "-")}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#cbdcf5] bg-[#edf2f9] p-3.5 dark:border-[#526d82]/60 dark:bg-[#1c2736]">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#2373f4] dark:text-[#65d0f4]">
                    ID Pendaftaran (UUID)
                  </span>
                  <p className="mt-1 font-mono text-sm font-bold text-slate-900 dark:text-[#dde6ed]">
                    <Sensitive value={maskText(record.uuid || "-")} />
                  </p>
                </div>

                <div className="rounded-2xl border border-[#cbdcf5] bg-[#edf2f9] p-3.5 dark:border-[#526d82]/60 dark:bg-[#1c2736]">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#2373f4] dark:text-[#65d0f4]">
                    Tahun Kegiatan
                  </span>
                  <p className="mt-1 break-all text-sm font-bold text-slate-900 dark:text-[#dde6ed]">
                    {record.tahun ?? currentYear}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Cryptographic Security Seal Footer */}
          <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border-2 border-[#cbdcf5] bg-white p-4 shadow-xs dark:border-[#526d82] dark:bg-[#27374d] sm:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                <FiShield className="text-base" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-[#dde6ed]">
                  Terverifikasi Sistem Basis Data CAI Data Center
                </p>
                <p className="text-[11px] text-slate-500 dark:text-[#9db2bf]">
                  Dokumen digital resmi dengan penyamaran data sensitif aktif (Protected Record).
                </p>
              </div>
            </div>

            <span className="font-mono text-xs font-bold text-[#2373f4] dark:text-[#65d0f4]">
              UUID: {kodeUuid}
            </span>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border-2 border-dashed border-[#cbdcf5] bg-white p-12 text-center shadow-sm dark:border-[#526d82] dark:bg-[#27374d]">
          <h3 className="text-base font-bold text-slate-900 dark:text-[#dde6ed]">
            Data Peserta CAI Tidak Ditemukan
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-[#9db2bf]">
            Kode referensi CAI tidak valid atau belum terdaftar dalam sistem.
          </p>
          <button
            type="button"
            onClick={() => navigate("/digital-data/cai")}
            className="mt-4 rounded-xl bg-[#2373f4] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#195ac7]"
          >
            Kembali ke Pencarian
          </button>
        </div>
      )}
    </div>
  );
};

export default CaiShowPage;
