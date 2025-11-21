// services/authService.ts
import axios from "axios";

const TOKEN_KEY = "bsm_token";

interface LoginResponse {
  token: string;
  user: any;
}

const authService = {
  register: async (userData: FormData): Promise<void> => {
    await axios.post("/api/auth/register", userData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await axios.post("/api/auth/login", { email, password });
    const { token, user } = response.data.data;
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }
    return { token, user };
  },

  logout: async (): Promise<void> => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      await axios.post(
        "/api/auth/logout",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    }
    localStorage.removeItem(TOKEN_KEY);
  },

  getCurrentUser: async (): Promise<any | null> => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      return null;
    }
    try {
      const response = await axios.get("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data?.data || null;
    } catch (error) {
      return null;
    }
  },

  getToken: () => localStorage.getItem(TOKEN_KEY),

  isAuthenticated: () => !!localStorage.getItem(TOKEN_KEY),

  forgotPassword: async (email: string): Promise<any> => {
    const response = await axios.post("/api/auth/forgot-password", { email });
    return response.data;
  },

  resetPassword: async (token: string, password: string): Promise<any> => {
    const response = await axios.post(`/api/auth/reset-password/${token}`, { password });
    return response.data;
  },
};

export default authService;
