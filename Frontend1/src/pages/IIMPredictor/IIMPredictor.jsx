import React, { useState, useEffect } from "react";
import "./IIMPredictor.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import jsPDF from "jspdf";

const IIMPredictor = () => {
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [fullHtml, setFullHtml] = useState("");
  const [questions, setQuestions] = useState([]);
  const [score, setScore] = useState(null);
  const [showScoreCalculator, setShowScoreCalculator] = useState(false);
  
  const [sectionScores, setSectionScores] = useState({
    varc: { correct: 0, incorrect: 0, score: 0, scaledScore: 0, percentile: null },
    dilr: { correct: 0, incorrect: 0, score: 0, scaledScore: 0, percentile: null },
    qa: { correct: 0, incorrect: 0, score: 0, scaledScore: 0, percentile: null },
    overall: { correct: 0, incorrect: 0, score: 0, scaledScore: 0, percentile: null }
  });

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.id;

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
          : [value],
      }));
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      alert("Please login to submit your details!");
      localStorage.setItem("redirectAfterLogin", "/iim-results");
      localStorage.setItem("formData", JSON.stringify(formData));
      navigate("/login");
      return;
    }

    const userIdValue = user.id || user._id;
    
    if (!userIdValue) {
      alert("Session expired. Please login again!");
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
      console.log("Submitting Data:", requestData);

      const response = await axios.post(
        "/api/v2/iim-predictor",
        requestData
      );

      console.log("API Response:", response.data);

      setLoading(false);

      if (response.status === 200 || response.status === 201) {
        alert("Form Submitted Successfully!");
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
        "Error submitting form:",
        error.response?.data || error.message
      );
      
      const errorMessage = error.response?.data?.message || "Submission failed. Please try again.";
      
      if (errorMessage.includes("Invalid user ID") || errorMessage.includes("Please login")) {
        alert("Please login with a valid account to submit the form. Your current session may have expired.");
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        localStorage.setItem("redirectAfterLogin", "/iim-results");
        localStorage.setItem("formData", JSON.stringify(formData));
        navigate("/login");
      } else {
        alert(`${errorMessage}`);
      }
    }
  };

  useEffect(() => {
    if (!userId) return;

    const storedData = localStorage.getItem(`iim-predictor-${userId}`);
    if (storedData) {
      setFormData(JSON.parse(storedData));
    }
  }, [userId]);

  useEffect(() => {
    if (questions && questions.length > 0) {
      console.log("Questions changed, auto-calculating scores...");
      autoCalculateScores(questions);
    }
  }, [questions]);

  const autoCalculateScores = (questionList) => {
    let varcCorrect = 0, varcWrong = 0;
    let dilrCorrect = 0, dilrWrong = 0;
    let qaCorrect = 0, qaWrong = 0;
    let attempted = 0, unattempted = 0;

    const totalQuestions = questionList.length;
    const varcQuestions = Math.ceil(totalQuestions * 0.33);
    const dilrQuestions = Math.ceil(totalQuestions * 0.33);

    questionList.forEach((q, index) => {
      const status = (q.status || "").toLowerCase().trim();
      const isCorrect = q.isCorrect || (q.chosenOption === q.correctAnswer);
      
      let section = 'qa';
      if (index < varcQuestions) section = 'varc';
      else if (index < varcQuestions + dilrQuestions) section = 'dilr';

      if (status === "answered" || (status.includes("answered") && !status.includes("not answered"))) {
        attempted++;
        if (isCorrect) {
          if (section === 'varc') varcCorrect++;
          else if (section === 'dilr') dilrCorrect++;
          else qaCorrect++;
        } else {
          if (section === 'varc') varcWrong++;
          else if (section === 'dilr') dilrWrong++;
          else qaWrong++;
        }
      } else {
        unattempted++;
      }
    });

    const varcRaw = calculateRawScore(varcCorrect, varcWrong);
    const dilrRaw = calculateRawScore(dilrCorrect, dilrWrong);
    const qaRaw = calculateRawScore(qaCorrect, qaWrong);
    const overallRaw = varcRaw + dilrRaw + qaRaw;

    const varcScaled = estimateScaledScore(varcRaw);
    const dilrScaled = estimateScaledScore(dilrRaw);
    const qaScaled = estimateScaledScore(qaRaw);
    const overallScaled = varcScaled + dilrScaled + qaScaled;

    const varcPercentile = estimatePercentile(varcScaled, 'varc');
    const dilrPercentile = estimatePercentile(dilrScaled, 'dilr');
    const qaPercentile = estimatePercentile(qaScaled, 'qa');
    const overallPercentile = estimateOverallPercentile(varcPercentile, dilrPercentile, qaPercentile);

    const newSectionScores = {
      varc: { correct: varcCorrect, incorrect: varcWrong, score: varcRaw, scaledScore: varcScaled, percentile: varcPercentile },
      dilr: { correct: dilrCorrect, incorrect: dilrWrong, score: dilrRaw, scaledScore: dilrScaled, percentile: dilrPercentile },
      qa: { correct: qaCorrect, incorrect: qaWrong, score: qaRaw, scaledScore: qaScaled, percentile: qaPercentile },
      overall: { correct: varcCorrect + dilrCorrect + qaCorrect, incorrect: varcWrong + dilrWrong + qaWrong, score: overallRaw, scaledScore: overallScaled, percentile: overallPercentile }
    };
    
    setSectionScores(newSectionScores);
    
    const attemptPercentage = totalQuestions > 0 ? ((attempted / totalQuestions) * 100).toFixed(1) : 0;
    setScore({ totalQuestions, attempted, unattempted, attemptPercentage });
    setShowScoreCalculator(true);
    
    console.log("Auto-calculated scores:", newSectionScores);
  };

  const handleSearch = async () => {
    if (!link) {
        toast.error("Please provide a valid link.");
        return;
    }

    setLoading(true);
    toast.info("Fetching response sheet... This may take a moment.");
    
    try {
        const response = await axios.post("/api/v3/fetch-questions", { link }, {
            timeout: 90000,
        });

        if (response.data.fullHtmlContent) {
            setFullHtml(response.data.fullHtmlContent);
        }

        if (response.data.questions && response.data.questions.length > 0) {
            setQuestions([...response.data.questions]);
            console.log("Fetched Questions:", response.data.questions);
            toast.success("Response sheet fetched successfully!");
        } else {
            console.warn("No questions found in API response.");
            toast.warning("Response sheet loaded but no questions found. Check if the link is correct.");
        }
    } catch (error) {
        console.error("Error fetching data:", error);
        
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
            toast.error("Request timed out. The server is slow. Please try again.");
        } else if (error.response?.data?.code === 'TIMEOUT') {
            toast.error(error.response?.data?.error || "Server timeout. Please try again.");
        } else if (error.response?.data?.code === 'ACCESS_DENIED') {
            toast.error(error.response?.data?.error || "Access denied. Link may have expired.");
        } else if (error.response?.data?.code === 'NOT_FOUND') {
            toast.error(error.response?.data?.error || "Response sheet not found. Link may have expired.");
        } else if (error.response?.data?.error) {
            toast.error(error.response.data.error);
        } else {
            toast.error("Failed to fetch response sheet. Please check the link and try again.");
        }
    }
    setLoading(false);
  };

  const calculateRawScore = (correct, incorrect) => {
    return (3 * correct) - (1 * incorrect);
  };

  const estimateScaledScore = (rawScore) => {
    return rawScore;
  };

  const PERCENTILE_DATASET_AVAILABLE = true;

  const estimatePercentile = (scaledScore, section) => {
    if (!PERCENTILE_DATASET_AVAILABLE) return null;
    
    if (scaledScore <= 0) return 0;

    const percentileTable = {
      varc: [
        { score: 45, percentile: 99 },
        { score: 40, percentile: 97 },
        { score: 35, percentile: 95 },
        { score: 30, percentile: 90 },
        { score: 25, percentile: 85 },
        { score: 20, percentile: 75 },
        { score: 15, percentile: 60 },
        { score: 10, percentile: 45 },
        { score: 5, percentile: 25 },
        { score: 1, percentile: 5 }
      ],
      dilr: [
        { score: 45, percentile: 99 },
        { score: 40, percentile: 98 },
        { score: 35, percentile: 96 },
        { score: 30, percentile: 92 },
        { score: 25, percentile: 87 },
        { score: 20, percentile: 80 },
        { score: 15, percentile: 65 },
        { score: 10, percentile: 50 },
        { score: 5, percentile: 30 },
        { score: 1, percentile: 5 }
      ],
      qa: [
        { score: 50, percentile: 99 },
        { score: 45, percentile: 98 },
        { score: 40, percentile: 97 },
        { score: 35, percentile: 95 },
        { score: 30, percentile: 90 },
        { score: 25, percentile: 82 },
        { score: 20, percentile: 70 },
        { score: 15, percentile: 55 },
        { score: 10, percentile: 40 },
        { score: 1, percentile: 5 }
      ]
    };

    const table = percentileTable[section] || percentileTable.varc;
    
    for (let i = 0; i < table.length; i++) {
      if (scaledScore >= table[i].score) {
        if (i === 0) return table[i].percentile;
        const prevScore = table[i - 1].score;
        const prevPercentile = table[i - 1].percentile;
        const ratio = (scaledScore - table[i].score) / (prevScore - table[i].score);
        return Math.round((table[i].percentile + ratio * (prevPercentile - table[i].percentile)) * 100) / 100;
      }
    }
    return table[table.length - 1].percentile;
  };

  const estimateOverallPercentile = (varcP, dilrP, qaP) => {
    if (!PERCENTILE_DATASET_AVAILABLE) return null;
    
    const validPercentiles = [varcP, dilrP, qaP].filter(p => p !== null && p !== undefined);
    if (validPercentiles.length === 0) return 0;
    
    const avgPercentile = validPercentiles.reduce((a, b) => a + b, 0) / validPercentiles.length;
    const minPercentile = Math.min(...validPercentiles);
    return Math.round((avgPercentile * 0.7 + minPercentile * 0.3) * 100) / 100;
  };

  const formatPercentile = (percentile) => {
    if (percentile === null || percentile === undefined) return "Percentile unavailable";
    return percentile.toFixed(2);
  };

  const formatScore = (score) => {
    return score.toFixed(1);
  };

  const calculateScore = () => {
    console.log("Current Questions Before Analysis:", questions); 

    if (!questions || questions.length === 0) {
        toast.error("No questions available to analyze. Please fetch the response sheet first.");
        return;
    }

    let varcCorrect = 0, varcWrong = 0;
    let dilrCorrect = 0, dilrWrong = 0;
    let qaCorrect = 0, qaWrong = 0;
    let attempted = 0, unattempted = 0;

    const totalQuestions = questions.length;
    const varcQuestions = Math.ceil(totalQuestions * 0.33);
    const dilrQuestions = Math.ceil(totalQuestions * 0.33);

    questions.forEach((q, index) => {
      const status = (q.status || "").toLowerCase().trim();
      const isCorrect = q.isCorrect || (q.chosenOption === q.correctAnswer);
      
      let section = 'qa';
      if (index < varcQuestions) section = 'varc';
      else if (index < varcQuestions + dilrQuestions) section = 'dilr';

      if (status === "answered" || (status.includes("answered") && !status.includes("not answered"))) {
        attempted++;
        if (isCorrect) {
          if (section === 'varc') varcCorrect++;
          else if (section === 'dilr') dilrCorrect++;
          else qaCorrect++;
        } else {
          if (section === 'varc') varcWrong++;
          else if (section === 'dilr') dilrWrong++;
          else qaWrong++;
        }
      } else {
        unattempted++;
      }
    });

    const varcRaw = calculateRawScore(varcCorrect, varcWrong);
    const dilrRaw = calculateRawScore(dilrCorrect, dilrWrong);
    const qaRaw = calculateRawScore(qaCorrect, qaWrong);
    const overallRaw = varcRaw + dilrRaw + qaRaw;

    const varcScaled = estimateScaledScore(varcRaw);
    const dilrScaled = estimateScaledScore(dilrRaw);
    const qaScaled = estimateScaledScore(qaRaw);
    const overallScaled = varcScaled + dilrScaled + qaScaled;

    const varcPercentile = estimatePercentile(varcScaled, 'varc');
    const dilrPercentile = estimatePercentile(dilrScaled, 'dilr');
    const qaPercentile = estimatePercentile(qaScaled, 'qa');
    const overallPercentile = estimateOverallPercentile(varcPercentile, dilrPercentile, qaPercentile);

    const newSectionScores = {
      varc: { correct: varcCorrect, incorrect: varcWrong, score: varcRaw, scaledScore: varcScaled, percentile: varcPercentile },
      dilr: { correct: dilrCorrect, incorrect: dilrWrong, score: dilrRaw, scaledScore: dilrScaled, percentile: dilrPercentile },
      qa: { correct: qaCorrect, incorrect: qaWrong, score: qaRaw, scaledScore: qaScaled, percentile: qaPercentile },
      overall: { correct: varcCorrect + dilrCorrect + qaCorrect, incorrect: varcWrong + dilrWrong + qaWrong, score: overallRaw, scaledScore: overallScaled, percentile: overallPercentile }
    };
    
    setSectionScores(newSectionScores);
    console.log("Updated Section Scores:", newSectionScores);

    const attemptPercentage = totalQuestions > 0 ? ((attempted / totalQuestions) * 100).toFixed(1) : 0;

    setScore({ 
      totalQuestions, 
      attempted, 
      unattempted, 
      attemptPercentage 
    });

    setShowScoreCalculator(true);
    console.log("Score Analysis:", { sectionScores, totalQuestions, attempted, unattempted, attemptPercentage });
    toast.success("CAT Score calculated successfully!");
  };

  const downloadScorecard = () => {
    if (!score || !showScoreCalculator) {
      toast.error("Please calculate score first!");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, pageWidth, 45, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("TathaGat", pageWidth / 2, 20, { align: "center" });
    
    doc.setFontSize(14);
    doc.text("CAT Score Calculator - Detailed Analysis", pageWidth / 2, 35, { align: "center" });

    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const today = new Date().toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
    doc.text(`Date: ${today}`, 20, 55);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`You scored ${sectionScores.overall.score.toFixed(1)} marks in CAT 2025`, pageWidth / 2, 70, { align: "center" });

    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.5);

    let yPos = 85;
    doc.setFillColor(37, 99, 235);
    doc.rect(20, yPos, pageWidth - 40, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text("Section", 25, yPos + 7);
    doc.text("Correct", 60, yPos + 7);
    doc.text("Incorrect", 90, yPos + 7);
    doc.text("Score", 120, yPos + 7);
    doc.text("Scaled Score", 145, yPos + 7);
    doc.text("Percentile", 175, yPos + 7);

    yPos += 12;
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");

    const sections = [
      { name: 'VARC', data: sectionScores.varc },
      { name: 'DILR', data: sectionScores.dilr },
      { name: 'QA', data: sectionScores.qa },
      { name: 'Overall', data: sectionScores.overall }
    ];

    sections.forEach((section, i) => {
      if (i % 2 === 0) {
        doc.setFillColor(240, 244, 255);
        doc.rect(20, yPos - 5, pageWidth - 40, 10, 'F');
      }
      doc.setFont("helvetica", section.name === 'Overall' ? "bold" : "normal");
      doc.text(section.name, 25, yPos);
      doc.text(section.data.correct.toString(), 65, yPos);
      doc.text(section.data.incorrect.toString(), 95, yPos);
      doc.text(section.data.score.toFixed(1), 125, yPos);
      doc.text(section.data.scaledScore.toFixed(2), 155, yPos);
      const percentileText = section.data.percentile !== null ? section.data.percentile.toFixed(2) : "N/A";
      doc.text(percentileText, 180, yPos);
      yPos += 12;
    });

    yPos += 10;
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.text("Note: Expected percentile based on response analysis. Official percentile may differ.", pageWidth / 2, yPos, { align: "center" });

    doc.setFillColor(240, 240, 240);
    doc.rect(0, 270, pageWidth, 30, 'F');
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.text("Generated by TathaGat - Leaders in Aptitude Test Prep", pageWidth / 2, 280, { align: "center" });
    doc.text("www.tathagat.co.in | +91 9205534439", pageWidth / 2, 290, { align: "center" });

    doc.save(`TathaGat_CAT_Score_${today.replace(/\s/g, '_')}.pdf`);
    toast.success("CAT Scorecard downloaded successfully!");
  };

  const handlePrint = () => {
    const printContent = document.querySelector(".response-sheet");
    
    if (!printContent) {
        toast.error("No response sheet available to print.");
        return;
    }

    const printWindow = window.open("", "", "width=900,height=700");
    
    const printStyles = `
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; color: #000; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { border: 1px solid #333; padding: 10px; text-align: left; }
        th { background-color: #007bff; color: white; }
        tr:nth-child(even) { background-color: #f2f2f2; }
        img { max-width: 100%; height: auto; display: block; margin: 10px auto; }
        @media print { img, table { page-break-inside: avoid; } }
      </style>
    `;

    printWindow.document.write(`
      <html>
        <head><title>Response Sheet - TathaGat</title>${printStyles}</head>
        <body>
          <h2 style="text-align: center; color: #007bff;">CMAT/CAT Response Sheet</h2>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);

    toast.success("Print window opened!");
  };

  return (
    <div>
      <div className="predictor-container">
        <h2 className="predictor-heading">
          CMAT/CAT Response Sheet Checker
        </h2>

        <input
          className="MainInput"
          type="text"
          placeholder="Paste response sheet link"
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />

        <button onClick={handleSearch} disabled={loading} className="check-btn">
          {loading ? "Fetching..." : "Check Response Sheet"}
        </button>

        <button onClick={handlePrint} className="print-btn">Print</button>
        <button onClick={calculateScore} className="calculate-btn">Calculate Score</button>

        {fullHtml && (
          <div
            className="response-sheet"
            dangerouslySetInnerHTML={{ __html: fullHtml }}
          />
        )}

        {showScoreCalculator && (
          <div className="cat-score-calculator">
            <div className="score-header">
              <h3>You scored <span className="highlight-score">{sectionScores.overall.score.toFixed(1)} marks</span> in CAT 2025.</h3>
              <p>Let's prepare better with TathaGat's <a href="/cat">CAT 2026</a> or <a href="/cat">XAT 2026 courses</a>.</p>
            </div>

            <div className="score-table-container">
              <table className="score-table">
                <thead>
                  <tr>
                    <th className="section-col">Section</th>
                    <th>Correct</th>
                    <th>Incorrect*</th>
                    <th>Estimated Raw Score</th>
                    <th>Expected Scaled Score</th>
                    <th>Expected Percentile</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="section-name">VARC</td>
                    <td>{sectionScores.varc.correct}</td>
                    <td>{sectionScores.varc.incorrect}</td>
                    <td>{formatScore(sectionScores.varc.score)}</td>
                    <td className="scaled">{formatScore(sectionScores.varc.scaledScore)}</td>
                    <td className="percentile">{formatPercentile(sectionScores.varc.percentile)}</td>
                  </tr>
                  <tr>
                    <td className="section-name">DILR</td>
                    <td>{sectionScores.dilr.correct}</td>
                    <td>{sectionScores.dilr.incorrect}</td>
                    <td>{formatScore(sectionScores.dilr.score)}</td>
                    <td className="scaled">{formatScore(sectionScores.dilr.scaledScore)}</td>
                    <td className="percentile">{formatPercentile(sectionScores.dilr.percentile)}</td>
                  </tr>
                  <tr>
                    <td className="section-name">QA</td>
                    <td>{sectionScores.qa.correct}</td>
                    <td>{sectionScores.qa.incorrect}</td>
                    <td>{formatScore(sectionScores.qa.score)}</td>
                    <td className="scaled">{formatScore(sectionScores.qa.scaledScore)}</td>
                    <td className="percentile">{formatPercentile(sectionScores.qa.percentile)}</td>
                  </tr>
                  <tr className="overall-row">
                    <td className="section-name">Overall</td>
                    <td>{sectionScores.overall.correct}</td>
                    <td>{sectionScores.overall.incorrect}</td>
                    <td>{formatScore(sectionScores.overall.score)}</td>
                    <td className="scaled">{formatScore(sectionScores.overall.scaledScore)}</td>
                    <td className="percentile">{formatPercentile(sectionScores.overall.percentile)}</td>
                  </tr>
                </tbody>
              </table>
              <p className="table-note">* Incorrect may include TITA. Negative marks apply only to MCQs. This score is estimated.</p>
            </div>

            <div className="response-info">
              <span className="info-badge">Expected percentile based on <strong>45k responses</strong>. <a href="#">Follow us on Instagram to stay updated</a></span>
            </div>

            <button onClick={downloadScorecard} className="download-btn">Download Scorecard</button>
          </div>
        )}

        {showScoreCalculator && (
          <div className="cat-explanation-section">
            <h3>CAT Score Calculation - Kaise Hota Hai?</h3>
            
            <div className="explanation-card">
              <h4>1) Official CAT Marking Scheme</h4>
              <ul>
                <li><strong>MCQ Correct:</strong> +3 marks</li>
                <li><strong>MCQ Incorrect:</strong> -1 mark (Negative marking)</li>
                <li><strong>TITA/Non-MCQ Incorrect:</strong> 0 marks (No negative)</li>
                <li><strong>Unattempted:</strong> 0 marks</li>
              </ul>
            </div>

            <div className="explanation-card">
              <h4>2) Raw Score Formula</h4>
              <div className="formula-box">
                <code>Raw Score = 3 x (Correct) - 1 x (Wrong MCQ)</code>
              </div>
              <p>Yeh formula section-wise aur overall dono ke liye apply hota hai.</p>
            </div>

            <div className="explanation-card">
              <h4>3) "Incorrect" Column Ka Confusion</h4>
              <p>Bahut saare calculators mein:</p>
              <div className="formula-box warning">
                <code>Incorrect = MCQ Wrong + TITA Wrong</code>
              </div>
              <p>But negative marking <strong>sirf MCQs pe</strong> lagti hai! Isliye simple formula <code>3 x Correct - Incorrect</code> galat ho sakta hai.</p>
            </div>

            <div className="explanation-card">
              <h4>4) Wrong MCQs Estimate Kaise Karein?</h4>
              <p>Agar aapko Correct aur Score pata hai:</p>
              <div className="formula-box">
                <code>Wrong MCQ ≈ 3 x Correct - Score</code>
              </div>
              <p>Yeh assume karta hai ki TITA wrong ka koi penalty nahi hai.</p>
            </div>

            <div className="explanation-card">
              <h4>5) Scaled Score (Normalization)</h4>
              <ul>
                <li>CAT ke different slots ki difficulty alag hoti hai</li>
                <li>IIMs officially scaling karte hain taaki fair comparison ho</li>
                <li>Coaching platforms approximate scaled score dete hain based on large response datasets</li>
              </ul>
            </div>

            <div className="explanation-card">
              <h4>6) Percentile Estimation Logic</h4>
              <p>Coaching tools percentile estimate karte hain using:</p>
              <ul>
                <li><strong>Response Volume:</strong> Kitne students ne attempt kiya</li>
                <li><strong>Score Distribution:</strong> Marks ka spread kaise hai</li>
                <li><strong>Past-Year Patterns:</strong> Previous years ke trends</li>
                <li><strong>Slot-Level Trends:</strong> Har slot ki specific difficulty</li>
              </ul>
              <p className="note">Note: Official percentile thoda different ho sakti hai kyunki IIM ka exact method public nahi hai.</p>
            </div>
          </div>
        )}

        <ToastContainer />
      </div>

      <div className="IIM-container">
        <h1>Lets Take Test</h1>
        <p>Test your percentile with our online mock exam.</p>
        <button className="ExamButton" onClick={() => navigate("/exam")}>Start Exam</button>
      </div>

      <div className="predictor-container">
        <h2 className="predictor-heading">LET'S PREDICT YOUR MBA COLLEGE</h2>
        <form className="predictor-form" onSubmit={handleSubmit}>
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
                value="Interview Prep"
                onChange={handleChange}
                checked={formData.interestedCourses.includes("Interview Prep")}
              />{" "}
              Interview Prep
            </label>
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Submitting..." : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default IIMPredictor;
