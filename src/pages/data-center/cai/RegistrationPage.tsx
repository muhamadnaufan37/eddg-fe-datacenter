import { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";

import {
  PhotoField,
  PrimeInputText,
  PrimeSelect,
  StepperHeader,
} from "../../../components/forms/FormFields";
import {
  fetchDaerahReference,
  fetchDesaReference,
  fetchKelompokReference,
  submitCaiRegistration,
} from "../../../services/dataCenter";
import { showToast } from "../../../services/toast";

type CaiFormValues = {
  nama_lengkap: string;
  tgl_lahir: string;
  jenis_kelamin: string;
  utusan: string;
  tmpt_daerah: string;
  tmpt_desa: string;
  tmpt_kelompok: string;
  size_tshirt: string;
  img: File | null;
};

interface ReactSelectOption {
  label: string;
  value: string;
}

const steps = ["Data Utama", "Lokasi & Foto"];

const jenisKelaminOptions: ReactSelectOption[] = [
  { label: "LAKI-LAKI", value: "LAKI-LAKI" },
  { label: "PEREMPUAN", value: "PEREMPUAN" },
];

const utsusanOptions: ReactSelectOption[] = [
  { label: "Daerah", value: "daerah" },
  { label: "Desa", value: "desa" },
  { label: "Kelompok", value: "kelompok" },
  { label: "Pengurus", value: "pengurus" },
  { label: "Pondok", value: "pondok" },
  { label: "Panitia", value: "panitia" },
];

const tshirtOptions: ReactSelectOption[] = [
  { label: "S", value: "S" },
  { label: "M", value: "M" },
  { label: "L", value: "L" },
  { label: "XL", value: "XL" },
  { label: "2XL", value: "2XL" },
  { label: "3XL", value: "3XL" },
  { label: "4XL", value: "4XL" },
];

const locationUtusanValues = {
  daerah: "daerah",
  desa: "desa",
  kelompok: "kelompok",
  pengurus: "pengurus",
  pondok: "pondok",
  panitia: "panitia",
} as const;

const baseImageSchema = Yup.mixed<File>()
  .required("Foto wajib diunggah")
  .test("fileType", "Foto harus berupa gambar", (file) => {
    if (!file) return false;
    return file instanceof File && file.type.startsWith("image/");
  })
  .test("fileSize", "Ukuran foto maksimal 5 MB", (file) => {
    if (!file) return false;
    return file instanceof File && file.size <= 5 * 1024 * 1024;
  });

const isUtusan = (
  value: string,
  expected: keyof typeof locationUtusanValues,
) => {
  return value === locationUtusanValues[expected];
};

const requiresAllLocations = (value: string) => {
  return [
    locationUtusanValues.pengurus,
    locationUtusanValues.pondok,
    locationUtusanValues.panitia,
  ].includes(value as (typeof locationUtusanValues)["pengurus"]);
};

const stepSchemas = [
  Yup.object({
    nama_lengkap: Yup.string().required("Nama lengkap wajib diisi"),
    tgl_lahir: Yup.string().required("Tanggal lahir wajib diisi"),
    jenis_kelamin: Yup.string().required("Jenis kelamin wajib dipilih"),
    utusan: Yup.string().required("Utusan wajib dipilih"),
  }),
  Yup.object({
    size_tshirt: Yup.string().required("Ukuran baju wajib dipilih"),
    tmpt_daerah: Yup.string().when("utusan", {
      is: (value: string) =>
        isUtusan(value, "daerah") || requiresAllLocations(value),
      then: (schema) => schema.required("Tempat daerah wajib diisi"),
      otherwise: (schema) => schema.notRequired(),
    }),
    tmpt_desa: Yup.string().when("utusan", {
      is: (value: string) =>
        isUtusan(value, "desa") || requiresAllLocations(value),
      then: (schema) => schema.required("Tempat desa wajib diisi"),
      otherwise: (schema) => schema.notRequired(),
    }),
    tmpt_kelompok: Yup.string().when("utusan", {
      is: (value: string) =>
        isUtusan(value, "kelompok") || requiresAllLocations(value),
      then: (schema) => schema.required("Tempat kelompok wajib diisi"),
      otherwise: (schema) => schema.notRequired(),
    }),
    img: baseImageSchema,
  }),
];

const CaiRegistrationPage = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDaerah, setIsLoadingDaerah] = useState(true);
  const [isLoadingDesa, setIsLoadingDesa] = useState(false);
  const [isLoadingKelompok, setIsLoadingKelompok] = useState(false);
  const [daerahOptions, setDaerahOptions] = useState<ReactSelectOption[]>([]);
  const [desaOptions, setDesaOptions] = useState<ReactSelectOption[]>([]);
  const [kelompokOptions, setKelompokOptions] = useState<ReactSelectOption[]>(
    [],
  );
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");

  const formik = useFormik<CaiFormValues>({
    initialValues: {
      nama_lengkap: "",
      tgl_lahir: "",
      jenis_kelamin: "",
      utusan: "",
      tmpt_daerah: "",
      tmpt_desa: "",
      tmpt_kelompok: "",
      size_tshirt: "",
      img: null,
    },
    validateOnBlur: true,
    validateOnChange: false,
    validationSchema: stepSchemas[activeStep],
    onSubmit: async (values, helpers) => {
      try {
        setIsSubmitting(true);

        if (!values.img) {
          throw new Error("Foto wajib diunggah");
        }

        const registrationDeadline = new Date("2026-06-26T23:59:59+07:00");

        if (new Date() > registrationDeadline) {
          showToast(
            "warn",
            "Pendaftaran Ditutup",
            "Pendaftaran peserta telah ditutup pada tanggal 26 Juni 2026 pukul 23:59 WIB.",
          );
          return;
        }

        const response = await submitCaiRegistration({
          nama_lengkap: values.nama_lengkap,
          tgl_lahir: values.tgl_lahir,
          jenis_kelamin: values.jenis_kelamin,
          utusan: values.utusan,
          tmpt_daerah: values.tmpt_daerah,
          tmpt_desa: values.tmpt_desa,
          tmpt_kelompok: values.tmpt_kelompok,
          size_tshirt: values.size_tshirt,
          img: values.img,
        });

        const nextUuid =
          response?.data?.uuid ??
          response?.data?.kodeUuid ??
          response?.data?.kode_cari_data;

        showToast(
          "success",
          "Berhasil",
          response?.message ?? "Registrasi CAI berhasil disimpan.",
        );
        helpers.resetForm();
        setActiveStep(0);

        if (nextUuid) {
          navigate(`/digital-data/cai/search/${nextUuid}`);
        }
      } catch (error: any) {
        showToast(
          "error",
          "Gagal",
          error?.response?.data?.message ||
            error?.message ||
            "Gagal registrasi CAI.",
        );
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  useEffect(() => {
    const loadDaerah = async () => {
      try {
        setIsLoadingDaerah(true);
        const options = await fetchDaerahReference();
        setDaerahOptions(options);
      } catch {
        showToast("error", "Gagal", "Gagal memuat referensi daerah.");
      } finally {
        setIsLoadingDaerah(false);
      }
    };

    void loadDaerah();
  }, []);

  useEffect(() => {
    if (formik.values.tmpt_daerah) {
      return;
    }

    setDesaOptions([]);
    setKelompokOptions([]);

    if (formik.values.tmpt_desa) {
      formik.setFieldValue("tmpt_desa", "", false);
    }

    if (formik.values.tmpt_kelompok) {
      formik.setFieldValue("tmpt_kelompok", "", false);
    }
  }, [formik.values.tmpt_daerah]);

  useEffect(() => {
    const loadDesa = async () => {
      if (!formik.values.tmpt_daerah) {
        return;
      }

      try {
        setIsLoadingDesa(true);
        const options = await fetchDesaReference(formik.values.tmpt_daerah);
        setDesaOptions(options);
      } catch {
        showToast("error", "Gagal", "Gagal memuat referensi desa.");
      } finally {
        setIsLoadingDesa(false);
      }
    };

    void loadDesa();
  }, [formik.values.tmpt_daerah]);

  useEffect(() => {
    if (formik.values.tmpt_desa) {
      return;
    }

    setKelompokOptions([]);

    if (formik.values.tmpt_kelompok) {
      formik.setFieldValue("tmpt_kelompok", "", false);
    }
  }, [formik.values.tmpt_desa]);

  useEffect(() => {
    const loadKelompok = async () => {
      if (!formik.values.tmpt_desa) {
        return;
      }

      try {
        setIsLoadingKelompok(true);
        const options = await fetchKelompokReference(formik.values.tmpt_desa);
        setKelompokOptions(options);
      } catch {
        showToast("error", "Gagal", "Gagal memuat referensi kelompok.");
      } finally {
        setIsLoadingKelompok(false);
      }
    };

    void loadKelompok();
  }, [formik.values.tmpt_desa]);

  useEffect(() => {
    if (!formik.values.utusan) {
      return;
    }

    formik.setFieldValue("tmpt_daerah", "", false);
    formik.setFieldValue("tmpt_desa", "", false);
    formik.setFieldValue("tmpt_kelompok", "", false);
    setDesaOptions([]);
    setKelompokOptions([]);
  }, [formik.values.utusan]);

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = registrationDeadline.getTime() - new Date().getTime();

      if (diff <= 0) {
        setTimeLeft("Pendaftaran telah ditutup");
        clearInterval(interval);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeLeft(`${days} hari ${hours} jam ${minutes} menit`);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleNext = async () => {
    const schema = stepSchemas[activeStep];

    try {
      await schema.validate(formik.values, { abortEarly: false });
      setActiveStep((current) => Math.min(current + 1, steps.length - 1));
    } catch (validationError) {
      if (validationError instanceof Yup.ValidationError) {
        validationError.inner.forEach((item) => {
          if (item.path) {
            formik.setFieldTouched(item.path, true, false);
          }
        });
      }
      showToast("warn", "Peringatan", "Lengkapi dulu data pada step ini.");
    }
  };

  const btnImgSize = () => {
    return (
      <>
        <div className="flex gap-2 items-center mt-2 text-sm text-slate-600 dark:text-slate-400">
          <div>Pastika sebelum memilih ukuran baju, lihat panduan ukuran:</div>
          <button
            type="button"
            onClick={() => setIsImagePreviewOpen(true)}
            className="bg-sky-600 px-3 py-1 text-xs font-semibold text-white rounded-lg transition hover:bg-sky-700"
          >
            T-Shirt Size Guide
          </button>
        </div>
      </>
    );
  };

  const registrationDeadline = new Date("2026-06-26T23:59:59+07:00");

  const isRegistrationClosed = new Date() > registrationDeadline;

  return (
    <>
      {isImagePreviewOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setIsImagePreviewOpen(false)}
        >
          <div
            className="relative w-full max-w-5xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsImagePreviewOpen(false)}
              className="absolute -top-12 right-0 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              Tutup
            </button>
            <img
              src="../../../../size-jersey.jpeg"
              alt="T-Shirt Size Guide"
              className="max-h-[85vh] w-full rounded-3xl object-contain shadow-2xl"
            />
          </div>
        </div>
      ) : null}

      <div className="w-full space-y-6">
        <StepperHeader
          title="Registrasi CAI"
          description="Form registrasi CAI dibuat bertahap agar lebih nyaman di perangkat mobile dan desktop. Semua input wajib diisi sesuai aturan utusan yang dipilih."
          steps={steps}
          activeStep={activeStep}
        />
        <div
          className={`mb-4 rounded-2xl border p-4 ${
            isRegistrationClosed
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-blue-200 bg-blue-50 text-blue-700"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="text-xl">{isRegistrationClosed ? "🚫" : "📢"}</div>

            <div>
              <h3 className="font-semibold">
                {isRegistrationClosed
                  ? "Pendaftaran Telah Ditutup"
                  : "Informasi Pendaftaran"}
              </h3>

              <p className="mt-1 text-sm">
                {isRegistrationClosed
                  ? "Pendaftaran peserta telah ditutup pada tanggal 26 Juni 2026 pukul 23:59 WIB."
                  : "Pendaftaran peserta akan ditutup pada tanggal 26 Juni 2026 pukul 23:59 WIB. Pastikan seluruh data telah diisi dengan benar sebelum mengirimkan formulir."}
              </p>
              {!isRegistrationClosed && (
                <div className="mt-2 text-sm font-medium text-blue-700">
                  Sisa waktu pendaftaran: {timeLeft}
                </div>
              )}
            </div>
          </div>
        </div>

        <form
          onSubmit={formik.handleSubmit}
          className="space-y-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {steps[activeStep]}
            </h2>
            <button
              type="button"
              onClick={() => navigate("/digital-data/cai")}
              className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              ← Kembali
            </button>
          </div>

          {activeStep === 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              <PrimeInputText
                label="Nama lengkap"
                name="nama_lengkap"
                formik={formik}
                required
                placeholder="Masukkan nama lengkap"
              />
              <PrimeInputText
                label="Tanggal lahir"
                name="tgl_lahir"
                formik={formik}
                required
                type="date"
              />
              <PrimeSelect
                label="Jenis kelamin"
                name="jenis_kelamin"
                formik={formik}
                required
                options={jenisKelaminOptions}
              />
              <PrimeSelect
                label="Utusan"
                name="utusan"
                formik={formik}
                required
                options={utsusanOptions}
              />
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-4">
                <PrimeSelect
                  label="Ukuran Baju"
                  name="size_tshirt"
                  formik={formik}
                  required
                  options={tshirtOptions}
                  helperText={btnImgSize()}
                />
                <div className="grid gap-4 md:grid-cols-3">
                  {(isUtusan(formik.values.utusan, "daerah") ||
                    requiresAllLocations(formik.values.utusan) ||
                    isUtusan(formik.values.utusan, "desa") ||
                    isUtusan(formik.values.utusan, "kelompok") ||
                    isUtusan(formik.values.utusan, "pengurus") ||
                    isUtusan(formik.values.utusan, "pondok") ||
                    isUtusan(formik.values.utusan, "panitia")) && (
                    <PrimeSelect
                      label="Tempat daerah"
                      name="tmpt_daerah"
                      formik={formik}
                      required={
                        isUtusan(formik.values.utusan, "daerah") ||
                        requiresAllLocations(formik.values.utusan)
                      }
                      options={daerahOptions}
                      isLoading={isLoadingDaerah}
                      placeholder={
                        isLoadingDaerah ? "Memuat data..." : "Pilih daerah"
                      }
                      helperText="Dipakai untuk memuat referensi desa."
                    />
                  )}
                  {(formik.values.utusan === "desa" ||
                    formik.values.utusan === "kelompok" ||
                    requiresAllLocations(formik.values.utusan)) && (
                    <PrimeSelect
                      label="Tempat desa"
                      name="tmpt_desa"
                      formik={formik}
                      required={
                        formik.values.utusan === "desa" ||
                        requiresAllLocations(formik.values.utusan)
                      }
                      options={desaOptions}
                      isLoading={isLoadingDesa}
                      placeholder={
                        formik.values.tmpt_daerah
                          ? isLoadingDesa
                            ? "Memuat data..."
                            : "Pilih desa"
                          : "Pilih daerah dulu"
                      }
                      helperText="Dipakai untuk memuat referensi kelompok."
                      disabled={!formik.values.tmpt_daerah}
                    />
                  )}
                  {(formik.values.utusan === "kelompok" ||
                    requiresAllLocations(formik.values.utusan)) && (
                    <PrimeSelect
                      label="Tempat kelompok"
                      name="tmpt_kelompok"
                      formik={formik}
                      required={
                        formik.values.utusan === "kelompok" ||
                        requiresAllLocations(formik.values.utusan)
                      }
                      options={kelompokOptions}
                      isLoading={isLoadingKelompok}
                      placeholder={
                        formik.values.tmpt_desa
                          ? isLoadingKelompok
                            ? "Memuat data..."
                            : "Pilih kelompok"
                          : "Pilih desa dulu"
                      }
                      helperText="Dipakai untuk melengkapi data lokasi."
                      disabled={!formik.values.tmpt_desa}
                    />
                  )}

                  <div className="md:col-span-3">
                    <PhotoField
                      label="Foto"
                      name="img"
                      formik={formik}
                      required
                      helperText="Unggah foto saja, ukuran maksimal 5 MB."
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700">
            <button
              type="button"
              onClick={() =>
                setActiveStep((current) => Math.max(current - 1, 0))
              }
              disabled={activeStep === 0 || isSubmitting}
              className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-200"
            >
              Kembali
            </button>

            {activeStep === steps.length - 1 ? (
              <button
                type="submit"
                disabled={isSubmitting || isRegistrationClosed}
                className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:opacity-70"
              >
                {isRegistrationClosed
                  ? "Pendaftaran Ditutup"
                  : isSubmitting
                    ? "Menyimpan..."
                    : "Simpan Registrasi"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                disabled={isRegistrationClosed}
                className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:opacity-70"
              >
                {isRegistrationClosed ? "Pendaftaran Ditutup" : "Lanjut"}
              </button>
            )}
          </div>
        </form>
      </div>
    </>
  );
};

export default CaiRegistrationPage;
