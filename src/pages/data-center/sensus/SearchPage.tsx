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
  searchSensusData,
  fetchNamaPesertaSensusReference,
} from "../../../services/dataCenter";
import type { ReferenceOption } from "../../../services/dataCenter";
import { showToast } from "../../../services/toast";
import { extractArrayResult } from "../../../utils/response";

type SensusSearchValues = {
  nama_lengkap: string;
  tanggal_lahir: string;
  nama_ortu: string;
};

type SensusSearchRecord = {
  id?: number;
  uuid?: string;
  kodeUuid?: string;
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
  nm_daerah?: string;
  nm_desa?: string;
  nm_kelompok?: string;
  img_url?: string;
};

const SensusSearchPage = () => {
  const navigate = useNavigate();
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SensusSearchRecord[]>([]);
  const [searched, setSearched] = useState(false);
  const [namaOptions, setNamaOptions] = useState<ReferenceOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  useEffect(() => {
    const loadNamaOptions = async () => {
      try {
        setLoadingOptions(true);
        const options = await fetchNamaPesertaSensusReference();
        setNamaOptions(options);
      } catch {
        showToast(
          "error",
          "Gagal",
          "Gagal memuat referensi nama peserta sensus.",
        );
      } finally {
        setLoadingOptions(false);
      }
    };
    loadNamaOptions();
  }, []);

  const formik = useFormik<SensusSearchValues>({
    initialValues: {
      nama_lengkap: "",
      tanggal_lahir: "",
      nama_ortu: "",
    },
    validationSchema: Yup.object({
      nama_lengkap: Yup.string().required("Nama lengkap wajib diisi"),
      tanggal_lahir: Yup.string().required("Tanggal lahir wajib diisi"),
      nama_ortu: Yup.string().required("Nama orang tua wajib diisi"),
    }),
    onSubmit: async (values) => {
      try {
        setIsSearching(true);
        const response = await searchSensusData(values);
        const data = extractArrayResult<SensusSearchRecord>(response);
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
      } catch (error) {
        setResults([]);
        setSearched(true);
        showToast(
          "error",
          "Gagal",
          error instanceof Error ? error.message : "Gagal mencari data sensus.",
        );
      } finally {
        setIsSearching(false);
      }
    },
  });

  return (
    <div className="w-full space-y-6">
      <StepperHeader
        title="Cari Data Sensus"
        description="Pilih nama peserta, tanggal lahir, dan nama orang tua untuk mempersempit hasil pencarian sensus."
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
            onClick={() => navigate("/digital-data/sensus")}
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
            name="tanggal_lahir"
            formik={formik}
            required
            type="date"
          />
          <div className="md:col-span-2">
            <PrimeInputText
              label="Nama orang tua"
              name="nama_ortu"
              formik={formik}
              required
              placeholder="Isi nama ayah atau ibu"
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
            {results.map((record: SensusSearchRecord, index) => {
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
                        Hasil Sensus
                      </p>
                      <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
                        {record.nama_lengkap ?? "Data sensus"}
                      </h3>
                    </div>
                    {detailCode ? (
                      <Link
                        to={`/digital-data/sensus/${detailCode}`}
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
                        {record.kode_cari_data ?? "-"}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                        Tanggal lahir
                      </p>
                      <p className="mt-2 font-semibold text-slate-900 dark:text-white">
                        {record.tanggal_lahir ?? "-"}
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
                    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                        Kelompok
                      </p>
                      <p className="mt-2 font-semibold text-slate-900 dark:text-white">
                        {record.nm_kelompok ?? "-"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            Data sensus tidak ditemukan.
          </div>
        )
      ) : null}
    </div>
  );
};

export default SensusSearchPage;
