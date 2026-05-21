import { useEffect, useState } from "react";
import { DeviceUUID } from "device-uuid";
import { FiCopy, FiRefreshCcw, FiShield, FiSmartphone } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import { showToast } from "../../../services/toast";

const formatFallbackValue = (value: string | null) => {
  if (!value) {
    return "-";
  }

  return value;
};

const DeviceIdPage = () => {
  const navigate = useNavigate();
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<{
    browser: string;
    os: string;
    platform: string;
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
  } | null>(null);
  const [isCopying, setIsCopying] = useState(false);

  const loadDeviceInfo = () => {
    const device = new DeviceUUID();
    const info = device.parse();

    setDeviceId(device.get());
    setDeviceInfo({
      browser: info.browser,
      os: info.os,
      platform: info.platform,
      isMobile: info.isMobile,
      isTablet: info.isTablet,
      isDesktop: info.isDesktop,
    });
  };

  useEffect(() => {
    loadDeviceInfo();
  }, []);

  const handleCopy = async () => {
    if (!deviceId) {
      return;
    }

    try {
      setIsCopying(true);
      await navigator.clipboard.writeText(deviceId);
      showToast("success", "Berhasil", "Device ID berhasil disalin.");
    } catch {
      showToast("error", "Gagal", "Gagal menyalin Device ID.");
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <div className="relative w-full overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="absolute inset-x-0 top-0 h-40 bg-linear-to-r from-sky-600 via-cyan-500 to-blue-600" />
      <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
      <div className="relative px-5 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/75">
              Utility
            </p>
            <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">
              Device ID Checker
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/90 sm:text-base">
              Halaman ini menampilkan identitas perangkat berbasis browser agar
              Anda bisa mengecek device_id dengan cepat.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={loadDeviceInfo}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <FiRefreshCcw className="h-4 w-4" />
              Refresh Device ID
            </button>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="inline-flex items-center justify-center rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              ← Kembali
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-950/40 sm:p-6">
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-lg shadow-sky-600/25">
                <FiSmartphone className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-600 dark:text-sky-400">
                  Device UUID
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Salin dan gunakan untuk pengecekan perangkat.
                </p>
              </div>
            </div>

            <div className="mt-5 break-all rounded-3xl border border-dashed border-slate-300 bg-white p-5 text-lg font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:text-xl">
              {formatFallbackValue(deviceId)}
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleCopy}
                disabled={!deviceId || isCopying}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              >
                <FiCopy className="h-4 w-4" />
                {isCopying ? "Menyalin..." : "Salin Device ID"}
              </button>
              <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300">
                Gunakan tombol refresh jika Anda ingin menghitung ulang data
                perangkat dari browser saat ini.
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950/50">
              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200">
                <FiShield className="h-5 w-5 text-emerald-500" />
                <span className="text-sm font-semibold">Browser</span>
              </div>
              <p className="mt-3 text-lg font-bold text-slate-900 dark:text-white">
                {formatFallbackValue(deviceInfo?.browser ?? null)}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950/50">
              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200">
                <FiShield className="h-5 w-5 text-sky-500" />
                <span className="text-sm font-semibold">OS</span>
              </div>
              <p className="mt-3 text-lg font-bold text-slate-900 dark:text-white">
                {formatFallbackValue(deviceInfo?.os ?? null)}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950/50 sm:col-span-3 lg:col-span-1">
              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200">
                <FiShield className="h-5 w-5 text-amber-500" />
                <span className="text-sm font-semibold">Platform</span>
              </div>
              <p className="mt-3 text-lg font-bold text-slate-900 dark:text-white">
                {formatFallbackValue(deviceInfo?.platform ?? null)}
              </p>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                <span
                  className={`rounded-2xl px-3 py-2 ${deviceInfo?.isDesktop ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-slate-100 dark:bg-slate-800"}`}
                >
                  Desktop
                </span>
                <span
                  className={`rounded-2xl px-3 py-2 ${deviceInfo?.isTablet ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-slate-100 dark:bg-slate-800"}`}
                >
                  Tablet
                </span>
                <span
                  className={`rounded-2xl px-3 py-2 ${deviceInfo?.isMobile ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-slate-100 dark:bg-slate-800"}`}
                >
                  Mobile
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceIdPage;
