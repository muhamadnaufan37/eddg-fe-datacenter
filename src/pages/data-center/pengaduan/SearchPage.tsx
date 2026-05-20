import { useState } from "react";
import { useFormik } from "formik";
import { useNavigate } from "react-router-dom";
import * as Yup from "yup";

import {
  PrimeInputText,
  StepperHeader,
} from "../../../components/forms/FormFields";
import { searchPengaduanData } from "../../../services/dataCenter";
import { showToast } from "../../../services/toast";
import { extractArrayResult } from "../../../utils/response";

type PengaduanSearchValues = {
  kontak: string;
};

type PengaduanRecord = {
  id?: number;
  uuid?: string;
  nama_lengkap?: string;
  kontak?: string;
  jenis_pengaduan?: string;
  subjek?: string;
  isi_pengaduan?: string;
  lampiran?: string;
  lampiran_url?: string;
  ip_address?: string;
  user_agent?: string;
  nama_kelompok?: string;
  status_pengaduan?: string;
  balasan_admin?: string | null;
  tanggal_dibalas?: string | null;
  dibalas_oleh?: number | null;
  dibalas_oleh_user?: {
    nama_lengkap?: string;
    username?: string;
  } | null;
  created_at?: string;
  updated_at?: string;
};

const shouldShowReply = (record: PengaduanRecord) => {
  return !(
    record.dibalas_oleh === null && record.status_pengaduan === "pending"
  );
};

const PengaduanSearchPage = () => {
  const navigate = useNavigate();
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<PengaduanRecord[]>([]);
  const [searched, setSearched] = useState(false);

  const formik = useFormik<PengaduanSearchValues>({
    initialValues: { kontak: "62" },
    validationSchema: Yup.object({
      kontak: Yup.string()
        .required("Kontak wajib diisi")
        .test("phone", "Format kontak tidak valid", (value) => {
          if (!value) return false;
          return /^62\d{9,12}$/.test(value);
        }),
    }),
    onSubmit: async (values) => {
      try {
        setIsSearching(true);
        const response = await searchPengaduanData(values);
        const data = extractArrayResult<PengaduanRecord>(response);
        setResults(data);
        setSearched(true);

        if (data.length === 0) {
          showToast(
            "info",
            "Tidak ditemukan",
            response?.message ?? "Data pengaduan tidak ditemukan.",
          );
          return;
        }

        showToast(
          "success",
          "Berhasil",
          response?.message ?? "Data pengaduan ditemukan.",
        );
      } catch (error: any) {
        setResults([]);
        setSearched(true);
        showToast(
          "error",
          "Gagal",
          error?.response?.data?.message ||
            error?.message ||
            "Gagal mencari data pengaduan.",
        );
      } finally {
        setIsSearching(false);
      }
    },
  });

  return (
    <div className="w-full space-y-6">
      <StepperHeader
        title="Cari Data Pengaduan"
        description="Masukkan kontak pelapor untuk melihat status pengaduan dan balasan admin bila sudah ada."
        steps={["Form Cari Data"]}
        activeStep={0}
      />

      <form
        onSubmit={formik.handleSubmit}
        className="space-y-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Form Cari Data
          </h2>
          <button
            type="button"
            onClick={() => navigate("/digital-data/pengaduan")}
            className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            ← Kembali
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <PrimeInputText
              label="Kontak"
              name="kontak"
              formik={formik}
              required
              placeholder="Masukkan nomor kontak"
              helperText="Gunakan nomor dengan format 62..."
            />
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-200 pt-5 dark:border-slate-700">
          <button
            type="submit"
            disabled={isSearching}
            className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSearching ? "Mencari..." : "Cari Data"}
          </button>
        </div>
      </form>

      {searched ? (
        results.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {results.map((record, index) => {
              const showReply = shouldShowReply(record);

              return (
                <div
                  key={`${record.uuid ?? record.id ?? index}`}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600 dark:text-sky-400">
                        Pengaduan
                      </p>
                      <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
                        {record.subjek ?? "Tanpa subjek"}
                      </h3>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {record.status_pengaduan ?? "-"}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                        Nama lengkap
                      </p>
                      <p className="mt-2 font-semibold text-slate-900 dark:text-white">
                        {record.nama_lengkap ?? "-"}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                        Kontak
                      </p>
                      <p className="mt-2 font-semibold text-slate-900 dark:text-white">
                        {record.kontak ?? "-"}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                        Jenis pengaduan
                      </p>
                      <p className="mt-2 font-semibold text-slate-900 dark:text-white">
                        {record.jenis_pengaduan ?? "-"}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                        Kelompok
                      </p>
                      <p className="mt-2 font-semibold text-slate-900 dark:text-white">
                        {record.nama_kelompok ?? "-"}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60 sm:col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                        Isi pengaduan
                      </p>
                      <p className="mt-2 whitespace-pre-wrap font-semibold text-slate-900 dark:text-white">
                        {record.isi_pengaduan ?? "-"}
                      </p>
                    </div>
                  </div>

                  {showReply ? (
                    <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/30">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
                        Balasan admin
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm font-medium text-emerald-950 dark:text-emerald-100">
                        {record.balasan_admin ?? "-"}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-emerald-700 dark:text-emerald-300">
                        <span>
                          Dibalas oleh:{" "}
                          {record.dibalas_oleh_user?.nama_lengkap ?? "-"}
                        </span>
                        <span>Tanggal: {record.tanggal_dibalas ?? "-"}</span>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            Data pengaduan tidak ditemukan.
          </div>
        )
      ) : null}
    </div>
  );
};

export default PengaduanSearchPage;
