import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./IIMPredictorResult.css";

const IIMPredictorResult = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [evaluationResult, setEvaluationResult] = useState(null);
    const [profileData, setProfileData] = useState(null);
    const [activeTab, setActiveTab] = useState("all");
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAndEvaluate = async () => {
            try {
                setLoading(true);
                
                const profileResponse = await axios.get(`/api/v2/iim-predictor/${userId}`);
                const profile = profileResponse.data;
                setProfileData(profile);
                
                const evalPayload = {
                    userId,
                    category: profile.category,
                    gender: profile.gender,
                    classX: profile.classX,
                    classXII: profile.classXII,
                    discipline: profile.discipline,
                    graduation: profile.graduation,
                    gradPercentage: profile.gradPercentage,
                    workExperience: profile.workExperience,
                    takenCATBefore: profile.takenCATBefore,
                    catYear: profile.catYear,
                    interestedCourses: profile.interestedCourses
                };
                
                const evalResponse = await axios.post("/api/iim-predictor/evaluate", evalPayload);
                
                if (evalResponse.data.success) {
                    setEvaluationResult(evalResponse.data);
                }
                
            } catch (err) {
                console.error("Error fetching data:", err);
                setError("Failed to load prediction results. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchAndEvaluate();
        }
    }, [userId]);

    if (loading) {
        return (
            <div className="result-loading">
                <div className="loading-spinner-large"></div>
                <p>Analyzing your profile...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="result-error">
                <h2>Oops!</h2>
                <p>{error}</p>
                <button onClick={() => navigate("/IIM-Predictor")}>Try Again</button>
            </div>
        );
    }

    const getCallStatusClass = (status) => {
        switch (status) {
            case "Likely Call": return "status-likely";
            case "Borderline": return "status-borderline";
            case "Stretch": return "status-stretch";
            default: return "status-not-eligible";
        }
    };

    const getGroupClass = (group) => {
        switch (group) {
            case "Top IIMs and FMS": return "group-top-iims";
            case "IITs and IIFT": return "group-iits";
            case "Newer IIMs": return "group-newer";
            default: return "group-other";
        }
    };

    const filterColleges = () => {
        if (!evaluationResult?.colleges) return [];
        switch (activeTab) {
            case "likely":
                return evaluationResult.colleges.filter(c => c.callStatus === "Likely Call");
            case "borderline":
                return evaluationResult.colleges.filter(c => c.callStatus === "Borderline");
            case "stretch":
                return evaluationResult.colleges.filter(c => c.callStatus === "Stretch");
            default:
                return evaluationResult.colleges;
        }
    };

    const colleges = filterColleges();

    return (
        <div className="iim-result-page">
            <div className="result-header">
                <h1>Congratulations, {evaluationResult?.userName || "Student"}!</h1>
                <p className="result-subtitle">
                    Based on your profile analysis, here are your predicted B-School matches
                </p>
            </div>

            <div className="profile-summary-card">
                <h3>Your Profile Summary</h3>
                <div className="profile-grid">
                    <div className="profile-item">
                        <span className="label">Category</span>
                        <span className="value">{profileData?.category || "N/A"}</span>
                    </div>
                    <div className="profile-item">
                        <span className="label">Gender</span>
                        <span className="value">{profileData?.gender || "N/A"}</span>
                    </div>
                    <div className="profile-item">
                        <span className="label">Class X</span>
                        <span className="value">{profileData?.classX}%</span>
                    </div>
                    <div className="profile-item">
                        <span className="label">Class XII</span>
                        <span className="value">{profileData?.classXII}%</span>
                    </div>
                    <div className="profile-item">
                        <span className="label">Graduation</span>
                        <span className="value">{profileData?.graduation} ({profileData?.gradPercentage}%)</span>
                    </div>
                    <div className="profile-item">
                        <span className="label">Work Experience</span>
                        <span className="value">{profileData?.workExperience || 0} months</span>
                    </div>
                </div>
            </div>

            <div className="score-cards-container">
                <div className="score-card academics">
                    <div className="score-circle">
                        <svg viewBox="0 0 100 100">
                            <circle className="bg" cx="50" cy="50" r="45" />
                            <circle 
                                className="progress" 
                                cx="50" cy="50" r="45"
                                style={{ 
                                    strokeDasharray: `${(evaluationResult?.academicsScore || 0) * 2.83} 283` 
                                }}
                            />
                        </svg>
                        <span className="score-value">{evaluationResult?.academicsScore || 0}</span>
                    </div>
                    <p className="score-label">Academics Score</p>
                </div>

                <div className="score-card work-ex">
                    <div className="score-circle">
                        <svg viewBox="0 0 100 100">
                            <circle className="bg" cx="50" cy="50" r="45" />
                            <circle 
                                className="progress" 
                                cx="50" cy="50" r="45"
                                style={{ 
                                    strokeDasharray: `${(evaluationResult?.workExScore || 0) * 2.83} 283` 
                                }}
                            />
                        </svg>
                        <span className="score-value">{evaluationResult?.workExScore || 0}</span>
                    </div>
                    <p className="score-label">Work Ex Score</p>
                </div>
            </div>

            <div className="percentile-cards">
                <div className="percentile-card top-iims">
                    <h4>Top IIMs & FMS</h4>
                    <span className="percentile-value">{evaluationResult?.topIimsAndFmsPercentile || 0}%ile</span>
                    <p>Required for shortlist consideration</p>
                </div>
                <div className="percentile-card iits">
                    <h4>IITs & IIFT</h4>
                    <span className="percentile-value">{evaluationResult?.iitsAndIiftPercentile || 0}%ile</span>
                    <p>Required for shortlist consideration</p>
                </div>
                <div className="percentile-card newer-iims">
                    <h4>Newer IIMs</h4>
                    <span className="percentile-value">{evaluationResult?.newerIimsPercentile || 0}%ile</span>
                    <p>Required for shortlist consideration</p>
                </div>
            </div>

            <div className="summary-stats">
                <div className="stat-box total">
                    <span className="stat-value">{evaluationResult?.summary?.totalColleges || 0}</span>
                    <span className="stat-label">Total Colleges</span>
                </div>
                <div className="stat-box likely">
                    <span className="stat-value">{evaluationResult?.summary?.likelyCallsCount || 0}</span>
                    <span className="stat-label">Likely Calls</span>
                </div>
                <div className="stat-box borderline">
                    <span className="stat-value">{evaluationResult?.summary?.borderlineCount || 0}</span>
                    <span className="stat-label">Borderline</span>
                </div>
                <div className="stat-box stretch">
                    <span className="stat-value">{evaluationResult?.summary?.stretchCount || 0}</span>
                    <span className="stat-label">Stretch</span>
                </div>
            </div>

            <div className="colleges-section">
                <h3>B-Schools You Can Target</h3>
                
                <div className="filter-tabs">
                    <button 
                        className={activeTab === "all" ? "active" : ""}
                        onClick={() => setActiveTab("all")}
                    >
                        All ({evaluationResult?.colleges?.length || 0})
                    </button>
                    <button 
                        className={activeTab === "likely" ? "active" : ""}
                        onClick={() => setActiveTab("likely")}
                    >
                        Likely ({evaluationResult?.summary?.likelyCallsCount || 0})
                    </button>
                    <button 
                        className={activeTab === "borderline" ? "active" : ""}
                        onClick={() => setActiveTab("borderline")}
                    >
                        Borderline ({evaluationResult?.summary?.borderlineCount || 0})
                    </button>
                    <button 
                        className={activeTab === "stretch" ? "active" : ""}
                        onClick={() => setActiveTab("stretch")}
                    >
                        Stretch ({evaluationResult?.summary?.stretchCount || 0})
                    </button>
                </div>

                <div className="colleges-table-container">
                    <table className="colleges-table">
                        <thead>
                            <tr>
                                <th>College</th>
                                <th>Program</th>
                                <th>VARC</th>
                                <th>DILR</th>
                                <th>QA</th>
                                <th>Overall</th>
                                <th>Target %ile</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {colleges.map((college, index) => (
                                <tr key={college._id || index} className={getGroupClass(college.collegeGroup)}>
                                    <td>
                                        <div className="college-name-cell">
                                            <strong>{college.collegeName}</strong>
                                            <span className="college-group-tag">{college.collegeGroup}</span>
                                        </div>
                                    </td>
                                    <td>{college.programName || "-"}</td>
                                    <td>{college.varcCutoff || "-"}</td>
                                    <td>{college.dilrCutoff || "-"}</td>
                                    <td>{college.qaCutoff || "-"}</td>
                                    <td>{college.overallMinCutoff || "-"}</td>
                                    <td><strong>{college.targetPercentile}%</strong></td>
                                    <td>
                                        <span className={`call-status ${getCallStatusClass(college.callStatus)}`}>
                                            {college.callStatus}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="action-buttons">
                <button className="btn-secondary" onClick={() => navigate("/IIM-Predictor")}>
                    Update Profile
                </button>
                <button className="btn-primary" onClick={() => window.print()}>
                    Download Report
                </button>
            </div>
        </div>
    );
};

export default IIMPredictorResult;
