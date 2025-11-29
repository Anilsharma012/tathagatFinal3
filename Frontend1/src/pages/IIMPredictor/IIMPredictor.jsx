import React, { useState, useEffect } from "react";
import "./IIMPredictor.css"; // Importing CSS for styling
import axios from "axios"; // ✅ Import Axios
import { useNavigate } from "react-router-dom";
import IIMPredictionpage from "../../subpages/IIMPredictionPage/IIMPredictionpage";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import jsPDF from "jspdf";

const IIMPredictor = () => {
  const [link, setLink] = useState("");
  // const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  // const [userDetails, setUserDetails] = useState(null);
  // const [htmlContent, setHtmlContent] = useState(null); // ✅ Store HTML for response sheet
  const navigate = useNavigate();
  const [fullHtml, setFullHtml] = useState(""); // ✅ Store full HTML content
  const [questions, setQuestions] = useState([]); // ✅ Store Questions
  const [score, setScore] = useState(null); // ✅ Store Score Data

  const user = JSON.parse(localStorage.getItem("user")); // ✅ Extract User Data
  const userId = user?.id; // ✅ Get userId safely

  const [formData, setFormData] = useState({
    category: "",
    gender: "",
    tenthPercentage: "",
    twelfthPercentage: "",
    discipline: "",
    degree: "",
    graduationPercentage: "",
    workExperience: "",
    takenCAT: "",
    catYear: "",
    interestedCourses: [],
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        interestedCourses: Array.isArray(prev.interestedCourses)
          ? checked
            ? [...prev.interestedCourses, value]
            : prev.interestedCourses.filter((course) => course !== value)
          : [value], // ✅ Ensure it remains an array
      }));
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      alert("⚠️ Please login to submit your details!");
      localStorage.setItem("redirectAfterLogin", "/iim-results");
      localStorage.setItem("formData", JSON.stringify(formData));
      navigate("/login");
      return;
    }

    // Get userId - check both id and _id since different login methods may use different keys
    const userIdValue = user.id || user._id;
    
    if (!userIdValue) {
      alert("⚠️ Session expired. Please login again!");
      navigate("/login");
      return;
    }

    const requestData = {
      userId: userIdValue,
      category: formData.category,
      gender: formData.gender,
      classX: formData.tenthPercentage,
      classXII: formData.twelfthPercentage,
      discipline: formData.discipline,
      graduation: formData.degree,
      gradPercentage: formData.graduationPercentage,
      workExperience: formData.workExperience,
      takenCATBefore: formData.takenCAT,
      catYear: formData.catYear,
      interestedCourses: formData.interestedCourses,
    };

    try {
      setLoading(true);
      console.log("🔍 Submitting Data:", requestData); // ✅ Debugging

      const response = await axios.post(
        "/api/v2/iim-predictor",
        requestData
      );

      console.log("✅ API Response:", response.data); // ✅ Debugging

      setLoading(false);

      if (response.status === 200 || response.status === 201) {
        alert("✅ Form Submitted Successfully!");
        localStorage.setItem(
          `iim-predictor-${userIdValue}`,
          JSON.stringify(response.data)
        );

        console.log("Navigating to:", `/iim-results/${userIdValue}`);
        navigate(`/iim-results/${userIdValue}`);
      }
    } catch (error) {
      setLoading(false);
      console.error(
        "❌ Error submitting form:",
        error.response?.data || error.message
      );
      alert("❌ Submission failed. Please try again.");
    }
  };

  useEffect(() => {
    if (!userId) return;

    const storedData = localStorage.getItem(`iim-predictor-${userId}`);
    if (storedData) {
      setFormData(JSON.parse(storedData)); // ✅ Restore saved form data
    }
  }, [userId]);

  // const handleFileChange = (e) => {
  //   setFile(e.target.files[0]);
  // };

  const handleSearch = async () => {
    if (!link) {
        toast.error("⚠️ Please provide a valid link.");
        return;
    }

    setLoading(true);
    toast.info("🔄 Fetching response sheet... This may take a moment.");
    
    try {
        const response = await axios.post("/api/v3/fetch-questions", { link }, {
            timeout: 90000, // 90 second timeout for external URL fetch
        });

        if (response.data.fullHtmlContent) {
            setFullHtml(response.data.fullHtmlContent);
        }

        if (response.data.questions && response.data.questions.length > 0) {
            setQuestions([...response.data.questions]);
            console.log("✅ Fetched Questions:", response.data.questions);
            toast.success("✅ Response sheet fetched successfully!");
        } else {
            console.warn("⚠️ No questions found in API response.");
            toast.warning("⚠️ Response sheet loaded but no questions found. Check if the link is correct.");
        }
    } catch (error) {
        console.error("❌ Error fetching data:", error);
        
        // Show helpful error message
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
            toast.error("⏱️ Request timed out. The server is slow. Please try again.");
        } else if (error.response?.data?.code === 'TIMEOUT') {
            toast.error("⏱️ " + (error.response?.data?.error || "Server timeout. Please try again."));
        } else if (error.response?.data?.code === 'ACCESS_DENIED') {
            toast.error("🚫 " + (error.response?.data?.error || "Access denied. Link may have expired."));
        } else if (error.response?.data?.code === 'NOT_FOUND') {
            toast.error("🔍 " + (error.response?.data?.error || "Response sheet not found. Link may have expired."));
        } else if (error.response?.data?.error) {
            toast.error("❌ " + error.response.data.error);
        } else {
            toast.error("❌ Failed to fetch response sheet. Please check the link and try again.");
        }
    }
    setLoading(false);
};


  
const calculateScore = () => {
  console.log("📌 Current Questions Before Analysis:", questions); 

  if (!questions || questions.length === 0) {
      toast.error("⚠️ No questions available to analyze.");
      return;
  }

  let attempted = 0, unattempted = 0;
  const totalQuestions = questions.length;

  questions.forEach(q => {
      console.log("🔍 Checking Question:", q);
      console.log("📋 Status:", q.status);

      // Check if status field is "answered" (case-insensitive)
      const status = (q.status || "").toLowerCase().trim();
      
      if (status === "answered" || status.includes("answered")) {
          // Only count as attempted if status is exactly "answered"
          // "not answered" will NOT match because we check exact match first
          if (status === "answered") {
              attempted++;
          } else if (status.includes("not answered")) {
              unattempted++;
          } else if (status.includes("answered")) {
              // Handle cases like "answered and marked for review"
              attempted++;
          } else {
              unattempted++;
          }
      } else {
          // Not answered, marked for review only, or empty status
          unattempted++;
      }
  });

  // Calculate attempt percentage
  const attemptPercentage = totalQuestions > 0 ? ((attempted / totalQuestions) * 100).toFixed(1) : 0;

  setScore({ 
    totalQuestions, 
    attempted, 
    unattempted, 
    attemptPercentage 
  });

  console.log("✅ Attempt Analysis:", { totalQuestions, attempted, unattempted, attemptPercentage });
  toast.success("✅ Attempt analysis completed!");
};

const downloadScorecard = () => {
    if (!score) {
      toast.error("⚠️ Please analyze attempts first!");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header background
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, pageWidth, 45, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("TathaGat", pageWidth / 2, 20, { align: "center" });
    
    doc.setFontSize(14);
    doc.text("CMAT/CAT Response Sheet - Attempt Analysis", pageWidth / 2, 35, { align: "center" });

    // Date
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const today = new Date().toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
    doc.text(`Date: ${today}`, 20, 60);

    // Analysis Card Box
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(1);
    doc.roundedRect(20, 70, pageWidth - 40, 95, 5, 5, 'S');

    // Analysis Details Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Attempt Analysis Summary", pageWidth / 2, 85, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    
    // Total Questions - Blue
    doc.setTextColor(37, 99, 235);
    doc.text(`Total Questions:`, 30, 105);
    doc.setFont("helvetica", "bold");
    doc.text(`${score.totalQuestions}`, 130, 105);

    // Attempted Questions - Green
    doc.setFont("helvetica", "normal");
    doc.setTextColor(34, 139, 34);
    doc.text(`Attempted Questions:`, 30, 120);
    doc.setFont("helvetica", "bold");
    doc.text(`${score.attempted}`, 130, 120);

    // Unattempted Questions - Gray
    doc.setFont("helvetica", "normal");
    doc.setTextColor(108, 117, 125);
    doc.text(`Unattempted Questions:`, 30, 135);
    doc.setFont("helvetica", "bold");
    doc.text(`${score.unattempted}`, 130, 135);

    // Attempt Percentage - Purple/Indigo
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(99, 102, 241);
    doc.text(`Attempt %:`, 30, 155);
    doc.setFontSize(20);
    doc.text(`${score.attemptPercentage}%`, 130, 155);

    // Note
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.text("Note: This analysis shows attempt statistics only. Answer key not available.", pageWidth / 2, 180, { align: "center" });

    // Footer
    doc.setFillColor(240, 240, 240);
    doc.rect(0, 270, pageWidth, 30, 'F');
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.text("Generated by TathaGat - Leaders in Aptitude Test Prep", pageWidth / 2, 280, { align: "center" });
    doc.text("www.tathagat.co.in | +91 9205534439", pageWidth / 2, 290, { align: "center" });

    // Save PDF
    doc.save(`TathaGat_Attempt_Analysis_${today.replace(/\s/g, '_')}.pdf`);
    toast.success("✅ Attempt analysis downloaded successfully!");
  };

  const handlePrint = () => {
    const printContent = document.querySelector(".response-sheet");
    
    if (!printContent) {
        toast.error("⚠️ No response sheet available to print.");
        return;
    }

    const printWindow = window.open("", "", "width=900,height=700");
    
    const printStyles = `
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          color: #000;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        th, td {
          border: 1px solid #333;
          padding: 10px;
          text-align: left;
        }
        th {
          background-color: #007bff;
          color: white;
        }
        tr:nth-child(even) {
          background-color: #f2f2f2;
        }
        img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 10px auto;
        }
        .question {
          font-size: 16px;
          font-weight: bold;
          margin-top: 15px;
        }
        @media print {
          img {
            max-width: 100% !important;
            page-break-inside: avoid;
          }
          table {
            page-break-inside: avoid;
          }
        }
      </style>
    `;

    printWindow.document.write(`
      <html>
        <head>
          <title>Response Sheet - TathaGat</title>
          ${printStyles}
        </head>
        <body>
          <h2 style="text-align: center; color: #007bff;">📜 CMAT/CAT Response Sheet</h2>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();

    // Wait for all images to load before printing
    const images = printWindow.document.querySelectorAll('img');
    let loadedImages = 0;
    const totalImages = images.length;

    if (totalImages === 0) {
      // No images, print directly
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 500);
    } else {
      images.forEach((img) => {
        if (img.complete) {
          loadedImages++;
          if (loadedImages === totalImages) {
            setTimeout(() => {
              printWindow.focus();
              printWindow.print();
            }, 500);
          }
        } else {
          img.onload = () => {
            loadedImages++;
            if (loadedImages === totalImages) {
              setTimeout(() => {
                printWindow.focus();
                printWindow.print();
              }, 500);
            }
          };
          img.onerror = () => {
            loadedImages++;
            if (loadedImages === totalImages) {
              setTimeout(() => {
                printWindow.focus();
                printWindow.print();
              }, 500);
            }
          };
        }
      });

      // Fallback: Print after 3 seconds if images don't load
      setTimeout(() => {
        if (loadedImages < totalImages) {
          printWindow.focus();
          printWindow.print();
        }
      }, 3000);
    }

    toast.success("✅ Print window opened!");
};

  return (
    <div>
      <div className="predictor-container">
        <h2 className="predictor-heading">
          📜 CMAT/CAT Response Sheet Checker
        </h2>

        {/* ✅ Input for Response Sheet Link */}
        <input
        className="MainInput"
          type="text"
          placeholder="Paste response sheet link"
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />

       

        {/* ✅ Search Button */}
        <button onClick={handleSearch} disabled={loading}>
          {loading ? "Fetching..." : "Check Response Sheet"}
        </button>

        {/* ✅ Print Button to Download the Response Sheet */}
         <button onClick={handlePrint} className="print-btn">Print</button>


        {/* ✅ Display Full Response Sheet (With Images & Tables) */}
        {fullHtml && (
          <div
            className="response-sheet"
            dangerouslySetInnerHTML={{ __html: fullHtml }}
          />
        )}

        {/* ✅ Calculate Score Button */}
        <button onClick={calculateScore}>Calculate Score</button>

        {/* ✅ Show Scorecard Section - Attempt Analysis */}
        {score && (
    <div className="scorecard-section">
        <h3>📊 Scorecard</h3>
        <p className="score-row total-questions">📋 Total Questions: <strong>{score.totalQuestions}</strong></p>
        <p className="score-row attempted">✅ Attempted Questions: <strong>{score.attempted}</strong></p>
        <p className="score-row unattempted">➖ Unattempted Questions: <strong>{score.unattempted}</strong></p>
        <p className="score-row attempt-percent">📈 Attempt %: <strong>{score.attemptPercentage}%</strong></p>

        {/* ✅ Download Scorecard Button */}
        <button onClick={downloadScorecard}>Download Scorecard</button>
    </div>
)}
        <ToastContainer />
      </div>




      <div className="IIM-container">
      <h1>Lets Take Test </h1>
      <p>Test your percentile with our online mock exam.</p>
      <button className="ExamButton" onClick={() => navigate("/exam")}>Start Exam</button>
    </div>






      <div className="predictor-container">
        <h2 className="predictor-heading">LET'S PREDICT YOUR MBA COLLEGE</h2>
        <form className="predictor-form" onSubmit={handleSubmit}>
          {/* Personal Information */}
          <div className="form-group">
            <label>PERSONAL INFORMATION</label>
            <select
              name="category"
              onChange={handleChange}
              value={formData.category}
            >
              <option value="">Category (e.g. OBC)</option>
              <option value="General">General</option>
              <option value="OBC">OBC</option>
              <option value="SC/ST">SC/ST</option>
            </select>
            <select
              name="gender"
              onChange={handleChange}
              value={formData.gender}
            >
              <option value="">Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label></label>
            <select
              name="discipline"
              onChange={handleChange}
              value={formData.discipline}
            >
              <option value="">Discipline (e.g. Science)</option>
              <option value="BBA">Science</option>
              <option value="BCom">Commerce</option>
              <option value="Engineering">Arts</option>
            </select>

            <input
              type="text"
              name="tenthPercentage"
              placeholder=" 10th Percentage (e.g. 98.72)"
              onChange={handleChange}
              value={formData.tenthPercentage}
            />
            <input
              type="text"
              name="twelfthPercentage"
              placeholder=" 12th Percentage (e.g. 98.72)"
              onChange={handleChange}
              value={formData.twelfthPercentage}
            />
          </div>

          {/* Graduation Details */}
          <div className="form-group">
            <label>GRADUATION</label>
            <select
              name="degree"
              onChange={handleChange}
              value={formData.degree}
            >
              <option value="">Degree (e.g. BBA)</option>
              <option value="BBA">BBA</option>
              <option value="BCom">B.Com</option>
              <option value="Engineering">Engineering</option>
            </select>
            <input
              type="text"
              name="graduationPercentage"
              placeholder="Graduation Percentage (e.g. 98.72)"
              onChange={handleChange}
              value={formData.graduationPercentage}
            />
            <input
              type="text"
              name="workExperience"
              placeholder="Enter in Months (0 if no work ex)"
              onChange={handleChange}
              value={formData.workExperience}
            />
          </div>

          {/* CAT Exam Details */}
          <div className="form-group">
            <label>HAVE YOU TAKEN CAT BEFORE?</label>
            <select
              name="takenCAT"
              onChange={handleChange}
              value={formData.takenCAT}
            >
              <option value="">Select (i.e. Yes)</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
            <select
              name="catYear"
              onChange={handleChange}
              value={formData.catYear}
            >
              <option value="">Select Year (i.e. 2024)</option>
              <option value="2022">2022</option>
              <option value="2023">2023</option>
              <option value="2024">2024</option>
            </select>
          </div>

          {/* Course Interest Section */}
          <div className="form-group radio-group">
            <label>INTERESTED IN IQUANTA CAT/MBA COURSE?</label>
            <label>
              <input
                type="radio"
                name="interested"
                value="Yes"
                onChange={handleChange}
              />{" "}
              Yes
            </label>
            <label>
              <input
                type="radio"
                name="interested"
                value="No"
                onChange={handleChange}
              />{" "}
              No
            </label>
          </div>

          {/* Course Selection */}
          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                name="interestedCourses"
                value="CAT Full Course"
                onChange={handleChange}
                checked={formData.interestedCourses.includes("CAT Full Course")}
              />{" "}
              CAT Full Course
            </label>
            <label>
              <input
                type="checkbox"
                name="interestedCourses"
                value="NMAT+SNAP Course"
                onChange={handleChange}
                checked={formData.interestedCourses.includes("NMAT+SNAP Course")}
              />{" "}
              NMAT+SNAP Course
            </label>
            <label>
              <input
                type="checkbox"
                name="interestedCourses"
                value="XAT Course"
                onChange={handleChange}
                checked={formData.interestedCourses.includes("XAT Course")}
              />{" "}
              XAT Course
            </label>
            <label>
              <input
                type="checkbox"
                name="interestedCourses"
                value="CMAT Course"
                onChange={handleChange}
                checked={formData.interestedCourses.includes("CMAT Course")}
              />{" "}
              CMAT Course
            </label>
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner"></span> Submitting...
              </>
            ) : (
              "SUBMIT"
            )}
          </button>
        </form>
      </div>

      <div>
        <IIMPredictionpage />
      </div>
    </div>
  );
};

export default IIMPredictor;
