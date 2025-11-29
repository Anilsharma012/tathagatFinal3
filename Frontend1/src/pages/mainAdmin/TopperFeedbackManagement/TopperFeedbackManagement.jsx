import React, { useState, useEffect } from "react";
import http from "../../../utils/http";
import "./TopperFeedbackManagement.css";

const TopperFeedbackManagement = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState(null);
  const [formData, setFormData] = useState({
    studentName: "",
    order: 0,
    isActive: true
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const res = await http.get("/topper-feedback/all");
      if (res.data?.success) {
        setFeedbacks(res.data.feedbacks || []);
      }
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
    } finally {
      setLoading(false);
    }
  };

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
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const resetForm = () => {
    setFormData({
      studentName: "",
      order: 0,
      isActive: true
    });
    setSelectedImage(null);
    setPreviewUrl("");
    setCurrentFeedback(null);
    setEditMode(false);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (feedback) => {
    setCurrentFeedback(feedback);
    setFormData({
      studentName: feedback.studentName || "",
      order: feedback.order || 0,
      isActive: feedback.isActive
    });
    setPreviewUrl(feedback.imageUrl);
    setEditMode(true);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formPayload = new FormData();
    formPayload.append("studentName", formData.studentName);
    formPayload.append("order", formData.order);
    formPayload.append("isActive", formData.isActive);
    
    if (selectedImage) {
      formPayload.append("image", selectedImage);
    }

    try {
      if (editMode && currentFeedback) {
        await http.put(`/topper-feedback/update/${currentFeedback._id}`, formPayload, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      } else {
        if (!selectedImage) {
          alert("Please select an image");
          return;
        }
        await http.post("/topper-feedback/create", formPayload, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      }
      
      setShowModal(false);
      resetForm();
      fetchFeedbacks();
    } catch (error) {
      console.error("Error saving feedback:", error);
      alert("Error saving feedback");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this feedback?")) return;
    
    try {
      await http.delete(`/topper-feedback/delete/${id}`);
      fetchFeedbacks();
    } catch (error) {
      console.error("Error deleting feedback:", error);
      alert("Error deleting feedback");
    }
  };

  const handleToggleActive = async (id) => {
    try {
      await http.patch(`/topper-feedback/toggle-active/${id}`);
      fetchFeedbacks();
    } catch (error) {
      console.error("Error toggling status:", error);
    }
  };

  const getImageUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return url;
  };

  return (
    <div className="feedback-mgmt-container">
      <div className="feedback-mgmt-header">
        <h1>Toppers' Feedback Management</h1>
        <button className="add-btn" onClick={openAddModal}>
          + Add Feedback
        </button>
      </div>

      <p className="feedback-info">
        Manage the testimonial images shown in the "TathaGat Toppers' Feedback" section on the Score Card page.
      </p>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="feedback-mgmt-grid">
          {feedbacks.length === 0 ? (
            <div className="no-data">No feedback images found. Add some from the button above.</div>
          ) : (
            feedbacks.map((feedback) => (
              <div key={feedback._id} className={`feedback-mgmt-card ${!feedback.isActive ? "inactive" : ""}`}>
                <div className="card-image">
                  <img src={getImageUrl(feedback.imageUrl)} alt={feedback.studentName || "Feedback"} />
                </div>
                <div className="card-info">
                  {feedback.studentName && <p className="student-name">{feedback.studentName}</p>}
                  <p className="order">Order: {feedback.order}</p>
                  <span className={`status ${feedback.isActive ? "active" : "inactive"}`}>
                    {feedback.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="card-actions">
                  <button className="edit-btn" onClick={() => openEditModal(feedback)}>Edit</button>
                  <button className="toggle-btn" onClick={() => handleToggleActive(feedback._id)}>
                    {feedback.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button className="delete-btn" onClick={() => handleDelete(feedback._id)}>Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editMode ? "Edit Feedback" : "Add Feedback"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Student Name (optional)</label>
                <input 
                  type="text" 
                  name="studentName" 
                  value={formData.studentName} 
                  onChange={handleInputChange}
                  placeholder="Enter student name"
                />
              </div>

              <div className="form-group">
                <label>Display Order</label>
                <input 
                  type="number" 
                  name="order" 
                  value={formData.order} 
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Feedback Image *</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange}
                  required={!editMode}
                />
                {previewUrl && (
                  <div className="image-preview">
                    <img src={previewUrl} alt="Preview" />
                  </div>
                )}
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

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  {editMode ? "Update" : "Add"} Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopperFeedbackManagement;
