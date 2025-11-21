import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    healthcareNumber: "",
    dateOfBirth: "",
    phone: "",
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setProfileImage(e.target.files[0]);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    setError(null);

    if (
      !formData.name ||
      !formData.email ||
      !formData.password ||
      !formData.healthcareNumber ||
      !formData.dateOfBirth
    ) {
      setError("Please fill out all required fields.");
      setLoading(false);
      return;
    }

    const data = new FormData();
    data.append("name", formData.name);
    data.append("email", formData.email);
    data.append("password", formData.password);
    data.append("healthcareNumber", formData.healthcareNumber);
    data.append("dateOfBirth", formData.dateOfBirth);
    data.append("phone", formData.phone);
    if (profileImage) {
      data.append("profileImage", profileImage);
    }

    try {
      await authService.register(data);
      alert("Registration successful!");
      navigate("/login");
    } catch (err: any) {
      if (import.meta.env.DEV) {
        console.error("Registration failed", err);
      }
      setError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", textAlign: "center" }}>
      <h2>Patient Registration</h2>
      <div
        style={{ padding: 20, borderRadius: 12, boxShadow: "0 0 10px #ccc" }}
      >
        <div style={{ marginBottom: 16, textAlign: "left" }}>
          <label>Name</label>
          <input
            type="text"
            name="name"
            style={{ width: "100%", padding: 10, marginTop: 4 }}
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter your name"
          />
        </div>

        <div style={{ marginBottom: 16, textAlign: "left" }}>
          <label>Email</label>
          <input
            type="email"
            name="email"
            style={{ width: "100%", padding: 10, marginTop: 4 }}
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
          />
        </div>

        <div style={{ marginBottom: 16, textAlign: "left" }}>
          <label>Password</label>
          <input
            type="password"
            name="password"
            style={{ width: "100%", padding: 10, marginTop: 4 }}
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
          />
        </div>

        <div style={{ marginBottom: 16, textAlign: "left" }}>
          <label>Health Care Number</label>
          <input
            type="text"
            name="healthcareNumber"
            style={{ width: "100%", padding: 10, marginTop: 4 }}
            value={formData.healthcareNumber}
            onChange={handleChange}
            placeholder="Enter your health care number"
          />
        </div>

        <div style={{ marginBottom: 16, textAlign: "left" }}>
          <label>Date of Birth</label>
          <input
            type="date"
            name="dateOfBirth"
            style={{ width: "100%", padding: 10, marginTop: 4 }}
            value={formData.dateOfBirth}
            onChange={handleChange}
          />
        </div>

        <div style={{ marginBottom: 16, textAlign: "left" }}>
          <label>Phone Number</label>
          <input
            type="text"
            name="phone"
            style={{ width: "100%", padding: 10, marginTop: 4 }}
            value={formData.phone}
            onChange={handleChange}
            placeholder="Enter your phone number"
          />
        </div>

        <div style={{ marginBottom: 16, textAlign: "left" }}>
          <label>Profile Image (Optional)</label>
          <input
            type="file"
            name="profileImage"
            style={{ width: "100%", padding: 10, marginTop: 4 }}
            onChange={handleFileChange}
          />
        </div>

        {error && <div style={{ color: "red", marginBottom: 12 }}>{error}</div>}

        <button
          onClick={handleRegister}
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
          {loading ? "Registering..." : "Register"}
        </button>
      </div>
    </div>
  );
};

export default Register;
