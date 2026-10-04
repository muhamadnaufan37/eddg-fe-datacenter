import { useState } from "react";
import { useFormik } from "formik";
import { useNavigate } from "react-router-dom";
import * as Yup from "yup";
import {
  FiArrowLeft,
  FiSearch,
  FiMessageSquare,
  FiUser,
  FiTag,
} from "react-icons/fi";
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
    <div className="w-full space-y-8">
      {/* Modern Startup Header & Spotlight Search */}
      <div className="relative overflow-hidden rounded-[2rem] bg-white p-8 shadow-2xl shadow-slate-200/50 ring-1 ring-slate-900/5 dark:bg-[#0b1120] dark:shadow-none dark:ring-white/10 sm:p-12">
        {/* Glow Effects */}
        <div className="pointer-events-none absolute -left-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 blur-[100px] dark:from-blue-600/20 dark:to-purple-600/20" />
        <div className="pointer-events-none absolute -bottom-40 -right-40 h-[30rem] w-[30rem] rounded-full bg-gradient-to-br from-cyan-500/30 to-emerald-500/30 blur-[100px] dark:from-cyan-500/20 dark:to-emerald-500/20" />

        <div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-2xl">
            <div className="mb-6 flex items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 ring-1 ring-inset ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20">
                <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400"></span>
                Operasional
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Pusat Bantuan
              </span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
              Lacak Tiket Pengaduan
            </h1>
            <p className="mt-4 text-lg font-medium text-slate-600 dark:text-slate-400">
              Pantau status laporan dan tindak lanjut dari admin secara real-time. Masukkan nomor kontak terdaftar untuk melihat riwayat tiket.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/digital-data/pengaduan")}
            className="group flex shrink-0 items-center gap-2 rounded-full bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-700/80"
          >
            <FiArrowLeft className="transition group-hover:-translate-x-1" />
            Kembali
          </button>
        </div>

        {/* Interactive Spotlight Search Input */}
        <form
          onSubmit={formik.handleSubmit}
          className="group relative z-10 mt-10 max-w-3xl"
        >
          <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 opacity-20 blur-lg transition-opacity duration-500 group-focus-within:opacity-50 dark:opacity-30 dark:group-focus-within:opacity-70" />
          <div className="relative flex flex-col rounded-3xl bg-white/90 p-2.5 shadow-2xl backdrop-blur-xl ring-1 ring-slate-900/5 transition-all focus-within:ring-blue-500/50 dark:bg-[#0f172a]/90 dark:ring-white/10 dark:focus-within:ring-blue-500/50 sm:flex-row sm:items-center">
            <div className="flex-1 px-4 py-3 sm:py-2">
              <label htmlFor="kontak" className="sr-only">Nomor Kontak</label>
              <div className="relative flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-focus-within:bg-blue-600 group-focus-within:text-white dark:bg-blue-500/10 dark:text-blue-400 dark:group-focus-within:bg-blue-500 dark:group-focus-within:text-white">
                  <FiSearch className="text-xl" />
                </div>
                <input
                  id="kontak"
                  type="text"
                  {...formik.getFieldProps("kontak")}
                  placeholder="Ketik nomor kontak (mis: 628...)"
                  className="w-full bg-transparent outline-none text-slate-900 placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500 text-lg sm:text-xl font-bold tracking-wide transition-all"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="mt-2 flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-8 py-4 text-sm font-bold text-white shadow-lg transition-all hover:scale-[1.02] hover:bg-blue-700 hover:shadow-blue-500/25 disabled:opacity-70 sm:mt-0 sm:w-auto dark:bg-blue-500 dark:hover:bg-blue-400"
            >
              {isSearching ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Mencari...
                </>
              ) : (
                "Lacak Tiket"
              )}
            </button>
          </div>
        </form>
        {formik.touched.kontak && formik.errors.kontak && (
          <p className="relative z-10 mt-3 pl-4 text-sm font-bold text-red-500">
            {formik.errors.kontak}
          </p>
        )}
      </div>

      {searched ? (
        results.length > 0 ? (
          <div className="grid gap-8 lg:grid-cols-2">
            {results.map((record, index) => {
              const showReply = shouldShowReply(record);
              const isResolved = record.status_pengaduan?.toLowerCase() === "selesai" || record.status_pengaduan?.toLowerCase() === "resolved";

              return (
                <div
                  key={`${record.uuid ?? record.id ?? index}`}
                  className="group relative flex flex-col overflow-hidden rounded-[2rem] bg-white shadow-lg ring-1 ring-slate-900/5 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:shadow-2xl hover:shadow-blue-500/10 hover:ring-blue-500/20 dark:bg-[#0f172a] dark:ring-white/10 dark:hover:ring-blue-500/30"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-slate-100 p-8 dark:border-slate-800/60">
                    <div>
                      <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        <FiTag /> Pengaduan
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white line-clamp-2">
                        {record.subjek ?? "Tanpa Subjek"}
                      </h3>
                    </div>
                    {/* Status Badge */}
                    <div className="shrink-0">
                      {isResolved ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-widest text-emerald-600 ring-1 ring-inset ring-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Selesai
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-4 py-2 text-xs font-black uppercase tracking-widest text-amber-600 ring-1 ring-inset ring-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" /> {record.status_pengaduan ?? "Menunggu"}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 p-8">
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="sm:col-span-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                          Nama Lengkap
                        </p>
                        <p className="mt-1.5 text-sm font-bold text-slate-900 dark:text-slate-200">
                          {record.nama_lengkap ?? "-"}
                        </p>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                          Kontak
                        </p>
                        <p className="mt-1.5 text-sm font-bold text-slate-900 dark:text-slate-200">
                          {record.kontak ?? "-"}
                        </p>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                          Jenis Pengaduan
                        </p>
                        <p className="mt-1.5 text-sm font-bold text-slate-900 dark:text-slate-200">
                          {record.jenis_pengaduan ?? "-"}
                        </p>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                          Kelompok
                        </p>
                        <p className="mt-1.5 text-sm font-bold text-slate-900 dark:text-slate-200">
                          {record.nama_kelompok ?? "-"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-8 rounded-2xl bg-slate-50 p-6 dark:bg-slate-800/40">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        Isi Pengaduan
                      </p>
                      <p className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-relaxed text-slate-700 dark:text-slate-300">
                        {record.isi_pengaduan ?? "-"}
                      </p>
                    </div>

                    {showReply && (
                      <div className="mt-6 rounded-2xl bg-emerald-50 p-6 ring-1 ring-emerald-500/20 dark:bg-emerald-500/10 dark:ring-emerald-500/20">
                        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-emerald-200/50 pb-4 dark:border-emerald-800/50">
                          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                            <FiMessageSquare /> Balasan Admin
                          </p>
                          <span className="text-xs font-bold text-emerald-600/80 dark:text-emerald-500/80">
                            {record.tanggal_dibalas ?? "-"}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap text-sm font-bold leading-relaxed text-emerald-900 dark:text-emerald-100">
                          {record.balasan_admin ?? "-"}
                        </p>
                        <div className="mt-5 flex items-center gap-2 text-xs font-bold text-emerald-700/80 dark:text-emerald-400/80">
                          <FiUser /> {record.dibalas_oleh_user?.nama_lengkap ?? "Admin"}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-slate-200 bg-white py-20 px-6 text-center dark:border-slate-800 dark:bg-[#0b1120]">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-slate-300 dark:bg-slate-800/50 dark:text-slate-600">
              <FiSearch className="text-4xl" />
            </div>
            <h3 className="mt-6 text-2xl font-black text-slate-900 dark:text-white">
              Tidak Ada Tiket
            </h3>
            <p className="mt-3 max-w-md text-base font-medium text-slate-500 dark:text-slate-400">
              Data tiket pengaduan dengan nomor kontak tersebut tidak ditemukan. Silakan periksa kembali nomor Anda.
            </p>
          </div>
        )
      ) : null}
    </div>
  );
};

export default PengaduanSearchPage;
