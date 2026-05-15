import React, { createContext, useContext, useState, useCallback } from "react";

type AlertType = "success" | "error" | "warning" | "info";

interface AlertData {
  id: string;
  type: AlertType;
  message: string;
}

interface AlertContextType {
  alerts: AlertData[];
  showAlert: (type: AlertType, message: string) => void;
  removeAlert: (id: string) => void;
  clearAlerts: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [alerts, setAlerts] = useState<AlertData[]>([]);

  const showAlert = useCallback((type: AlertType, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newAlert: AlertData = { id, type, message };

    setAlerts((prev) => [...prev, newAlert]);
  }, []);

  const removeAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  return (
    <AlertContext.Provider
      value={{ alerts, showAlert, removeAlert, clearAlerts }}
    >
      {children}
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
};
