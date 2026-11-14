/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import axios from "axios";
import {
  endZiswafSession,
  getZiswafErrorMessage,
  startZiswafSession,
  type ZiswafSessionUser,
} from "../services/ziswaf";

type SessionStatus = "idle" | "loading" | "ready" | "error";

interface AuthContextValue {
  user: ZiswafSessionUser | null;
  expiresAt: string | null;
  status: SessionStatus;
  error: string | null;
  isAuthenticated: boolean;
  startSession: () => Promise<void>;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<ZiswafSessionUser | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [status, setStatus] = useState<SessionStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const sessionRequestRef = useRef<Promise<void> | null>(null);

  const establishSession = useCallback((force: boolean) => {
    if (!force && status === "ready") return Promise.resolve();
    if (sessionRequestRef.current) return sessionRequestRef.current;

    setStatus("loading");
    setError(null);
    const request = startZiswafSession()
      .then((session) => {
        setUser(session.user);
        setExpiresAt(session.expires_at);
        setStatus("ready");
      })
      .catch((cause: unknown) => {
        const message = getZiswafErrorMessage(cause);
        setUser(null);
        setExpiresAt(null);
        setError(message);
        setStatus("error");
        throw new Error(message);
      })
      .finally(() => {
        sessionRequestRef.current = null;
      });

    sessionRequestRef.current = request;
    return request;
  }, [status]);

  const startSession = useCallback(
    () => establishSession(false),
    [establishSession],
  );
  const refreshSession = useCallback(
    () => establishSession(true),
    [establishSession],
  );

  const logout = useCallback(async () => {
    try {
      await endZiswafSession();
    } catch (cause) {
      if (!axios.isAxiosError(cause) || cause.response?.status !== 401) {
        throw new Error(getZiswafErrorMessage(cause));
      }
    } finally {
      setUser(null);
      setExpiresAt(null);
      setError(null);
      setStatus("idle");
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      expiresAt,
      status,
      error,
      isAuthenticated: status === "ready",
      startSession,
      refreshSession,
      logout,
    }),
    [user, expiresAt, status, error, startSession, refreshSession, logout],
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
