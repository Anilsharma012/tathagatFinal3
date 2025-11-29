import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff } from "react-icons/fa";
import AdminLayout from "../AdminLayout/AdminLayout";
import "./BSchoolManagement.css";

const BSchoolManagement = () => {
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCategory, setFilterCategory] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingSchool, setEditingSchool] = useState(null);
    
    const [formData, setFormData] = useState({
        name: "",
        category: "noSectionalCutOffs",
        highestPackage: "",
        avgPackage: "",
        exams: "",
        order: 0,
        isActive: true
    });

    const categories = [
        { value: "noSectionalCutOffs", label: "No Sectional Cut Offs" },
        { value: "lessAcadsWeightage", label: "Less Acads Weightage" },
        { value: "bSchoolsViaXAT", label: "B-Schools via XAT" }
    ];

    const fetchSchools = async () => {
        try {
            setLoading(true);
            const response = await axios.get("/api/bschools/admin/all");
            if (response.data.success) {
                setSchools(response.data.schools);
            }
        } catch (error) {
            console.error("Error fetching B-Schools:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSchools();
    }, []);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const openAddModal = () => {
        setEditingSchool(null);
        setFormData({
            name: "",
            category: "noSectionalCutOffs",
            highestPackage: "",
            avgPackage: "",
            exams: "",
            order: 0,
            isActive: true
        });
        setShowModal(true);
    };

    const openEditModal = (school) => {
        setEditingSchool(school);
        setFormData({
            name: school.name,
            category: school.category,
            highestPackage: school.highestPackage,
            avgPackage: school.avgPackage,
            exams: school.exams,
            order: school.order || 0,
            isActive: school.isActive
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingSchool) {
                await axios.put(`/api/bschools/admin/${editingSchool._id}`, formData);
                alert("B-School updated successfully!");
            } else {
                await axios.post("/api/bschools/admin", formData);
                alert("B-School added successfully!");
            }
            setShowModal(false);
            fetchSchools();
        } catch (error) {
            console.error("Error saving B-School:", error);
            alert("Failed to save B-School");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this B-School?")) {
            try {
                await axios.delete(`/api/bschools/admin/${id}`);
                alert("B-School deleted successfully!");
                fetchSchools();
            } catch (error) {
                console.error("Error deleting B-School:", error);
                alert("Failed to delete B-School");
            }
        }
    };

    const toggleStatus = async (school) => {
        try {
            await axios.put(`/api/bschools/admin/${school._id}`, {
                ...school,
                isActive: !school.isActive
            });
            fetchSchools();
        } catch (error) {
            console.error("Error toggling status:", error);
        }
    };

    const filteredSchools = schools.filter(school => {
        const matchesSearch = school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             school.exams.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = !filterCategory || school.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const getCategoryLabel = (value) => {
        const cat = categories.find(c => c.value === value);
        return cat ? cat.label : value;
    };

    const getCategoryBadgeClass = (category) => {
        switch (category) {
            case "noSectionalCutOffs": return "badge-success";
            case "lessAcadsWeightage": return "badge-info";
            case "bSchoolsViaXAT": return "badge-primary";
            default: return "badge-secondary";
        }
    };

    return (
        <AdminLayout>
            <div className="bschool-management">
                <div className="bschool-header">
                    <h1>B-Schools Management</h1>
                    <p>Manage B-Schools displayed on IIM Predictor page by categories</p>
                </div>

                <div className="bschool-actions">
                    <div className="search-filter-row">
                        <input
                            type="text"
                            placeholder="Search by name or exams..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="filter-select"
                        >
                            <option value="">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                            ))}
                        </select>
                    </div>
                    <button onClick={openAddModal} className="add-btn">
                        <FaPlus /> Add B-School
                    </button>
                </div>

                {loading ? (
                    <div className="loading">Loading B-Schools...</div>
                ) : (
                    <div className="bschool-table-container">
                        <table className="bschool-table">
                            <thead>
                                <tr>
                                    <th>Order</th>
                                    <th>Name</th>
                                    <th>Category</th>
                                    <th>Highest Package</th>
                                    <th>Avg Package</th>
                                    <th>Exams</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSchools.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="no-data">No B-Schools found</td>
                                    </tr>
                                ) : (
                                    filteredSchools.map((school, index) => (
                                        <tr key={school._id}>
                                            <td>{school.order || index + 1}</td>
                                            <td className="school-name">{school.name}</td>
                                            <td>
                                                <span className={`category-badge ${getCategoryBadgeClass(school.category)}`}>
                                                    {getCategoryLabel(school.category)}
                                                </span>
                                            </td>
                                            <td>{school.highestPackage}</td>
                                            <td>{school.avgPackage}</td>
                                            <td>{school.exams}</td>
                                            <td>
                                                <button
                                                    onClick={() => toggleStatus(school)}
                                                    className={`status-btn ${school.isActive ? 'active' : 'inactive'}`}
                                                >
                                                    {school.isActive ? <FaToggleOn /> : <FaToggleOff />}
                                                    {school.isActive ? 'Active' : 'Inactive'}
                                                </button>
                                            </td>
                                            <td className="action-btns">
                                                <button onClick={() => openEditModal(school)} className="edit-btn">
                                                    <FaEdit />
                                                </button>
                                                <button onClick={() => handleDelete(school._id)} className="delete-btn">
                                                    <FaTrash />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {showModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h2>{editingSchool ? 'Edit B-School' : 'Add B-School'}</h2>
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label>School Name *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="e.g., FMS Delhi"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Category *</label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        {categories.map(cat => (
                                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Highest Package *</label>
                                        <input
                                            type="text"
                                            name="highestPackage"
                                            value={formData.highestPackage}
                                            onChange={handleInputChange}
                                            placeholder="e.g., 120 Lakh"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Avg Package *</label>
                                        <input
                                            type="text"
                                            name="avgPackage"
                                            value={formData.avgPackage}
                                            onChange={handleInputChange}
                                            placeholder="e.g., 34.1 Lakh"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Exams *</label>
                                    <input
                                        type="text"
                                        name="exams"
                                        value={formData.exams}
                                        onChange={handleInputChange}
                                        placeholder="e.g., CAT/XAT/GMAT"
                                        required
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Display Order</label>
                                        <input
                                            type="number"
                                            name="order"
                                            value={formData.order}
                                            onChange={handleInputChange}
                                            min="0"
                                        />
                                    </div>
                                    <div className="form-group checkbox-group">
                                        <label>
                                            <input
                                                type="checkbox"
                                                name="isActive"
                                                checked={formData.isActive}
                                                onChange={handleInputChange}
                                            />
                                            Active
                                        </label>
                                    </div>
                                </div>

                                <div className="modal-actions">
                                    <button type="button" onClick={() => setShowModal(false)} className="cancel-btn">
                                        Cancel
                                    </button>
                                    <button type="submit" className="submit-btn">
                                        {editingSchool ? 'Update' : 'Add'} B-School
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default BSchoolManagement;
