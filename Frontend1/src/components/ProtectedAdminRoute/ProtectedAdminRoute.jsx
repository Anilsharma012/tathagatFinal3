import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import axios from "../../utils/axiosConfig";

const ProtectedAdminRoute = ({ children, requiredPermission }) => {
  const [authState, setAuthState] = useState("loading");
  const [permissions, setPermissions] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem("adminToken");
      
      if (!token) {
        setAuthState("unauthorized");
        return;
      }

      try {
        const response = await axios.get("/api/admin/admin-users/me", {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          setPermissions(response.data.permissions);
          localStorage.setItem("adminPermissions", JSON.stringify(response.data.permissions));
          localStorage.setItem("adminUser", JSON.stringify(response.data.user));
          setAuthState("authorized");
        } else {
          throw new Error("Invalid response");
        }
      } catch (error) {
        console.error("Auth verification failed:", error);
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        localStorage.removeItem("adminPermissions");
        setAuthState("unauthorized");
      }
    };

    verifyAuth();
  }, [location.pathname]);

  if (authState === "loading") {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh",
        background: "#f5f5f5"
      }}>
        <div style={{ textAlign: "center" }}>
          <div className="spinner" style={{
            width: "40px",
            height: "40px",
            border: "4px solid #e0e0e0",
            borderTop: "4px solid #0d9488",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 16px"
          }}></div>
          <p style={{ color: "#666" }}>Verifying access...</p>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (authState === "unauthorized") {
    return <Navigate to="/admin" state={{ from: location }} replace />;
  }

  if (requiredPermission && permissions) {
    const [module, action] = requiredPermission.split(".");
    const modulePerms = permissions[module];
    if (!modulePerms || !modulePerms[action || "view"]) {
      return (
        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center", 
          height: "100vh",
          background: "#f5f5f5"
        }}>
          <div style={{ 
            textAlign: "center",
            padding: "40px",
            background: "white",
            borderRadius: "8px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
          }}>
            <h2 style={{ color: "#dc2626", marginBottom: "16px" }}>Access Denied</h2>
            <p style={{ color: "#666" }}>You don't have permission to access this page.</p>
            <button 
              onClick={() => window.history.back()}
              style={{
                marginTop: "20px",
                padding: "10px 24px",
                background: "#0d9488",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer"
              }}
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
  }

  return children;
};

export default ProtectedAdminRoute;
