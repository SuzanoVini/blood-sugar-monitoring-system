/**
 * Minimal authService - keeps token in localStorage.
 * Replace with backend JWT exchange for production.
 */

const TOKEN_KEY = "bsm_token";

interface LoginResponse {
  token: string;
}

interface AuthService {
  login: (email: string, password: string) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  getToken: () => string | null;
  isAuthenticated: () => boolean;
}

const authService: AuthService = {
  login: async (email: string, password: string) => {
    // Replace with real server call; here we mock success for demo
    const fakeToken = "demo-token";
    localStorage.setItem(TOKEN_KEY, fakeToken);
    return { token: fakeToken };
  },

  logout: async () => {
    localStorage.removeItem(TOKEN_KEY);
  },

  getToken: () => localStorage.getItem(TOKEN_KEY),

  isAuthenticated: () => !!localStorage.getItem(TOKEN_KEY),
};

export default authService;
