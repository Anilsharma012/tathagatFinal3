import React, { useState, useEffect } from 'react';
import { FaVideo, FaImage, FaPlus, FaEdit, FaTrash, FaStar, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { toast } from 'react-toastify';
import './ImageGalleryManagement.css';

const ImageGalleryManagement = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [activeTab, setActiveTab] = useState('video');
  const [formData, setFormData] = useState({
    type: 'video',
    title: '',
    description: '',
    youtubeUrl: '',
    isActive: true,
    isFeatured: false,
    order: 0
  });
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const getToken = () => localStorage.getItem('adminToken') || localStorage.getItem('authToken');

  const fetchItems = async () => {
    try {
      const response = await fetch(`/api/gallery/admin?type=${activeTab}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await response.json();
      if (data.success) {
        setItems(data.data);
      }
    } catch (error) {
      console.error('Error fetching gallery items:', error);
      toast.error('Failed to fetch gallery items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [activeTab]);

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        type: item.type,
        title: item.title || '',
        description: item.description || '',
        youtubeUrl: item.youtubeUrl || '',
        isActive: item.isActive !== undefined ? item.isActive : true,
        isFeatured: item.isFeatured || false,
        order: item.order || 0
      });
    } else {
      setEditingItem(null);
      setFormData({
        type: activeTab,
        title: '',
        description: '',
        youtubeUrl: '',
        isActive: true,
        isFeatured: false,
        order: items.length
      });
    }
    setImageFile(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setImageFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('type', formData.type);
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description || '');
      formDataToSend.append('isActive', formData.isActive);
      formDataToSend.append('isFeatured', formData.isFeatured);
      formDataToSend.append('order', formData.order);

      if (formData.type === 'video') {
        formDataToSend.append('youtubeUrl', formData.youtubeUrl);
      }

      if (formData.type === 'image' && imageFile) {
        formDataToSend.append('image', imageFile);
      }

      const url = editingItem
        ? `/api/gallery/admin/${editingItem._id}`
        : '/api/gallery/admin';

      const method = editingItem ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${getToken()}` },
        body: formDataToSend
      });

      const data = await response.json();

      if (data.success) {
        toast.success(editingItem ? 'Item updated successfully' : 'Item created successfully');
        handleCloseModal();
        fetchItems();
      } else {
        toast.error(data.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error('Failed to save item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      const response = await fetch(`/api/gallery/admin/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Item deleted successfully');
        fetchItems();
      } else {
        toast.error(data.message || 'Delete failed');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  const handleToggleActive = async (item) => {
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('isActive', !item.isActive);

      const response = await fetch(`/api/gallery/admin/${item._id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${getToken()}` },
        body: formDataToSend
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Item ${!item.isActive ? 'activated' : 'deactivated'}`);
        fetchItems();
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleToggleFeatured = async (item) => {
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('isFeatured', !item.isFeatured);

      const response = await fetch(`/api/gallery/admin/${item._id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${getToken()}` },
        body: formDataToSend
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Item ${!item.isFeatured ? 'set as featured' : 'removed from featured'}`);
        fetchItems();
      }
    } catch (error) {
      console.error('Error toggling featured:', error);
      toast.error('Failed to update featured status');
    }
  };

  const handleReorder = async (index, direction) => {
    const newItems = [...items];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= newItems.length) return;

    [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];

    const reorderData = newItems.map((item, idx) => ({
      id: item._id,
      order: idx
    }));

    try {
      const response = await fetch('/api/gallery/admin/reorder', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ items: reorderData })
      });

      const data = await response.json();

      if (data.success) {
        setItems(newItems.map((item, idx) => ({ ...item, order: idx })));
        toast.success('Order updated');
      }
    } catch (error) {
      console.error('Error reordering:', error);
      toast.error('Failed to reorder');
    }
  };

  const extractVideoId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  return (
    <div className="gallery-management">
      <div className="gallery-header">
        <div>
          <h1>Image Gallery Management</h1>
          <p>Manage videos and images for the gallery page</p>
        </div>
        <button className="add-btn" onClick={() => handleOpenModal()}>
          <FaPlus /> Add {activeTab === 'video' ? 'Video' : 'Image'}
        </button>
      </div>

      <div className="gallery-tabs">
        <button
          className={`tab-btn ${activeTab === 'video' ? 'active' : ''}`}
          onClick={() => setActiveTab('video')}
        >
          <FaVideo /> Videos
        </button>
        <button
          className={`tab-btn ${activeTab === 'image' ? 'active' : ''}`}
          onClick={() => setActiveTab('image')}
        >
          <FaImage /> Images
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="gallery-grid">
          {items.length === 0 ? (
            <div className="no-items">
              No {activeTab}s found. Click "Add {activeTab === 'video' ? 'Video' : 'Image'}" to create one.
            </div>
          ) : (
            items.map((item, index) => (
              <div key={item._id} className={`gallery-card ${!item.isActive ? 'inactive' : ''}`}>
                <div className="card-thumbnail">
                  {item.type === 'video' ? (
                    <img
                      src={item.thumbnailUrl || `https://img.youtube.com/vi/${extractVideoId(item.youtubeUrl)}/hqdefault.jpg`}
                      alt={item.title}
                    />
                  ) : (
                    <img src={item.imagePath} alt={item.title} />
                  )}
                  {item.isFeatured && (
                    <span className="featured-badge">
                      <FaStar /> Featured
                    </span>
                  )}
                  {!item.isActive && <span className="inactive-badge">Inactive</span>}
                </div>
                <div className="card-content">
                  <h3>{item.title}</h3>
                  {item.description && <p>{item.description}</p>}
                  {item.type === 'video' && (
                    <small className="video-url">{item.youtubeUrl}</small>
                  )}
                </div>
                <div className="card-actions">
                  <button
                    className="action-btn reorder"
                    onClick={() => handleReorder(index, 'up')}
                    disabled={index === 0}
                    title="Move Up"
                  >
                    <FaArrowUp />
                  </button>
                  <button
                    className="action-btn reorder"
                    onClick={() => handleReorder(index, 'down')}
                    disabled={index === items.length - 1}
                    title="Move Down"
                  >
                    <FaArrowDown />
                  </button>
                  <button
                    className={`action-btn featured ${item.isFeatured ? 'active' : ''}`}
                    onClick={() => handleToggleFeatured(item)}
                    title={item.isFeatured ? 'Remove Featured' : 'Set as Featured'}
                  >
                    <FaStar />
                  </button>
                  <button
                    className="action-btn edit"
                    onClick={() => handleOpenModal(item)}
                    title="Edit"
                  >
                    <FaEdit />
                  </button>
                  <button
                    className={`action-btn toggle ${item.isActive ? '' : 'inactive'}`}
                    onClick={() => handleToggleActive(item)}
                    title={item.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {item.isActive ? 'ON' : 'OFF'}
                  </button>
                  <button
                    className="action-btn delete"
                    onClick={() => handleDelete(item._id)}
                    title="Delete"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingItem ? 'Edit' : 'Add'} {formData.type === 'video' ? 'Video' : 'Image'}</h2>
              <button className="close-btn" onClick={handleCloseModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  disabled={editingItem}
                >
                  <option value="video">Video</option>
                  <option value="image">Image</option>
                </select>
              </div>

              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="Enter title"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter description (optional)"
                  rows="3"
                />
              </div>

              {formData.type === 'video' && (
                <div className="form-group">
                  <label>YouTube URL *</label>
                  <input
                    type="text"
                    value={formData.youtubeUrl}
                    onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                    required
                    placeholder="https://youtube.com/watch?v=... or https://youtu.be/..."
                  />
                  {formData.youtubeUrl && extractVideoId(formData.youtubeUrl) && (
                    <div className="video-preview">
                      <img
                        src={`https://img.youtube.com/vi/${extractVideoId(formData.youtubeUrl)}/hqdefault.jpg`}
                        alt="Video thumbnail"
                      />
                    </div>
                  )}
                </div>
              )}

              {formData.type === 'image' && (
                <div className="form-group">
                  <label>Image File {!editingItem && '*'}</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files[0])}
                    required={!editingItem}
                  />
                  {imageFile && (
                    <div className="image-preview">
                      <img src={URL.createObjectURL(imageFile)} alt="Preview" />
                    </div>
                  )}
                  {editingItem && editingItem.imagePath && !imageFile && (
                    <div className="image-preview">
                      <img src={editingItem.imagePath} alt="Current" />
                      <small>Current image (upload new to replace)</small>
                    </div>
                  )}
                </div>
              )}

              <div className="form-row">
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                    Active
                  </label>
                </div>
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    />
                    Featured (shows in hero section)
                  </label>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn" disabled={submitting}>
                  {submitting ? 'Saving...' : (editingItem ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGalleryManagement;
