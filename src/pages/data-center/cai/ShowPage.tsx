import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { fetchCaiByUuid, recoverCaiYear } from "../../../services/dataCenter";
import { showToast } from "../../../services/toast";
import {
  formatBooleanLabel,
  maskText,
  resolveImageUrl,
} from "../../../utils/text";
import Sensitive from "../../../components/Sensitive";

type DetailValue = string | number | null | undefined;

interface CaiRecord {
  kode_cari_data?: string;
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

  const fields: Array<[string, DetailValue]> = [
    ["ID Peserta", maskText(record?.kode_cari_data || "-")],
    ["ID Daftar", maskText(record?.uuid || "-")],
    ["Nama lengkap", record?.nama_lengkap],
    ["Tanggal lahir", maskText(record?.tgl_lahir || "-")],
    ["Umur", record?.umur || "-"],
    ["Jenis kelamin", record?.jenis_kelamin],
    ["Utusan", record?.utusan || "-"],
    ["Daerah", record?.nm_daerah || "-"],
    ["Desa", record?.nm_desa || "-"],
    ["Kelompok", record?.nm_kelompok || "-"],
    ["Tahun", record?.tahun || "-"],
    ["Aktif", formatBooleanLabel(record?.is_active)],
  ];

  const imageUrl = resolveImageUrl(record?.img_url);

  return (
    <div className="w-full space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600 dark:text-sky-400">
              Detail CAI
            </p>
            <h1 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
              Ringkasan data peserta
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Data sensitif ditampilkan dengan penyamaran.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/digital-data/cai")}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-500 hover:text-sky-600 dark:border-slate-600 dark:text-slate-200"
            >
              ← Kembali
            </button>
            <button
              type="button"
              onClick={handleRecover}
              disabled={!isRecoverable || isRecovering}
              className="inline-flex items-center justify-center rounded-2xl border border-emerald-300 px-5 py-3 text-sm font-semibold text-emerald-700 transition hover:border-emerald-500 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-700 dark:text-emerald-300"
            >
              {isRecovering ? "Memulihkan..." : "Pulihkan Data Tahun"}
            </button>
            <Link
              to="/digital-data/cai/registration"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-500 hover:text-sky-600 dark:border-slate-600 dark:text-slate-200"
            >
              Registrasi baru
            </Link>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          Memuat data...
        </div>
      ) : record ? (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    {label}
                  </p>
                  <p className="mt-2 wrap-break-word text-sm font-semibold text-slate-900 dark:text-white">
                    <Sensitive value={value} />
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Foto
            </p>
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Foto CAI"
                className="mt-4 h-80 w-full rounded-3xl object-cover"
              />
            ) : (
              <div className="mt-4 flex h-80 items-center justify-center rounded-3xl border border-dashed border-slate-300 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                Foto tidak tersedia
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          Data tidak ditemukan.
        </div>
      )}
    </div>
  );
};

export default CaiShowPage;
