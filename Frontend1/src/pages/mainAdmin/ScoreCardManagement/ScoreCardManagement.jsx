import React, { useState, useEffect } from "react";
import http from "../../../utils/http";
import "./ScoreCardManagement.css";

const ScoreCardManagement = () => {
  const [scorecards, setScorecards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentCard, setCurrentCard] = useState(null);
  const [formData, setFormData] = useState({
    percentileCategory: "99",
    studentName: "",
    percentileScore: "",
    order: 0,
    isActive: true
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");

  useEffect(() => {
    fetchScorecards();
  }, []);

  const fetchScorecards = async () => {
    try {
      setLoading(true);
      const res = await http.get("/scorecards/all");
      if (res.data?.success) {
        setScorecards(res.data.scorecards || []);
      }
    } catch (error) {
      console.error("Error fetching scorecards:", error);
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
      percentileCategory: "99",
      studentName: "",
      percentileScore: "",
      order: 0,
      isActive: true
    });
    setSelectedImage(null);
    setPreviewUrl("");
    setCurrentCard(null);
    setEditMode(false);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (card) => {
    setCurrentCard(card);
    setFormData({
      percentileCategory: card.percentileCategory,
      studentName: card.studentName || "",
      percentileScore: card.percentileScore || "",
      order: card.order || 0,
      isActive: card.isActive
    });
    setPreviewUrl(card.imageUrl);
    setEditMode(true);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formPayload = new FormData();
    formPayload.append("percentileCategory", formData.percentileCategory);
    formPayload.append("studentName", formData.studentName);
    formPayload.append("percentileScore", formData.percentileScore);
    formPayload.append("order", formData.order);
    formPayload.append("isActive", formData.isActive);
    
    if (selectedImage) {
      formPayload.append("image", selectedImage);
    }

    try {
      if (editMode && currentCard) {
        await http.put(`/scorecards/update/${currentCard._id}`, formPayload, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      } else {
        if (!selectedImage) {
          alert("Please select an image");
          return;
        }
        await http.post("/scorecards/create", formPayload, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      }
      
      setShowModal(false);
      resetForm();
      fetchScorecards();
    } catch (error) {
      console.error("Error saving scorecard:", error);
      alert("Error saving scorecard");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this scorecard?")) return;
    
    try {
      await http.delete(`/scorecards/delete/${id}`);
      fetchScorecards();
    } catch (error) {
      console.error("Error deleting scorecard:", error);
      alert("Error deleting scorecard");
    }
  };

  const handleToggleActive = async (id) => {
    try {
      await http.patch(`/scorecards/toggle-active/${id}`);
      fetchScorecards();
    } catch (error) {
      console.error("Error toggling status:", error);
    }
  };

  const filteredCards = filterCategory === "All" 
    ? scorecards 
    : scorecards.filter(card => card.percentileCategory === filterCategory);

  const getImageUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return url;
  };

  return (
    <div className="scorecard-mgmt-container">
      <div className="scorecard-mgmt-header">
        <h1>Score Card Management</h1>
        <button className="add-btn" onClick={openAddModal}>
          + Add Score Card
        </button>
      </div>

      <div className="scorecard-mgmt-filters">
        <button 
          className={filterCategory === "All" ? "active" : ""} 
          onClick={() => setFilterCategory("All")}
        >
          All
        </button>
        <button 
          className={filterCategory === "99" ? "active" : ""} 
          onClick={() => setFilterCategory("99")}
        >
          99%+
        </button>
        <button 
          className={filterCategory === "98" ? "active" : ""} 
          onClick={() => setFilterCategory("98")}
        >
          98%+
        </button>
        <button 
          className={filterCategory === "97" ? "active" : ""} 
          onClick={() => setFilterCategory("97")}
        >
          97%+
        </button>
        <button 
          className={filterCategory === "95" ? "active" : ""} 
          onClick={() => setFilterCategory("95")}
        >
          95%+
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="scorecard-mgmt-grid">
          {filteredCards.length === 0 ? (
            <div className="no-data">No scorecards found. Add some from the button above.</div>
          ) : (
            filteredCards.map((card) => (
              <div key={card._id} className={`scorecard-mgmt-card ${!card.isActive ? "inactive" : ""}`}>
                <div className="card-image">
                  <img src={getImageUrl(card.imageUrl)} alt={card.studentName || "Scorecard"} />
                </div>
                <div className="card-info">
                  <span className="category-badge">{card.percentileCategory}%+</span>
                  {card.studentName && <p className="student-name">{card.studentName}</p>}
                  {card.percentileScore && <p className="percentile">{card.percentileScore}</p>}
                  <p className="order">Order: {card.order}</p>
                  <span className={`status ${card.isActive ? "active" : "inactive"}`}>
                    {card.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="card-actions">
                  <button className="edit-btn" onClick={() => openEditModal(card)}>Edit</button>
                  <button className="toggle-btn" onClick={() => handleToggleActive(card._id)}>
                    {card.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button className="delete-btn" onClick={() => handleDelete(card._id)}>Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editMode ? "Edit Score Card" : "Add Score Card"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Percentile Category *</label>
                <select 
                  name="percentileCategory" 
                  value={formData.percentileCategory} 
                  onChange={handleInputChange}
                  required
                >
                  <option value="99">99%+</option>
                  <option value="98">98%+</option>
                  <option value="97">97%+</option>
                  <option value="95">95%+</option>
                </select>
              </div>

              <div className="form-group">
                <label>Student Name</label>
                <input 
                  type="text" 
                  name="studentName" 
                  value={formData.studentName} 
                  onChange={handleInputChange}
                  placeholder="Enter student name (optional)"
                />
              </div>

              <div className="form-group">
                <label>Percentile Score</label>
                <input 
                  type="text" 
                  name="percentileScore" 
                  value={formData.percentileScore} 
                  onChange={handleInputChange}
                  placeholder="e.g., 99.72%"
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
                <label>Score Card Image *</label>
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
                  {editMode ? "Update" : "Add"} Score Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScoreCardManagement;
