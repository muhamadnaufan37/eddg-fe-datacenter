import axios from "axios";
import type { AxiosResponse } from "axios";

const configuredApiUrl =
  import.meta.env.VITE_PUBLIC_REACT_APP_BASE_URL_API?.replace(/\/+$/, "") ?? "";
const apiBaseUrl = /\/api\/v1$/i.test(configuredApiUrl)
  ? configuredApiUrl
  : `${configuredApiUrl}/api/v1`;

export const ziswafApi = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

export type DonationType = "zakat" | "infaq" | "sedekah" | "wakaf";
export type DonationStatus =
  | "processing"
  | "pending"
  | "success"
  | "expired"
  | "failed";

export interface Donation {
  uuid: string;
  donation_type: DonationType;
  description?: string;
  amount: number;
  total_amount?: number;
  amount_uniq?: number;
  admin_fee?: number;
  admin_fee_pct?: number;
  credit_amount?: number;
  fee_by?: string;
  qris_method?: string;
  qr_url?: string | null;
  qris_image?: string | null;
  payment_url?: string | null;
  status: DonationStatus;
  is_test?: boolean;
  expired_at?: string | null;
  paid_at?: string | null;
  created_at?: string;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ZiswafSessionUser {
  id?: string;
  nama_lengkap?: string;
  role_id?: string;
  nm_role?: string;
}

export interface ZiswafSession {
  user: ZiswafSessionUser;
  expires_at: string;
}

const isAxiosUnauthorized = (error: unknown) =>
  axios.isAxiosError(error) && error.response?.status === 401;

export const getZiswafErrorMessage = (error: unknown) => {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return (
      error.response?.data?.message ??
      "Permintaan gagal. Silakan coba lagi."
    );
  }
  if (error instanceof Error) return error.message;
  return "Terjadi kesalahan saat menghubungi layanan ZISWAF.";
};

export const getZiswafStatusCode = (error: unknown) =>
  axios.isAxiosError(error) ? (error.response?.status ?? null) : null;

export const getRetryAfterSeconds = (error: unknown) => {
  if (!axios.isAxiosError(error)) return null;
  const value = error.response?.headers["retry-after"];
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
};

export const startZiswafSession = async () => {
  const response = await ziswafApi.post<ApiEnvelope<ZiswafSession>>(
    "/ziswaf/session",
  );
  if (
    !response.data.success ||
    !response.data.data?.user ||
    !response.data.data.expires_at
  ) {
    throw new Error(
      response.data.message || "Respons sesi ZISWAF tidak lengkap.",
    );
  }
  return response.data.data;
};

export const endZiswafSession = async () => {
  await ziswafApi.delete("/ziswaf/session");
};

export const createDonation = async (payload: {
  request_id: string;
  donation_type: DonationType;
  amount: number;
}) => {
  const response = await ziswafApi.post<ApiEnvelope<Donation>>(
    "/ziswaf/donations",
    payload,
  );
  return response.data;
};

const getDonationResponse = (response: AxiosResponse<ApiEnvelope<Donation>>) => {
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || "Data transaksi tidak tersedia.");
  }
  return response.data.data;
};

export const fetchDonation = async (
  uuid: string,
  refreshSession: () => Promise<void>,
) => {
  const path = `/ziswaf/donations/${encodeURIComponent(uuid)}`;
  try {
    return getDonationResponse(
      await ziswafApi.get<ApiEnvelope<Donation>>(path),
    );
  } catch (error) {
    if (!isAxiosUnauthorized(error)) throw error;

    await refreshSession();
    return getDonationResponse(
      await ziswafApi.get<ApiEnvelope<Donation>>(path),
    );
  }
};
