import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import authService from "../services/authService";

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);

    if (!password || !confirmPassword) {
      setError("Please enter and confirm your new password.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    if (!token) {
      setError("Password reset token is missing.");
      setLoading(false);
      return;
    }

    try {
      const response = await authService.resetPassword(token, password);
      setMessage(response.message);
      setTimeout(() => {
        navigate("/login");
      }, 3000); // Redirect to login after 3 seconds
    } catch (err: any) {
      if (import.meta.env.DEV) {
        console.error("Password reset failed", err);
      }
      setError(err.response?.data?.message || "Invalid or expired token. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", textAlign: "center" }}>
      <h2>Reset Password</h2>
      <div
        style={{ padding: 20, borderRadius: 12, boxShadow: "0 0 10px #ccc" }}
      >
        <p style={{ marginBottom: 20 }}>
          Enter your new password below.
        </p>
        <div style={{ marginBottom: 16, textAlign: "left" }}>
          <label>New Password</label>
          <input
            type="password"
            style={{ width: "100%", padding: 10, marginTop: 4 }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter new password"
          />
        </div>

        <div style={{ marginBottom: 16, textAlign: "left" }}>
          <label>Confirm New Password</label>
          <input
            type="password"
            style={{ width: "100%", padding: 10, marginTop: 4 }}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
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
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </div>
    </div>
  );
};

export default ResetPassword;
