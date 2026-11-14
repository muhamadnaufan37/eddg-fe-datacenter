/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import axios from "axios";
import { axiosServices } from "../services/axios";

export interface AuthUser {
  id: string;
  nama_lengkap: string;
  role_id: string;
  nm_role: string;
  status_nda: number;
}

interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    token?: string;
    user?: AuthUser;
  };
}

const AuthContext = createContext<AuthContextValue | null>(null);

const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return (
      error.response?.data?.message ?? "Login gagal. Periksa kembali data Anda."
    );
  }
  return error instanceof Error ? error.message : "Login gagal.";
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const response = await axiosServices().post<LoginResponse>(
        "/api/v1/login",
        { username, password },
      );
      const payload = response.data;

      if (!payload.success || !payload.data?.token || !payload.data.user) {
        throw new Error(payload.message || "Respons login tidak lengkap.");
      }

      setToken(payload.data.token);
      setUser(payload.data.user);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token && user),
      login,
      logout,
    }),
    [token, user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
