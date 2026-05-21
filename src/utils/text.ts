export const maskText = (
  value: string | number | null | undefined,
  visibleStart = 2,
  visibleEnd = 2,
) => {
  if (value === null || value === undefined) {
    return "-";
  }

  const text = String(value).trim();

  if (!text) {
    return "-";
  }

  if (text.length <= visibleStart + visibleEnd) {
    return "*".repeat(Math.max(text.length, 1));
  }

  const start = text.slice(0, visibleStart);
  const end = text.slice(text.length - visibleEnd);

  return `${start}${"*".repeat(Math.max(text.length - visibleStart - visibleEnd, 1))}${end}`;
};

export const formatBooleanLabel = (value: boolean | null | undefined) => {
  if (value === null || value === undefined) {
    return "-";
  }

  return value ? "Ya" : "Tidak";
};

export const resolveImageUrl = (value: string | null | undefined) => {
  if (!value) {
    return "";
  }

  if (/^(https?:)?\/\//i.test(value) || value.startsWith("data:")) {
    return value;
  }

  const baseUrl = import.meta.env.VITE_PUBLIC_REACT_APP_BASE_URL_API;

  if (!baseUrl) {
    return value;
  }

  const apiOrigin = new URL(baseUrl, window.location.origin).origin;
  return new URL(value, apiOrigin).toString();
};
