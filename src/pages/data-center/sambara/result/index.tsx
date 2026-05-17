import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";

import {
  FiArrowLeft,
  FiCalendar,
  FiChevronDown,
  FiCreditCard,
  FiMapPin,
  FiTruck,
} from "react-icons/fi";
import HitungTagihanModal from "./cekbyrkedepan";
import { axiosServices } from "../../../../services/axios";
import { useInspectContext } from "../../../../contexts/InspectContext";

const numberToBahasa = (num: number): string => {
  const words: { [key: number]: string } = {
    1: "SATU",
    2: "DUA",
    3: "TIGA",
    4: "EMPAT",
    5: "LIMA",
    6: "ENAM",
    7: "TUJUH",
    8: "DELAPAN",
    9: "SEMBILAN",
    10: "SEPULUH",
  };

  return words[num] || "";
};

const formatCurrency = (value: number) =>
  `Rp ${Number(value || 0).toLocaleString("id-ID")}`;

const sumFields = (data: any, prefix: string) =>
  Array.from({ length: 6 }).reduce(
    (sum: any, _, i) => sum + Number(data?.[`${prefix}${i}`] || 0),
    0,
  );

const InfoCard = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => {
  return (
    <div
      className="
        rounded-3xl
        border
        border-slate-200
        bg-white/90
        shadow-sm
        backdrop-blur-xl
        transition-all
        dark:border-slate-700
        dark:bg-slate-900/90
      "
    >
      <div className="flex items-center gap-3 border-b border-slate-100 p-5 dark:border-slate-800">
        <div
          className="
            flex h-11 w-11 items-center justify-center
            rounded-2xl
            bg-blue-50
            text-blue-600
            dark:bg-slate-800
            dark:text-cyan-400
          "
        >
          {icon}
        </div>

        <h2 className="text-sm font-semibold sm:text-base">{title}</h2>
      </div>

      <div className="p-5">{children}</div>
    </div>
  );
};

const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-slate-400">{label}</span>

      <span className="text-sm font-semibold text-slate-800 dark:text-white">
        {value || "-"}
      </span>
    </div>
  );
};

export default function ResultInfoPajakKendaraan() {
  const toastRef = useRef<Toast>(null);

  const navigate = useNavigate();
  const location = useLocation();

  const dataBalikan = location.state || {};

  const vehicle = dataBalikan?.detailData?.data?.data;
  const pajak = vehicle?.data_hitung_pajak;

  const [showDetail, setShowDetail] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const { isInspectOpen } = useInspectContext();

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const renderVal = (val: any) =>
    isInspectOpen ? (
      <span className="italic text-sm text-rose-600">
        [Disamarkan saat inspeksi]
      </span>
    ) : (
      <span className="text-sm font-semibold text-slate-800 dark:text-white">
        {val ?? "-"}
      </span>
    );

  const biayaList = useMemo(
    () => [
      {
        label: "PKB Pokok",
        value: sumFields(pajak, "bea_pkb_pok"),
      },
      {
        label: "PKB Denda",
        value: sumFields(pajak, "bea_pkb_den"),
      },
      {
        label: "SWDKLLJ Pokok",
        value: sumFields(pajak, "bea_swdkllj_pok"),
      },
      {
        label: "SWDKLLJ Denda",
        value: sumFields(pajak, "bea_swdkllj_den"),
      },
      {
        label: "Opsen PKB Pokok",
        value: sumFields(pajak, "bea_pkb_ops"),
      },
      {
        label: "Opsen PKB Denda",
        value: sumFields(pajak, "bea_pkb_ops_den"),
      },
      {
        label: "PNBP STNK",
        value: pajak?.bea_adm_stnk || 0,
      },
      {
        label: "PNBP TNKB",
        value: pajak?.bea_adm_tnkb || 0,
      },
    ],
    [pajak],
  );

  const hasFetchedRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [dataByrKeDepan, setDataByrKeDepan] = useState<any>(null);

  const tglHariIni = new Intl.DateTimeFormat("en-CA").format(new Date());

  const totalBayar = [
    // PKB Pokok
    "bea_pkb_pok0",
    "bea_pkb_pok1",
    "bea_pkb_pok2",
    "bea_pkb_pok3",
    "bea_pkb_pok4",
    "bea_pkb_pok5",
    // PKB Denda
    "bea_pkb_den0",
    "bea_pkb_den1",
    "bea_pkb_den2",
    "bea_pkb_den3",
    "bea_pkb_den4",
    "bea_pkb_den5",
    // SWDKLLJ Pokok
    "bea_swdkllj_pok0",
    "bea_swdkllj_pok1",
    "bea_swdkllj_pok2",
    "bea_swdkllj_pok3",
    "bea_swdkllj_pok4",
    "bea_swdkllj_pok5",
    // SWDKLLJ Denda
    "bea_swdkllj_den0",
    "bea_swdkllj_den1",
    "bea_swdkllj_den2",
    "bea_swdkllj_den3",
    "bea_swdkllj_den4",
    "bea_swdkllj_den5",
    // PNBP
    "bea_adm_stnk",
    "bea_adm_tnkb",
    // Opsen PKB Pokok
    "bea_pkb_ops0",
    "bea_pkb_ops1",
    "bea_pkb_ops2",
    "bea_pkb_ops3",
    "bea_pkb_ops4",
    "bea_pkb_ops5",
    // Opsen PKB Denda
    "bea_pkb_ops_den0",
    "bea_pkb_ops_den1",
    "bea_pkb_ops_den2",
    "bea_pkb_ops_den3",
    "bea_pkb_ops_den4",
    "bea_pkb_ops_den5",
  ].reduce((total, key) => {
    const value = Number(
      dataBalikan?.detailData?.data?.data?.data_hitung_pajak?.[key] || 0,
    );
    return total + value;
  }, 0);

  const fetchByrKeDpn = async () => {
    try {
      const response = await axiosServices().post(
        `/api/v1/data_center/sambara/cek-bayar-kedepan?tg_proses_tetap=${tglHariIni}&tg_akhir_pajak=${dataBalikan?.detailData?.data?.data?.tg_akhir_pajak}`,
      );
      setDataByrKeDepan(response.data.data);

      if (response.data.data?.data?.is_bisa_bayar_kedepan) {
        setOpen(true);
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
          setDataByrKeDepan(error.response.data);
          toastRef.current?.show({
            severity: "error",
            summary: "Error",
            detail: data.message || data.error || "Terjadi kesalahan",
            life: 3000,
          });
        }
      }
    }
  };

  const reSubmitInfoPkb = async () => {
    try {
      const response = await axiosServices().post(
        `/api/v1/data_center/sambara/info-pajak`,
        {
          objek_pajak_no_polisi1: dataBalikan?.values?.no_polisi1,
          objek_pajak_no_polisi2: dataBalikan?.values?.no_polisi2,
          objek_pajak_no_polisi3: dataBalikan?.values?.no_polisi3,
          objek_pajak_kd_plat: dataBalikan?.values?.kd_plat,
          bayar_kedepan:
            dataByrKeDepan?.data?.is_bisa_bayar_kedepan === true ? "Y" : "",
        },
      );

      const result = response.data;

      const updatedDetailData = {
        ...result,
        data: {
          ...result.data,
          tg_akhir_pajak:
            result.data?.data?.data_hitung_pajak?.tg_akhir_pajak_baru ??
            result.data?.data?.tg_akhir_pajak,
        },
      };

      if (result?.success) {
        navigate(`/digital-data/sambara/cek-pajak-kendaraan/result`, {
          state: { detailData: updatedDetailData, values: dataBalikan?.values },
          replace: true,
        });
        setOpen(false);
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
    }
  };

  const milikKe = dataBalikan?.detailData?.data?.data?.milik_ke;

  const milikKeFormatted = milikKe
    ? `${milikKe} (${numberToBahasa(milikKe).trim()})`
    : "";

  useEffect(() => {
    if (!hasFetchedRef.current) {
      fetchByrKeDpn();
      hasFetchedRef.current = true;
    }
  }, []);

  return (
    <>
      <Toast ref={toastRef} />

      <div
        className="
          min-h-screen
          text-slate-900
          transition-colors
          duration-300
          dark:text-white
        "
      >
        {/* CONTENT */}
        <div className="mx-auto flex max-w-7xl flex-col gap-5">
          {/* HERO */}
          <div
            className="
              overflow-hidden
              rounded-3xl
              bg-linear-to-r
              from-blue-600
              to-cyan-500
              p-6
              text-white
              shadow-xl
            "
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-3xl font-bold">
                  {isInspectOpen
                    ? "[Disamarkan saat inspeksi]"
                    : `${vehicle?.no_polisi1 ?? ""} ${vehicle?.no_polisi2 ?? ""} ${vehicle?.no_polisi3 ?? ""}`}
                </h2>

                <p className="mt-2 text-sm text-white/90">
                  {isInspectOpen
                    ? "[Disamarkan saat inspeksi]"
                    : `${vehicle?.nm_merek_kb ?? ""} • ${vehicle?.nm_model_kb ?? ""}`}
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-5 backdrop-blur-lg">
                <span className="text-sm text-white/80">Total Pembayaran</span>

                <h3 className="mt-1 text-3xl font-bold">
                  {isInspectOpen ? (
                    <span className="italic text-sm text-white/80">
                      [Disamarkan saat inspeksi]
                    </span>
                  ) : (
                    formatCurrency(totalBayar)
                  )}
                </h3>
              </div>
            </div>
          </div>

          {/* INFORMASI KENDARAAN */}
          <InfoCard title="Informasi Kendaraan" icon={<FiTruck size={20} />}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <DetailRow label="Merk" value={renderVal(vehicle?.nm_merek_kb)} />
              <DetailRow
                label="Model"
                value={renderVal(vehicle?.nm_model_kb)}
              />
              <DetailRow label="Warna" value={renderVal(vehicle?.warna_kb)} />
              <DetailRow label="Tahun" value={renderVal(vehicle?.th_buatan)} />
              <DetailRow label="Wilayah" value={renderVal(vehicle?.nm_wil)} />
              <DetailRow label="Milik Ke" value={renderVal(milikKeFormatted)} />
            </div>
          </InfoCard>

          {/* INFORMASI PKB */}
          <InfoCard
            title="Informasi PKB & STNK"
            icon={<FiCalendar size={20} />}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <DetailRow
                label="MS. Berlaku Pajak"
                value={renderVal(
                  `${vehicle?.tg_akhir_pajak ?? "-"} - ${vehicle?.data_hitung_pajak?.tg_akhir_pajak_baru ?? "N/A"}`,
                )}
              />

              <DetailRow
                label="MS. Berlaku STNK"
                value={renderVal(
                  `${vehicle?.tg_akhir_stnk ?? "-"} - ${vehicle?.data_hitung_pajak?.tg_akhir_stnk_baru ?? "N/A"}`,
                )}
              />

              <DetailRow
                label="Tanggal Proses"
                value={renderVal(vehicle?.tg_proses_tetap)}
              />

              <DetailRow label="Lokasi" value={renderVal(vehicle?.nm_wil)} />
            </div>
          </InfoCard>

          {/* INFORMASI BIAYA */}
          <InfoCard title="Informasi Biaya" icon={<FiCreditCard size={20} />}>
            <button
              onClick={() => setShowDetail(!showDetail)}
              className="
                flex w-full items-center justify-between
                rounded-2xl
                bg-slate-50
                px-5
                py-4
                transition-all
                hover:bg-slate-100
                dark:bg-slate-800
                dark:hover:bg-slate-700
              "
            >
              <div className="flex items-center gap-3">
                <FiMapPin />

                <span className="font-medium">Detail Komponen Biaya</span>
              </div>
              <FiChevronDown />
            </button>

            {showDetail && (
              <div className="mt-4 space-y-3">
                {biayaList.map((item, index) => (
                  <div
                    key={index}
                    className="
                          flex items-center justify-between
                          rounded-2xl
                          border
                          border-slate-100
                          p-4
                          dark:border-slate-800
                        "
                  >
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {item.label}
                    </span>

                    {isInspectOpen ? (
                      <span className="italic text-sm text-rose-600">
                        [Disamarkan saat inspeksi]
                      </span>
                    ) : (
                      <span className="font-semibold">
                        {formatCurrency(item.value)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* TOTAL */}
            <div
              className="
                mt-5
                rounded-3xl
                bg-linear-to-r
                from-blue-600
                to-cyan-500
                p-5
                text-white
              "
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/80">Total Pembayaran</span>

                <span className="text-2xl font-bold">
                  {isInspectOpen ? (
                    <span className="italic text-sm">
                      [Disamarkan saat inspeksi]
                    </span>
                  ) : (
                    formatCurrency(totalBayar)
                  )}
                </span>
              </div>
            </div>
          </InfoCard>

          {/* FOOTER ACTION */}
          <div
            className="
            sticky bottom-0
            border-t
            border-slate-200
            backdrop-blur-xl
            dark:border-slate-800
          "
          >
            <div className="mx-auto flex max-w-7xl">
              <Button
                type="button"
                className="w-full p-button-sm text-xs"
                label="Kembali"
                icon={<FiArrowLeft />}
                severity="contrast"
                outlined
                onClick={() =>
                  navigate(`/digital-data/sambara/cek-pajak-kendaraan`, {
                    replace: true,
                  })
                }
              />
            </div>
          </div>
        </div>
      </div>

      <HitungTagihanModal
        isOpen={open}
        onClose={() => setOpen(false)}
        reSubmitInfoPkb={reSubmitInfoPkb}
        tglAkhir={dataBalikan?.detailData?.data?.data?.tg_akhir_pajak}
        tglAkhirSelanjutnya={
          dataByrKeDepan?.data?.tg_akhir_pajak_baru ??
          dataByrKeDepan?.data?.tg_akhir_pajak
        }
      />
    </>
  );
}
