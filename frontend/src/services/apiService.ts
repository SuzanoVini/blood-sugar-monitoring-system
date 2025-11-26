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

axiosInstance.interceptors.request.use(config => {
  const token = authService.getToken();
  if (token) {
    config.headers.Authorization = 'Bearer ' + token;
    console.log('apiService: Sending request with Authorization header:', config.headers.Authorization);
  } else {
    console.log('apiService: Sending request without Authorization header (no token found).');
  }
  return config;
});

// Helper: return data
const extractData = (res: any) => res.data;

export default {
  // readings
  async getReadings() {
    const currentUser = await authService.getCurrentUser(); // Await current user
    const userId = currentUser?.user_id;
    if (!userId) {
      console.warn("getReadings failed: No user ID found.");
      return [];
    }
    try {
      const res = await axiosInstance.get("/patient/readings", { params: { patient_id: userId } });
      const data = extractData(res);
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
      if (err instanceof Error) {
        console.warn("getReadings fallback to mock", err.message);
      } else {
        console.warn("getReadings fallback to mock", err);
      }
      return [];
    }
  },

  async createReading(payload: Record<string, any>) {
    const currentUser = await authService.getCurrentUser(); // Await current user
    const userId = currentUser?.user_id;
    if (!userId) throw new Error("User not authenticated");
    const res = await axiosInstance.post("/patient/readings", { ...payload, patient_id: userId });
    return extractData(res);
  },

  async deleteReading(id: number | string): Promise<any> {
    const currentUser = await authService.getCurrentUser(); // Await current user
    const userId = currentUser?.user_id;
    if (!userId) throw new Error("User not authenticated");
    const res = await axiosInstance.delete(`/patient/readings/${id}`, { params: { patient_id: userId } });
    return extractData(res);
  },

  async updateReading(id: number | string, payload: Record<string, any>): Promise<any> {
    const currentUser = await authService.getCurrentUser(); // Await current user
    const userId = currentUser?.user_id;
    if (!userId) throw new Error("User not authenticated");
    const res = await axiosInstance.put(`/patient/readings/${id}`, { ...payload, patient_id: userId });
    return extractData(res);
  },

  // admin & staff
  async getCategoryThreshold() {
    const res = await this.get("/thresholds");
    return res.data;
  },

  async updateCategoryThreshold(payload: Record<string, any>) {
    const res = await this.put("/thresholds", payload);
    return res;
  },

  async getStaffPatients() {
    const res = await this.get("/staff/patients");
    const patients = res.data || [];
    return patients.map((p: any) => ({
      patient_id: p.Patient_ID,
      name: p.Name,
      email: p.Email,
      status: p.Status,
      healthcare_number: p.Healthcare_Number,
      date_of_birth: p.Date_Of_Birth,
      threshold_normal_low: p.Threshold_Normal_Low,
      threshold_normal_high: p.Threshold_Normal_High,
      profile_image: p.Profile_Image
    }));
  },

  async getStaffPatientDetails(patientId: number) {
    const res = await axiosInstance.get(`/staff/patients/${patientId}`);
    const data = extractData(res);
    const p = data.data;
    return {
      patient_id: p.Patient_ID,
      name: p.Name,
      email: p.Email,
      phone: p.Phone,
      profile_image: p.Profile_Image,
      status: p.Status,
      created_at: p.Created_At,
      healthcare_number: p.Healthcare_Number,
      date_of_birth: p.Date_Of_Birth,
      threshold_normal_low: p.Threshold_Normal_Low,
      threshold_normal_high: p.Threshold_Normal_High,
    };
  },

  async getStaffPatientReadings(patientId: number, filters: any = {}) {
    const res = await axiosInstance.get(`/staff/patients/${patientId}/readings`, { params: filters });
    const data = extractData(res);
    const readings = data.data || [];
    return readings.map((r: any) => ({
      reading_id: r.Reading_ID,
      patient_id: r.Patient_ID,
      datetime: r.DateTime,
      value: r.Value,
      unit: r.Unit,
      category: r.Category,
      food_notes: r.Food_Notes,
      activity_notes: r.Activity_Notes,
      notes: r.Notes,
      symptoms: r.Symptoms
    }));
  },

  async getStaffPatientFeedback(patientId: number) {
    const res = await axiosInstance.get(`/staff/patients/${patientId}/feedback`);
    const data = extractData(res);
    const feedbackList = data.data || [];
    return feedbackList.map((f: any) => ({
      feedback_id: f.Feedback_ID,
      specialist_id: f.Specialist_ID,
      patient_id: f.Patient_ID,
      content: f.Content,
      created_at: f.Created_At,
      specialist_name: f.Specialist_Name,
    }));
  },

  // alerts
  async getAlerts() {
    const currentUser = await authService.getCurrentUser(); // Await current user
    const userId = currentUser?.user_id;
    if (!userId) {
      console.warn("getAlerts failed: No user ID found.");
      return [];
    }
    const res = await axiosInstance.get("/patient/alerts", { params: { patient_id: userId } });
    const data = extractData(res);
    return data.data?.alerts || [];
  },

  async getPatientSuggestions() {
    const currentUser = await authService.getCurrentUser();
    const userId = currentUser?.user_id;
    if (!userId) {
      console.warn("getPatientSuggestions failed: No user ID found.");
      return [];
    }
    try {
      const res = await axiosInstance.get("/patient/suggestions", { params: { patient_id: userId } });
      const data = extractData(res);
      const suggestions = data.data?.suggestions || [];
      return suggestions.map((s: any) => ({
        suggestion_id: s.Suggestion_ID,
        patient_id: s.Patient_ID,
        content: s.Content,
        generated_at: s.Generated_At,
        based_on_pattern: s.Based_On_Pattern,
      }));
    } catch (err) {
      if (err instanceof Error) {
        console.warn("getPatientSuggestions fallback to empty array", err.message);
      } else {
        console.warn("getPatientSuggestions fallback to empty array", err);
      }
      return [];
    }
  },

  async generatePatientSuggestions() {
    const currentUser = await authService.getCurrentUser();
    const userId = currentUser?.user_id;
    if (!userId) {
      console.warn("generatePatientSuggestions failed: No user ID found.");
      return null;
    }
    try {
      const res = await axiosInstance.post("/patient/suggestions/generate", { patient_id: userId });
      return extractData(res);
    } catch (err) {
      if (err instanceof Error) {
        console.error("generatePatientSuggestions failed:", err.message);
      } else {
        console.error("generatePatientSuggestions failed:", err);
      }
      throw err;
    }
  },


  // specialist
  async getAssignedPatients() {
    const res = await axiosInstance.get("/specialist/patients");
    const data = extractData(res);
    const patients = data.data?.patients || [];
    return patients.map((p: any) => ({
      patient_id: p.Patient_ID,
      name: p.Name,
      healthcare_number: p.Healthcare_Number
    }));
  },

  async getSpecialistReadings(filters: any) {
    const res = await axiosInstance.get("/specialist/readings", { params: filters });
    const data = extractData(res);
    const readings = data.data?.readings || [];
    return readings.map((r: any) => ({
      reading_id: r.Reading_ID,
      patient_id: r.Patient_ID,
      patient_name: r.patient_name,
      datetime: r.DateTime,
      value: r.Value,
      unit: r.Unit,
      category: r.Category,
      food_notes: r.Food_Notes,
      activity_notes: r.Activity_Notes,
      notes: r.Notes,
      symptoms: r.Symptoms
    }));
  },

  // admin: report-related
  async getAllReadings(start: string, end: string): Promise<any[]> {
    const res = await axiosInstance.get("/admin/readings", { params: { start, end }});
    return extractData(res).data;
  },

  async getAIPatternAnalyses(start: string, end: string) {
    const res = await axiosInstance.get("/admin/analyses", { params: { start, end }});
    return extractData(res);
  },

  async getAdminAssignmentOptions() {
    const res = await axiosInstance.get("/admin/assignments/options");
    const data = extractData(res).data || {};
    return {
      specialists: (data.specialists || []).map((s: any) => ({
        specialist_id: s.Specialist_ID,
        name: s.Name,
        email: s.Email
      })),
      patients: (data.patients || []).map((p: any) => ({
        patient_id: p.Patient_ID,
        name: p.Patient_Name,
        email: p.Patient_Email
      }))
    };
  },

  async getAdminAssignments() {
    const res = await axiosInstance.get("/admin/assignments");
    const data = extractData(res).data || [];
    return data.map((item: any) => ({
      patient_id: item.Patient_ID,
      patient_name: item.Patient_Name,
      patient_email: item.Patient_Email,
      specialist_id: item.Specialist_ID,
      specialist_name: item.Specialist_Name,
      specialist_email: item.Specialist_Email,
      assigned_at: item.Assigned_At
    }));
  },

  async assignSpecialistToPatient(patientId: number, specialistId: number) {
    const res = await axiosInstance.post("/admin/assignments", { patient_id: patientId, specialist_id: specialistId });
    return extractData(res);
  },

  async unassignSpecialistFromPatient(patientId: number) {
    const res = await axiosInstance.delete(`/admin/assignments/${patientId}`);
    return extractData(res);
  },

  async saveReport(report: Record<string, any>) {
    const res = await axiosInstance.post("/admin/reports", report);
    return extractData(res);
  },

  // --- NEW GENERIC METHODS ---
  async get(endpoint: string, params?: any) {
    const res = await axiosInstance.get(endpoint, { params });
    return res.data; // Return the full backend response object
  },
  async post(endpoint: string, data: any, config?: any) {
    const res = await axiosInstance.post(endpoint, data, config);
    return res.data; // Return the full backend response object
  },
  async put(endpoint: string, data: any, config?: any) {
    const res = await axiosInstance.put(endpoint, data, config);
    return res.data; // Return the full backend response object
  },
  async delete(endpoint: string) {
    const res = await axiosInstance.delete(endpoint);
    return res.data; // Return the full backend response object
  }
};
