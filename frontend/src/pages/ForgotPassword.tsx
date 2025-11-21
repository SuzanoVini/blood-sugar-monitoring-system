import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleSubmit = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);

    if (!email) {
      setError("Please enter your email address.");
      setLoading(false);
      return;
    }

    try {
      const response = await authService.forgotPassword(email);
      setMessage(response.message);
    } catch (err: any) {
      if (import.meta.env.DEV) {
        console.error("Forgot password request failed", err);
      }
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", textAlign: "center" }}>
      <h2>Forgot Password</h2>
      <div
        style={{ padding: 20, borderRadius: 12, boxShadow: "0 0 10px #ccc" }}
      >
        <p style={{ marginBottom: 20 }}>
          Enter your email address and we'll send you a link to reset your password.
        </p>
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

        {error && <div style={{ color: "red", marginBottom: 12 }}>{error}</div>}
        {message && <div style={{ color: "green", marginBottom: 12 }}>{message}</div>}

        <button
          onClick={handleSubmit}
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
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
        <div style={{ marginTop: 16 }}>
          <a href="/login">Back to Login</a>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
