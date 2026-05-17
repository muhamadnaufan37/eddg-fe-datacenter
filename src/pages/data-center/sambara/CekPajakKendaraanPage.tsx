import { useEffect, useRef, useState } from "react";
import { Formik, Form, Field, type FormikHelpers } from "formik";
import { useNavigate } from "react-router-dom";
import * as Yup from "yup";
import { Toast } from "primereact/toast";
import { axiosServices } from "../../../services/axios";
import { InputText } from "primereact/inputtext";
import { CiCircleCheck } from "react-icons/ci";
import { Button } from "primereact/button";
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
  const [selectedOption, setSelectedOption] = useState("Hitam/Putih");

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

      if (result?.success) {
        navigate(`/digital-data/sambara/cek-pajak-kendaraan/result`, {
          state: { detailData: result, values: values },
          replace: true,
        });
      } else {
        toastRef.current?.show({
          severity: "error",
          summary: "Gagal",
          detail: result?.message || "Terjadi kesalahan saat mengirim data.",
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
    { value: "1", label: "Hitam/Putih" },
    { value: "2", label: "Merah" },
    { value: "3", label: "Kuning" },
  ];

  return (
    <div className="w-full flex flex-col gap-4">
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
            if (defaultOption) {
              setSelectedOption(defaultOption.label);
              setFieldValue("kd_plat", defaultOption.value);
            }
          }, [setFieldValue]);

          return (
            <>
              <Toast ref={toastRef} />
              <Form>
                <div className="flex flex-col justify-between gap-4">
                  <main className="overflow-y-auto bottom-0 flex flex-col flex-1">
                    <div className="flex flex-col gap-2 bg-white dark:bg-slate-800 p-3 rounded-xl">
                      <span className="text-sm leading-5 text-slate-700 dark:text-slate-300">
                        Pilih warna plat, lalu masukan nomor plat
                        <br /> kendaraan bermotor anda
                      </span>
                      <div className="w-full">
                        <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">
                          Nomor Polisi
                        </span>
                        <div
                          className={`w-full ${
                            values?.kd_plat === "1"
                              ? "bg-black"
                              : values?.kd_plat === "2"
                                ? "bg-red-600"
                                : values?.kd_plat === "3"
                                  ? "bg-yellow-400"
                                  : "bg-red-900 text-black border border-[#E3E7ED]"
                          } p-2 rounded-xl`}
                        >
                          <div
                            className={`border ${
                              values?.kd_plat === "1"
                                ? "border-white"
                                : values?.kd_plat === "2"
                                  ? "border-white"
                                  : values?.kd_plat === "3"
                                    ? "border-white"
                                    : ""
                            } rounded-xl px-4 py-3 grid grid-cols-5 gap-2 w-full`}
                          >
                            {/* Huruf Depan */}
                            <Field name="no_polisi1">
                              {({ field }: any) => {
                                const display = isInspectOpen
                                  ? ""
                                  : field.value;
                                return (
                                  <InputText
                                    id="no_polisi1"
                                    name="no_polisi1"
                                    maxLength={1}
                                    ref={input1Ref}
                                    value={display}
                                    readOnly={isInspectOpen}
                                    className={`bg-transparent border-none text-center ${
                                      values?.kd_plat === "1"
                                        ? "text-white"
                                        : values?.kd_plat === "2"
                                          ? "text-white"
                                          : values?.kd_plat === "3"
                                            ? "text-white"
                                            : "bg-[#FFFFFF] text-black border-2 border-white"
                                    } text-2xl sm:text-3xl font-semibold placeholder-gray-500 focus:outline-none ${
                                      errors.no_polisi1 && touched.no_polisi1
                                        ? "p-invalid"
                                        : ""
                                    }`}
                                    placeholder={
                                      isInspectOpen
                                        ? "[Disamarkan saat inspeksi]"
                                        : "X"
                                    }
                                    onChange={(e: any) => {
                                      const value = e.target.value
                                        .toUpperCase()
                                        .replace(/[^A-Z]/g, "");
                                      setFieldValue("no_polisi1", value);
                                      if (value.length === 1)
                                        input2Ref.current?.focus();
                                    }}
                                  />
                                );
                              }}
                            </Field>

                            {/* Angka Tengah */}
                            <Field name="no_polisi2">
                              {({ field }: any) => {
                                const display = isInspectOpen
                                  ? ""
                                  : field.value;
                                return (
                                  <InputText
                                    id="no_polisi2"
                                    name="no_polisi2"
                                    maxLength={4}
                                    ref={input2Ref}
                                    value={display}
                                    readOnly={isInspectOpen}
                                    className={`bg-transparent border-none text-center ${
                                      values?.kd_plat === "1"
                                        ? "text-white"
                                        : values?.kd_plat === "2"
                                          ? "text-white"
                                          : values?.kd_plat === "3"
                                            ? "text-white"
                                            : "bg-[#FFFFFF] text-black border-2 border-white"
                                    } text-2xl sm:text-3xl font-semibold placeholder-gray-500 focus:outline-none col-span-2 ${
                                      errors.no_polisi2 && touched.no_polisi2
                                        ? "p-invalid"
                                        : ""
                                    }`}
                                    placeholder={
                                      isInspectOpen
                                        ? "[Disamarkan saat inspeksi]"
                                        : "XXXX"
                                    }
                                    onChange={(e) => {
                                      const value = e.target.value.replace(
                                        /[^0-9]/g,
                                        "",
                                      );
                                      setFieldValue("no_polisi2", value);
                                      if (value === "")
                                        input1Ref.current?.focus();
                                      else if (value.length === 4)
                                        input3Ref.current?.focus();
                                    }}
                                  />
                                );
                              }}
                            </Field>

                            {/* Huruf Belakang */}
                            <Field name="no_polisi3">
                              {({ field }: any) => {
                                const display = isInspectOpen
                                  ? ""
                                  : field.value;
                                return (
                                  <InputText
                                    id="no_polisi3"
                                    name="no_polisi3"
                                    maxLength={3}
                                    ref={input3Ref}
                                    value={display}
                                    readOnly={isInspectOpen}
                                    className={`bg-transparent border-none text-center ${
                                      values?.kd_plat === "1"
                                        ? "text-white"
                                        : values?.kd_plat === "2"
                                          ? "text-white"
                                          : values?.kd_plat === "3"
                                            ? "text-white"
                                            : "bg-[#FFFFFF] text-black border-2 border-white"
                                    } text-2xl sm:text-3xl font-semibold placeholder-gray-500 focus:outline-none col-span-2 ${
                                      errors.no_polisi3 && touched.no_polisi3
                                        ? "p-invalid"
                                        : ""
                                    }`}
                                    placeholder={
                                      isInspectOpen
                                        ? "[Disamarkan saat inspeksi]"
                                        : "XXX"
                                    }
                                    onChange={(e: any) => {
                                      const value = e.target.value
                                        .toUpperCase()
                                        .replace(/[^A-Z]/g, "");
                                      setFieldValue("no_polisi3", value);
                                      if (value === "")
                                        input2Ref.current?.focus();
                                    }}
                                  />
                                );
                              }}
                            </Field>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 w-full">
                        <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">
                          Warna TNKB
                        </span>
                        <div className="grid grid-cols-3 gap-2">
                          {optionsDataProgresif.map((option) => (
                            <button
                              type="button"
                              key={option.value}
                              onClick={() => {
                                setSelectedOption(option.label);
                                setFieldValue("kd_plat", option.value); // Simpan sebagai string: "1", "2", "3"
                              }}
                              className={`flex font-semibold text-[11px] leading-4 items-center justify-between p-2 rounded-lg border transition-all ${
                                selectedOption === option.label
                                  ? "border-[#069550] bg-[#069550] text-white"
                                  : "border-[#E3E7ED] bg-[#FFFFFF] text-black"
                              }`}
                            >
                              <span>{option.label}</span>
                              {selectedOption === option.label ? (
                                <CiCircleCheck
                                  size={20}
                                  className="text-white"
                                />
                              ) : (
                                <CiCircleCheck
                                  size={15}
                                  className="text-[#E3E7ED] bg-[#E3E7ED] rounded-full"
                                />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </main>
                  <footer className="sticky bottom-0 flex flex-col gap-2 p-4">
                    <Button
                      type="submit"
                      className="w-full p-button-sm text-xs"
                      label="Lihat Info"
                      severity="success"
                      size="small"
                      disabled={
                        isSubmitting ||
                        !values?.no_polisi1 ||
                        !values?.no_polisi2 ||
                        !values?.no_polisi3 ||
                        (typeof isInspectOpen !== "undefined" && isInspectOpen)
                      }
                    />
                    <Button
                      type="button"
                      className="w-full p-button-sm text-xs"
                      label="Kembali"
                      severity="success"
                      size="small"
                      onClick={() =>
                        navigate(`/`, {
                          replace: true,
                        })
                      }
                      outlined
                    />
                  </footer>
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
