import { useEffect, useRef, useState } from "react";
import { Formik, Form, Field, type FormikHelpers } from "formik";
import { useNavigate } from "react-router-dom";
import * as Yup from "yup";
import { Toast } from "primereact/toast";
import { axiosServices } from "../../../services/axios";
import { FiArrowLeft, FiCheckCircle } from "react-icons/fi";
import { useInspectContext } from "../../../contexts/InspectContext";

export interface Root {
  code: string;
  success: boolean;
  data: Data;
  message: string;
  param: Param;
}

export interface Data {
  kuota_total: number;
  sisa_kuota: number;
  kuota_terpakai: number;
  able_reservasi: boolean;
}

export interface Param {
  id_wiluppd: string;
  tg_proses: string;
}

const CekPajakKendaraanPage = () => {
  const navigate = useNavigate();

  const toastRef = useRef<Toast>(null);
  const [selectedOption, setSelectedOption] = useState("Hitam/Putih Pribadi");

  const input2Ref = useRef<HTMLInputElement>(null);
  const input1Ref = useRef<HTMLInputElement>(null);
  const input3Ref = useRef<HTMLInputElement>(null);

  const validationSchema = Yup.object().shape({
    no_polisi1: Yup.string().required("Wajib diisi"),
    no_polisi2: Yup.string().required("Wajib diisi"),
    no_polisi3: Yup.string().required("Wajib diisi"),
  });

  const initialValues = {
    no_polisi1: "",
    no_polisi2: "",
    no_polisi3: "",
    kd_plat: "1",
    bayar_kedepan: "",
  };

  const handleSubmit = async (
    values: any,
    { setSubmitting }: FormikHelpers<any>,
  ) => {
    try {
      const response = await axiosServices().post(
        `/api/v1/data_center/sambara/info-pajak`,
        {
          objek_pajak_no_polisi1: values.no_polisi1,
          objek_pajak_no_polisi2: values.no_polisi2,
          objek_pajak_no_polisi3: values.no_polisi3,
          objek_pajak_kd_plat: values.kd_plat,
          bayar_kedepan: "",
        },
      );

      const result = response.data;
      const isValidResult =
        result?.success !== false && result?.data?.success !== false;

      if (isValidResult) {
        navigate(`/digital-data/sambara/cek-pajak-kendaraan/result`, {
          state: { detailData: result, values: values },
          replace: true,
        });
      } else {
        toastRef.current?.show({
          severity: "error",
          summary: "Gagal",
          detail:
            result?.data?.message || "Terjadi kesalahan saat mengirim data.",
          life: 3000,
        });
      }
    } catch (error: any) {
      if (error.response) {
        const { status, data } = error.response;
        if (
          [
            400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412,
            413, 414, 415, 416, 417, 418, 422, 423, 424, 425, 426, 428, 429,
            431, 451, 500, 501, 502, 503, 504, 505, 506, 507, 508, 510, 511,
          ].includes(status)
        ) {
          toastRef.current?.show({
            severity: "error",
            summary: "Error",
            detail: data.message || "Terjadi kesalahan",
            life: 3000,
          });
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const optionsDataProgresif = [
    { value: "1", label: "Hitam/Putih Pribadi", short: "Hitam/Putih", color: "bg-slate-900", border: "border-slate-700", text: "text-white" },
    { value: "2", label: "Merah Instansi", short: "Merah", color: "bg-red-600", border: "border-red-500", text: "text-white" },
    { value: "3", label: "Kuning Umum", short: "Kuning", color: "bg-amber-400", border: "border-amber-500", text: "text-slate-900" },
  ];

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      {/* Modern Startup Header & Search Interface */}
      <div className="relative overflow-hidden rounded-[2rem] bg-white p-8 shadow-2xl shadow-slate-200/50 ring-1 ring-slate-900/5 dark:bg-[#0b1120] dark:shadow-none dark:ring-white/10 sm:p-12">
        {/* Glow Effects */}
        <div className="pointer-events-none absolute -left-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 blur-[100px] dark:from-blue-600/20 dark:to-purple-600/20" />
        <div className="pointer-events-none absolute -bottom-40 -right-40 h-[30rem] w-[30rem] rounded-full bg-gradient-to-br from-cyan-500/30 to-emerald-500/30 blur-[100px] dark:from-cyan-500/20 dark:to-emerald-500/20" />

        <div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-2xl">
            <div className="mb-6 flex items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 ring-1 ring-inset ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20">
                <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400"></span>
                Tax Integration
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Sambara
              </span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
              Cek Pajak Kendaraan
            </h1>
            <p className="mt-4 text-lg font-medium text-slate-600 dark:text-slate-400">
              Integrasi langsung untuk memeriksa informasi pajak kendaraan bermotor. Masukkan nomor registrasi dan pilih jenis plat di bawah ini.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="group flex shrink-0 items-center gap-2 rounded-full bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-700/80"
          >
            <FiArrowLeft className="transition group-hover:-translate-x-1" />
            Kembali
          </button>
        </div>

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          validateOnChange={true}
          validateOnBlur={true}
        >
          {({ errors, touched, isSubmitting, values, setFieldValue }) => {
            const { isInspectOpen } = useInspectContext();
            
            useEffect(() => {
              const defaultOption = optionsDataProgresif.find(
                (opt) => opt.value === "1",
              );
              if (defaultOption && !values.kd_plat) {
                setSelectedOption(defaultOption.label);
                setFieldValue("kd_plat", defaultOption.value);
              }
            }, [setFieldValue, values.kd_plat]);

            return (
              <>
                <Toast ref={toastRef} />
                <Form className="relative z-10 mt-10">
                  <div className="rounded-[2rem] bg-white/50 p-6 shadow-lg ring-1 ring-slate-900/5 backdrop-blur-xl dark:bg-slate-900/50 dark:ring-white/10 sm:p-8">
                    
                    <div className="grid gap-10 lg:grid-cols-[1fr_auto]">
                      {/* Left: Plate Input Section */}
                      <div className="space-y-4">
                        <label className="text-xs font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">
                          Nomor Registrasi Kendaraan
                        </label>
                        
                        <div className={`relative flex items-center justify-between gap-2 sm:gap-4 rounded-[1.5rem] p-4 sm:p-6 shadow-inner transition-colors duration-300 ${
                          values?.kd_plat === "1" ? "bg-slate-900 ring-4 ring-slate-900/20" :
                          values?.kd_plat === "2" ? "bg-red-600 ring-4 ring-red-600/20" :
                          values?.kd_plat === "3" ? "bg-amber-400 ring-4 ring-amber-400/20" :
                          "bg-slate-900 ring-4 ring-slate-900/20"
                        }`}>
                          {/* Inner Border mimicking a physical license plate */}
                          <div className={`pointer-events-none absolute inset-2 rounded-xl border-2 ${
                            values?.kd_plat === "1" || values?.kd_plat === "2" ? "border-white/20" :
                            values?.kd_plat === "3" ? "border-black/20" : "border-white/20"
                          }`} />

                          {/* Prefix Letter */}
                          <Field name="no_polisi1">
                            {({ field }: any) => {
                              const display = isInspectOpen ? "" : field.value;
                              return (
                                <input
                                  id="no_polisi1"
                                  maxLength={2}
                                  ref={input1Ref}
                                  value={display}
                                  readOnly={isInspectOpen}
                                  className={`relative z-10 w-16 sm:w-24 bg-transparent text-center text-4xl sm:text-5xl font-black uppercase tracking-widest outline-none transition-colors ${
                                    values?.kd_plat === "1" || values?.kd_plat === "2" ? "text-white placeholder:text-white/20" : "text-slate-900 placeholder:text-slate-900/20"
                                  } ${errors.no_polisi1 && touched.no_polisi1 ? "ring-2 ring-red-500 rounded-lg" : ""}`}
                                  placeholder={isInspectOpen ? "**" : "B"}
                                  onChange={(e: any) => {
                                    const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, "");
                                    setFieldValue("no_polisi1", value);
                                    if (value.length >= 1 && value.length <= 2) {
                                      // Focus next when user inputs enough characters
                                      if (value.length === 2) input2Ref.current?.focus();
                                    }
                                  }}
                                />
                              );
                            }}
                          </Field>

                          {/* Middle Numbers */}
                          <Field name="no_polisi2">
                            {({ field }: any) => {
                              const display = isInspectOpen ? "" : field.value;
                              return (
                                <input
                                  id="no_polisi2"
                                  maxLength={4}
                                  ref={input2Ref}
                                  value={display}
                                  readOnly={isInspectOpen}
                                  className={`relative z-10 w-24 sm:w-36 bg-transparent text-center text-4xl sm:text-5xl font-black tracking-widest outline-none transition-colors ${
                                    values?.kd_plat === "1" || values?.kd_plat === "2" ? "text-white placeholder:text-white/20" : "text-slate-900 placeholder:text-slate-900/20"
                                  } ${errors.no_polisi2 && touched.no_polisi2 ? "ring-2 ring-red-500 rounded-lg" : ""}`}
                                  placeholder={isInspectOpen ? "****" : "1234"}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/[^0-9]/g, "");
                                    setFieldValue("no_polisi2", value);
                                    if (value === "") input1Ref.current?.focus();
                                    else if (value.length === 4) input3Ref.current?.focus();
                                  }}
                                />
                              );
                            }}
                          </Field>

                          {/* Suffix Letter */}
                          <Field name="no_polisi3">
                            {({ field }: any) => {
                              const display = isInspectOpen ? "" : field.value;
                              return (
                                <input
                                  id="no_polisi3"
                                  maxLength={3}
                                  ref={input3Ref}
                                  value={display}
                                  readOnly={isInspectOpen}
                                  className={`relative z-10 w-20 sm:w-28 bg-transparent text-center text-4xl sm:text-5xl font-black uppercase tracking-widest outline-none transition-colors ${
                                    values?.kd_plat === "1" || values?.kd_plat === "2" ? "text-white placeholder:text-white/20" : "text-slate-900 placeholder:text-slate-900/20"
                                  } ${errors.no_polisi3 && touched.no_polisi3 ? "ring-2 ring-red-500 rounded-lg" : ""}`}
                                  placeholder={isInspectOpen ? "***" : "XYZ"}
                                  onChange={(e: any) => {
                                    const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, "");
                                    setFieldValue("no_polisi3", value);
                                    if (value === "") input2Ref.current?.focus();
                                  }}
                                />
                              );
                            }}
                          </Field>
                        </div>
                      </div>

                      {/* Right: Plate Color/Type Selector */}
                      <div className="space-y-4">
                        <label className="text-xs font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">
                          Jenis TNKB
                        </label>
                        <div className="flex flex-col gap-3">
                          {optionsDataProgresif.map((option) => (
                            <button
                              type="button"
                              key={option.value}
                              onClick={() => {
                                setSelectedOption(option.label);
                                setFieldValue("kd_plat", option.value);
                              }}
                              className={`group relative flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all ${
                                selectedOption === option.label
                                  ? "border-blue-600 bg-blue-50 shadow-md dark:border-blue-500 dark:bg-blue-500/10"
                                  : "border-transparent bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/60 dark:hover:bg-slate-700/60"
                              }`}
                            >
                              <div className={`h-6 w-8 shrink-0 rounded border ${option.border} ${option.color} shadow-sm transition-transform group-hover:scale-105`} />
                              <div className="flex-1">
                                <p className={`text-xs font-bold ${
                                  selectedOption === option.label ? "text-blue-700 dark:text-blue-400" : "text-slate-700 dark:text-slate-300"
                                }`}>
                                  {option.label}
                                </p>
                              </div>
                              {selectedOption === option.label && (
                                <FiCheckCircle className="text-lg text-blue-600 dark:text-blue-400 shrink-0" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-10 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4 border-t border-slate-200 pt-6 dark:border-slate-800/60">
                      <button
                        type="submit"
                        disabled={
                          isSubmitting ||
                          !values?.no_polisi1 ||
                          !values?.no_polisi2 ||
                          !values?.no_polisi3 ||
                          (typeof isInspectOpen !== "undefined" && isInspectOpen)
                        }
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700 disabled:opacity-50 sm:w-auto dark:shadow-none"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Memproses...
                          </>
                        ) : (
                          "Cek Informasi Kendaraan"
                        )}
                      </button>
                    </div>
                  </div>
                </Form>
              </>
            );
          }}
        </Formik>
      </div>
    </div>
  );
};

export default CekPajakKendaraanPage;

