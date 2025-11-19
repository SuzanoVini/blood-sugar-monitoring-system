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
      const data = unwrap(res);
      const readings = data.data?.readings || [];
      // Map backend PascalCase to frontend snake_case
      return readings.map((r: any) => ({
        reading_id: r.Reading_ID,
        datetime: r.DateTime,
        value: r.Value,
        unit: r.Unit,
        category: r.Category,
        food_notes: r.Food_Notes,
        activity_notes: r.Activity_Notes,
        notes: r.Notes,
        symptoms: r.Symptoms
      }));
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
    // Backend route: GET /api/thresholds (Clinic_Staff/Admin only)
    const res = await axiosInstance.get("/thresholds");
    const data = unwrap(res) as any;
    const t = data?.data || data;
    // Normalize keys for frontend consumers
    return {
      normal_low: t.Normal_Low ?? t.normal_low,
      normal_high: t.Normal_High ?? t.normal_high,
      borderline_low: t.Borderline_Low ?? t.borderline_low,
      borderline_high: t.Borderline_High ?? t.borderline_high,
      abnormal_low: t.Abnormal_Low ?? t.abnormal_low,
      abnormal_high: t.Abnormal_High ?? t.abnormal_high,
    };
  },

  async updateCategoryThreshold(payload: Record<string, any>) {
    // Backend route: PUT /api/thresholds expects PascalCase keys
    const body = {
      Normal_Low: payload.Normal_Low ?? payload.normal_low,
      Normal_High: payload.Normal_High ?? payload.normal_high,
      Borderline_Low: payload.Borderline_Low ?? payload.borderline_low,
      Borderline_High: payload.Borderline_High ?? payload.borderline_high,
      Abnormal_Low: payload.Abnormal_Low ?? payload.abnormal_low,
      Abnormal_High: payload.Abnormal_High ?? payload.abnormal_high,
    };
    const res = await axiosInstance.put("/thresholds", body);
    return unwrap(res);
  },

  // alerts
  async getAlerts() {
    const res = await axiosInstance.get("/patient/alerts");
    const data = unwrap(res);
    return data.data?.alerts || [];
  },

  // specialist
  async getAssignedPatients() {
    const res = await axiosInstance.get("/specialist/patients");
    const data = unwrap(res) as any;
    const list = data?.data?.patients || data?.patients || [];
    // Map backend column names to frontend shape
    return list.map((r: any) => ({
      patient_id: r.Patient_ID,
      name: r.Name,
      healthcare_number: r.Healthcare_Number,
    }));
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
  },

  // staff: patient list (read-only)
  async getStaffPatients(limit = 20, offset = 0) {
    const userId = authService.getUserIdFromToken();
    if (!userId) {
      throw new Error("User ID not found in token");
    }
    const res = await axiosInstance.get("/staff/patients", {
      params: { staff_id: userId, limit, offset }
    });
    const data = unwrap(res) as any;
    const list = data?.data?.patients || data?.patients || [];
    // Map backend column names to frontend shape
    return list.map((r: any) => ({
      patient_id: r.Patient_ID,
      name: r.Name,
      email: r.Email,
      healthcare_number: r.Healthcare_Number,
      status: r.Status,
    }));
  }
};
