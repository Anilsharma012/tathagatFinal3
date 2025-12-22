import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../../utils/axiosConfig";
import "./StudentOnboarding.css";

const StudentOnboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    email: "",
    gender: "",
    dob: "",
    selectedCategory: "",
    selectedExam: "",
    targetYear: "",
    city: "",
    state: ""
  });

  const examCategories = [
    { id: "MBA", name: "MBA Entrance", icon: "🎓" },
    { id: "After12", name: "After 12th", icon: "📚" },
    { id: "GMAT", name: "GMAT/GRE", icon: "🌍" },
    { id: "Govt", name: "Govt Exams", icon: "🏛️" }
  ];

  const examTypes = {
    MBA: ["CAT", "XAT", "SNAP", "MAT", "CMAT", "NMAT", "IIFT"],
    After12: ["CUET", "IPMAT", "NPAT", "SET"],
    GMAT: ["GMAT", "GRE"],
    Govt: ["UPSC", "SSC", "Bank PO", "RBI Grade B"]
  };

  const states = [
    "Delhi", "Maharashtra", "Karnataka", "Tamil Nadu", "Uttar Pradesh",
    "Gujarat", "West Bengal", "Rajasthan", "Kerala", "Telangana",
    "Andhra Pradesh", "Madhya Pradesh", "Bihar", "Punjab", "Haryana"
  ];

  const targetYears = ["2025", "2026", "2027", "2028"];

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        navigate("/auth/login");
        return;
      }

      try {
        const response = await axios.get("/api/user/verify-token", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const user = response.data.user;
        if (user.isOnboardingComplete) {
          navigate("/student/dashboard");
          return;
        }

        setFormData(prev => ({
          ...prev,
          name: user.name || "",
          phoneNumber: user.phoneNumber || "",
          email: user.email || "",
          gender: user.gender || "",
          dob: user.dob || "",
          selectedCategory: user.selectedCategory || "",
          selectedExam: user.selectedExam || "",
          targetYear: user.targetYear || "",
          city: user.city || "",
          state: user.state || ""
        }));
      } catch (err) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        navigate("/auth/login");
      }
    };
    
    checkAuth();
  }, [navigate]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError("");
  };

  const validateStep = () => {
    if (step === 1) {
      if (!formData.name.trim()) {
        setError("Please enter your full name");
        return false;
      }
      if (!formData.gender) {
        setError("Please select your gender");
        return false;
      }
      if (!formData.dob) {
        setError("Please enter your date of birth");
        return false;
      }
    } else if (step === 2) {
      if (!formData.selectedCategory) {
        setError("Please select an exam category");
        return false;
      }
      if (!formData.selectedExam) {
        setError("Please select your target exam");
        return false;
      }
      if (!formData.targetYear) {
        setError("Please select your target year");
        return false;
      }
    } else if (step === 3) {
      if (!formData.city.trim()) {
        setError("Please enter your city");
        return false;
      }
      if (!formData.state) {
        setError("Please select your state");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.post(
        "/api/user/update-details",
        {
          ...formData,
          isOnboardingComplete: true
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Handle account merge - new token provided
      if (response.data.merged && response.data.token) {
        localStorage.setItem("authToken", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.data));
        navigate(response.data.redirectTo || "/student/dashboard");
        return;
      }

      const updatedUser = {
        ...JSON.parse(localStorage.getItem("user") || "{}"),
        ...formData,
        isOnboardingComplete: true
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      
      navigate("/student/dashboard");
    } catch (err) {
      setError(err.response?.data?.msg || err.response?.data?.message || "Failed to save details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-container">
        <div className="onboarding-header">
          <img src="/tgLOGO.png" alt="TathaGat" className="onboarding-logo" />
          <h1>Complete Your Profile</h1>
          <p>Help us personalize your learning experience</p>
        </div>

        <div className="progress-bar">
          <div className="progress-steps">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`progress-step ${step >= s ? "active" : ""} ${step > s ? "completed" : ""}`}>
                <div className="step-circle">
                  {step > s ? "✓" : s}
                </div>
                <span className="step-label">
                  {s === 1 ? "Basic Info" : s === 2 ? "Exam Preferences" : "Location"}
                </span>
              </div>
            ))}
          </div>
          <div className="progress-line">
            <div className="progress-fill" style={{ width: `${((step - 1) / 2) * 100}%` }}></div>
          </div>
        </div>

        {error && <div className="onboarding-error">{error}</div>}

        <div className="onboarding-form">
          {step === 1 && (
            <div className="form-step">
              <h2>Tell us about yourself</h2>
              
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    disabled
                    className="disabled-input"
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    placeholder="Enter email (optional)"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Gender *</label>
                <div className="gender-options">
                  {["Male", "Female", "Other"].map((g) => (
                    <button
                      key={g}
                      type="button"
                      className={`gender-btn ${formData.gender === g ? "active" : ""}`}
                      onClick={() => handleChange("gender", g)}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Date of Birth *</label>
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => handleChange("dob", e.target.value)}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="form-step">
              <h2>What are you preparing for?</h2>
              
              <div className="form-group">
                <label>Exam Category *</label>
                <div className="category-grid">
                  {examCategories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      className={`category-card ${formData.selectedCategory === cat.id ? "active" : ""}`}
                      onClick={() => {
                        handleChange("selectedCategory", cat.id);
                        handleChange("selectedExam", "");
                      }}
                    >
                      <span className="category-icon">{cat.icon}</span>
                      <span className="category-name">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {formData.selectedCategory && (
                <div className="form-group">
                  <label>Target Exam *</label>
                  <div className="exam-chips">
                    {examTypes[formData.selectedCategory]?.map((exam) => (
                      <button
                        key={exam}
                        type="button"
                        className={`exam-chip ${formData.selectedExam === exam ? "active" : ""}`}
                        onClick={() => handleChange("selectedExam", exam)}
                      >
                        {exam}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Target Year *</label>
                <div className="year-chips">
                  {targetYears.map((year) => (
                    <button
                      key={year}
                      type="button"
                      className={`year-chip ${formData.targetYear === year ? "active" : ""}`}
                      onClick={() => handleChange("targetYear", year)}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="form-step">
              <h2>Where are you located?</h2>
              
              <div className="form-group">
                <label>City *</label>
                <input
                  type="text"
                  placeholder="Enter your city"
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>State *</label>
                <select
                  value={formData.state}
                  onChange={(e) => handleChange("state", e.target.value)}
                >
                  <option value="">Select State</option>
                  {states.map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="onboarding-actions">
          {step > 1 && (
            <button className="back-btn" onClick={handleBack}>
              ← Back
            </button>
          )}
          <button 
            className="next-btn" 
            onClick={handleNext}
            disabled={loading}
          >
            {loading ? "Saving..." : step === 3 ? "Complete Setup" : "Continue →"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentOnboarding;
