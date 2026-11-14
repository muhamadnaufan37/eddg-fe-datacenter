import axios from "axios";

const configuredBaseURL =
  import.meta.env.VITE_PUBLIC_REACT_APP_BASE_URL_API?.replace(/\/+$/, "");
const baseURL = configuredBaseURL?.replace(/\/api\/v1$/i, "");

export const axiosServices = () => {
  const Axios = axios.create({
    baseURL: baseURL,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  return Axios;
};
