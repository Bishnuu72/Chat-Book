import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const Signup = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.fullName || !form.email || !form.password || !form.confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          password: form.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Something went wrong");
      } else {
        setSuccess("Registration successful! Redirecting to Sign In...");
        setTimeout(() => navigate("/signin"), 1500);
      }
    } catch (err) {
      setError("Failed to connect to server");
      console.error(err);
    }
  };

  return (
    <div className="signup">
      <div className="row">
        <div className="col-md-6">
          <div className="signup-details1">
            <h3>Sign Up</h3>
            <form className="container cred-details" onSubmit={handleSubmit}>
              <div className="cred">
                <input
                  type="text"
                  name="fullName"
                  placeholder="Enter your name"
                  value={form.fullName}
                  onChange={handleChange}
                />
              </div>
              <div className="cred">
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={handleChange}
                />
              </div>
              <div className="cred">
                <input
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                />
              </div>
              <div className="cred">
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                />
              </div>
              {error && <p style={{ color: "red" }}>{error}</p>}
              {success && <p style={{ color: "green" }}>{success}</p>}
              <div className="cred signup-btn">
                <button type="submit" className="signUp-btn">
                  Sign Up
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="col-md-6">
          <div className="signup-details2">
            <h3>Hello! Welcome to Bishnu's Chat Book</h3>
            <p>Already have an account?</p>
            <Link to="/signin" className="signIn-btn">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
