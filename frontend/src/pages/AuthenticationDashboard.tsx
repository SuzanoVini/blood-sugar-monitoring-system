import React, { useState } from "react";
import api from "../services/apiService";

interface AuthenticationDashboardProps {}

/**
 * AuthenticationDashboard - handles user login and authentication.
 */
const AuthenticationDashboard: React.FC<AuthenticationDashboardProps> = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const success = await api.login(email, password);
      if (success) {
        alert("Login successful!");
        window.location.href = "/dashboard"; // Adjust route as needed
      } else {
        setError("Invalid email or password.");
      }
    } catch (err) {
      console.error("Login failed", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h2 className="page-title">Login</h2>
      <div className="card" style={{ maxWidth: 400, margin: "0 auto" }}>
        <div>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
          />
        </div>
        <div style={{ marginTop: 12 }}>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
          />
        </div>
        {error && (
          <div style={{ color: "red", marginTop: 8 }}>{error}</div>
        )}
        <div style={{ marginTop: 16 }}>
          <button
            className="btn btn-primary"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthenticationDashboard;
