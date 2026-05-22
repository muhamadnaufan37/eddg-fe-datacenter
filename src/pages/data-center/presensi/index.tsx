import { useEffect, useState } from "react";
import { useFormik } from "formik";
import { useNavigate } from "react-router-dom";
import * as Yup from "yup";
import type { InputActionMeta } from "react-select";

import {
  PrimeInputText,
  PrimeSelect,
  StepperHeader,
  TextareaField,
} from "../../../components/forms/FormFields";
import {
  fetchNamaPesertaCaiReference,
  fetchNamaPesertaSensusReference,
  submitPresensi,
} from "../../../services/dataCenter";
import { showToast } from "../../../services/toast";

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

const PresensiPage = () => {
  const navigate = useNavigate();
  const [participantOptions, setParticipantOptions] = useState<
    ReactSelectOption[]
  >([]);
  const [attendanceType, setAttendanceType] = useState<"cai" | "sensus" | null>(
    null,
  );
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationAccuracy, setLocationAccuracy] = useState<string | null>(null);
  const [participantSearchTerm, setParticipantSearchTerm] = useState("");
  const currentYear = new Date().getFullYear();

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

  const searchCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast(
        "error",
        "Gagal",
        "Browser Anda tidak mendukung fitur geolocation.",
      );
      return;
    }

    // Check if using HTTPS (required for geolocation in modern browsers)
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

    // For Safari and other browsers, use a longer timeout and more flexible settings
    const timeoutDuration = 30000; // 30 seconds for better compatibility
    const options = {
      enableHighAccuracy: true,
      timeout: timeoutDuration,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        formik.setFieldValue("latitude", position.coords.latitude.toFixed(6));
        formik.setFieldValue("longitude", position.coords.longitude.toFixed(6));
        formik.setFieldTouched("latitude", true);
        formik.setFieldTouched("longitude", true);
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

        // Handle specific geolocation errors
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              "Izin akses lokasi ditolak. Aktifkan izin lokasi di pengaturan browser Anda. Untuk Safari: Buka Preferences > Privacy > Location Services, atau coba di browser lain.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage =
              "Informasi lokasi tidak tersedia. Pastikan GPS aktif atau koneksi internet stabil.";
            break;
          case error.TIMEOUT:
            errorMessage =
              "Waktu pencarian lokasi habis. Coba lagi atau pastikan koneksi GPS aktif. Untuk Safari, coba di area terbuka.";
            break;
          default:
            errorMessage = `Gagal mengambil lokasi: ${error.message || "Kesalahan tidak diketahui"}`;
        }

        showToast("error", "Gagal", errorMessage);
      },
      options,
    );
  };

  return (
    <div className="w-full space-y-6">
      {!attendanceType ? (
        <>
          <StepperHeader
            title="Absensi Online"
            description="Pilih jenis absensi yang ingin Anda lakukan."
            steps={["Pilih Tipe", "Data Presensi"]}
            activeStep={0}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <button
              onClick={() => setAttendanceType("cai")}
              className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-sky-300 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900"
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
              onClick={() => setAttendanceType("sensus")}
              className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-sky-300 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900"
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

          <form
            onSubmit={formik.handleSubmit}
            className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Data Presensi {attendanceType === "cai" ? "CAI" : "Muda/i"}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setAttendanceType(null);
                  formik.resetForm();
                  setLocationAccuracy(null);
                }}
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
              <div className="hidden">
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
              <div className="md:col-span-2">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Kehadiran <span className="text-rose-500">*</span>
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Pilih salah satu status presensi di bawah ini.
                    </p>
                  </div>
                  {formik.touched.status_presensi &&
                  formik.errors.status_presensi ? (
                    <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
                      {formik.errors.status_presensi}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {attendanceOptions.map((option) => {
                    const isActive =
                      formik.values.status_presensi === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          formik.setFieldValue(
                            "status_presensi",
                            option.value,
                            true,
                          );
                          formik.setFieldTouched(
                            "status_presensi",
                            true,
                            false,
                          );
                        }}
                        className={`group flex h-full flex-col gap-3 rounded-3xl border p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-sky-500/10 ${
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
              {(formik.values.status_presensi === "sakit" ||
                formik.values.status_presensi === "izin") && (
                <TextareaField
                  label="Keterangan"
                  name="keterangan"
                  formik={formik}
                  required
                  className="md:col-span-2"
                  rows={4}
                />
              )}
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
                className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={
                  isSubmitting ||
                  searchingLocation ||
                  formik.values.latitude === locationDefault ||
                  formik.values.longitude === locationDefault
                }
              >
                {isSubmitting ? "Menyimpan..." : "Simpan Presensi"}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default PresensiPage;
