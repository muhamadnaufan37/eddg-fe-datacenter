import { useEffect, useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiCheckCircle,
  FiChevronDown,
  FiChevronRight,
  FiExternalLink,
  FiMapPin,
  FiRefreshCw,
  FiSearch,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import {
  fetchPublicWilayahDetail,
  fetchPublicWilayahTree,
  type PublicWilayahDaerah,
  type PublicWilayahDesa,
  type PublicWilayahDetail,
  type PublicWilayahKelompok,
  type PublicWilayahType,
} from "../../../services/dataCenter";
import { resolveImageUrl } from "../../../utils/text";

type SelectedWilayah = {
  type: PublicWilayahType;
  id: number;
  name: string;
  daerahName: string;
  desaName?: string;
};

const surfaceClass =
  "rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900";

const matchesQuery = (value: string, query: string) =>
  value.toLocaleLowerCase("id-ID").includes(query);

const getWilayahName = (
  detail: PublicWilayahDetail,
  type: PublicWilayahType,
) => {
  if (type === "daerah") return detail.nama_daerah ?? "Detail Daerah";
  if (type === "desa") return detail.nama_desa ?? "Detail Desa";
  return detail.nama_kelompok ?? "Detail Kelompok";
};

const WilayahPage = () => {
  const navigate = useNavigate();
  const [wilayah, setWilayah] = useState<PublicWilayahDaerah[]>([]);
  const [loadingTree, setLoadingTree] = useState(true);
  const [treeError, setTreeError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [expandedDaerah, setExpandedDaerah] = useState<number | null>(null);
  const [expandedDesa, setExpandedDesa] = useState<number | null>(null);
  const [selectedWilayah, setSelectedWilayah] =
    useState<SelectedWilayah | null>(null);
  const [detail, setDetail] = useState<PublicWilayahDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const loadTree = async () => {
    setLoadingTree(true);
    setTreeError(null);
    try {
      const result = await fetchPublicWilayahTree();
      setWilayah(result);
    } catch (error) {
      setTreeError(
        error instanceof Error ? error.message : "Gagal memuat data wilayah.",
      );
    } finally {
      setLoadingTree(false);
    }
  };

  useEffect(() => {
    void loadTree();
  }, []);

  useEffect(() => {
    if (!selectedWilayah) {
      setDetail(null);
      setDetailError(null);
      return;
    }

    let cancelled = false;
    setLoadingDetail(true);
    setDetailError(null);

    fetchPublicWilayahDetail(selectedWilayah.type, selectedWilayah.id)
      .then((result) => {
        if (!cancelled) setDetail(result);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setDetail(null);
          setDetailError(
            error instanceof Error
              ? error.message
              : "Gagal memuat detail wilayah.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedWilayah]);

  const filteredWilayah = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("id-ID");
    if (!query) return wilayah;

    return wilayah
      .map((daerah) => {
        const daerahMatches = matchesQuery(daerah.nama_daerah, query);
        const desa = daerah.desa
          .map((itemDesa) => {
            const desaMatches = matchesQuery(itemDesa.nama_desa, query);
            return {
              ...itemDesa,
              kelompok:
                daerahMatches || desaMatches
                  ? itemDesa.kelompok
                  : itemDesa.kelompok.filter((itemKelompok) =>
                      matchesQuery(itemKelompok.nama_kelompok, query),
                    ),
            };
          })
          .filter(
            (itemDesa) =>
              daerahMatches ||
              matchesQuery(itemDesa.nama_desa, query) ||
              itemDesa.kelompok.length > 0,
          );

        return { ...daerah, desa };
      })
      .filter(
        (daerah) =>
          matchesQuery(daerah.nama_daerah, query) || daerah.desa.length > 0,
      );
  }, [search, wilayah]);

  const totals = useMemo(
    () =>
      wilayah.reduce(
        (total, daerah) => ({
          daerah: total.daerah + 1,
          desa: total.desa + daerah.desa.length,
          kelompok:
            total.kelompok +
            daerah.desa.reduce(
              (count, desa) => count + desa.kelompok.length,
              0,
            ),
        }),
        { daerah: 0, desa: 0, kelompok: 0 },
      ),
    [wilayah],
  );

  const selectDaerah = (daerah: PublicWilayahDaerah) => {
    setExpandedDaerah((current) => (current === daerah.id ? null : daerah.id));
    setExpandedDesa(null);
    setSelectedWilayah({
      type: "daerah",
      id: daerah.id,
      name: daerah.nama_daerah,
      daerahName: daerah.nama_daerah,
    });
  };

  const selectDesa = (daerah: PublicWilayahDaerah, desa: PublicWilayahDesa) => {
    setExpandedDesa((current) => (current === desa.id ? null : desa.id));
    setSelectedWilayah({
      type: "desa",
      id: desa.id,
      name: desa.nama_desa,
      daerahName: daerah.nama_daerah,
      desaName: desa.nama_desa,
    });
  };

  const selectKelompok = (
    daerah: PublicWilayahDaerah,
    desa: PublicWilayahDesa,
    kelompok: PublicWilayahKelompok,
  ) => {
    setSelectedWilayah({
      type: "kelompok",
      id: kelompok.id,
      name: kelompok.nama_kelompok,
      daerahName: daerah.nama_daerah,
      desaName: desa.nama_desa,
    });
  };

  const selectedImage = resolveImageUrl(detail?.img_url ?? detail?.img);
  const latitude = detail?.latitude;
  const longitude = detail?.longitude;
  const hasCoordinates =
    latitude !== null &&
    latitude !== undefined &&
    longitude !== null &&
    longitude !== undefined &&
    Number.isFinite(Number(latitude)) &&
    Number.isFinite(Number(longitude));
  const mapsUrl = hasCoordinates
    ? `https://www.google.com/maps?q=${latitude},${longitude}`
    : null;
  const mapEmbedUrl = hasCoordinates
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${Number(longitude) - 0.01}%2C${Number(latitude) - 0.01}%2C${Number(longitude) + 0.01}%2C${Number(latitude) + 0.01}&layer=mapnik&marker=${latitude}%2C${longitude}`
    : null;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 text-slate-900 dark:text-slate-100">
      <section className="overflow-hidden rounded-3xl bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white">
        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="max-w-2xl">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="group mb-6 inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <FiArrowLeft className="transition group-hover:-translate-x-1" />
              Kembali
            </button>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-800 dark:text-cyan-300">
              Referensi Wilayah
            </p>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
              Jelajahi wilayah
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Telusuri data dari Daerah hingga Kelompok dan lihat informasi
              lokasi yang tersedia.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { label: "Daerah", count: totals.daerah },
              { label: "Desa", count: totals.desa },
              { label: "Kelompok", count: totals.kelompok },
            ].map((item) => (
              <div
                key={item.label}
                className="min-w-20 border-l border-slate-300 pl-3 first:border-0 first:pl-0 dark:border-white/20 sm:min-w-24 sm:pl-4"
              >
                <p className="text-xl font-bold tabular-nums text-slate-900 dark:text-white sm:text-2xl">
                  {item.count}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(20rem,0.95fr)]">
        <section className={`${surfaceClass} overflow-hidden`}>
          <div className="border-b border-slate-200 p-4 dark:border-slate-800 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold">Struktur wilayah</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Pilih nama untuk melihat detail.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void loadTree()}
                disabled={loadingTree}
                aria-label="Muat ulang data wilayah"
                title="Muat ulang"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <FiRefreshCw className={loadingTree ? "animate-spin" : ""} />
              </button>
            </div>
            <label className="relative mt-4 block">
              <span className="sr-only">Cari daerah, desa, atau kelompok</span>
              <FiSearch
                aria-hidden
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari daerah, desa, atau kelompok"
                className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/10 dark:border-slate-700 dark:bg-slate-950 dark:placeholder:text-slate-500"
              />
            </label>
          </div>

          <div className="max-h-136 overflow-y-auto p-2 sm:p-3">
            {loadingTree ? (
              <div className="space-y-2 p-2" aria-live="polite">
                {[0, 1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-12 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800"
                  />
                ))}
              </div>
            ) : treeError ? (
              <div className="m-2 rounded-lg border border-rose-200 bg-rose-50 p-4 dark:border-rose-500/20 dark:bg-rose-500/10">
                <div className="flex items-start gap-3">
                  <FiAlertCircle className="mt-0.5 shrink-0 text-rose-600 dark:text-rose-300" />
                  <div>
                    <p className="text-sm font-semibold">Data gagal dimuat</p>
                    <p className="mt-1 wrap-break-word text-sm text-rose-800 dark:text-rose-200">
                      {treeError}
                    </p>
                    <button
                      type="button"
                      onClick={() => void loadTree()}
                      className="mt-3 text-sm font-semibold underline underline-offset-2"
                    >
                      Coba lagi
                    </button>
                  </div>
                </div>
              </div>
            ) : filteredWilayah.length === 0 ? (
              <p className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                {search
                  ? "Wilayah tidak ditemukan. Coba kata kunci lain."
                  : "Belum ada data wilayah."}
              </p>
            ) : (
              <ul className="space-y-1">
                {filteredWilayah.map((daerah) => {
                  const isDaerahExpanded =
                    search.length > 0 || expandedDaerah === daerah.id;
                  const isDaerahSelected =
                    selectedWilayah?.type === "daerah" &&
                    selectedWilayah.id === daerah.id;

                  return (
                    <li key={daerah.id}>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => selectDaerah(daerah)}
                          aria-pressed={isDaerahSelected}
                          className={`flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-lg px-3 py-2 text-left transition ${
                            isDaerahSelected
                              ? "bg-cyan-50 text-cyan-950 ring-1 ring-inset ring-cyan-300 dark:bg-cyan-500/10 dark:text-cyan-100 dark:ring-cyan-400/30"
                              : "hover:bg-slate-50 dark:hover:bg-slate-800/70"
                          }`}
                        >
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-cyan-100 text-xs font-bold text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-200">
                            D
                          </span>
                          <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                            {daerah.nama_daerah}
                          </span>
                        </button>
                        <button
                          type="button"
                          aria-label={`${isDaerahExpanded ? "Tutup" : "Buka"} desa di ${daerah.nama_daerah}`}
                          aria-expanded={isDaerahExpanded}
                          onClick={() =>
                            setExpandedDaerah((current) =>
                              current === daerah.id ? null : daerah.id,
                            )
                          }
                          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                        >
                          {isDaerahExpanded ? (
                            <FiChevronDown />
                          ) : (
                            <FiChevronRight />
                          )}
                        </button>
                      </div>

                      {isDaerahExpanded ? (
                        <ul className="ml-4 border-l border-slate-200 py-1 pl-2 dark:border-slate-700 sm:ml-5 sm:pl-3">
                          {daerah.desa.map((desa) => {
                            const isDesaExpanded =
                              search.length > 0 || expandedDesa === desa.id;
                            const isDesaSelected =
                              selectedWilayah?.type === "desa" &&
                              selectedWilayah.id === desa.id;

                            return (
                              <li key={desa.id}>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => selectDesa(daerah, desa)}
                                    aria-pressed={isDesaSelected}
                                    className={`flex min-h-10 min-w-0 flex-1 items-center gap-3 rounded-lg px-3 py-2 text-left transition ${
                                      isDesaSelected
                                        ? "bg-emerald-50 text-emerald-950 ring-1 ring-inset ring-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-100 dark:ring-emerald-400/30"
                                        : "hover:bg-slate-50 dark:hover:bg-slate-800/70"
                                    }`}
                                  >
                                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-emerald-100 text-[10px] font-bold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200">
                                      Ds
                                    </span>
                                    <span className="min-w-0 flex-1 truncate text-sm">
                                      {desa.nama_desa}
                                    </span>
                                  </button>
                                  {desa.kelompok.length > 0 ? (
                                    <button
                                      type="button"
                                      aria-label={`${isDesaExpanded ? "Tutup" : "Buka"} kelompok di ${desa.nama_desa}`}
                                      aria-expanded={isDesaExpanded}
                                      onClick={() =>
                                        setExpandedDesa((current) =>
                                          current === desa.id ? null : desa.id,
                                        )
                                      }
                                      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                                    >
                                      {isDesaExpanded ? (
                                        <FiChevronDown />
                                      ) : (
                                        <FiChevronRight />
                                      )}
                                    </button>
                                  ) : null}
                                </div>

                                {isDesaExpanded && desa.kelompok.length > 0 ? (
                                  <ul className="ml-4 border-l border-slate-200 py-1 pl-2 dark:border-slate-700 sm:ml-5 sm:pl-3">
                                    {desa.kelompok.map((kelompok) => {
                                      const isSelected =
                                        selectedWilayah?.type === "kelompok" &&
                                        selectedWilayah.id === kelompok.id;

                                      return (
                                        <li key={kelompok.id}>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              selectKelompok(
                                                daerah,
                                                desa,
                                                kelompok,
                                              )
                                            }
                                            aria-pressed={isSelected}
                                            className={`flex min-h-10 w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition ${
                                              isSelected
                                                ? "bg-amber-50 text-amber-950 ring-1 ring-inset ring-amber-300 dark:bg-amber-500/10 dark:text-amber-100 dark:ring-amber-400/30"
                                                : "hover:bg-slate-50 dark:hover:bg-slate-800/70"
                                            }`}
                                          >
                                            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-amber-100 text-[10px] font-bold text-amber-900 dark:bg-amber-500/15 dark:text-amber-200">
                                              K
                                            </span>
                                            <span className="min-w-0 flex-1 truncate text-sm">
                                              {kelompok.nama_kelompok}
                                            </span>
                                          </button>
                                        </li>
                                      );
                                    })}
                                  </ul>
                                ) : null}
                              </li>
                            );
                          })}
                        </ul>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        <section className={`${surfaceClass} min-w-0 overflow-hidden`}>
          <div className="border-b border-slate-200 px-4 py-4 dark:border-slate-800 sm:px-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Detail wilayah
            </p>
            {selectedWilayah ? (
              <>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>{selectedWilayah.daerahName}</span>
                  {selectedWilayah.desaName ? (
                    <>
                      <FiChevronRight aria-hidden />
                      <span>{selectedWilayah.desaName}</span>
                    </>
                  ) : null}
                  {selectedWilayah.type === "kelompok" ? (
                    <>
                      <FiChevronRight aria-hidden />
                      <span>Kelompok</span>
                    </>
                  ) : null}
                </div>
                <h2 className="mt-1 wrap-break-word text-xl font-bold">
                  {detail
                    ? getWilayahName(detail, selectedWilayah.type)
                    : selectedWilayah.name}
                </h2>
              </>
            ) : (
              <h2 className="mt-2 text-xl font-bold">Pilih wilayah</h2>
            )}
          </div>

          {!selectedWilayah ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 py-10 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-xl bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
                <FiMapPin className="text-2xl" />
              </div>
              <p className="mt-4 text-sm font-semibold">
                Belum ada wilayah dipilih
              </p>
              <p className="mt-1 max-w-xs text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                Pilih Daerah, Desa, atau Kelompok dari struktur wilayah.
              </p>
            </div>
          ) : loadingDetail ? (
            <div className="space-y-3 p-4 sm:p-5" aria-live="polite">
              <div className="h-40 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
              <div className="h-5 w-2/3 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
              <div className="h-5 w-1/2 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
            </div>
          ) : detailError ? (
            <div className="p-5" role="alert">
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 dark:border-rose-500/20 dark:bg-rose-500/10">
                <p className="text-sm font-semibold">Detail tidak tersedia</p>
                <p className="mt-1 wrap-break-word text-sm text-rose-800 dark:text-rose-200">
                  {detailError}
                </p>
              </div>
            </div>
          ) : detail ? (
            <div className="space-y-4 p-4 sm:p-5">
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt={`Foto ${selectedWilayah.name}`}
                  className="max-h-64 w-full rounded-lg bg-slate-100 object-cover dark:bg-slate-800"
                />
              ) : (
                <div className="flex h-36 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                  Foto wilayah tidak tersedia
                </div>
              )}

              <div className="flex items-center gap-2">
                {detail.is_active === undefined ? (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    Status tidak tersedia
                  </span>
                ) : (
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                      detail.is_active
                        ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300"
                        : "bg-rose-50 text-rose-800 dark:bg-rose-500/10 dark:text-rose-300"
                    }`}
                  >
                    <FiCheckCircle />
                    {detail.is_active ? "Aktif" : "Tidak aktif"}
                  </span>
                )}
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {selectedWilayah.type}
                </span>
              </div>

              <div className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                    Alamat
                  </p>
                  <p className="mt-1 text-sm leading-relaxed">
                    {detail.alamat || "Alamat belum tersedia"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                      Latitude
                    </p>
                    <p className="mt-1 break-all text-sm tabular-nums">
                      {latitude ?? "-"}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                      Longitude
                    </p>
                    <p className="mt-1 break-all text-sm tabular-nums">
                      {longitude ?? "-"}
                    </p>
                  </div>
                </div>
              </div>

              {mapEmbedUrl ? (
                <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
                  <iframe
                    title={`Peta ${selectedWilayah.name}`}
                    src={mapEmbedUrl}
                    loading="lazy"
                    className="h-52 w-full border-0 sm:h-60"
                  />
                </div>
              ) : null}

              {mapsUrl ? (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-500/20 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                >
                  <FiExternalLink />
                  Buka di Google Maps
                </a>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
};

export default WilayahPage;
