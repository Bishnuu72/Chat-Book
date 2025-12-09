import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const Signin = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Helper to set token with 7-day expiry
  const setTokenWithExpiry = (token, userId) => {
    const now = new Date();
    const expiry = now.getTime() + 7 * 24 * 60 * 60 * 1000;
    const data = { token, userId, expiry };
    localStorage.setItem("authData", JSON.stringify(data));
  };

  // Helper to remove expired token
  const removeExpiredToken = () => {
    const stored = localStorage.getItem("authData");
    if (!stored) return;
    const { expiry } = JSON.parse(stored);
    const now = new Date().getTime();
    if (now > expiry) {
      localStorage.removeItem("authData");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    removeExpiredToken();

    if (!form.email || !form.password) {
      setError("All fields are required");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Invalid credentials");
      } else {
        setTokenWithExpiry(data.token, data.userId);
        setSuccess("Login successful! Redirecting...");
        setTimeout(() => navigate("/home"), 1500);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to connect to server");
    }
  };

  return (
    <div className="signin">
      <div className="row">
        <div className="col-md-6">
          <div className="signin-details1">
            <h3>Welcome Back to Bishnu's Chat Book</h3>
            <p>Don't have an account?</p>
            <Link to="/" className="signUp-btn">
              Sign Up
            </Link>
          </div>
        </div>

        <div className="col-md-6">
          <div className="signin-details2">
            <h3>Sign In</h3>
            <form className="container cred-details" onSubmit={handleSubmit}>
              <div className="cred">
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
              </div>
              <div className="cred">
                <input
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                />
              </div>
              {error && <p style={{ color: "red" }}>{error}</p>}
              {success && <p style={{ color: "green" }}>{success}</p>}
              <div className="cred signup-btn">
                <button type="submit" className="signIn-btn">
                  Sign In
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signin;
