import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../utils/axiosConfig";
import "./AdminLogin.css";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (token) {
      // Verify token is valid
      axios.get("/api/admin/admin-users/me", {
        headers: { Authorization: `Bearer ${token}` }
      }).then(() => {
        navigate("/admin/dashboard");
      }).catch(() => {
        // Token invalid, clear it
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        localStorage.removeItem("adminPermissions");
      });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post("/api/admin/login", {
        email,
        password,
      });

      if (res.data && res.data.success && res.data.token) {
        // Store token and user info
        localStorage.setItem("adminToken", res.data.token);
        localStorage.setItem("adminUser", JSON.stringify(res.data.user));
        localStorage.setItem("adminPermissions", JSON.stringify(res.data.permissions));
        
        console.log("Admin login successful, redirecting...");
        window.location.href = "/admin/dashboard";
      } else {
        throw new Error(res.data?.message || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      const errorMessage = err.response?.data?.message || err.message || "Login failed";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login__container">
      <div className="admin-login__left">
        Welcome to <br /> Admin Panel
      </div>
      <div className="admin-login__right">
        <form className="admin-login__form" onSubmit={handleSubmit}>
          <h2>Admin Login</h2>
          <input
            type="email"
            placeholder="Email"
            required
            className="admin-login__input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            required
            className="admin-login__input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="admin-login__button" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
          {error && <p className="admin-login__error">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
