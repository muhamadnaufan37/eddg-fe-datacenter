import { useEffect, useMemo, useState } from "react";
import { useFormik } from "formik";
import { useNavigate } from "react-router-dom";
import * as Yup from "yup";

import {
  PhotoField,
  PrimeInputText,
  PrimeSelect,
  StepperHeader,
  TextareaField,
} from "../../../components/forms/FormFields";
import {
  fetchPekerjaanReference,
  fetchDaerahReference,
  fetchDesaReference,
  fetchKelompokReference,
  submitSensusRegistration,
} from "../../../services/dataCenter";
import { showToast } from "../../../services/toast";

type SensusFormValues = {
  nama_lengkap: string;
  nama_panggilan: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  alamat: string;
  jenis_kelamin: string;
  no_telepon: string;
  nama_ayah: string;
  nama_ibu: string;
  hoby: string;
  pekerjaan: string;
  usia_menikah: string;
  kriteria_pasangan: string;
  tmpt_daerah: string;
  tmpt_desa: string;
  tmpt_kelompok: string;
  status_persetujuan: number;
  img: File | null;
};

interface ReactSelectOption {
  label: string;
  value: string;
}

const steps = ["Identitas", "Keluarga", "Alamat & Foto"];

const agreementItems = [
  "Nama lengkap",
  "Tanggal Lahir",
  "Alamat",
  "Nomor telepon",
  "Nama Orang Tua Kandung",
  "Data Kriteria",
  "Foto",
];

const agreementParagraphs = [
  "Dengan ini saya menyatakan bahwa data pribadi yang saya berikan kepada sistem adalah benar, lengkap, dan dapat dipertanggungjawabkan. Saya memberikan persetujuan kepada pengelola sistem untuk mengumpulkan, menyimpan, mengelola, memproses, dan menggunakan data pribadi tersebut sesuai dengan kebutuhan layanan, administrasi, verifikasi, pelaporan, serta keperluan lain yang berkaitan dengan operasional sistem.",
  "Data pribadi yang dimaksud dapat meliputi, namun tidak terbatas pada:",
  "Pengelola sistem berkomitmen untuk menjaga kerahasiaan dan keamanan data pribadi sesuai dengan ketentuan peraturan perundang-undangan yang berlaku, serta tidak akan menyalahgunakan data untuk kepentingan di luar layanan tanpa persetujuan pengguna.",
];

const imageSchema = Yup.mixed<File>()
  .required("Foto wajib diunggah")
  .test("fileType", "Foto harus berupa gambar", (file) => {
    if (!file) return false;
    return file instanceof File && file.type.startsWith("image/");
  })
  .test("fileSize", "Ukuran foto maksimal 5 MB", (file) => {
    if (!file) return false;
    return file instanceof File && file.size <= 5 * 1024 * 1024;
  });

const stepSchemas = [
  Yup.object({
    nama_lengkap: Yup.string().required("Nama lengkap wajib diisi"),
    nama_panggilan: Yup.string().required("Nama panggilan wajib diisi"),
    tempat_lahir: Yup.string().required("Tempat lahir wajib diisi"),
    tanggal_lahir: Yup.string().required("Tanggal lahir wajib diisi"),
    jenis_kelamin: Yup.string().required("Jenis kelamin wajib dipilih"),
    no_telepon: Yup.string()
      .required("Nomor telepon wajib diisi")
      .test("phone", "Format nomor telepon tidak valid", (value) => {
        if (!value) return false;
        // Must be 62 prefix followed by 9-12 digits
        return /^62\d{9,12}$/.test(value);
      }),
  }),
  Yup.object({
    nama_ayah: Yup.string().required("Nama ayah wajib diisi"),
    nama_ibu: Yup.string().required("Nama ibu wajib diisi"),
    hoby: Yup.string().required("Hoby wajib diisi"),
    pekerjaan: Yup.string().required("Pekerjaan wajib dipilih"),
    usia_menikah: Yup.string().notRequired(),
    kriteria_pasangan: Yup.string().notRequired(),
  }),
  Yup.object({
    alamat: Yup.string().required("Alamat wajib diisi"),
    tmpt_daerah: Yup.string().required("Tempat daerah wajib diisi"),
    tmpt_desa: Yup.string().required("Tempat desa wajib diisi"),
    tmpt_kelompok: Yup.string().required("Tempat kelompok wajib diisi"),
    status_persetujuan: Yup.number()
      .oneOf([1], "Persetujuan wajib dicentang")
      .required("Persetujuan wajib dicentang"),
    img: imageSchema,
  }),
];

const ConsentModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl dark:bg-slate-900 sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-700">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600 dark:text-sky-400">
              Persetujuan
            </p>
            <h3 className="mt-2 text-xl font-black text-slate-900 dark:text-white">
              Persetujuan Penyimpanan dan Penggunaan Data Pribadi
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-300 px-3 py-1 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Tutup
          </button>
        </div>

        <div className="mt-5 space-y-4 text-sm leading-7 text-slate-700 dark:text-slate-300">
          <p>{agreementParagraphs[0]}</p>
          <div>
            <p className="mb-2">{agreementParagraphs[1]}</p>
            <ol className="list-decimal space-y-1 pl-5">
              {agreementItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </div>
          <p>{agreementParagraphs[2]}</p>
        </div>
      </div>
    </div>
  );
};

const SensusRegistrationPage = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConsentOpen, setIsConsentOpen] = useState(false);
  const [isLoadingPekerjaan, setIsLoadingPekerjaan] = useState(true);
  const [isLoadingDaerah, setIsLoadingDaerah] = useState(true);
  const [isLoadingDesa, setIsLoadingDesa] = useState(false);
  const [isLoadingKelompok, setIsLoadingKelompok] = useState(false);
  const [pekerjaanOptions, setPekerjaanOptions] = useState<ReactSelectOption[]>(
    [],
  );
  const [daerahOptions, setDaerahOptions] = useState<ReactSelectOption[]>([]);
  const [desaOptions, setDesaOptions] = useState<ReactSelectOption[]>([]);
  const [kelompokOptions, setKelompokOptions] = useState<ReactSelectOption[]>(
    [],
  );

  const jenisKelaminOptions: ReactSelectOption[] = [
    { label: "LAKI-LAKI", value: "LAKI-LAKI" },
    { label: "PEREMPUAN", value: "PEREMPUAN" },
  ];

  const formik = useFormik<SensusFormValues>({
    initialValues: {
      nama_lengkap: "",
      nama_panggilan: "",
      tempat_lahir: "",
      tanggal_lahir: "",
      alamat: "",
      jenis_kelamin: "",
      no_telepon: "62",
      nama_ayah: "",
      nama_ibu: "",
      hoby: "",
      pekerjaan: "",
      usia_menikah: "",
      kriteria_pasangan: "",
      tmpt_daerah: "",
      tmpt_desa: "",
      tmpt_kelompok: "",
      status_persetujuan: 0,
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

        const response = await submitSensusRegistration({
          ...values,
          img: values.img,
          status_persetujuan: values.status_persetujuan,
        });

        showToast(
          "success",
          "Berhasil",
          response?.message ?? "Registrasi sensus berhasil disimpan.",
        );
        helpers.resetForm();
        setActiveStep(0);
      } catch (error: any) {
        showToast(
          "error",
          "Gagal",
          error?.response?.data?.message ||
            error?.message ||
            "Gagal menyimpan registrasi sensus.",
        );
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  useEffect(() => {
    const loadPekerjaan = async () => {
      try {
        setIsLoadingPekerjaan(true);
        const options = await fetchPekerjaanReference();
        setPekerjaanOptions(options);
      } catch {
        showToast("error", "Gagal", "Gagal memuat referensi pekerjaan.");
      } finally {
        setIsLoadingPekerjaan(false);
      }
    };

    void loadPekerjaan();
  }, []);

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
    if (!formik.values.tmpt_daerah) {
      setDesaOptions([]);
      setKelompokOptions([]);

      if (formik.values.tmpt_desa) {
        formik.setFieldValue("tmpt_desa", "", false);
      }

      if (formik.values.tmpt_kelompok) {
        formik.setFieldValue("tmpt_kelompok", "", false);
      }

      return;
    }

    const loadDesa = async () => {
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

    if (formik.values.tmpt_desa) {
      formik.setFieldValue("tmpt_desa", "", false);
    }

    if (formik.values.tmpt_kelompok) {
      formik.setFieldValue("tmpt_kelompok", "", false);
    }
  }, [formik.values.tmpt_daerah]);

  useEffect(() => {
    if (!formik.values.tmpt_desa) {
      setKelompokOptions([]);

      if (formik.values.tmpt_kelompok) {
        formik.setFieldValue("tmpt_kelompok", "", false);
      }

      return;
    }

    const loadKelompok = async () => {
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

  const isLastStep = activeStep === steps.length - 1;

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

      showToast("warning", "Peringatan", "Lengkapi dulu data pada step ini.");
    }
  };

  const pekerjaanHint = useMemo(() => {
    if (isLoadingPekerjaan) {
      return "Memuat referensi pekerjaan...";
    }

    return pekerjaanOptions.length > 0
      ? "Pilih pekerjaan."
      : "Referensi pekerjaan kosong.";
  }, [isLoadingPekerjaan, pekerjaanOptions.length]);

  return (
    <div className="w-full space-y-6">
      <StepperHeader
        title="Registrasi Sensus"
        description="Form registrasi sensus menggunakan stepper agar lebih mudah dipakai di perangkat mobile. Semua field wajib diisi, kecuali usia menikah dan kriteria pasangan yang bersifat opsional. Pada langkah terakhir, persetujuan penyimpanan dan penggunaan data pribadi wajib dicentang."
        steps={steps}
        activeStep={activeStep}
      />

      <ConsentModal
        isOpen={isConsentOpen}
        onClose={() => setIsConsentOpen(false)}
      />

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
            onClick={() => navigate("/digital-data/sensus")}
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
            />
            <PrimeInputText
              label="Nama panggilan"
              name="nama_panggilan"
              formik={formik}
              required
            />
            <PrimeInputText
              label="Tempat lahir"
              name="tempat_lahir"
              formik={formik}
              required
            />
            <PrimeInputText
              label="Tanggal lahir"
              name="tanggal_lahir"
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
            <PrimeInputText
              label="Nomor telepon"
              name="no_telepon"
              formik={formik}
              required
              placeholder="Masukkan nomor (default 62)"
              helperText="Nomor akan disimpan dengan prefix 62"
            />
          </div>
        ) : activeStep === 1 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <PrimeInputText
              label="Nama ayah"
              name="nama_ayah"
              formik={formik}
              required
            />
            <PrimeInputText
              label="Nama ibu"
              name="nama_ibu"
              formik={formik}
              required
            />
            <PrimeInputText label="Hoby" name="hoby" formik={formik} required />
            <PrimeSelect
              label="Pekerjaan"
              name="pekerjaan"
              formik={formik}
              required
              options={pekerjaanOptions}
              isLoading={isLoadingPekerjaan}
              placeholder={
                isLoadingPekerjaan ? "Memuat data..." : "Pilih pekerjaan"
              }
              helperText={pekerjaanHint}
            />
            <PrimeInputText
              label="Usia menikah"
              name="usia_menikah"
              formik={formik}
              placeholder="Opsional"
            />
            <PrimeInputText
              label="Kriteria pasangan"
              name="kriteria_pasangan"
              formik={formik}
              placeholder="Opsional"
            />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <TextareaField
                label="Alamat"
                name="alamat"
                formik={formik}
                required
                rows={5}
              />
            </div>
            <PrimeSelect
              label="Tempat daerah"
              name="tmpt_daerah"
              formik={formik}
              required
              options={daerahOptions}
              isLoading={isLoadingDaerah}
              placeholder={isLoadingDaerah ? "Memuat data..." : "Pilih daerah"}
              helperText="Dipakai untuk memuat referensi desa."
            />
            <PrimeSelect
              label="Tempat desa"
              name="tmpt_desa"
              formik={formik}
              required
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
            <PrimeSelect
              label="Tempat kelompok"
              name="tmpt_kelompok"
              formik={formik}
              required
              options={kelompokOptions}
              isLoading={isLoadingKelompok}
              placeholder={
                formik.values.tmpt_desa
                  ? isLoadingKelompok
                    ? "Memuat data..."
                    : "Pilih kelompok"
                  : "Pilih desa dulu"
              }
              helperText="Lengkapi lokasi sesuai referensi."
              disabled={!formik.values.tmpt_desa}
            />
            <div className="md:col-span-2">
              <PhotoField
                label="Foto"
                name="img"
                formik={formik}
                required
                helperText="Unggah foto saja, ukuran maksimal 5 MB."
              />
            </div>
            <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/40">
              <div className="flex items-start gap-3">
                <input
                  id="status_persetujuan"
                  name="status_persetujuan"
                  type="checkbox"
                  aria-label="Persetujuan penyimpanan dan penggunaan data pribadi"
                  checked={formik.values.status_persetujuan === 1}
                  onChange={(event) => {
                    formik.setFieldValue(
                      "status_persetujuan",
                      event.target.checked ? 1 : 0,
                      true,
                    );
                  }}
                  onBlur={formik.handleBlur}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => setIsConsentOpen(true)}
                    className="block text-left text-sm font-medium leading-6 text-slate-700 transition hover:text-sky-700 dark:text-slate-200"
                  >
                    Dengan tombol &quot;ceklis&quot; atau melanjutkan proses
                    penggunaan layanan, saya dianggap telah membaca, memahami,
                    dan menyetujui ketentuan penyimpanan dan penggunaan data
                    pribadi ini.
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConsentOpen(true)}
                    className="mt-2 text-left text-sm font-semibold text-sky-600 underline decoration-sky-400 decoration-2 underline-offset-4 transition hover:text-sky-700"
                  >
                    Lihat persetujuan lengkap
                  </button>
                  {(formik.submitCount > 0 ||
                    formik.touched.status_persetujuan) &&
                  typeof formik.errors.status_persetujuan === "string" ? (
                    <p className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-400">
                      {formik.errors.status_persetujuan}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700">
          <button
            type="button"
            onClick={() => setActiveStep((current) => Math.max(current - 1, 0))}
            disabled={activeStep === 0 || isSubmitting}
            className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-200"
          >
            Kembali
          </button>

          {isLastStep ? (
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Registrasi"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
            >
              Lanjut
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default SensusRegistrationPage;
