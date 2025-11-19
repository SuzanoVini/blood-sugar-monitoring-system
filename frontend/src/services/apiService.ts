import axios from "axios";
import authService from "./authService";

/**
 * apiService - single place for REST interactions
 * Adjust BASE_URL to match your backend (PHP) endpoints.
 */
const BASE_URL = import.meta.env.VITE_API_BASE || "/api";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 8000,
  headers: { "Content-Type": "application/json" }
});

axiosInstance.interceptors.request.use(config => { const token = authService.getToken(); if (token) { config.headers.Authorization = 'Bearer ' + token; } return config; });

// Helper: return data or fallback
interface ApiResponse<T = any> {
  data: T;
  [key: string]: any;
}

type UnwrapResponse<T = any> = ApiResponse<T> | T;

const unwrap = <T = any>(res: UnwrapResponse<T>): T => {
  if (res && typeof res === "object" && "data" in res) {
    return (res as ApiResponse<T>).data;
  }
  return res as T;
};

export default {
  // readings
  async getReadings() {
    try {
      const res = await axiosInstance.get("/patient/readings");
      return unwrap(res);
    } catch (err) {
      // fallback: return empty array for dev without backend
      if (err instanceof Error) {
        console.warn("getReadings fallback to mock", err.message);
      } else {
        console.warn("getReadings fallback to mock", err);
      }
      return [];
    }
  },

  async createReading(payload: Record<string, any>) {
    const res = await axiosInstance.post("/patient/readings", payload);
    return unwrap(res);
  },

  async deleteReading(id: number | string): Promise<any> {
    const res = await axiosInstance.delete<ApiResponse<any>>(`/patient/readings/${id}`);
    return unwrap(res);
  },

  // admin & staff
  async getCategoryThreshold() {
    const res = await axiosInstance.get("/threshold");
    return unwrap(res);
  },

  async updateCategoryThreshold(payload: Record<string, any>) {
    const res = await axiosInstance.put("/threshold", payload);
    return unwrap(res);
  },

  // alerts
  async getAlerts() {
    const res = await axiosInstance.get("/patient/alerts");
    return unwrap(res);
  },

  // specialist
  async getAssignedPatients() {
    const res = await axiosInstance.get("/specialist/patients");
    return unwrap(res);
  },

  // admin: report-related
  async getAllReadings(start: string, end: string): Promise<any[]> {
    const res = await axiosInstance.get<ApiResponse<any[]>>("/admin/readings", { params: { start, end }});
    return unwrap<any[]>(res.data);
  },

  async getAIPatternAnalyses(start: string, end: string) {
    const res = await axiosInstance.get("/admin/analyses", { params: { start, end }});
    return unwrap(res);
  },

  async saveReport(report: Record<string, any>) {
    const res = await axiosInstance.post("/admin/reports", report);
    return unwrap(res);
  }
};
