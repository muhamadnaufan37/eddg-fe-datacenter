import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiUser,
  FiMapPin,
  FiBriefcase,
  FiUsers,
  FiShield,
  FiMaximize2,
  FiCheckCircle,
} from "react-icons/fi";

import { fetchSensusByUuid } from "../../../services/dataCenter";
import { showToast } from "../../../services/toast";
import {
  maskText,
  resolveImageUrl,
} from "../../../utils/text";
import Sensitive from "../../../components/Sensitive";

interface SensusRecord {
  kode_cari_data?: string;
  nama_lengkap?: string;
  nama_panggilan?: string;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  umur?: number;
  alamat?: string;
  jenis_kelamin?: string;
  no_telepon?: string;
  nama_ayah?: string;
  nama_ibu?: string;
  hoby?: string;
  nm_pekerjaan?: string;
  usia_menikah?: string;
  kriteria_pasangan?: string;
  status_pernikahan?: boolean | number | string;
  status_sambung?: string | number;
  status_atlet_asad?: string | number;
  nm_daerah?: string;
  nm_desa?: string;
  nm_kelompok?: string;
  img_url?: string;
}

const SensusShowPage = () => {
  const { kodeUuid } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [record, setRecord] = useState<SensusRecord | null>(null);

  const getStatusSambungLabel = (status?: string | number) => {
    if (status == 2 || status === "2") return "PINDAH SAMBUNG";
    if (status == 1 || status === "1") return "SAMBUNG";
    if (status == 0 || status === "0") return "TIDAK SAMBUNG";
    return status || "TIDAK DIKETAHUI";
  };

  const getStatusPernikahanLabel = (status?: boolean | number | string) => {
    if (status == 1 || status === "1" || status === true) return "SUDAH MENIKAH";
    if (status == 0 || status === "0" || status === false) return "BELUM MENIKAH";
    return "BELUM MENIKAH";
  };

  const getStatusAtletAsadLabel = (status?: string | number) => {
    if (status == 1 || status === "1") return "ATLET";
    return "-";
  };

  useEffect(() => {
    const loadRecord = async () => {
      if (!kodeUuid) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetchSensusByUuid(kodeUuid);
        setRecord(response?.data ?? response);
      } catch {
        showToast("error", "Gagal", "Gagal mengambil detail sensus.");
      } finally {
        setLoading(false);
      }
    };

    void loadRecord();
  }, [kodeUuid]);

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
              <span className="text-xs font-bold text-white/80">Foto Profil Dokumen Sensus</span>
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
              alt="Preview foto sensus"
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
            onClick={() => navigate("/digital-data/sensus")}
            className="inline-flex items-center gap-2 rounded-xl border border-[#2373f4] bg-white px-3.5 py-2 text-xs font-bold text-[#2373f4] transition hover:bg-[#2373f4] hover:text-white dark:border-[#65d0f4] dark:bg-[#27374d] dark:text-[#65d0f4] dark:hover:bg-[#65d0f4] dark:hover:text-[#27374d]"
          >
            <FiArrowLeft />
            Kembali ke Sensus
          </button>
          <span className="text-xs font-bold text-slate-400 dark:text-[#9db2bf]">/ Ringkasan Portofolio</span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/digital-data/sensus/registration"
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
            Memuat berkas portofolio data sensus...
          </p>
        </div>
      ) : record ? (
        <div className="space-y-6">
          {/* Executive Portfolio Header Dossier Card */}
          <div className="relative overflow-hidden rounded-3xl border border-[#578ef5]/50 bg-gradient-to-br from-[#2373f4] via-[#3a83f6] to-[#1b5ecc] p-6 text-white shadow-2xl shadow-[#2373f4]/20 dark:border-[#526d82]/50 dark:from-[#27374d] dark:via-[#2f435c] dark:to-[#1c2736] sm:p-8">
            <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 left-1/4 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 right-1/3 h-64 w-64 rounded-full bg-[#65d0f4]/20 blur-3xl" />

            <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-start">
                {/* Profile Photo Avatar Frame */}
                <div className="relative shrink-0">
                  <div className="relative h-32 w-32 overflow-hidden rounded-2xl border-4 border-white/80 bg-white/10 shadow-2xl backdrop-blur-md transition-transform duration-300 hover:scale-105 sm:h-36 sm:w-36">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt="Foto Profil Sensus"
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
                <div className="flex flex-col items-center justify-center space-y-3 sm:items-start text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center gap-2.5 sm:justify-start">
                    <span className="rounded-lg bg-cyan-400 px-3 py-1 text-[10px] font-black tracking-widest text-[#1e293b] uppercase shadow-sm">
                      PORTOFOLIO RESMI
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white/90">
                      <FiCheckCircle className="text-sm text-cyan-300 dark:text-[#65d0f4]" />
                      Terverifikasi Sistem
                    </span>
                  </div>

                  <h1 className="text-2xl font-black tracking-tight text-white drop-shadow-md sm:text-3xl lg:text-4xl">
                    <Sensitive value={record.nama_lengkap ?? "Nama Peserta"} />
                  </h1>

                  <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-white/90 sm:justify-start">
                    {record.nama_panggilan && (
                      <span className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur-sm">
                        Panggilan: &quot;{record.nama_panggilan}&quot;
                      </span>
                    )}
                    <span className="rounded-lg border border-black/10 bg-black/20 px-3 py-1.5 font-mono text-cyan-300 backdrop-blur-sm dark:text-[#65d0f4]">
                      ID: {maskText(record.kode_cari_data ?? "-")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Chips Block */}
              <div className="mt-4 grid w-full grid-cols-2 gap-3 sm:grid-cols-3 md:mt-0 md:w-auto md:flex md:flex-col md:items-end">
                <div className="col-span-1 flex flex-col items-center justify-center rounded-xl border border-white/10 bg-black/20 p-3 text-center backdrop-blur-md md:w-auto md:min-w-[180px] md:px-6 md:py-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">
                    Status Sambung
                  </span>
                  <span className="mt-1 text-sm font-black text-white">
                    {getStatusSambungLabel(record.status_sambung)}
                  </span>
                </div>

                <div className="col-span-1 flex flex-col items-center justify-center rounded-xl border border-white/10 bg-black/20 p-3 text-center backdrop-blur-md md:w-auto md:min-w-[180px] md:px-6 md:py-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">
                    Status Pernikahan
                  </span>
                  <span className="mt-1 text-sm font-black text-cyan-300 dark:text-[#65d0f4]">
                    {getStatusPernikahanLabel(record.status_pernikahan)}
                  </span>
                </div>

                <div className="col-span-2 flex flex-col items-center justify-center rounded-xl border border-white/10 bg-black/20 p-3 text-center sm:col-span-1 backdrop-blur-md md:w-auto md:min-w-[180px] md:px-6 md:py-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">
                    Status Atlet ASAD
                  </span>
                  <span className="mt-1 text-sm font-black text-cyan-300 dark:text-[#65d0f4]">
                    {getStatusAtletAsadLabel(record.status_atlet_asad)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Elegant Bento Grid Portfolio Sections */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Section 1: Demografi & Identitas Pribadi */}
            <div className="flex flex-col justify-between rounded-3xl border-2 border-[#cbdcf5] bg-white p-6 shadow-sm transition hover:shadow-md dark:border-[#526d82] dark:bg-[#27374d]">
              <div>
                <div className="flex items-center gap-2.5 border-b border-[#cbdcf5]/70 pb-3 dark:border-[#526d82]/60">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2373f4] text-white shadow-xs dark:bg-[#65d0f4] dark:text-[#1c2736]">
                    <FiUser className="text-base" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 dark:text-[#dde6ed]">
                      Identitas & Demografi
                    </h2>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-[#9db2bf]">
                      Informasi biologis dan usia peserta
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

                  <div className="rounded-2xl border border-[#cbdcf5] bg-[#edf2f9] p-3.5 dark:border-[#526d82]/60 dark:bg-[#1c2736]">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#2373f4] dark:text-[#65d0f4]">
                      Tempat Lahir
                    </span>
                    <p className="mt-1 break-all text-sm font-bold text-slate-900 dark:text-[#dde6ed]">
                      <Sensitive value={maskText(record.tempat_lahir)} />
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#cbdcf5] bg-[#edf2f9] p-3.5 dark:border-[#526d82]/60 dark:bg-[#1c2736]">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#2373f4] dark:text-[#65d0f4]">
                      Tanggal Lahir
                    </span>
                    <p className="mt-1 break-all text-sm font-bold text-slate-900 dark:text-[#dde6ed]">
                      <Sensitive value={maskText(record.tanggal_lahir)} />
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Teritori & Wilayah Sambung */}
            <div className="flex flex-col justify-between rounded-3xl border-2 border-[#cbdcf5] bg-white p-6 shadow-sm transition hover:shadow-md dark:border-[#526d82] dark:bg-[#27374d]">
              <div>
                <div className="flex items-center gap-2.5 border-b border-[#cbdcf5]/70 pb-3 dark:border-[#526d82]/60">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#578ef5] text-white shadow-xs dark:bg-[#578ef5]">
                    <FiMapPin className="text-base" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 dark:text-[#dde6ed]">
                      Hierarki Wilayah & Lokasi
                    </h2>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-[#9db2bf]">
                      Penempatan domisili dan kelompok sambung
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {/* Breadcrumb Hierarchy */}
                  <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#cbdcf5] bg-[#edf2f9] p-3.5 dark:border-[#526d82]/60 dark:bg-[#1c2736]">
                    <span className="rounded-md bg-[#2373f4] px-2 py-0.5 text-[10px] font-bold text-white">
                      Daerah: {record.nm_daerah ?? "-"}
                    </span>
                    <span className="text-slate-400">›</span>
                    <span className="rounded-md bg-[#578ef5] px-2 py-0.5 text-[10px] font-bold text-white">
                      Desa: {record.nm_desa ?? "-"}
                    </span>
                    <span className="text-slate-400">›</span>
                    <span className="rounded-md bg-[#65d0f4] px-2 py-0.5 text-[10px] font-bold text-[#1c2736]">
                      Kelompok: {record.nm_kelompok ?? "-"}
                    </span>
                  </div>

                  <div className="rounded-2xl border border-[#cbdcf5] bg-[#edf2f9] p-3.5 dark:border-[#526d82]/60 dark:bg-[#1c2736]">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#2373f4] dark:text-[#65d0f4]">
                      Alamat Lengkap
                    </span>
                    <p className="mt-1 break-all text-sm font-bold leading-relaxed text-slate-900 dark:text-[#dde6ed]">
                      <Sensitive value={maskText(record.alamat, 3, 2)} />
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Garis Keluarga & Kontak */}
            <div className="flex flex-col justify-between rounded-3xl border-2 border-[#cbdcf5] bg-white p-6 shadow-sm transition hover:shadow-md dark:border-[#526d82] dark:bg-[#27374d]">
              <div>
                <div className="flex items-center gap-2.5 border-b border-[#cbdcf5]/70 pb-3 dark:border-[#526d82]/60">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#65d0f4] text-[#1c2736] shadow-xs">
                    <FiUsers className="text-base" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 dark:text-[#dde6ed]">
                      Nasab Keluarga & Kontak
                    </h2>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-[#9db2bf]">
                      Orang tua kandung dan saluran komunikasi
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[#cbdcf5] bg-[#edf2f9] p-3.5 dark:border-[#526d82]/60 dark:bg-[#1c2736]">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#2373f4] dark:text-[#65d0f4]">
                      Nama Ayah Kandung
                    </span>
                    <p className="mt-1 break-all text-sm font-bold text-slate-900 dark:text-[#dde6ed]">
                      <Sensitive value={maskText(record.nama_ayah)} />
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#cbdcf5] bg-[#edf2f9] p-3.5 dark:border-[#526d82]/60 dark:bg-[#1c2736]">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#2373f4] dark:text-[#65d0f4]">
                      Nama Ibu Kandung
                    </span>
                    <p className="mt-1 break-all text-sm font-bold text-slate-900 dark:text-[#dde6ed]">
                      <Sensitive value={maskText(record.nama_ibu)} />
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#cbdcf5] bg-[#edf2f9] p-3.5 sm:col-span-2 dark:border-[#526d82]/60 dark:bg-[#1c2736]">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#2373f4] dark:text-[#65d0f4]">
                      Nomor Telepon / WhatsApp
                    </span>
                    <p className="mt-1 break-all text-sm font-bold text-slate-900 dark:text-[#dde6ed]">
                      <Sensitive value={maskText(record.no_telepon, 3, 2)} />
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Karir, Sosial & Preferensi */}
            <div className="flex flex-col justify-between rounded-3xl border-2 border-[#cbdcf5] bg-white p-6 shadow-sm transition hover:shadow-md dark:border-[#526d82] dark:bg-[#27374d]">
              <div>
                <div className="flex items-center gap-2.5 border-b border-[#cbdcf5]/70 pb-3 dark:border-[#526d82]/60">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2373f4] text-white shadow-xs dark:bg-[#65d0f4] dark:text-[#1c2736]">
                    <FiBriefcase className="text-base" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 dark:text-[#dde6ed]">
                      Profesi & Informasi Sosial
                    </h2>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-[#9db2bf]">
                      Aktivitas kerja, hobi, dan kriteria
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[#cbdcf5] bg-[#edf2f9] p-3.5 dark:border-[#526d82]/60 dark:bg-[#1c2736]">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#2373f4] dark:text-[#65d0f4]">
                      Pekerjaan
                    </span>
                    <p className="mt-1 break-all text-sm font-bold text-slate-900 dark:text-[#dde6ed]">
                      {record.nm_pekerjaan ?? "-"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#cbdcf5] bg-[#edf2f9] p-3.5 dark:border-[#526d82]/60 dark:bg-[#1c2736]">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#2373f4] dark:text-[#65d0f4]">
                      Hobi & Minat
                    </span>
                    <p className="mt-1 break-all text-sm font-bold text-slate-900 dark:text-[#dde6ed]">
                      <Sensitive value={maskText(record.hoby)} />
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#cbdcf5] bg-[#edf2f9] p-3.5 dark:border-[#526d82]/60 dark:bg-[#1c2736]">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#2373f4] dark:text-[#65d0f4]">
                      Rencana Usia Menikah
                    </span>
                    <p className="mt-1 break-all text-sm font-bold text-slate-900 dark:text-[#dde6ed]">
                      <Sensitive value={maskText(record.usia_menikah || "-")} />
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#cbdcf5] bg-[#edf2f9] p-3.5 dark:border-[#526d82]/60 dark:bg-[#1c2736]">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#2373f4] dark:text-[#65d0f4]">
                      Kriteria Pasangan
                    </span>
                    <p className="mt-1 break-all text-sm font-bold text-slate-900 dark:text-[#dde6ed]">
                      <Sensitive value={maskText(record.kriteria_pasangan || "-")} />
                    </p>
                  </div>
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
                  Terverifikasi Sistem Basis Data Terpusat SIPANDA
                </p>
                <p className="text-[11px] text-slate-500 dark:text-[#9db2bf]">
                  Dokumen digital resmi dengan penyamaran data sensitif aktif (Protected Record).
                </p>
              </div>
            </div>

            <span className="font-mono text-xs font-bold text-[#2373f4] dark:text-[#65d0f4]">
              UUID: {maskText(kodeUuid)}
            </span>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border-2 border-dashed border-[#cbdcf5] bg-white p-12 text-center shadow-sm dark:border-[#526d82] dark:bg-[#27374d]">
          <h3 className="text-base font-bold text-slate-900 dark:text-[#dde6ed]">
            Data Sensus Tidak Ditemukan
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-[#9db2bf]">
            Kode referensi sensus tidak valid atau belum terdaftar dalam sistem.
          </p>
          <button
            type="button"
            onClick={() => navigate("/digital-data/sensus")}
            className="mt-4 rounded-xl bg-[#2373f4] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#195ac7]"
          >
            Kembali ke Pencarian
          </button>
        </div>
      )}
    </div>
  );
};

export default SensusShowPage;
