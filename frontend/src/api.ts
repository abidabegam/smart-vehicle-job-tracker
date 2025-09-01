import axios from "axios";
export const API_BASE = import.meta.env.VITE_API_BASE as string; // e.g. http://127.0.0.1:8000
export const api = axios.create({ baseURL: `${API_BASE}/api` });
export function setToken(token: string | null) {
  if (token) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  else delete api.defaults.headers.common["Authorization"];
}
