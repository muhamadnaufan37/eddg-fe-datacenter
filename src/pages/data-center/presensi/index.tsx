import { useEffect, useState } from "react";
import { useFormik } from "formik";
import { useNavigate } from "react-router-dom";
import * as Yup from "yup";

import {
  PrimeInputText,
  PrimeSelect,
  StepperHeader,
} from "../../../components/forms/FormFields";
import {
  fetchNamaPesertaReference,
  submitPresensi,
} from "../../../services/dataCenter";
import { showToast } from "../../../services/toast";

type PresensiFormValues = {
  kode_kegiatan: string;
  id_peserta: string;
  latitude: string;
  longitude: string;
};

interface ReactSelectOption {
  label: string;
  value: string;
}

const locationDefault = "";

const PresensiPage = () => {
  const navigate = useNavigate();
  const [participantOptions, setParticipantOptions] = useState<
    ReactSelectOption[]
  >([]);

  const [loadingParticipants, setLoadingParticipants] = useState(true);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationAccuracy, setLocationAccuracy] = useState<string | null>(null);

  useEffect(() => {
    const loadParticipants = async () => {
      try {
        setLoadingParticipants(true);
        const options = await fetchNamaPesertaReference();
        setParticipantOptions(options);
      } catch {
        showToast("error", "Gagal", "Gagal memuat referensi peserta.");
      } finally {
        setLoadingParticipants(false);
      }
    };

    void loadParticipants();
  }, []);

  const formik = useFormik<PresensiFormValues>({
    initialValues: {
      kode_kegiatan: "",
      id_peserta: "",
      latitude: locationDefault,
      longitude: locationDefault,
    },
    validationSchema: Yup.object({
      kode_kegiatan: Yup.string().required("Kode kegiatan wajib diisi"),
      id_peserta: Yup.string().required("Peserta wajib dipilih"),
      latitude: Yup.string().required("Lokasi harus dicari terlebih dahulu"),
      longitude: Yup.string().required("Lokasi harus dicari terlebih dahulu"),
    }),
    onSubmit: async (values, helpers) => {
      try {
        setIsSubmitting(true);

        const response = await submitPresensi({
          ...values,
          add_by_petugas: "124fe53d-64da-4647-8c30-87aea6ac23bd",
          radius_meter: 10,
        });

        showToast(
          "success",
          "Berhasil",
          response?.message ?? "Presensi berhasil disimpan.",
        );
        helpers.resetForm();
        setLocationAccuracy(null);
      } catch (error) {
        showToast(
          "error",
          "Gagal",
          error instanceof Error ? error.message : "Gagal menyimpan presensi.",
        );
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const searchCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast("error", "Gagal", "Browser tidak mendukung geolocation.");
      return;
    }

    setSearchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        formik.setFieldValue("latitude", position.coords.latitude.toFixed(6));
        formik.setFieldValue("longitude", position.coords.longitude.toFixed(6));
        setLocationAccuracy(
          `Akurasi sekitar ${Math.round(position.coords.accuracy)} meter`,
        );
        setSearchingLocation(false);
      },
      () => {
        setSearchingLocation(false);
        showToast("error", "Gagal", "Gagal mengambil lokasi saat ini.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  };

  return (
    <div className="w-full max-w-4xl space-y-6">
      <StepperHeader
        title="Absensi Online"
        description="Lokasi harus diambil otomatis dari perangkat, bukan diketik manual. Radius meter dan petugas input ditetapkan oleh sistem."
        steps={["Data Presensi", "Lokasi"]}
        activeStep={1}
      />

      <form
        onSubmit={formik.handleSubmit}
        className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Data Presensi
          </h2>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            ← Kembali
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <PrimeInputText
            label="Kode kegiatan"
            name="kode_kegiatan"
            formik={formik}
            required
          />
          <PrimeSelect
            label="Nama peserta"
            name="id_peserta"
            formik={formik}
            required
            options={participantOptions}
            isLoading={loadingParticipants}
            placeholder={
              loadingParticipants ? "Memuat peserta..." : "Pilih peserta"
            }
          />
          <PrimeInputText
            label="Latitude"
            name="latitude"
            formik={formik}
            readOnly
            required
          />
          <PrimeInputText
            label="Longitude"
            name="longitude"
            formik={formik}
            readOnly
            required
          />
        </div>

        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/40">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Cari lokasi otomatis
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tekan tombol untuk mengambil koordinat perangkat.
              </p>
            </div>
            <button
              type="button"
              onClick={searchCurrentLocation}
              disabled={searchingLocation}
              className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {searchingLocation ? "Mencari..." : "Cari lokasi"}
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
            disabled={isSubmitting}
            className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Menyimpan..." : "Simpan Presensi"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PresensiPage;
