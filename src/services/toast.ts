import { Toast } from "primereact/toast";

let toastRef: Toast | null = null;

export const setToastRef = (ref: Toast) => {
  toastRef = ref;
};

export const showToast = (
  severity: "success" | "error" | "warning" | "info",
  summary: string,
  detail?: string,
  life: number = 3000,
) => {
  if (toastRef) {
    toastRef.show({
      severity,
      summary,
      detail,
      life,
    });
  }
};
