import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaImage, FaLink, FaEye } from "react-icons/fa";
import AdminLayout from "../AdminLayout/AdminLayout";
import "./PopupAnnouncementManagement.css";

const PopupAnnouncementManagement = () => {
    const [popups, setPopups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPopup, setEditingPopup] = useState(null);
    const [previewPopup, setPreviewPopup] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        title: "",
        text: "",
        image: null,
        link: "",
        linkText: "Learn More",
        isActive: true,
        startDate: "",
        endDate: ""
    });

    const fetchPopups = async () => {
        try {
            setLoading(true);
            const response = await axios.get("/api/popup-announcements");
            if (response.data.success) {
                setPopups(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching popups:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPopups();
    }, []);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({ ...prev, image: file }));
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const openAddModal = () => {
        setEditingPopup(null);
        setFormData({
            title: "",
            text: "",
            image: null,
            link: "",
            linkText: "Learn More",
            isActive: true,
            startDate: new Date().toISOString().split('T')[0],
            endDate: ""
        });
        setImagePreview(null);
        setShowModal(true);
    };

    const openEditModal = (popup) => {
        setEditingPopup(popup);
        setFormData({
            title: popup.title,
            text: popup.text || "",
            image: null,
            link: popup.link || "",
            linkText: popup.linkText || "Learn More",
            isActive: popup.isActive,
            startDate: popup.startDate ? new Date(popup.startDate).toISOString().split('T')[0] : "",
            endDate: popup.endDate ? new Date(popup.endDate).toISOString().split('T')[0] : ""
        });
        setImagePreview(popup.image ? `/uploads/popups/${popup.image}` : null);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const submitData = new FormData();
        submitData.append("title", formData.title);
        submitData.append("text", formData.text);
        submitData.append("link", formData.link);
        submitData.append("linkText", formData.linkText);
        submitData.append("isActive", formData.isActive);
        submitData.append("startDate", formData.startDate);
        submitData.append("endDate", formData.endDate || "");
        if (formData.image instanceof File) {
            submitData.append("image", formData.image);
        }

        try {
            if (editingPopup) {
                await axios.put(`/api/popup-announcements/${editingPopup._id}`, submitData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                alert("Popup updated successfully!");
            } else {
                await axios.post("/api/popup-announcements", submitData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                alert("Popup created successfully!");
            }
            setShowModal(false);
            fetchPopups();
        } catch (error) {
            console.error("Error saving popup:", error);
            alert("Failed to save popup");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this popup?")) {
            try {
                await axios.delete(`/api/popup-announcements/${id}`);
                alert("Popup deleted successfully!");
                fetchPopups();
            } catch (error) {
                console.error("Error deleting popup:", error);
                alert("Failed to delete popup");
            }
        }
    };

    const toggleStatus = async (popup) => {
        try {
            await axios.patch(`/api/popup-announcements/${popup._id}/toggle`);
            fetchPopups();
        } catch (error) {
            console.error("Error toggling status:", error);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "No end date";
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <AdminLayout>
            <div className="popup-management">
                <div className="popup-header">
                    <h1>Homepage Popup Announcements</h1>
                    <p>Manage popup announcements that appear on the homepage</p>
                    <button className="add-btn" onClick={openAddModal}>
                        <FaPlus /> Add New Popup
                    </button>
                </div>

                {loading ? (
                    <div className="loading">Loading...</div>
                ) : popups.length === 0 ? (
                    <div className="no-data">No popup announcements found. Create one to get started!</div>
                ) : (
                    <div className="popup-grid">
                        {popups.map(popup => (
                            <div key={popup._id} className={`popup-card ${popup.isActive ? 'active' : 'inactive'}`}>
                                <div className="popup-card-header">
                                    <h3>{popup.title}</h3>
                                    <span className={`status-badge ${popup.isActive ? 'active' : 'inactive'}`}>
                                        {popup.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                
                                {popup.image && (
                                    <div className="popup-image">
                                        <img src={`/uploads/popups/${popup.image}`} alt={popup.title} />
                                    </div>
                                )}
                                
                                {popup.text && (
                                    <p className="popup-text">{popup.text.substring(0, 100)}{popup.text.length > 100 ? '...' : ''}</p>
                                )}
                                
                                {popup.link && (
                                    <div className="popup-link">
                                        <FaLink /> <a href={popup.link} target="_blank" rel="noopener noreferrer">{popup.linkText}</a>
                                    </div>
                                )}
                                
                                <div className="popup-dates">
                                    <span>Start: {formatDate(popup.startDate)}</span>
                                    <span>End: {formatDate(popup.endDate)}</span>
                                </div>
                                
                                <div className="popup-actions">
                                    <button onClick={() => setPreviewPopup(popup)} title="Preview">
                                        <FaEye />
                                    </button>
                                    <button onClick={() => openEditModal(popup)} title="Edit">
                                        <FaEdit />
                                    </button>
                                    <button onClick={() => toggleStatus(popup)} title="Toggle Status">
                                        {popup.isActive ? <FaToggleOn className="toggle-on" /> : <FaToggleOff />}
                                    </button>
                                    <button onClick={() => handleDelete(popup._id)} className="delete-btn" title="Delete">
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <h2>{editingPopup ? 'Edit Popup' : 'Add New Popup'}</h2>
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label>Title *</label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Enter popup title"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Text/Description</label>
                                    <textarea
                                        name="text"
                                        value={formData.text}
                                        onChange={handleInputChange}
                                        placeholder="Enter popup description (optional)"
                                        rows="4"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Image</label>
                                    <div className="image-upload-area">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleImageChange}
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                        />
                                        <button 
                                            type="button" 
                                            className="upload-btn"
                                            onClick={() => fileInputRef.current.click()}
                                        >
                                            <FaImage /> Choose Image
                                        </button>
                                        {imagePreview && (
                                            <div className="image-preview">
                                                <img src={imagePreview} alt="Preview" />
                                                <button 
                                                    type="button" 
                                                    className="remove-image"
                                                    onClick={() => {
                                                        setImagePreview(null);
                                                        setFormData(prev => ({ ...prev, image: null }));
                                                    }}
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Link URL</label>
                                        <input
                                            type="url"
                                            name="link"
                                            value={formData.link}
                                            onChange={handleInputChange}
                                            placeholder="https://example.com"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Link Text</label>
                                        <input
                                            type="text"
                                            name="linkText"
                                            value={formData.linkText}
                                            onChange={handleInputChange}
                                            placeholder="Learn More"
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Start Date</label>
                                        <input
                                            type="date"
                                            name="startDate"
                                            value={formData.startDate}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>End Date (Optional)</label>
                                        <input
                                            type="date"
                                            name="endDate"
                                            value={formData.endDate}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>

                                <div className="form-group checkbox-group">
                                    <label>
                                        <input
                                            type="checkbox"
                                            name="isActive"
                                            checked={formData.isActive}
                                            onChange={handleInputChange}
                                        />
                                        Active (Show on homepage)
                                    </label>
                                </div>

                                <div className="modal-actions">
                                    <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
                                    <button type="submit" className="submit-btn">
                                        {editingPopup ? 'Update Popup' : 'Create Popup'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {previewPopup && (
                    <div className="preview-overlay" onClick={() => setPreviewPopup(null)}>
                        <div className="preview-popup" onClick={e => e.stopPropagation()}>
                            <button className="close-preview" onClick={() => setPreviewPopup(null)}>×</button>
                            {previewPopup.image && (
                                <img src={`/uploads/popups/${previewPopup.image}`} alt={previewPopup.title} />
                            )}
                            <h2>{previewPopup.title}</h2>
                            {previewPopup.text && <p>{previewPopup.text}</p>}
                            {previewPopup.link && (
                                <a href={previewPopup.link} target="_blank" rel="noopener noreferrer" className="preview-link">
                                    {previewPopup.linkText || 'Learn More'}
                                </a>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default PopupAnnouncementManagement;
