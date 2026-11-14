import axios from "axios";
import { axiosServices } from "./axios";

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

export interface Pagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface DonationListResponse {
  items: Donation[];
  pagination: Pagination;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface Withdrawal {
  uuid: string;
  withdrawal_id?: string;
  amount: number;
  fee?: number;
  net_amount?: number;
  status: string;
  note?: string | null;
  created_at?: string;
  processed_at?: string | null;
}

const api = axiosServices();

const authConfig = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const getZiswafErrorMessage = (error: unknown) => {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? "Permintaan gagal. Silakan coba lagi.";
  }
  return error instanceof Error ? error.message : "Terjadi kesalahan.";
};

export const getRetryAfterSeconds = (error: unknown) => {
  if (!axios.isAxiosError(error)) return null;
  const value = error.response?.headers["retry-after"];
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
};

export const fetchMyDonations = async (
  token: string,
  page = 1,
  perPage = 15,
) => {
  const response = await api.get<ApiEnvelope<DonationListResponse>>(
    `/api/v1/ziswaf/donations?per_page=${perPage}&page=${page}`,
    authConfig(token),
  );
  return response.data.data;
};

export const createDonation = async (
  token: string,
  payload: {
    request_id: string;
    donation_type: DonationType;
    amount: number;
  },
) => {
  const response = await api.post<ApiEnvelope<Donation>>(
    "/api/v1/ziswaf/donations",
    payload,
    authConfig(token),
  );
  return response.data;
};

export const fetchDonation = async (token: string, uuid: string) => {
  const response = await api.get<ApiEnvelope<Donation>>(
    `/api/v1/ziswaf/donations/${encodeURIComponent(uuid)}`,
    authConfig(token),
  );
  return response.data.data;
};

export const fetchAdminDonations = async (
  token: string,
  filters: {
    status?: string;
    donation_type?: DonationType | "";
    page?: number;
    per_page?: number;
  },
) => {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.donation_type) params.set("donation_type", filters.donation_type);
  params.set("per_page", String(filters.per_page ?? 15));
  params.set("page", String(filters.page ?? 1));
  const response = await api.get<
    ApiEnvelope<DonationListResponse | Donation[]>
  >(`/api/v1/ziswaf/admin/donations?${params.toString()}`, authConfig(token));
  return response.data.data;
};

export const fetchAdminWithdrawals = async (token: string, page = 1) => {
  const response = await api.get<
    ApiEnvelope<{ items: Withdrawal[]; pagination?: Pagination } | Withdrawal[]>
  >(`/api/v1/ziswaf/admin/withdrawals?per_page=15&page=${page}`, authConfig(token));
  return response.data.data;
};

export const createWithdrawal = async (token: string, amount: number) => {
  const response = await api.post<ApiEnvelope<Withdrawal>>(
    "/api/v1/ziswaf/admin/withdrawals",
    { amount },
    authConfig(token),
  );
  return response.data;
};

export const fetchAdminWithdrawal = async (token: string, uuid: string) => {
  const response = await api.get<ApiEnvelope<Withdrawal>>(
    `/api/v1/ziswaf/admin/withdrawals/${encodeURIComponent(uuid)}`,
    authConfig(token),
  );
  return response.data.data;
};
