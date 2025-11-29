import React, { useState, useEffect } from "react";
import { FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash, FaYoutube, FaSearch } from "react-icons/fa";
import http from "../../../utils/http";
import "./DemoVideoManagement.css";

const categories = ["QUANT", "VARC", "LRDI"];

const DemoVideoManagement = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [formData, setFormData] = useState({
    title: "",
    category: "QUANT",
    youtubeUrl: "",
    order: 0,
    isActive: true
  });

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const res = await http.get("/demo-videos/all");
      if (res.data?.success) {
        setVideos(res.data.videos || []);
      }
    } catch (error) {
      console.error("Error fetching videos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingVideo) {
        await http.put(`/demo-videos/update/${editingVideo._id}`, formData);
      } else {
        await http.post("/demo-videos/create", formData);
      }
      fetchVideos();
      closeModal();
    } catch (error) {
      console.error("Error saving video:", error);
      alert(error.response?.data?.message || "Error saving video");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this video?")) return;
    try {
      await http.delete(`/demo-videos/delete/${id}`);
      fetchVideos();
    } catch (error) {
      console.error("Error deleting video:", error);
    }
  };

  const handleToggleActive = async (id) => {
    try {
      await http.patch(`/demo-videos/toggle-active/${id}`);
      fetchVideos();
    } catch (error) {
      console.error("Error toggling video status:", error);
    }
  };

  const openEditModal = (video) => {
    setEditingVideo(video);
    setFormData({
      title: video.title,
      category: video.category,
      youtubeUrl: video.youtubeUrl,
      order: video.order || 0,
      isActive: video.isActive
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingVideo(null);
    setFormData({
      title: "",
      category: "QUANT",
      youtubeUrl: "",
      order: 0,
      isActive: true
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingVideo(null);
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

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "All" || video.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="demo-video-management">
      <div className="dvm-header">
        <h1>Demo Video Management</h1>
        <button className="dvm-add-btn" onClick={openCreateModal}>
          <FaPlus /> Add Video
        </button>
      </div>

      <div className="dvm-filters">
        <div className="dvm-search">
          <FaSearch />
          <input
            type="text"
            placeholder="Search videos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="dvm-category-filter"
        >
          <option value="All">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="dvm-loading">Loading videos...</div>
      ) : filteredVideos.length === 0 ? (
        <div className="dvm-empty">
          <FaYoutube size={48} />
          <p>No demo videos found. Click "Add Video" to create one.</p>
        </div>
      ) : (
        <div className="dvm-table-container">
          <table className="dvm-table">
            <thead>
              <tr>
                <th>Thumbnail</th>
                <th>Title</th>
                <th>Category</th>
                <th>Order</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVideos.map(video => (
                <tr key={video._id}>
                  <td>
                    <img 
                      src={video.thumbnailUrl || getThumbnail(video.youtubeUrl)} 
                      alt={video.title}
                      className="dvm-thumbnail"
                    />
                  </td>
                  <td className="dvm-title-cell">{video.title}</td>
                  <td>
                    <span className={`dvm-category-badge ${video.category.toLowerCase()}`}>
                      {video.category}
                    </span>
                  </td>
                  <td>{video.order}</td>
                  <td>
                    <span className={`dvm-status ${video.isActive ? 'active' : 'inactive'}`}>
                      {video.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="dvm-actions">
                    <button 
                      className="dvm-action-btn toggle"
                      onClick={() => handleToggleActive(video._id)}
                      title={video.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {video.isActive ? <FaEyeSlash /> : <FaEye />}
                    </button>
                    <button 
                      className="dvm-action-btn edit"
                      onClick={() => openEditModal(video)}
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button 
                      className="dvm-action-btn delete"
                      onClick={() => handleDelete(video._id)}
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
        <div className="dvm-modal-overlay" onClick={closeModal}>
          <div className="dvm-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingVideo ? 'Edit Video' : 'Add New Video'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="dvm-form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Time & Work in 5 Minutes"
                  required
                />
              </div>

              <div className="dvm-form-group">
                <label>Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="dvm-form-group">
                <label>YouTube URL *</label>
                <input
                  type="url"
                  value={formData.youtubeUrl}
                  onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  required
                />
                {formData.youtubeUrl && extractYouTubeId(formData.youtubeUrl) && (
                  <div className="dvm-preview">
                    <img 
                      src={getThumbnail(formData.youtubeUrl)} 
                      alt="Preview"
                      className="dvm-preview-img"
                    />
                  </div>
                )}
              </div>

              <div className="dvm-form-row">
                <div className="dvm-form-group">
                  <label>Display Order</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>

                <div className="dvm-form-group checkbox">
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

              <div className="dvm-modal-actions">
                <button type="button" className="dvm-cancel-btn" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="dvm-submit-btn">
                  {editingVideo ? 'Update Video' : 'Add Video'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DemoVideoManagement;
