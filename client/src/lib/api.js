import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? "" : "http://localhost:8888");

const api = axios.create({
  baseURL,
  withCredentials: true,
});

export default api;
