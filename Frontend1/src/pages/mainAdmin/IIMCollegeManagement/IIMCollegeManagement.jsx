import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaUsers, FaEye, FaTimes } from "react-icons/fa";
import AdminLayout from "../AdminLayout/AdminLayout";
import "./IIMCollegeManagement.css";

const IIMCollegeManagement = () => {
    const [colleges, setColleges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterGroup, setFilterGroup] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingCollege, setEditingCollege] = useState(null);
    
    // Student submissions state
    const [showStudentModal, setShowStudentModal] = useState(false);
    const [studentSubmissions, setStudentSubmissions] = useState([]);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [studentSearchTerm, setStudentSearchTerm] = useState("");
    const [selectedStudent, setSelectedStudent] = useState(null);
    
    const [formData, setFormData] = useState({
        collegeGroup: "Top IIMs and FMS",
        collegeName: "",
        programName: "",
        varcCutoff: "",
        dilrCutoff: "",
        qaCutoff: "",
        overallMinCutoff: "",
        targetPercentile: "",
        conversionCalls: "",
        shortlistingUrl: "",
        displayOrder: 0,
        isActive: true
    });

    const collegeGroups = [
        "Top IIMs and FMS",
        "IITs and IIFT",
        "Newer IIMs",
        "Other Top B-Schools"
    ];

    const fetchColleges = async () => {
        try {
            setLoading(true);
            const response = await axios.get("/api/admin/iim-colleges");
            if (response.data.success) {
                setColleges(response.data.colleges);
            }
        } catch (error) {
            console.error("Error fetching colleges:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchColleges();
    }, []);

    // Fetch student submissions
    const fetchStudentSubmissions = async () => {
        try {
            setLoadingStudents(true);
            const response = await axios.get("/api/v2/admin/all-submissions");
            if (response.data.success) {
                setStudentSubmissions(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching student submissions:", error);
        } finally {
            setLoadingStudents(false);
        }
    };

    const openStudentModal = () => {
        setShowStudentModal(true);
        fetchStudentSubmissions();
    };

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filteredStudents = studentSubmissions.filter(student => {
        const searchLower = studentSearchTerm.toLowerCase();
        return (
            student.userName?.toLowerCase().includes(searchLower) ||
            student.userEmail?.toLowerCase().includes(searchLower) ||
            student.userPhone?.includes(studentSearchTerm) ||
            student.category?.toLowerCase().includes(searchLower)
        );
    });

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const openAddModal = () => {
        setEditingCollege(null);
        setFormData({
            collegeGroup: "Top IIMs and FMS",
            collegeName: "",
            programName: "",
            varcCutoff: "",
            dilrCutoff: "",
            qaCutoff: "",
            overallMinCutoff: "",
            targetPercentile: "",
            conversionCalls: "",
            shortlistingUrl: "",
            displayOrder: 0,
            isActive: true
        });
        setShowModal(true);
    };

    const openEditModal = (college) => {
        setEditingCollege(college);
        setFormData({
            collegeGroup: college.collegeGroup,
            collegeName: college.collegeName,
            programName: college.programName || "",
            varcCutoff: college.varcCutoff || "",
            dilrCutoff: college.dilrCutoff || "",
            qaCutoff: college.qaCutoff || "",
            overallMinCutoff: college.overallMinCutoff || "",
            targetPercentile: college.targetPercentile,
            conversionCalls: college.conversionCalls || "",
            shortlistingUrl: college.shortlistingUrl || "",
            displayOrder: college.displayOrder || 0,
            isActive: college.isActive
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                varcCutoff: formData.varcCutoff ? parseFloat(formData.varcCutoff) : null,
                dilrCutoff: formData.dilrCutoff ? parseFloat(formData.dilrCutoff) : null,
                qaCutoff: formData.qaCutoff ? parseFloat(formData.qaCutoff) : null,
                overallMinCutoff: formData.overallMinCutoff ? parseFloat(formData.overallMinCutoff) : null,
                targetPercentile: parseFloat(formData.targetPercentile),
                displayOrder: parseInt(formData.displayOrder) || 0
            };

            if (editingCollege) {
                await axios.put(`/api/admin/iim-colleges/${editingCollege._id}`, payload);
            } else {
                await axios.post("/api/admin/iim-colleges", payload);
            }
            setShowModal(false);
            fetchColleges();
        } catch (error) {
            console.error("Error saving college:", error);
            alert("Failed to save college. Please try again.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this college?")) return;
        try {
            await axios.delete(`/api/admin/iim-colleges/${id}`);
            fetchColleges();
        } catch (error) {
            console.error("Error deleting college:", error);
            alert("Failed to delete college.");
        }
    };

    const handleToggleActive = async (id) => {
        try {
            await axios.patch(`/api/admin/iim-colleges/${id}/toggle-active`);
            fetchColleges();
        } catch (error) {
            console.error("Error toggling status:", error);
        }
    };

    const getGroupBadgeClass = (group) => {
        switch (group) {
            case "Top IIMs and FMS": return "group-badge top-iims";
            case "IITs and IIFT": return "group-badge iits";
            case "Newer IIMs": return "group-badge newer-iims";
            default: return "group-badge other";
        }
    };

    const filteredColleges = colleges.filter(college => {
        const matchesSearch = college.collegeName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesGroup = !filterGroup || college.collegeGroup === filterGroup;
        return matchesSearch && matchesGroup;
    });

    return (
        <AdminLayout>
            <div className="iim-college-management">
                <h2>IIM College Management</h2>
                
                <div className="college-controls">
                    <input
                        type="text"
                        placeholder="Search colleges..."
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <select
                        className="filter-select"
                        value={filterGroup}
                        onChange={(e) => setFilterGroup(e.target.value)}
                    >
                        <option value="">All Groups</option>
                        {collegeGroups.map(group => (
                            <option key={group} value={group}>{group}</option>
                        ))}
                    </select>
                    <button className="student-details-btn" onClick={openStudentModal}>
                        <FaUsers /> Student Details
                    </button>
                    <button className="add-college-btn" onClick={openAddModal}>
                        <FaPlus /> Add College
                    </button>
                </div>

                {loading ? (
                    <div className="loading-container">Loading colleges...</div>
                ) : filteredColleges.length === 0 ? (
                    <div className="empty-state">
                        <p>No colleges found. Click "Add College" to add one.</p>
                    </div>
                ) : (
                    <div className="college-table-container">
                        <table className="college-table">
                            <thead>
                                <tr>
                                    <th>College Group</th>
                                    <th>College Name</th>
                                    <th>Program</th>
                                    <th>VARC</th>
                                    <th>DILR</th>
                                    <th>QA</th>
                                    <th>Overall</th>
                                    <th>Target %ile</th>
                                    <th>Calls</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredColleges.map(college => (
                                    <tr key={college._id}>
                                        <td>
                                            <span className={getGroupBadgeClass(college.collegeGroup)}>
                                                {college.collegeGroup}
                                            </span>
                                        </td>
                                        <td><strong>{college.collegeName}</strong></td>
                                        <td>{college.programName || "-"}</td>
                                        <td className="cutoff-cell">{college.varcCutoff || "-"}</td>
                                        <td className="cutoff-cell">{college.dilrCutoff || "-"}</td>
                                        <td className="cutoff-cell">{college.qaCutoff || "-"}</td>
                                        <td className="cutoff-cell">{college.overallMinCutoff || "-"}</td>
                                        <td className="cutoff-cell"><strong>{college.targetPercentile}%</strong></td>
                                        <td>{college.conversionCalls || "NA"}</td>
                                        <td>
                                            <span className={college.isActive ? "status-active" : "status-inactive"}>
                                                {college.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td>
                                            <button 
                                                className="action-btn edit-btn"
                                                onClick={() => openEditModal(college)}
                                            >
                                                <FaEdit />
                                            </button>
                                            <button 
                                                className="action-btn toggle-btn"
                                                onClick={() => handleToggleActive(college._id)}
                                            >
                                                {college.isActive ? <FaToggleOn /> : <FaToggleOff />}
                                            </button>
                                            <button 
                                                className="action-btn delete-btn"
                                                onClick={() => handleDelete(college._id)}
                                            >
                                                <FaTrash />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <h3>{editingCollege ? "Edit College" : "Add New College"}</h3>
                            <form onSubmit={handleSubmit}>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>College Group *</label>
                                        <select
                                            name="collegeGroup"
                                            value={formData.collegeGroup}
                                            onChange={handleInputChange}
                                            required
                                        >
                                            {collegeGroups.map(group => (
                                                <option key={group} value={group}>{group}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Target Percentile *</label>
                                        <input
                                            type="number"
                                            name="targetPercentile"
                                            value={formData.targetPercentile}
                                            onChange={handleInputChange}
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            required
                                        />
                                    </div>
                                    <div className="form-group full-width">
                                        <label>College Name *</label>
                                        <input
                                            type="text"
                                            name="collegeName"
                                            value={formData.collegeName}
                                            onChange={handleInputChange}
                                            placeholder="e.g., IIM Ahmedabad"
                                            required
                                        />
                                    </div>
                                    <div className="form-group full-width">
                                        <label>Program Name</label>
                                        <input
                                            type="text"
                                            name="programName"
                                            value={formData.programName}
                                            onChange={handleInputChange}
                                            placeholder="e.g., PGP"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>VARC Cutoff</label>
                                        <input
                                            type="number"
                                            name="varcCutoff"
                                            value={formData.varcCutoff}
                                            onChange={handleInputChange}
                                            step="0.01"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>DILR Cutoff</label>
                                        <input
                                            type="number"
                                            name="dilrCutoff"
                                            value={formData.dilrCutoff}
                                            onChange={handleInputChange}
                                            step="0.01"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>QA Cutoff</label>
                                        <input
                                            type="number"
                                            name="qaCutoff"
                                            value={formData.qaCutoff}
                                            onChange={handleInputChange}
                                            step="0.01"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Overall Min Cutoff</label>
                                        <input
                                            type="number"
                                            name="overallMinCutoff"
                                            value={formData.overallMinCutoff}
                                            onChange={handleInputChange}
                                            step="0.01"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Conversion Calls</label>
                                        <input
                                            type="text"
                                            name="conversionCalls"
                                            value={formData.conversionCalls}
                                            onChange={handleInputChange}
                                            placeholder="e.g., High, Medium, NA"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Display Order</label>
                                        <input
                                            type="number"
                                            name="displayOrder"
                                            value={formData.displayOrder}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group full-width">
                                        <label>Shortlisting URL</label>
                                        <input
                                            type="url"
                                            name="shortlistingUrl"
                                            value={formData.shortlistingUrl}
                                            onChange={handleInputChange}
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>
                                <div className="modal-actions">
                                    <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="save-btn">
                                        {editingCollege ? "Update" : "Add"} College
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Student Details Modal */}
                {showStudentModal && (
                    <div className="modal-overlay" onClick={() => { setShowStudentModal(false); setSelectedStudent(null); }}>
                        <div className="student-modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="student-modal-header">
                                <h3><FaUsers /> Student Submissions</h3>
                                <button className="close-btn" onClick={() => { setShowStudentModal(false); setSelectedStudent(null); }}>
                                    <FaTimes />
                                </button>
                            </div>
                            
                            <div className="student-search-bar">
                                <input
                                    type="text"
                                    placeholder="Search by name, email, phone or category..."
                                    value={studentSearchTerm}
                                    onChange={(e) => setStudentSearchTerm(e.target.value)}
                                />
                                <span className="student-count">
                                    Total: {filteredStudents.length} submissions
                                </span>
                            </div>

                            {loadingStudents ? (
                                <div className="loading-container">Loading student submissions...</div>
                            ) : selectedStudent ? (
                                <div className="student-detail-view">
                                    <button className="back-btn" onClick={() => setSelectedStudent(null)}>
                                        Back to List
                                    </button>
                                    <div className="student-detail-card">
                                        <h4>{selectedStudent.userName}</h4>
                                        <div className="detail-grid">
                                            <div className="detail-item">
                                                <label>Email:</label>
                                                <span>{selectedStudent.userEmail || "N/A"}</span>
                                            </div>
                                            <div className="detail-item">
                                                <label>Phone:</label>
                                                <span>{selectedStudent.userPhone || "N/A"}</span>
                                            </div>
                                            <div className="detail-item">
                                                <label>Category:</label>
                                                <span>{selectedStudent.category}</span>
                                            </div>
                                            <div className="detail-item">
                                                <label>Gender:</label>
                                                <span>{selectedStudent.gender}</span>
                                            </div>
                                            <div className="detail-item">
                                                <label>Class X %:</label>
                                                <span>{selectedStudent.classX}%</span>
                                            </div>
                                            <div className="detail-item">
                                                <label>Class XII %:</label>
                                                <span>{selectedStudent.classXII}%</span>
                                            </div>
                                            <div className="detail-item">
                                                <label>Discipline:</label>
                                                <span>{selectedStudent.discipline}</span>
                                            </div>
                                            <div className="detail-item">
                                                <label>Graduation:</label>
                                                <span>{selectedStudent.graduation}</span>
                                            </div>
                                            <div className="detail-item">
                                                <label>Grad %:</label>
                                                <span>{selectedStudent.gradPercentage}%</span>
                                            </div>
                                            <div className="detail-item">
                                                <label>Work Experience:</label>
                                                <span>{selectedStudent.workExperience} months</span>
                                            </div>
                                            <div className="detail-item">
                                                <label>Taken CAT Before:</label>
                                                <span>{selectedStudent.takenCATBefore}</span>
                                            </div>
                                            <div className="detail-item">
                                                <label>CAT Year:</label>
                                                <span>{selectedStudent.catYear || "N/A"}</span>
                                            </div>
                                            <div className="detail-item">
                                                <label>Interested Courses:</label>
                                                <span>{selectedStudent.interestedCourses?.join(", ") || "None"}</span>
                                            </div>
                                            <div className="detail-item">
                                                <label>Submitted On:</label>
                                                <span>{formatDate(selectedStudent.createdAt)}</span>
                                            </div>
                                            {selectedStudent.totalScore && (
                                                <div className="detail-item">
                                                    <label>CMAT Score:</label>
                                                    <span>{selectedStudent.totalScore}</span>
                                                </div>
                                            )}
                                            {selectedStudent.predictedPercentile && (
                                                <div className="detail-item">
                                                    <label>Predicted Percentile:</label>
                                                    <span>{selectedStudent.predictedPercentile}%</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : filteredStudents.length === 0 ? (
                                <div className="empty-state">
                                    <p>No student submissions found.</p>
                                </div>
                            ) : (
                                <div className="student-table-container">
                                    <table className="student-table">
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Phone</th>
                                                <th>Category</th>
                                                <th>Gender</th>
                                                <th>10th %</th>
                                                <th>12th %</th>
                                                <th>Grad %</th>
                                                <th>Work Exp</th>
                                                <th>Submitted</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredStudents.map(student => (
                                                <tr key={student._id}>
                                                    <td><strong>{student.userName}</strong></td>
                                                    <td>{student.userEmail || "-"}</td>
                                                    <td>{student.userPhone || "-"}</td>
                                                    <td>
                                                        <span className={`category-badge ${student.category?.toLowerCase().replace('/', '-')}`}>
                                                            {student.category}
                                                        </span>
                                                    </td>
                                                    <td>{student.gender}</td>
                                                    <td>{student.classX}%</td>
                                                    <td>{student.classXII}%</td>
                                                    <td>{student.gradPercentage}%</td>
                                                    <td>{student.workExperience} mo</td>
                                                    <td>{formatDate(student.createdAt)}</td>
                                                    <td>
                                                        <button 
                                                            className="action-btn view-btn"
                                                            onClick={() => setSelectedStudent(student)}
                                                            title="View Details"
                                                        >
                                                            <FaEye />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default IIMCollegeManagement;
