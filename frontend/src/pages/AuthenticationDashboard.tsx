import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";

const AuthenticationDashboard: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    if (!email || !password) {
      setError("Please enter both email and password.");
      setLoading(false);
      return;
    }

    try {
      const { token, user } = await authService.login(email, password);

      if (token) {
        console.log("Login successful, user:", user);
        alert(`Welcome back, ${user.name}!`);

        // Normalize role to lowercase and replace spaces with underscores
        const role = user.role?.toLowerCase().replace(" ", "_");

        // Role-based default route
        const roleDefaultRoute: { [key: string]: string } = {
          patient: "/dashboard",
          specialist: "/specialist",
          clinic_staff: "/staff",
          administrator: "/admin",
        };

        const redirectRoute = roleDefaultRoute[role] || "/login";
        console.log("Redirecting to:", redirectRoute);
        navigate(redirectRoute);
      } else {
        setError("Invalid email or password.");
      }
    } catch (err: any) {
      console.error("Login failed", err);
      setError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", textAlign: "center" }}>
      <h2>Login</h2>
      <div
        style={{ padding: 20, borderRadius: 12, boxShadow: "0 0 10px #ccc" }}
      >
        <div style={{ marginBottom: 16, textAlign: "left" }}>
          <label>Email</label>
          <input
            type="email"
            style={{ width: "100%", padding: 10, marginTop: 4 }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
          />
        </div>

        <div style={{ marginBottom: 16, textAlign: "left" }}>
          <label>Password</label>
          <input
            type="password"
            style={{ width: "100%", padding: 10, marginTop: 4 }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
          />
        </div>

        {error && <div style={{ color: "red", marginBottom: 12 }}>{error}</div>}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 8,
            fontWeight: 600,
            backgroundColor: "#2b7cff",
            color: "#fff",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </div>
    </div>
  );
};

export default AuthenticationDashboard;
