import { axiosServices } from "./axios";

const api = axiosServices();

const multipartHeaders = {
  "Content-Type": "multipart/form-data",
};

const appendIfPresent = (
  formData: FormData,
  key: string,
  value: string | number | boolean | File | null | undefined,
) => {
  if (value === null || value === undefined || value === "") {
    return;
  }

  if (value instanceof File) {
    formData.append(key, value);
    return;
  }

  formData.append(key, String(value));
};

type ReferenceEntry = {
  id?: string | number;
  uuid?: string;
  kode_uuid?: string;
  kode_cari_data?: string;
  value?: string | number;
  label?: string;
  nama_lengkap?: string;
  nama_pekerjaan?: string;
  nm_peserta?: string;
  name?: string;
};

type TempatSambungEntry = {
  id?: string | number;
  nama_daerah?: string;
  nama_desa?: string;
  nama_kelomopok?: string;
  nama_kelompok?: string;
  label?: string;
  name?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const normalizeReferenceList = (payload: unknown) => {
  const source =
    (payload as { data?: unknown })?.data ??
    (payload as { result?: unknown })?.result ??
    payload;

  const items = Array.isArray(source)
    ? source
    : Array.isArray((source as { data?: unknown[] })?.data)
      ? (source as { data: unknown[] }).data
      : [];

  return items.map((item) => {
    const entry = isRecord(item) ? (item as ReferenceEntry) : {};
    const value =
      entry.kode_cari_data ??
      entry.id ??
      entry.uuid ??
      entry.kode_uuid ??
      entry.value ??
      entry.label ??
      entry.nama_lengkap ??
      entry.nama_pekerjaan ??
      entry.nm_peserta ??
      entry.name ??
      "";

    const label =
      entry.nama_pekerjaan ??
      entry.nama_lengkap ??
      entry.label ??
      entry.nm_peserta ??
      entry.name ??
      (entry.kode_cari_data
        ? `${entry.nama_lengkap ?? entry.nm_peserta ?? entry.name ?? entry.kode_cari_data} (${entry.kode_cari_data})`
        : String(value));

    return {
      label: String(label),
      value: String(value),
    };
  });
};

const normalizeNamaPesertaReference = (payload: unknown) => {
  const source =
    (payload as { data?: unknown })?.data ??
    (payload as { result?: unknown })?.result ??
    payload;

  const items = Array.isArray(source)
    ? source
    : Array.isArray((source as { data?: unknown[] })?.data)
      ? (source as { data: unknown[] }).data
      : [];

  return items.map((item) => {
    const entry = isRecord(item) ? (item as ReferenceEntry) : {};
    const namaLengkap =
      entry.nama_lengkap ?? entry.nm_peserta ?? entry.name ?? "";
    const kodeCariData = entry.kode_cari_data ?? entry.id ?? entry.uuid ?? "";

    const label =
      kodeCariData && namaLengkap
        ? `${namaLengkap}`
        : namaLengkap || kodeCariData || "";

    return {
      label: String(label),
      // Use kode_cari_data (or id/uuid) as the option value so selections
      // submit the participant identifier instead of the display name.
      value: String(kodeCariData ?? namaLengkap ?? ""),
    };
  });
};

const normalizeTempatSambungReference = (
  payload: unknown,
  labelKeys: Array<keyof TempatSambungEntry>,
) => {
  const source =
    (payload as { data_tempat_sambung?: unknown })?.data_tempat_sambung ??
    (payload as { data?: unknown })?.data ??
    (payload as { result?: unknown })?.result ??
    payload;

  const items = Array.isArray(source)
    ? source
    : Array.isArray(
          (source as { data_tempat_sambung?: unknown[] })?.data_tempat_sambung,
        )
      ? (source as { data_tempat_sambung: unknown[] }).data_tempat_sambung
      : Array.isArray((source as { data?: unknown[] })?.data)
        ? (source as { data: unknown[] }).data
        : [];

  return items.map((item) => {
    const entry = isRecord(item) ? (item as TempatSambungEntry) : {};
    const labelValue =
      labelKeys.map((key) => entry[key]).find((value) => Boolean(value)) ??
      entry.label ??
      entry.name ??
      entry.id ??
      "";

    return {
      label: String(labelValue),
      value: String(entry.id ?? labelValue ?? ""),
    };
  });
};

export type ReferenceOption = {
  label: string;
  value: string;
};

export const fetchCaiByUuid = async (kodeUuid: string) => {
  const response = await api.get(`/api/v1/data_center/cai/${kodeUuid}`);
  return response.data;
};

export const recoverCaiYear = async (payload: {
  nama_lengkap: string;
  from_year: number;
  to_year: number;
}) => {
  const response = await api.post("/api/v1/data_center/cai/recover", payload);

  return response.data;
};

export const submitCaiRegistration = async (payload: {
  nama_lengkap: string;
  tgl_lahir: string;
  jenis_kelamin: string;
  tmpt_daerah: string;
  tmpt_desa: string;
  tmpt_kelompok: string;
  utusan: string;
  img: File;
}) => {
  const formData = new FormData();

  appendIfPresent(formData, "nama_lengkap", payload.nama_lengkap);
  appendIfPresent(formData, "tgl_lahir", payload.tgl_lahir);
  appendIfPresent(formData, "jenis_kelamin", payload.jenis_kelamin);
  appendIfPresent(formData, "tmpt_daerah", payload.tmpt_daerah);
  appendIfPresent(formData, "tmpt_desa", payload.tmpt_desa);
  appendIfPresent(formData, "tmpt_kelompok", payload.tmpt_kelompok);
  appendIfPresent(formData, "utusan", payload.utusan);
  appendIfPresent(formData, "img", payload.img);

  const response = await api.post("/api/v1/data_center/cai/create", formData, {
    headers: multipartHeaders,
  });

  return response.data;
};

export const fetchSensusByUuid = async (kodeUuid: string) => {
  const response = await api.get(`/api/v1/data_center/sensus/${kodeUuid}`);
  return response.data;
};

export const submitSensusRegistration = async (payload: {
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
  usia_menikah?: string;
  kriteria_pasangan?: string;
  tmpt_daerah: string;
  tmpt_desa: string;
  tmpt_kelompok: string;
  status_persetujuan: number;
  img: File;
}) => {
  const formData = new FormData();

  appendIfPresent(formData, "nama_lengkap", payload.nama_lengkap);
  appendIfPresent(formData, "nama_panggilan", payload.nama_panggilan);
  appendIfPresent(formData, "tempat_lahir", payload.tempat_lahir);
  appendIfPresent(formData, "tanggal_lahir", payload.tanggal_lahir);
  appendIfPresent(formData, "alamat", payload.alamat);
  appendIfPresent(formData, "jenis_kelamin", payload.jenis_kelamin);
  appendIfPresent(formData, "no_telepon", payload.no_telepon);
  appendIfPresent(formData, "nama_ayah", payload.nama_ayah);
  appendIfPresent(formData, "nama_ibu", payload.nama_ibu);
  appendIfPresent(formData, "hoby", payload.hoby);
  appendIfPresent(formData, "pekerjaan", payload.pekerjaan);
  appendIfPresent(formData, "usia_menikah", payload.usia_menikah);
  appendIfPresent(formData, "kriteria_pasangan", payload.kriteria_pasangan);
  appendIfPresent(formData, "tmpt_daerah", payload.tmpt_daerah);
  appendIfPresent(formData, "tmpt_desa", payload.tmpt_desa);
  appendIfPresent(formData, "tmpt_kelompok", payload.tmpt_kelompok);
  appendIfPresent(formData, "status_persetujuan", payload.status_persetujuan);
  appendIfPresent(formData, "img", payload.img);

  const response = await api.post(
    "/api/v1/data_center/sensus/create",
    formData,
    { headers: multipartHeaders },
  );

  return response.data;
};

export const fetchPekerjaanReference = async (): Promise<ReferenceOption[]> => {
  const response = await api.get(
    "/api/v1/data_center/reference/list-pekerjaan",
  );
  return normalizeReferenceList(response.data);
};

export const fetchDaerahReference = async (): Promise<ReferenceOption[]> => {
  const response = await api.get("/api/v1/data_center/reference/list-daerah");
  return normalizeTempatSambungReference(response.data, ["nama_daerah"]);
};

export const fetchDesaReference = async (
  daerahId: string,
): Promise<ReferenceOption[]> => {
  const response = await api.get("/api/v1/data_center/reference/list-desa", {
    params: { daerah_id: daerahId },
  });
  return normalizeTempatSambungReference(response.data, ["nama_desa"]);
};

export const fetchKelompokReference = async (
  desaId: string,
): Promise<ReferenceOption[]> => {
  const response = await api.get(
    "/api/v1/data_center/reference/list-kelompok",
    {
      params: { desa_id: desaId },
    },
  );
  return normalizeTempatSambungReference(response.data, [
    "nama_kelomopok",
    "nama_kelompok",
  ]);
};

export const fetchAllKelompokReference = async (): Promise<
  ReferenceOption[]
> => {
  const response = await api.get(
    "/api/v1/data_center/reference/list-all-kelompok",
  );
  return normalizeTempatSambungReference(response.data, [
    "nama_kelomopok",
    "nama_kelompok",
  ]);
};

export const fetchNamaPesertaReference = async (): Promise<
  ReferenceOption[]
> => {
  const response = await api.get(
    "/api/v1/data_center/reference/list-nama-peserta-sensus",
  );
  return normalizeNamaPesertaReference(response.data);
};

export const fetchNamaPesertaCaiReference = async (params?: {
  tahun?: number;
  search?: string;
}): Promise<ReferenceOption[]> => {
  const response = await api.get(
    "/api/v1/data_center/reference/list-nama-peserta-cai",
    {
      params: {
        ...(typeof params?.tahun === "number" ? { tahun: params.tahun } : {}),
        search: params?.search ?? "",
      },
    },
  );
  return normalizeNamaPesertaReference(response.data);
};

export const fetchNamaPesertaSensusReference = async (params?: {
  search?: string;
}): Promise<ReferenceOption[]> => {
  const response = await api.get(
    "/api/v1/data_center/reference/list-nama-peserta-sensus",
    {
      params: { search: params?.search ?? "" },
    },
  );
  return normalizeNamaPesertaReference(response.data);
};

export type PresensiKegiatanVenue = {
  id: number;
  uuid?: string | null;
  nama_daerah?: string;
  nama_desa?: string;
  nama_kelompok?: string;
  alamat?: string;
  latitude?: string;
  longitude?: string;
  img?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type PresensiKegiatan = {
  id: number;
  kode_kegiatan: string;
  nama_kegiatan: string;
  tmpt_kegiatan: string;
  type_kegiatan: string;
  category: string;
  usia_mode: string;
  usia_min: number;
  usia_max: number;
  tgl_kegiatan: string;
  jam_kegiatan: string;
  expired_date_time: string;
  is_expired: boolean;
  status_kegiatan: string;
  expired_message: string;
  daerah?: PresensiKegiatanVenue | null;
  desa?: PresensiKegiatanVenue | null;
  kelompok?: PresensiKegiatanVenue | null;
};

export const searchKegiatanPresensi = async (kodeKegiatan: string) => {
  const response = await api.get(
    "/api/v1/data_center/presensi/search-kegiatan",
    {
      params: { kode_kegiatan: kodeKegiatan },
    },
  );

  return response.data as {
    success: boolean;
    message: string;
    data: PresensiKegiatan[];
  };
};

export const searchCaiData = async (payload: {
  nama_lengkap: string;
  tgl_lahir: string;
  jenis_kelamin: string;
}) => {
  const response = await api.get("/api/v1/data_center/cai/search", {
    params: payload,
  });
  return response.data;
};

export const searchSensusData = async (payload: {
  nama_lengkap: string;
  tanggal_lahir: string;
  nama_ortu: string;
}) => {
  const response = await api.get("/api/v1/data_center/sensus/search", {
    params: payload,
  });
  return response.data;
};

export const searchPengaduanData = async (payload: { kontak: string }) => {
  const response = await api.post(
    "/api/v1/data_center/pengaduan/search",
    payload,
  );
  return response.data;
};

export const submitPresensi = async (payload: {
  kode_kegiatan: string;
  id_peserta: string;
  add_by_petugas: string;
  latitude: string;
  longitude: string;
  status_presensi: string;
  radius_meter: number;
  category: string | null;
}) => {
  const response = await api.post(
    "/api/v1/data_center/presensi/create",
    payload,
  );
  return response.data;
};

export const submitEticket = async (payload: {
  nama_lengkap: string;
  kontak: string;
  jenis_pengaduan: string;
  subjek: string;
  isi_pengaduan: string;
  nama_kelompok: string;
  lampiran?: File | null;
}) => {
  const formData = new FormData();

  appendIfPresent(formData, "nama_lengkap", payload.nama_lengkap);
  appendIfPresent(formData, "kontak", payload.kontak);
  appendIfPresent(formData, "jenis_pengaduan", payload.jenis_pengaduan);
  appendIfPresent(formData, "subjek", payload.subjek);
  appendIfPresent(formData, "isi_pengaduan", payload.isi_pengaduan);
  appendIfPresent(formData, "nama_kelompok", payload.nama_kelompok);
  appendIfPresent(formData, "lampiran", payload.lampiran ?? undefined);

  const response = await api.post(
    "/api/v1/data_center/pengaduan/eticket",
    formData,
    {
      headers: multipartHeaders,
    },
  );

  return response.data;
};

export const submitCekPajakKendaraan = async (payload: {
  objek_pajak_no_polisi1: string;
  objek_pajak_no_polisi2: string;
  objek_pajak_no_polisi3: string;
  objek_pajak_kd_plat: string;
  bayar_kedepan: string;
}) => {
  const response = await api.post(
    "/api/v1/data_center/sambara/info-pajak",
    payload,
  );

  return response.data;
};
