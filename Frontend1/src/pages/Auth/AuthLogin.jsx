import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../utils/axiosConfig";
import "./AuthLogin.css";

const AuthLogin = () => {
  const navigate = useNavigate();
  const [loginMethod, setLoginMethod] = useState("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState("input");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  
  const otpRefs = useRef([]);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("authToken");
      if (token) {
        try {
          const response = await axios.get("/api/user/verify-token", {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.data.user) {
            const user = response.data.user;
            localStorage.setItem("user", JSON.stringify(user));
            if (user.isOnboardingComplete) {
              navigate("/student/dashboard");
            } else {
              navigate("/student/onboarding");
            }
          }
        } catch (err) {
          localStorage.removeItem("authToken");
          localStorage.removeItem("user");
        }
      }
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const sendOtp = async () => {
    setLoading(true);
    setError("");
    
    try {
      if (loginMethod === "phone") {
        if (!/^\d{10}$/.test(phone)) {
          setError("Please enter a valid 10-digit phone number");
          setLoading(false);
          return;
        }
        await axios.post("/api/auth/phone/send-otp", { phoneNumber: phone });
      } else {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          setError("Please enter a valid email address");
          setLoading(false);
          return;
        }
        await axios.post("/api/auth/email/send-email", { email });
      }
      
      setStep("otp");
      setSuccess("OTP sent successfully!");
      setResendTimer(30);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setError("Please enter complete 6-digit OTP");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let response;
      if (loginMethod === "phone") {
        response = await axios.post("/api/auth/phone/mobileVerify-otp", { 
          phoneNumber: phone, 
          otpCode 
        });
      } else {
        response = await axios.post("/api/auth/email/verify", { 
          email, 
          otpCode 
        });
      }

      if (response.data.token) {
        localStorage.setItem("authToken", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        
        setSuccess("Login successful!");
        
        setTimeout(() => {
          if (response.data.user?.isOnboardingComplete) {
            navigate("/student/dashboard");
          } else {
            navigate("/student/onboarding");
          }
        }, 500);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (resendTimer > 0) return;
    setOtp(["", "", "", "", "", ""]);
    await sendOtp();
  };

  return (
    <div className="auth-login-page">
      <div className="auth-login-container">
        <div className="auth-login-left">
          <div className="auth-brand">
            <img src="/tgLOGO.png" alt="TathaGat" className="auth-logo" />
            <h1>TathaGat</h1>
            <p className="auth-tagline">Your Gateway to Top B-Schools</p>
          </div>
          <div className="auth-features">
            <div className="auth-feature">
              <span className="feature-icon">📚</span>
              <span>Comprehensive CAT/XAT/SNAP Preparation</span>
            </div>
            <div className="auth-feature">
              <span className="feature-icon">🎯</span>
              <span>Mock Tests with Detailed Analysis</span>
            </div>
            <div className="auth-feature">
              <span className="feature-icon">👨‍🏫</span>
              <span>Expert Faculty with IIM Background</span>
            </div>
            <div className="auth-feature">
              <span className="feature-icon">📊</span>
              <span>Track Your Progress in Real-time</span>
            </div>
          </div>
        </div>

        <div className="auth-login-right">
          <div className="auth-form-container">
            <h2>{step === "input" ? "Welcome Back" : "Verify OTP"}</h2>
            <p className="auth-subtitle">
              {step === "input" 
                ? "Sign in to continue your preparation journey" 
                : `Enter the 6-digit code sent to ${loginMethod === "phone" ? `+91 ${phone.slice(0,5)}XXXXX` : email}`
              }
            </p>

            {error && <div className="auth-error">{error}</div>}
            {success && <div className="auth-success">{success}</div>}

            {step === "input" ? (
              <>
                <div className="auth-method-tabs">
                  <button 
                    className={`method-tab ${loginMethod === "phone" ? "active" : ""}`}
                    onClick={() => { setLoginMethod("phone"); setError(""); }}
                  >
                    Phone Number
                  </button>
                  <button 
                    className={`method-tab ${loginMethod === "email" ? "active" : ""}`}
                    onClick={() => { setLoginMethod("email"); setError(""); }}
                  >
                    Email
                  </button>
                </div>

                {loginMethod === "phone" ? (
                  <div className="auth-input-group">
                    <label>Phone Number</label>
                    <div className="phone-input-wrapper">
                      <span className="country-code">+91</span>
                      <input
                        type="tel"
                        placeholder="Enter 10-digit number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        maxLength={10}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="auth-input-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                )}

                <button 
                  className="auth-submit-btn"
                  onClick={sendOtp}
                  disabled={loading}
                >
                  {loading ? "Sending OTP..." : "Get OTP"}
                </button>
              </>
            ) : (
              <>
                <div className="otp-input-group">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={el => otpRefs.current[index] = el}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="otp-input"
                    />
                  ))}
                </div>

                <button 
                  className="auth-submit-btn"
                  onClick={verifyOtp}
                  disabled={loading}
                >
                  {loading ? "Verifying..." : "Verify & Login"}
                </button>

                <div className="resend-section">
                  <p>Didn't receive the code?</p>
                  <button 
                    className="resend-btn"
                    onClick={resendOtp}
                    disabled={resendTimer > 0}
                  >
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
                  </button>
                </div>

                <button 
                  className="back-btn"
                  onClick={() => { setStep("input"); setOtp(["", "", "", "", "", ""]); setError(""); }}
                >
                  ← Change {loginMethod === "phone" ? "Phone Number" : "Email"}
                </button>
              </>
            )}

            <div className="auth-terms">
              By continuing, you agree to our <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLogin;
