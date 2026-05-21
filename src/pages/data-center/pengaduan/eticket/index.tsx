import { useEffect, useState } from "react";
import { useFormik } from "formik";
import { useNavigate } from "react-router-dom";
import * as Yup from "yup";
import type { InputActionMeta } from "react-select";

import {
  PhotoField,
  PrimeInputText,
  PrimeSelect,
  StepperHeader,
  TextareaField,
} from "../../../../components/forms/FormFields";
import {
  fetchNamaPesertaCaiReference,
  submitEticket,
} from "../../../../services/dataCenter";
import { showToast } from "../../../../services/toast";

type EticketFormValues = {
  nama_lengkap: string;
  kontak: string;
  jenis_pengaduan: string;
  subjek: string;
  isi_pengaduan: string;
  nama_kelompok: string;
  lampiran: File | null;
};

interface ReactSelectOption {
  label: string;
  value: string;
}

const steps = ["Jenis Pengaduan", "Pelapor", "Aduan"];

const imageSchema = Yup.mixed<File>()
  .nullable()
  .test("fileType", "Lampiran harus berupa foto", (file) => {
    if (!file) return true;
    return file instanceof File && file.type.startsWith("image/");
  })
  .test("fileSize", "Ukuran lampiran maksimal 5 MB", (file) => {
    if (!file) return true;
    return file instanceof File && file.size <= 5 * 1024 * 1024;
  });

const stepSchemas = [
  Yup.object({
    jenis_pengaduan: Yup.string().required("Jenis pengaduan wajib dipilih"),
  }),
  Yup.object({
    kontak: Yup.string()
      .required("Kontak wajib diisi")
      .test("phone", "Format nomor telepon tidak valid", (value) => {
        if (!value) return false;
        return /^62\d{9,12}$/.test(value);
      }),
    nama_lengkap: Yup.string().required("Nama wajib diisi"),
    nama_kelompok: Yup.string().required("Nama kelompok wajib diisi"),
  }),
  Yup.object({
    subjek: Yup.string().required("Subjek wajib diisi"),
    isi_pengaduan: Yup.string().required("Isi pengaduan wajib diisi"),
    lampiran: imageSchema,
  }),
];

const EticketPage = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingNames, setIsLoadingNames] = useState(false);
  const [nameOptions, setNameOptions] = useState<ReactSelectOption[]>([]);
  const [nameSearchTerm, setNameSearchTerm] = useState("");

  const formik = useFormik<EticketFormValues>({
    initialValues: {
      nama_lengkap: "",
      kontak: "62",
      jenis_pengaduan: "",
      subjek: "",
      isi_pengaduan: "",
      nama_kelompok: "",
      lampiran: null,
    },
    validateOnBlur: true,
    validateOnChange: false,
    validationSchema: stepSchemas[activeStep],
    onSubmit: async (values, helpers) => {
      try {
        setIsSubmitting(true);

        const response = await submitEticket({
          ...values,
          lampiran: values.lampiran,
        });

        showToast(
          "success",
          "Berhasil",
          response?.message ?? "E-ticket berhasil dikirim.",
        );
        helpers.resetForm();
        setActiveStep(0);
        setNameOptions([]);
      } catch (error: any) {
        showToast(
          "error",
          "Gagal",
          error?.response?.data?.message ||
            error?.message ||
            "Gagal msengirim e-ticket.",
        );
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const { setFieldValue, setFieldTouched, values } = formik;

  const requiresCaiReferenceName =
    values.jenis_pengaduan === "keluhan_data_cai";

  useEffect(() => {
    setFieldValue("nama_lengkap", "", false);
    setFieldTouched("nama_lengkap", false, false);
    setNameOptions([]);
    setNameSearchTerm("");
  }, [setFieldTouched, setFieldValue, values.jenis_pengaduan]);

  useEffect(() => {
    if (!requiresCaiReferenceName) {
      setNameOptions([]);
      return;
    }

    let cancelled = false;

    const loadNames = async () => {
      try {
        setIsLoadingNames(true);
        const options = await fetchNamaPesertaCaiReference({
          search: nameSearchTerm,
        });

        if (!cancelled) {
          setNameOptions(options);
        }
      } catch {
        if (!cancelled) {
          showToast("error", "Gagal", "Gagal memuat referensi nama peserta.");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingNames(false);
        }
      }
    };

    const timeoutId = window.setTimeout(() => {
      void loadNames();
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [requiresCaiReferenceName, nameSearchTerm]);

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

  const renderNamaLengkapField = () => {
    if (!requiresCaiReferenceName) {
      return (
        <PrimeInputText
          label="Nama lengkap"
          name="nama_lengkap"
          formik={formik}
          required
        />
      );
    }

    return (
      <PrimeSelect
        label="Nama lengkap"
        name="nama_lengkap"
        formik={formik}
        required
        options={nameOptions}
        isLoading={isLoadingNames}
        placeholder={isLoadingNames ? "Memuat data..." : "Pilih nama"}
        helperText={
          isLoadingNames
            ? "Memuat referensi nama..."
            : "Dipilih dari referensi peserta."
        }
        onInputChange={(inputValue: string, actionMeta: InputActionMeta) => {
          if (actionMeta.action === "input-change") {
            setNameSearchTerm(inputValue);
          }

          return inputValue;
        }}
      />
    );
  };

  return (
    <div className="w-full space-y-6">
      <StepperHeader
        title="E-Ticket"
        description="Form ini dipakai untuk keluhan data, kritik, dan saran. Jika jenis pengaduan terkait data CAI, nama pelapor diambil dari reference list nama peserta CAI."
        steps={steps}
        activeStep={activeStep}
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
            onClick={() => navigate("/digital-data/pengaduan")}
            className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            ← Kembali
          </button>
        </div>

        {activeStep === 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <PrimeSelect
                label="Jenis pengaduan"
                name="jenis_pengaduan"
                formik={formik}
                required
                options={[
                  { label: "Keluhan Data CAI", value: "keluhan_data_cai" },
                  {
                    label: "Keluhan Data Sensus",
                    value: "keluhan_data_sensus",
                  },
                  {
                    label: "Keluhan Data Absensi",
                    value: "keluhan_data_absensi",
                  },
                  { label: "Kritik Saran", value: "kritik_saran" },
                ]}
              />
            </div>
          </div>
        ) : activeStep === 1 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {renderNamaLengkapField()}
            <PrimeInputText
              label="Kontak"
              name="kontak"
              formik={formik}
              required
              placeholder="Masukkan nomor (default 62)"
              helperText="Nomor akan disimpan dengan prefix 62"
            />
            <PrimeInputText
              label="Nama kelompok"
              name="nama_kelompok"
              formik={formik}
              required
              placeholder="Isi nama kelompok"
            />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <PrimeInputText
                label="Subjek"
                name="subjek"
                formik={formik}
                required
              />
            </div>
            <div className="md:col-span-2">
              <TextareaField
                label="Isi pengaduan"
                name="isi_pengaduan"
                formik={formik}
                required
                rows={6}
              />
            </div>
            <div className="md:col-span-2">
              <PhotoField
                label="Lampiran"
                name="lampiran"
                formik={formik}
                helperText="Opsional, hanya foto dan maksimal 5 MB."
                previewLabel="Lampiran e-ticket"
              />
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

          {activeStep === steps.length - 1 ? (
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Mengirim..." : "Kirim E-Ticket"}
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

export default EticketPage;
