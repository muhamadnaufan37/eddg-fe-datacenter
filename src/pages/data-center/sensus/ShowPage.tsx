import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { fetchSensusByUuid } from "../../../services/dataCenter";
import { showToast } from "../../../services/toast";
import {
  formatBooleanLabel,
  maskText,
  resolveImageUrl,
} from "../../../utils/text";
import Sensitive from "../../../components/Sensitive";

type DetailValue = string | number | null | undefined;

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
  status_pernikahan?: boolean;
  status_sambung?: string;
  nm_daerah?: string;
  nm_desa?: string;
  nm_kelompok?: string;
  img_url?: string;
}

const SensusShowPage = () => {
  const { kodeUuid } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<SensusRecord | null>(null);

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

  const fields: Array<[string, DetailValue]> = [
    ["Kode cari data", maskText(record?.kode_cari_data)],
    ["Nama lengkap", record?.nama_lengkap],
    ["Nama panggilan", record?.nama_panggilan],
    ["Tempat lahir", maskText(record?.tempat_lahir)],
    ["Tanggal lahir", maskText(record?.tanggal_lahir)],
    ["Umur", record?.umur],
    ["Alamat", maskText(record?.alamat, 3, 2)],
    ["Jenis kelamin", record?.jenis_kelamin],
    ["No telepon", maskText(record?.no_telepon, 3, 2)],
    ["Nama ayah", maskText(record?.nama_ayah)],
    ["Nama ibu", maskText(record?.nama_ibu)],
    ["Hoby", record?.hoby],
    ["Pekerjaan", record?.nm_pekerjaan],
    ["Usia menikah", record?.usia_menikah || "-"],
    ["Kriteria pasangan", record?.kriteria_pasangan || "-"],
    ["Daerah", record?.nm_daerah],
    ["Desa", record?.nm_desa],
    ["Kelompok", record?.nm_kelompok],
    ["Status pernikahan", formatBooleanLabel(record?.status_pernikahan)],
    ["Status sambung", record?.status_sambung],
  ];

  const imageUrl = resolveImageUrl(record?.img_url);

  return (
    <div className="w-full space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600 dark:text-sky-400">
              Detail Sensus
            </p>
            <h1 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
              Ringkasan data sensus
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Data sensitif ditampilkan dengan penyamaran.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/digital-data/sensus")}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-500 hover:text-sky-600 dark:border-slate-600 dark:text-slate-200"
            >
              ← Kembali
            </button>
            <Link
              to="/digital-data/sensus/registration"
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
                alt="Foto sensus"
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

export default SensusShowPage;
