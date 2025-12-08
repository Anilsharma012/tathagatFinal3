import React, { useState, useEffect } from "react";
import { FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash, FaSearch, FaStar } from "react-icons/fa";
import http from "../../../utils/http";
import "./SuccessStoryManagement.css";

const universities = [
  "IIM Ahmedabad",
  "IIM Bangalore",
  "IIM Calcutta",
  "IIM Lucknow",
  "IIM Kozhikode",
  "IIM Indore",
  "ISB Hyderabad",
  "NMIMS Mumbai",
  "XLRI Jamshedpur",
  "FMS Delhi",
  "MDI Gurgaon",
  "SPJIMR Mumbai",
  "IIM Shillong",
  "IIM Udaipur",
  "Other"
];

const SuccessStoryManagement = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStory, setEditingStory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterUniversity, setFilterUniversity] = useState("All");
  const [formData, setFormData] = useState({
    studentName: "",
    university: "IIM Ahmedabad",
    youtubeUrl: "",
    order: 0,
    isActive: true
  });

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      setLoading(true);
      const res = await http.get("/success-stories/all");
      if (res.data?.success) {
        setStories(res.data.stories || []);
      }
    } catch (error) {
      console.error("Error fetching success stories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStory) {
        await http.put(`/success-stories/update/${editingStory._id}`, formData);
      } else {
        await http.post("/success-stories/create", formData);
      }
      fetchStories();
      closeModal();
    } catch (error) {
      console.error("Error saving success story:", error);
      alert(error.response?.data?.message || "Error saving success story");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this success story?")) return;
    try {
      await http.delete(`/success-stories/delete/${id}`);
      fetchStories();
    } catch (error) {
      console.error("Error deleting success story:", error);
    }
  };

  const handleToggleActive = async (id) => {
    try {
      await http.patch(`/success-stories/toggle-active/${id}`);
      fetchStories();
    } catch (error) {
      console.error("Error toggling story status:", error);
    }
  };

  const openEditModal = (story) => {
    setEditingStory(story);
    setFormData({
      studentName: story.studentName,
      university: story.university,
      youtubeUrl: story.youtubeUrl,
      order: story.order || 0,
      isActive: story.isActive
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingStory(null);
    setFormData({
      studentName: "",
      university: "IIM Ahmedabad",
      youtubeUrl: "",
      order: 0,
      isActive: true
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingStory(null);
  };

  const extractYouTubeId = (url) => {
    if (!url) return null;
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/live\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const getThumbnail = (url) => {
    const id = extractYouTubeId(url);
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : "";
  };

  const uniqueUniversities = [...new Set(stories.map(s => s.university))];

  const filteredStories = stories.filter(story => {
    const matchesSearch = story.studentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUniversity = filterUniversity === "All" || story.university === filterUniversity;
    return matchesSearch && matchesUniversity;
  });

  return (
    <div className="success-story-management">
      <div className="ssm-header">
        <h1>Success Stories Management</h1>
        <button className="ssm-add-btn" onClick={openCreateModal}>
          <FaPlus /> Add Success Story
        </button>
      </div>

      <div className="ssm-filters">
        <div className="ssm-search">
          <FaSearch />
          <input
            type="text"
            placeholder="Search by student name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={filterUniversity}
          onChange={(e) => setFilterUniversity(e.target.value)}
          className="ssm-university-filter"
        >
          <option value="All">All Universities</option>
          {uniqueUniversities.map(uni => (
            <option key={uni} value={uni}>{uni}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="ssm-loading">Loading success stories...</div>
      ) : filteredStories.length === 0 ? (
        <div className="ssm-empty">
          <FaStar size={48} />
          <p>No success stories found. Click "Add Success Story" to create one.</p>
        </div>
      ) : (
        <div className="ssm-table-container">
          <table className="ssm-table">
            <thead>
              <tr>
                <th>Thumbnail</th>
                <th>Student Name</th>
                <th>University</th>
                <th>Order</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStories.map(story => (
                <tr key={story._id}>
                  <td>
                    <img 
                      src={story.thumbnailUrl || getThumbnail(story.youtubeUrl)} 
                      alt={story.studentName}
                      className="ssm-thumbnail"
                    />
                  </td>
                  <td className="ssm-name-cell">{story.studentName}</td>
                  <td>
                    <span className="ssm-university-badge">
                      {story.university}
                    </span>
                  </td>
                  <td>{story.order}</td>
                  <td>
                    <span className={`ssm-status ${story.isActive ? 'active' : 'inactive'}`}>
                      {story.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="ssm-actions">
                    <button 
                      className="ssm-action-btn toggle"
                      onClick={() => handleToggleActive(story._id)}
                      title={story.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {story.isActive ? <FaEyeSlash /> : <FaEye />}
                    </button>
                    <button 
                      className="ssm-action-btn edit"
                      onClick={() => openEditModal(story)}
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button 
                      className="ssm-action-btn delete"
                      onClick={() => handleDelete(story._id)}
                      title="Delete"
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
        <div className="ssm-modal-overlay" onClick={closeModal}>
          <div className="ssm-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingStory ? 'Edit Success Story' : 'Add New Success Story'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="ssm-form-group">
                <label>Student Name *</label>
                <input
                  type="text"
                  value={formData.studentName}
                  onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                  placeholder="e.g., Rahul Sharma"
                  required
                />
              </div>

              <div className="ssm-form-group">
                <label>University *</label>
                <select
                  value={formData.university}
                  onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                  required
                >
                  {universities.map(uni => (
                    <option key={uni} value={uni}>{uni}</option>
                  ))}
                </select>
              </div>

              <div className="ssm-form-group">
                <label>YouTube Video URL *</label>
                <input
                  type="url"
                  value={formData.youtubeUrl}
                  onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  required
                />
                {formData.youtubeUrl && extractYouTubeId(formData.youtubeUrl) && (
                  <div className="ssm-preview">
                    <img 
                      src={getThumbnail(formData.youtubeUrl)} 
                      alt="Preview"
                      className="ssm-preview-img"
                    />
                  </div>
                )}
              </div>

              <div className="ssm-form-row">
                <div className="ssm-form-group">
                  <label>Display Order</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>

                <div className="ssm-form-group checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                    Active (visible on website)
                  </label>
                </div>
              </div>

              <div className="ssm-modal-actions">
                <button type="button" className="ssm-cancel-btn" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="ssm-submit-btn">
                  {editingStory ? 'Update Story' : 'Add Story'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuccessStoryManagement;
