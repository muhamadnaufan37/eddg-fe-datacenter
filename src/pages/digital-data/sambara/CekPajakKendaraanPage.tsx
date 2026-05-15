import { useMemo, useState } from "react";
import { useFormik } from "formik";
import { useNavigate } from "react-router-dom";
import * as Yup from "yup";

import {
  PrimeInputText,
  PrimeSelect,
} from "../../../components/forms/FormFields";
import { submitCekPajakKendaraan } from "../../../services/dataCenter";
import { showToast } from "../../../services/toast";
import { formatBooleanLabel, maskText } from "../../../utils/text";

type PajakDetailValue = string | number | boolean | null | undefined;

interface PajakDetail {
  [key: string]: PajakDetailValue;
}

interface PajakApiResult {
  data?: PajakDetail;
  message?: string;
  success?: boolean;
}

type PajakFormValues = {
  objek_pajak_no_polisi1: string;
  objek_pajak_no_polisi2: string;
  objek_pajak_no_polisi3: string;
  objek_pajak_kd_plat: string;
  bayar_kedepan: string;
};

interface ReactSelectOption {
  label: string;
  value: string | number;
}

const CekPajakKendaraanPage = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<PajakApiResult | null>(null);

  const kdPlatOptions: ReactSelectOption[] = [
    { label: "1", value: "1" },
    { label: "2", value: "2" },
    { label: "3", value: "3" },
    { label: "4", value: "4" },
    { label: "5", value: "5" },
  ];

  const formik = useFormik<PajakFormValues>({
    initialValues: {
      objek_pajak_no_polisi1: "",
      objek_pajak_no_polisi2: "",
      objek_pajak_no_polisi3: "",
      objek_pajak_kd_plat: "1",
      bayar_kedepan: "",
    },
    validationSchema: Yup.object({
      objek_pajak_no_polisi1: Yup.string()
        .required("Bagian nomor polisi 1 wajib diisi")
        .matches(/^[A-Z]$/, "Hanya 1 huruf kapital"),
      objek_pajak_no_polisi2: Yup.string()
        .required("Bagian nomor polisi 2 wajib diisi")
        .matches(/^\d{1,4}$/, "1-4 digit angka saja"),
      objek_pajak_no_polisi3: Yup.string()
        .required("Bagian nomor polisi 3 wajib diisi")
        .matches(/^[A-Z]{1,3}$/, "1-3 huruf kapital saja"),
      objek_pajak_kd_plat: Yup.string().required("Kode plat wajib dipilih"),
      bayar_kedepan: Yup.string().notRequired(),
    }),
    onSubmit: async (values) => {
      try {
        setIsSubmitting(true);
        const response = await submitCekPajakKendaraan(values);
        setResult(response as PajakApiResult);
        showToast(
          "success",
          "Berhasil",
          (response as PajakApiResult)?.message ??
            "Data pajak kendaraan berhasil diambil.",
        );
      } catch {
        showToast("error", "Gagal", "Gagal mengambil data pajak kendaraan.");
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const summaryCards = useMemo(() => {
    if (!result?.data) {
      return [];
    }

    const cards: Array<[string, PajakDetailValue]> = [
      [
        "Nomor polisi",
        `${result.data.no_polisi1}-${result.data.no_polisi2}-${result.data.no_polisi3}`,
      ],
      ["Pemilik", maskText(result.data.nm_pemilik as string, 2, 2)],
      ["Alamat pemilik", maskText(result.data.al_pemilik as string, 3, 2)],
      ["No rangka", maskText(result.data.no_rangka as string, 3, 3)],
      ["No mesin", maskText(result.data.no_mesin as string, 3, 3)],
      ["Merek", result.data.nm_merek_kb],
      ["Model", result.data.nm_model_kb],
      ["Warna", result.data.warna_kb],
      [
        "Bayar pajak",
        formatBooleanLabel(result.data.able_bayar_pajak as boolean),
      ],
      [
        "Bayar e-samsat",
        formatBooleanLabel(result.data.able_bayar_esamsat as boolean),
      ],
      ["Tgl akhir pajak", result.data.tg_akhir_pajak],
      ["Tgl akhir STNK", result.data.tg_akhir_stnk],
    ];

    // Add nominal fields if they exist
    const nominalFields = [
      "nm_pokok",
      "nm_denda",
      "nm_stnk",
      "nm_plat",
      "nm_samsat",
      "nm_total",
      "nm_bayar",
      "nm_sisa",
    ];

    nominalFields.forEach((field) => {
      if (result.data?.[field] !== undefined && result.data?.[field] !== null) {
        const label = field
          .replace("nm_", "")
          .replace(/_/g, " ")
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
        cards.push([label, result.data[field]]);
      }
    });

    return cards;
  }, [result]);

  return (
    <div className="w-full max-w-6xl space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600 dark:text-sky-400">
              Sambara
            </p>
            <h1 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
              Cek Pajak Kendaraan
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
              Hasil pencarian menampilkan ringkasan dan data sensitif
              disamarkan.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            ← Kembali
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <form
          onSubmit={formik.handleSubmit}
          className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <PrimeInputText
              label="No polisi 1"
              name="objek_pajak_no_polisi1"
              formik={formik}
              required
              placeholder="Masukkan 1 huruf kapital"
            />
            <PrimeInputText
              label="No polisi 2"
              name="objek_pajak_no_polisi2"
              formik={formik}
              required
              placeholder="Masukkan 1-4 digit"
            />
            <PrimeInputText
              label="No polisi 3"
              name="objek_pajak_no_polisi3"
              formik={formik}
              required
              placeholder="Masukkan 1-3 huruf kapital"
            />
            <PrimeSelect
              label="Kode plat"
              name="objek_pajak_kd_plat"
              formik={formik}
              required
              options={kdPlatOptions}
            />
          </div>

          <PrimeInputText
            label="Bayar ke depan"
            name="bayar_kedepan"
            formik={formik}
            placeholder="Opsional"
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Mengecek..." : "Cek Pajak"}
          </button>
        </form>

        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Hasil pencarian
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Ringkasan ini akan terisi setelah data berhasil diambil.
            </p>
          </div>

          {result?.data ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {summaryCards.map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    {label}
                  </p>
                  <p className="mt-2 break-words text-sm font-semibold text-slate-900 dark:text-white">
                    {value ?? "-"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[20rem] items-center justify-center rounded-3xl border border-dashed border-slate-300 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              Isi data kendaraan lalu tekan tombol cek pajak.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CekPajakKendaraanPage;
