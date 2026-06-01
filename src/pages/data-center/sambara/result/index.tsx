import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";

import {
  FiArrowLeft,
  FiCalendar,
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
}) => (
  <div className="rounded-3xl border border-slate-200 bg-white/90 shadow-sm backdrop-blur-xl transition-all dark:border-slate-700 dark:bg-slate-900/90">
    <div className="flex items-center gap-3 border-b border-slate-100 p-5 dark:border-slate-800">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-cyan-400">
        {icon}
      </div>

      <h2 className="text-sm font-semibold sm:text-base">{title}</h2>
    </div>

    <div className="p-5">{children}</div>
  </div>
);

const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1">
    <span className="text-xs text-slate-400">{label}</span>

    <span className="text-sm font-semibold text-slate-800 dark:text-white">
      {value || "-"}
    </span>
  </div>
);

const RouteStatePanel = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
    <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/95 p-6 text-center shadow-xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95 sm:p-8">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 dark:bg-slate-800 dark:text-cyan-400">
        <FiMapPin size={22} />
      </div>

      <h1 className="mt-5 text-2xl font-black text-slate-900 dark:text-white">
        {title}
      </h1>

      <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-300">
        {description}
      </p>

      <div className="mt-6 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
        <span className="h-2 w-2 animate-pulse rounded-full bg-sky-500" />
        Mengalihkan halaman
      </div>
    </div>
  </div>
);

export default function ResultInfoPajakKendaraan() {
  const toastRef = useRef<Toast>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [routeState, setRouteState] = useState<
    "checking" | "ready" | "redirecting"
  >("checking");

  const dataBalikan = (location.state || {}) as any;
  const detailData = dataBalikan?.detailData;
  const isAllowedResult = Boolean(
    detailData &&
    detailData?.success !== false &&
    detailData?.data?.success !== false,
  );

  useEffect(() => {
    if (isAllowedResult) {
      setRouteState("ready");
      return;
    }

    setRouteState("redirecting");
    const redirectTimer = window.setTimeout(() => {
      navigate("/digital-data/sambara/cek-pajak-kendaraan", {
        replace: true,
      });
    }, 0);

    return () => window.clearTimeout(redirectTimer);
  }, [isAllowedResult, navigate]);

  const vehicle = detailData?.data?.data;
  const pajak = vehicle?.data_hitung_pajak;

  const { isInspectOpen } = useInspectContext();

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const renderVal = (val: any) =>
    isInspectOpen ? (
      <span className="text-sm italic text-rose-600">
        [Disamarkan saat inspeksi]
      </span>
    ) : (
      <span className="text-sm font-semibold text-slate-800 dark:text-white">
        {val ?? "-"}
      </span>
    );

  const biayaList = useMemo(
    () => [
      { label: "PKB Pokok", value: sumFields(pajak, "bea_pkb_pok") },
      { label: "PKB Denda", value: sumFields(pajak, "bea_pkb_den") },
      { label: "SWDKLLJ Pokok", value: sumFields(pajak, "bea_swdkllj_pok") },
      { label: "SWDKLLJ Denda", value: sumFields(pajak, "bea_swdkllj_den") },
      { label: "Opsen PKB Pokok", value: sumFields(pajak, "bea_pkb_ops") },
      { label: "Opsen PKB Denda", value: sumFields(pajak, "bea_pkb_ops_den") },
      { label: "PNBP STNK", value: pajak?.bea_adm_stnk || 0 },
      { label: "PNBP TNKB", value: pajak?.bea_adm_tnkb || 0 },
    ],
    [pajak],
  );

  const hasFetchedRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [dataByrKeDepan, setDataByrKeDepan] = useState<any>(null);

  const tglHariIni = new Intl.DateTimeFormat("en-CA").format(new Date());

  const totalBayar = [
    "bea_pkb_pok0",
    "bea_pkb_pok1",
    "bea_pkb_pok2",
    "bea_pkb_pok3",
    "bea_pkb_pok4",
    "bea_pkb_pok5",
    "bea_pkb_den0",
    "bea_pkb_den1",
    "bea_pkb_den2",
    "bea_pkb_den3",
    "bea_pkb_den4",
    "bea_pkb_den5",
    "bea_swdkllj_pok0",
    "bea_swdkllj_pok1",
    "bea_swdkllj_pok2",
    "bea_swdkllj_pok3",
    "bea_swdkllj_pok4",
    "bea_swdkllj_pok5",
    "bea_swdkllj_den0",
    "bea_swdkllj_den1",
    "bea_swdkllj_den2",
    "bea_swdkllj_den3",
    "bea_swdkllj_den4",
    "bea_swdkllj_den5",
    "bea_adm_stnk",
    "bea_adm_tnkb",
    "bea_pkb_ops0",
    "bea_pkb_ops1",
    "bea_pkb_ops2",
    "bea_pkb_ops3",
    "bea_pkb_ops4",
    "bea_pkb_ops5",
    "bea_pkb_ops_den0",
    "bea_pkb_ops_den1",
    "bea_pkb_ops_den2",
    "bea_pkb_ops_den3",
    "bea_pkb_ops_den4",
    "bea_pkb_ops_den5",
  ].reduce((total, key) => {
    const value = Number(detailData?.data?.data?.data_hitung_pajak?.[key] || 0);
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
      const isValidResult =
        result?.success !== false && result?.data?.success !== false;

      const updatedDetailData = {
        ...result,
        data: {
          ...result.data,
          tg_akhir_pajak:
            result.data?.data?.data_hitung_pajak?.tg_akhir_pajak_baru ??
            result.data?.data?.tg_akhir_pajak,
        },
      };

      if (isValidResult) {
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

  const invoiceMeta = [
    {
      label: "Tanggal Proses",
      value: renderVal(vehicle?.tg_proses_tetap),
    },
    {
      label: "Masa Berlaku Pajak",
      value: renderVal(
        `${vehicle?.tg_akhir_pajak ?? "-"} - ${vehicle?.data_hitung_pajak?.tg_akhir_pajak_baru ?? "N/A"}`,
      ),
    },
    {
      label: "Masa Berlaku STNK",
      value: renderVal(
        `${vehicle?.tg_akhir_stnk ?? "-"} - ${vehicle?.data_hitung_pajak?.tg_akhir_stnk_baru ?? "N/A"}`,
      ),
    },
    {
      label: "Wilayah",
      value: renderVal(vehicle?.nm_wil),
    },
  ];

  useEffect(() => {
    if (routeState !== "ready" || hasFetchedRef.current) {
      return;
    }

    fetchByrKeDpn();
    hasFetchedRef.current = true;
  }, [routeState]);

  return (
    <>
      <Toast ref={toastRef} />

      {routeState !== "ready" ? (
        routeState === "redirecting" ? (
          <RouteStatePanel
            title="Data invoice tidak tersedia"
            description="Halaman result tidak bisa dibuka tanpa data cek pajak yang valid. Anda akan diarahkan kembali ke halaman pencarian."
          />
        ) : (
          <RouteStatePanel
            title="Memuat invoice"
            description="Menyiapkan detail pembayaran dan memverifikasi data hasil cek Sambara."
          />
        )
      ) : (
        <div className="relative z-9 mx-auto flex max-w-7xl flex-col gap-5 sm:gap-6">
          <div className="overflow-hidden rounded-[28px] border border-white/40 bg-slate-950 p-5 text-white shadow-2xl shadow-sky-950/10 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3 sm:space-y-4">
                <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/80 sm:text-xs sm:tracking-[0.28em]">
                  Invoice Pajak Kendaraan
                </div>

                <div>
                  <h1 className="text-2xl font-black tracking-tight sm:text-4xl">
                    {isInspectOpen
                      ? "[Disamarkan saat inspeksi]"
                      : `${vehicle?.no_polisi1 ?? ""} ${vehicle?.no_polisi2 ?? ""} ${vehicle?.no_polisi3 ?? ""}`}
                  </h1>

                  <p className="mt-2 max-w-2xl text-xs leading-5 text-white/75 sm:text-base">
                    {isInspectOpen
                      ? "[Disamarkan saat inspeksi]"
                      : `${vehicle?.nm_merek_kb ?? ""} • ${vehicle?.nm_model_kb ?? ""}`}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl sm:grid-cols-2 lg:min-w-105">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-white/60">
                    Status
                  </div>
                  <div className="mt-2 inline-flex rounded-full bg-emerald-400/15 px-3 py-1 text-sm font-semibold text-emerald-200">
                    Data berhasil diproses
                  </div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-white/60">
                    Total Pembayaran
                  </div>
                  <div className="mt-2 text-2xl font-black sm:text-3xl">
                    {isInspectOpen ? (
                      <span className="text-sm italic text-white/75">
                        [Disamarkan saat inspeksi]
                      </span>
                    ) : (
                      formatCurrency(totalBayar)
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.85fr)]">
            <div className="flex flex-col gap-6">
              <InfoCard
                title="Ringkasan Kendaraan"
                icon={<FiTruck size={20} />}
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <DetailRow
                    label="Merk"
                    value={renderVal(vehicle?.nm_merek_kb)}
                  />
                  <DetailRow
                    label="Model"
                    value={renderVal(vehicle?.nm_model_kb)}
                  />
                  <DetailRow
                    label="Warna"
                    value={renderVal(vehicle?.warna_kb)}
                  />
                  <DetailRow
                    label="Tahun"
                    value={renderVal(vehicle?.th_buatan)}
                  />
                  <DetailRow
                    label="Wilayah"
                    value={renderVal(vehicle?.nm_wil)}
                  />
                  <DetailRow
                    label="Milik Ke"
                    value={renderVal(milikKeFormatted)}
                  />
                </div>
              </InfoCard>

              <InfoCard
                title="Detail Masa Pajak"
                icon={<FiCalendar size={20} />}
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {invoiceMeta.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60"
                    >
                      <span className="block text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                        {item.label}
                      </span>
                      <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </InfoCard>

              <InfoCard title="Rincian Biaya" icon={<FiCreditCard size={20} />}>
                <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] border-b border-slate-200 bg-slate-100 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                    <span>Komponen</span>
                    <span>Nominal</span>
                  </div>

                  <div className="divide-y divide-slate-200 dark:divide-slate-800">
                    {biayaList.map((item) => (
                      <div
                        key={item.label}
                        className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3"
                      >
                        <div>
                          <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            {item.label}
                          </div>
                        </div>

                        <div className="text-right text-sm font-semibold text-slate-900 dark:text-white">
                          {isInspectOpen ? (
                            <span className="italic text-rose-600">
                              [Disamarkan saat inspeksi]
                            </span>
                          ) : (
                            formatCurrency(item.value)
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-slate-200 bg-slate-950 px-4 py-4 text-white dark:border-slate-800">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-xs uppercase tracking-[0.18em] text-white/60">
                          Total Pembayaran
                        </div>
                        <div className="mt-1 text-xs text-white/50">
                          Ringkasan nominal yang harus dibayarkan
                        </div>
                      </div>
                      <div className="text-2xl font-black sm:text-3xl">
                        {isInspectOpen ? (
                          <span className="text-sm italic text-white/70">
                            [Disamarkan saat inspeksi]
                          </span>
                        ) : (
                          formatCurrency(totalBayar)
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </InfoCard>
            </div>

            <div className="flex flex-col gap-6 lg:sticky lg:top-6 lg:self-start">
              <InfoCard title="Invoice Summary" icon={<FiMapPin size={20} />}>
                <div className="space-y-4">
                  <div className="rounded-2xl bg-linear-to-br from-sky-500 to-cyan-500 p-4 text-white shadow-lg shadow-sky-500/20 sm:p-5">
                    <div className="text-xs uppercase tracking-[0.2em] text-white/70">
                      Total Tagihan
                    </div>
                    <div className="mt-3 text-2xl font-black sm:text-3xl">
                      {isInspectOpen ? (
                        <span className="text-sm italic text-white/80">
                          [Disamarkan saat inspeksi]
                        </span>
                      ) : (
                        formatCurrency(totalBayar)
                      )}
                    </div>
                  </div>

                  <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-slate-500 dark:text-slate-400">
                        Nopol
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {isInspectOpen
                          ? "[Disamarkan saat inspeksi]"
                          : `${vehicle?.no_polisi1 ?? ""} ${vehicle?.no_polisi2 ?? ""} ${vehicle?.no_polisi3 ?? ""}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-slate-500 dark:text-slate-400">
                        Merk / Model
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {isInspectOpen
                          ? "[Disamarkan saat inspeksi]"
                          : `${vehicle?.nm_merek_kb ?? "-"} / ${vehicle?.nm_model_kb ?? "-"}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-slate-500 dark:text-slate-400">
                        Masa Pajak
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {isInspectOpen
                          ? "[Disamarkan saat inspeksi]"
                          : `${vehicle?.tg_akhir_pajak ?? "-"} → ${vehicle?.data_hitung_pajak?.tg_akhir_pajak_baru ?? "N/A"}`}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                    Data invoice ini mengikuti hasil cek Sambara dan akan
                    menyesuaikan jika terdapat bayaran ke depan yang valid.
                  </div>
                </div>
              </InfoCard>

              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <Button
                  type="button"
                  className="w-full p-button-sm text-xs"
                  label="Kembali ke Pencarian"
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
      )}

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
