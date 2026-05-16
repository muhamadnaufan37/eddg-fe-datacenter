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
  value?: string | number;
  label?: string;
  nama_lengkap?: string;
  nm_pekerjaan?: string;
  nm_peserta?: string;
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
      entry.id ??
      entry.uuid ??
      entry.kode_uuid ??
      entry.value ??
      entry.label ??
      entry.nama_lengkap ??
      entry.nm_pekerjaan ??
      entry.nm_peserta ??
      entry.name ??
      "";

    const label =
      entry.nm_pekerjaan ??
      entry.nama_lengkap ??
      entry.label ??
      entry.nm_peserta ??
      entry.name ??
      String(value);

    return {
      label: String(label),
      value: String(value),
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

export const fetchNamaPesertaReference = async (): Promise<
  ReferenceOption[]
> => {
  const response = await api.get(
    "/api/v1/data_center/reference/list-nama-peserta-sensus",
  );
  return normalizeReferenceList(response.data);
};

export const submitPresensi = async (payload: {
  kode_kegiatan: string;
  id_peserta: string;
  add_by_petugas: string;
  latitude: string;
  longitude: string;
  radius_meter: number;
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
