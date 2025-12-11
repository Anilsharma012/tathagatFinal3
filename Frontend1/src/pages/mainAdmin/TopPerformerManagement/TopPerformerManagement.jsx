import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './TopPerformerManagement.css';

const TopPerformerManagement = () => {
  const [performers, setPerformers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPerformer, setEditingPerformer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    percentile: '',
    displayOrder: 0,
    isActive: true
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const fetchPerformers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/top-performers/admin`, {
        headers: getAuthHeaders()
      });
      if (res.data.success) {
        setPerformers(res.data.performers);
      }
    } catch (error) {
      console.error('Error fetching performers:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPerformers();
  }, [fetchPerformers]);

  const openAddModal = () => {
    setEditingPerformer(null);
    setFormData({ name: '', percentile: '', displayOrder: performers.length + 1, isActive: true });
    setSelectedFile(null);
    setPreviewUrl('');
    setShowModal(true);
  };

  const openEditModal = (performer) => {
    setEditingPerformer(performer);
    setFormData({
      name: performer.name,
      percentile: performer.percentile,
      displayOrder: performer.displayOrder,
      isActive: performer.isActive
    });
    setSelectedFile(null);
    setPreviewUrl(performer.photoUrl ? `/uploads/top-performers/${performer.photoUrl}` : '');
    setShowModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const formDataObj = new FormData();
      formDataObj.append('name', formData.name);
      formDataObj.append('percentile', formData.percentile);
      formDataObj.append('displayOrder', formData.displayOrder);
      formDataObj.append('isActive', formData.isActive);
      if (selectedFile) {
        formDataObj.append('photo', selectedFile);
      }

      if (editingPerformer) {
        await axios.put(
          `/api/top-performers/admin/${editingPerformer._id}`,
          formDataObj,
          { headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' } }
        );
      } else {
        await axios.post(
          `/api/top-performers/admin`,
          formDataObj,
          { headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' } }
        );
      }

      setShowModal(false);
      fetchPerformers();
    } catch (error) {
      console.error('Error saving performer:', error);
      alert('Failed to save performer');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this performer?')) return;
    
    try {
      await axios.delete(`/api/top-performers/admin/${id}`, {
        headers: getAuthHeaders()
      });
      fetchPerformers();
    } catch (error) {
      console.error('Error deleting performer:', error);
      alert('Failed to delete performer');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await axios.patch(`/api/top-performers/admin/${id}/toggle`, {}, {
        headers: getAuthHeaders()
      });
      fetchPerformers();
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const moveUp = async (index) => {
    if (index === 0) return;
    const newPerformers = [...performers];
    [newPerformers[index - 1], newPerformers[index]] = [newPerformers[index], newPerformers[index - 1]];
    await reorderPerformers(newPerformers);
  };

  const moveDown = async (index) => {
    if (index === performers.length - 1) return;
    const newPerformers = [...performers];
    [newPerformers[index], newPerformers[index + 1]] = [newPerformers[index + 1], newPerformers[index]];
    await reorderPerformers(newPerformers);
  };

  const reorderPerformers = async (newOrder) => {
    setPerformers(newOrder);
    try {
      await axios.post(
        `/api/top-performers/admin/reorder`,
        { orderedIds: newOrder.map(p => p._id) },
        { headers: getAuthHeaders() }
      );
      fetchPerformers();
    } catch (error) {
      console.error('Error reordering:', error);
    }
  };

  return (
    <div className="top-performer-management">
      <div className="page-header">
        <h1>Best Results Management</h1>
        <p>Manage student success stories shown on the mock test page</p>
      </div>

      <div className="actions-bar">
        <button className="btn-add" onClick={openAddModal}>
          + Add New Performer
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="performers-table">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Photo</th>
                <th>Name</th>
                <th>Percentile</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {performers.map((performer, index) => (
                <tr key={performer._id}>
                  <td>
                    <div className="order-controls">
                      <button 
                        onClick={() => moveUp(index)} 
                        disabled={index === 0}
                        className="order-btn"
                      >
                        ▲
                      </button>
                      <span>{index + 1}</span>
                      <button 
                        onClick={() => moveDown(index)} 
                        disabled={index === performers.length - 1}
                        className="order-btn"
                      >
                        ▼
                      </button>
                    </div>
                  </td>
                  <td>
                    {performer.photoUrl ? (
                      <img 
                        src={`/uploads/top-performers/${performer.photoUrl}`} 
                        alt={performer.name}
                        className="performer-thumb"
                      />
                    ) : (
                      <div className="no-photo">No Photo</div>
                    )}
                  </td>
                  <td>{performer.name}</td>
                  <td><span className="percentile-badge">{performer.percentile}</span></td>
                  <td>
                    <button 
                      className={`status-btn ${performer.isActive ? 'active' : 'inactive'}`}
                      onClick={() => handleToggleStatus(performer._id)}
                    >
                      {performer.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td>
                    <button className="btn-edit" onClick={() => openEditModal(performer)}>Edit</button>
                    <button className="btn-delete" onClick={() => handleDelete(performer._id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {performers.length === 0 && (
                <tr>
                  <td colSpan="6" className="empty-message">No performers added yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>{editingPerformer ? 'Edit Performer' : 'Add New Performer'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Student Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter student name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Percentile *</label>
                <input
                  type="text"
                  value={formData.percentile}
                  onChange={(e) => setFormData({...formData, percentile: e.target.value})}
                  placeholder="e.g., 99.99 %ILE"
                  required
                />
              </div>

              <div className="form-group">
                <label>Photo</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                />
                {previewUrl && (
                  <div className="photo-preview">
                    <img src={previewUrl} alt="Preview" />
                  </div>
                )}
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  />
                  Active (visible on website)
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-cancel">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-save">
                  {saving ? 'Saving...' : (editingPerformer ? 'Update' : 'Add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopPerformerManagement;
