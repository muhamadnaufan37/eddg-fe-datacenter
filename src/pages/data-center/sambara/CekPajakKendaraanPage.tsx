import { useEffect, useRef } from "react";
import { Formik, Form, Field, type FormikHelpers } from "formik";
import { useNavigate } from "react-router-dom";
import * as Yup from "yup";
import { Toast } from "primereact/toast";
import { axiosServices } from "../../../services/axios";
import { FiArrowLeft } from "react-icons/fi";
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
    { value: "1", label: "Pribadi (Hitam / Putih)" },
    { value: "2", label: "Instansi (Merah)" },
    { value: "3", label: "Umum (Kuning)" },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      {/* Sleek Minimalist Header */}
      <div className="flex flex-col gap-4 text-center">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-5xl">
          Cek Pajak Kendaraan
        </h1>
        <p className="mx-auto max-w-xl text-sm font-medium text-slate-500 dark:text-slate-400 sm:text-base">
          Akses informasi pajak kendaraan bermotor (PKB) secara real-time. Masukkan nomor registrasi dan wilayah untuk melihat rincian tagihan, kendaraan yang terdaftar hanya untuk wilayah jawa barat.
        </p>
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
            if (!values.kd_plat) {
              setFieldValue("kd_plat", "1");
            }
          }, [setFieldValue, values.kd_plat]);

          return (
            <>
              <Toast ref={toastRef} />
              <Form className="relative z-10 mx-auto max-w-2xl">
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/40 transition-all dark:border-slate-800 dark:bg-[#0f172a] dark:shadow-none">

                  <div className="p-6 sm:p-8 space-y-8">
                    {/* Input Section */}
                    <div className="space-y-4">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        Nomor Polisi (NRKB)
                      </label>
                      {(() => {
                        const getPlateColors = () => {
                          switch (values.kd_plat) {
                            case "2":
                              return {
                                wrapper: "border-red-700 bg-red-600 dark:border-red-800",
                                input: "text-white placeholder-white/40",
                                footer: "border-black/20 bg-red-700/80 text-white/60",
                              };
                            case "3":
                              return {
                                wrapper: "border-yellow-600 bg-yellow-400 dark:border-yellow-700",
                                input: "text-slate-900 placeholder-slate-900/30",
                                footer: "border-black/10 bg-yellow-500/50 text-slate-900/60",
                              };
                            case "1":
                            default:
                              return {
                                wrapper: "border-slate-300 bg-white dark:border-slate-400 dark:bg-slate-100",
                                input: "text-slate-900 placeholder-slate-300",
                                footer: "border-slate-900/10 bg-slate-100 text-slate-900/40 dark:bg-slate-200",
                              };
                          }
                        };
                        const pColor = getPlateColors();

                        return (
                          <div className={`mx-auto flex w-full max-w-[28rem] flex-col overflow-hidden rounded-xl border-[6px] shadow-inner transition-colors duration-300 ${pColor.wrapper}`}>
                            <div className="flex items-center justify-center gap-1 p-2 sm:gap-2">
                              <Field name="no_polisi1">
                                {({ field }: any) => (
                                  <input
                                    {...field}
                                    maxLength={2}
                                    ref={input1Ref}
                                    readOnly={isInspectOpen}
                                    className={`w-[25%] bg-transparent text-center text-4xl font-black uppercase tracking-wider outline-none transition-colors sm:text-5xl ${pColor.input} ${errors.no_polisi1 && touched.no_polisi1 ? "!text-rose-500 drop-shadow-sm" : ""}`}
                                    placeholder={isInspectOpen ? "**" : "D"}
                                    onChange={(e: any) => {
                                      const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, "");
                                      setFieldValue("no_polisi1", value);
                                      if (value.length === 2) input2Ref.current?.focus();
                                    }}
                                  />
                                )}
                              </Field>

                              <Field name="no_polisi2">
                                {({ field }: any) => (
                                  <input
                                    {...field}
                                    maxLength={4}
                                    ref={input2Ref}
                                    readOnly={isInspectOpen}
                                    className={`w-[40%] bg-transparent text-center text-4xl font-black tracking-widest outline-none transition-colors sm:text-5xl ${pColor.input} ${errors.no_polisi2 && touched.no_polisi2 ? "!text-rose-500 drop-shadow-sm" : ""}`}
                                    placeholder={isInspectOpen ? "****" : "1234"}
                                    onChange={(e: any) => {
                                      const value = e.target.value.replace(/[^0-9]/g, "");
                                      setFieldValue("no_polisi2", value);
                                      if (value === "") input1Ref.current?.focus();
                                      else if (value.length === 4) input3Ref.current?.focus();
                                    }}
                                  />
                                )}
                              </Field>

                              <Field name="no_polisi3">
                                {({ field }: any) => (
                                  <input
                                    {...field}
                                    maxLength={3}
                                    ref={input3Ref}
                                    readOnly={isInspectOpen}
                                    className={`w-[35%] bg-transparent text-center text-4xl font-black uppercase tracking-wider outline-none transition-colors sm:text-5xl ${pColor.input} ${errors.no_polisi3 && touched.no_polisi3 ? "!text-rose-500 drop-shadow-sm" : ""}`}
                                    placeholder={isInspectOpen ? "***" : "XYZ"}
                                    onChange={(e: any) => {
                                      const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, "");
                                      setFieldValue("no_polisi3", value);
                                      if (value === "") input2Ref.current?.focus();
                                    }}
                                  />
                                )}
                              </Field>
                            </div>
                            <div className={`flex justify-center border-t-2 py-1 transition-colors duration-300 ${pColor.footer}`}>
                              <span className="text-[10px] font-black tracking-[0.4em] text-inherit">KORLANTAS POLRI</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    <div className="space-y-4">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        Jenis TNKB
                      </label>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {optionsDataProgresif.map((option) => (
                          <button
                            type="button"
                            key={option.value}
                            onClick={() => setFieldValue("kd_plat", option.value)}
                            className={`flex items-center justify-center rounded-xl border-2 p-3 text-xs font-bold transition-all ${values.kd_plat === option.value
                              ? "border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-500/10 dark:text-blue-400"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-[#0f172a] dark:text-slate-400 dark:hover:border-slate-700"
                              }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row items-center gap-4 bg-slate-50 px-6 py-5 dark:bg-slate-900/50 sm:justify-between">
                    <button
                      type="button"
                      onClick={() => navigate("/")}
                      className="group flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 sm:w-auto"
                    >
                      <FiArrowLeft className="transition-transform group-hover:-translate-x-1" />
                      Kembali
                    </button>

                    <button
                      type="submit"
                      disabled={
                        isSubmitting ||
                        !values?.no_polisi1 ||
                        !values?.no_polisi2 ||
                        !values?.no_polisi3 ||
                        (typeof isInspectOpen !== "undefined" && isInspectOpen)
                      }
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:bg-blue-700 disabled:opacity-50 dark:shadow-none sm:w-auto"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Memproses...
                        </>
                      ) : (
                        "Cari Data Kendaraan"
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
  );
};

export default CekPajakKendaraanPage;

