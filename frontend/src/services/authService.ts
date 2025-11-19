// services/authService.ts
import axios from "axios";

const TOKEN_KEY = "bsm_token";

interface LoginResponse {
  token: string;
  user: any;
}

const authService = {
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

  getCurrentUser: (): any | null => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    try {
      const payload = token.split(".")[1];
      const decoded = JSON.parse(atob(payload));
      return decoded;
    } catch (error) {
      console.error("Failed to decode current user from token:", error);
      return null;
    }
  },

  getToken: () => localStorage.getItem(TOKEN_KEY),

  isAuthenticated: () => !!localStorage.getItem(TOKEN_KEY),

  getUserIdFromToken: (): number | null => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return decoded.user_id || decoded.userId || null;
    } catch (err) {
      console.error("Failed to decode token:", err);
      return null;
    }
  },
};

export default authService;
