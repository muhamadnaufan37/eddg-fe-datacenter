import { useEffect, useState } from "react";
import { useFormik } from "formik";
import { Link, useNavigate } from "react-router-dom";
import * as Yup from "yup";

import {
  PrimeInputText,
  PrimeSelect,
  StepperHeader,
} from "../../../components/forms/FormFields";
import {
  searchCaiData,
  fetchNamaPesertaCaiReference,
} from "../../../services/dataCenter";
import type { ReferenceOption } from "../../../services/dataCenter";
import { showToast } from "../../../services/toast";
import Sensitive from "../../../components/Sensitive";
import { extractArrayResult } from "../../../utils/response";

type CaiSearchValues = {
  nama_lengkap: string;
  tgl_lahir: string;
  jenis_kelamin: string;
};

type CaiSearchRecord = {
  id?: number;
  uuid?: string;
  kodeUuid?: string;
  kode_cari_data?: string;
  nama_lengkap?: string;
  tgl_lahir?: string;
  jenis_kelamin?: string;
  is_active?: boolean;
  utusan?: string;
  tahun?: number;
  nm_daerah?: string;
  nm_desa?: string;
  nm_kelompok?: string;
  img_url?: string;
};

const CaiSearchPage = () => {
  const navigate = useNavigate();
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<CaiSearchRecord[]>([]);
  const [searched, setSearched] = useState(false);
  const [namaOptions, setNamaOptions] = useState<ReferenceOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  useEffect(() => {
    const loadNamaOptions = async () => {
      try {
        setLoadingOptions(true);
        const options = await fetchNamaPesertaCaiReference();
        setNamaOptions(options);
      } catch {
        showToast("error", "Gagal", "Gagal memuat referensi nama peserta CAI.");
      } finally {
        setLoadingOptions(false);
      }
    };
    loadNamaOptions();
  }, []);

  const formik = useFormik<CaiSearchValues>({
    initialValues: {
      nama_lengkap: "",
      tgl_lahir: "",
      jenis_kelamin: "",
    },
    validationSchema: Yup.object({
      nama_lengkap: Yup.string().required("Nama lengkap wajib diisi"),
      tgl_lahir: Yup.string().required("Tanggal lahir wajib diisi"),
      jenis_kelamin: Yup.string().required("Jenis kelamin wajib dipilih"),
    }),
    onSubmit: async (values) => {
      try {
        setIsSearching(true);
        const response = await searchCaiData(values);
        const data = extractArrayResult<CaiSearchRecord>(response);
        setResults(data);
        setSearched(true);

        if (data.length === 0) {
          showToast(
            "info",
            "Tidak ditemukan",
            response?.message ?? "Data tidak ditemukan.",
          );
          return;
        }

        showToast(
          "success",
          "Berhasil",
          response?.message ?? "Data berhasil ditemukan.",
        );
      } catch (error: any) {
        setResults([]);
        setSearched(true);
        showToast(
          "error",
          "Gagal",
          error?.response?.data?.message ||
            error?.message ||
            "Gagal mencari data CAI.",
        );
      } finally {
        setIsSearching(false);
      }
    },
  });

  return (
    <div className="w-full space-y-6">
      <StepperHeader
        title="Cari Data CAI"
        description="Pilih nama peserta, tanggal lahir, dan jenis kelamin untuk mempersempit hasil pencarian CAI."
        steps={["Form Cari Data", "Hasil"]}
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
            onClick={() => navigate("/digital-data/cai")}
            className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            ← Kembali
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <PrimeSelect
            label="Nama lengkap"
            name="nama_lengkap"
            formik={formik}
            required
            options={namaOptions}
            disabled={loadingOptions}
          />
          <PrimeInputText
            label="Tanggal lahir"
            name="tgl_lahir"
            formik={formik}
            required
            type="date"
          />
          <div className="md:col-span-2">
            <PrimeSelect
              label="Jenis kelamin"
              name="jenis_kelamin"
              formik={formik}
              required
              options={[
                { label: "LAKI-LAKI", value: "LAKI-LAKI" },
                { label: "PEREMPUAN", value: "PEREMPUAN" },
              ]}
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
          <div className="grid gap-4 lg:grid-cols-1">
            {results.map((record, index) => {
              const detailCode =
                record.uuid ?? record.kodeUuid ?? record.kode_cari_data;

              return (
                <div
                  key={`${record.kode_cari_data ?? index}`}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600 dark:text-sky-400">
                        Hasil CAI
                      </p>
                      <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
                        <Sensitive value={record.nama_lengkap ?? "Data CAI"} />
                      </h3>
                    </div>
                    {detailCode ? (
                      <Link
                        to={`/digital-data/cai/search/${detailCode}`}
                        className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-500 hover:text-sky-600 dark:border-slate-600 dark:text-slate-200"
                      >
                        Detail
                      </Link>
                    ) : null}
                  </div>

                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                        Kode cari data
                      </p>
                      <p className="mt-2 font-semibold text-slate-900 dark:text-white">
                        <Sensitive value={record.kode_cari_data} />
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                        Tanggal lahir
                      </p>
                      <p className="mt-2 font-semibold text-slate-900 dark:text-white">
                        <Sensitive value={record.tgl_lahir} />
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                        Jenis kelamin
                      </p>
                      <p className="mt-2 font-semibold text-slate-900 dark:text-white">
                        <Sensitive value={record.jenis_kelamin} />
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                        Jenis kelamin
                      </p>
                      <p className="mt-2 font-semibold text-slate-900 dark:text-white">
                        {record.jenis_kelamin ?? "-"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            Data CAI tidak ditemukan.
          </div>
        )
      ) : null}
    </div>
  );
};

export default CaiSearchPage;
