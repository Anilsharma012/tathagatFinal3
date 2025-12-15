import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaEye, FaFileAlt, FaFilter, FaSearch, FaBook, FaVideo, FaHistory, FaFilePdf } from 'react-icons/fa';
import { toast } from 'react-toastify';
import './StudyMaterials.css';

const StudyMaterials = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Study Materials');
  const [filters, setFilters] = useState({
    subject: 'All Subjects',
    category: 'All Categories',
    type: 'All Types',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    subject: 'Quantitative Aptitude',
    category: 'Study Materials',
    type: 'PDF',
    tags: '',
    file: null
  });

  const [uploadLoading, setUploadLoading] = useState(false);
  
  // Preview and Edit modal states
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    subject: '',
    category: '',
    type: '',
    tags: ''
  });
  const [editLoading, setEditLoading] = useState(false);

  const subjects = ['All Subjects', 'Quantitative Aptitude', 'Verbal Ability', 'Data Interpretation', 'Logical Reasoning', 'General Knowledge'];
  const categories = ['All Categories', 'Study Materials', 'Video Lectures', 'Previous Year Papers'];
  const types = ['All Types', 'PDF', 'Video', 'Practice Sets', 'Notes', 'Other'];

  const openUploadModal = (category, forceType = null) => {
    setSelectedCategory(category);
    setUploadData(prev => ({
      ...prev,
      category: category,
      type: forceType || (category === 'Video Lectures' ? 'Video' : 'PDF')
    }));
    setShowUploadModal(true);
  };

  // Fetch study materials
  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const queryParams = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.subject !== 'All Subjects' && { subject: filters.subject }),
        ...(filters.type !== 'All Types' && { type: filters.type }),
        ...(filters.search && { search: filters.search })
      });

      const response = await fetch(`/api/study-materials/admin?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setMaterials(data.data);
        setPagination(data.pagination);
      } else {
        toast.error(data.message || 'Failed to fetch study materials');
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
      toast.error('Failed to fetch study materials');
    } finally {
      setLoading(false);
    }
  };

  // Upload study material
  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!uploadData.file) {
      toast.error('Please select a file to upload');
      return;
    }

    setUploadLoading(true);
    
    try {
      const token = localStorage.getItem('authToken');
      const formData = new FormData();
      
      formData.append('title', uploadData.title);
      formData.append('description', uploadData.description);
      formData.append('subject', uploadData.subject);
      formData.append('category', uploadData.category);
      formData.append('type', uploadData.type);
      formData.append('tags', uploadData.tags);
      formData.append('file', uploadData.file);

      const response = await fetch('/api/study-materials/admin/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Study material uploaded successfully!');
        setShowUploadModal(false);
        setUploadData({
          title: '',
          description: '',
          subject: 'Quantitative Aptitude',
          category: 'Study Materials',
          type: 'PDF',
          tags: '',
          file: null
        });
        fetchMaterials();
      } else {
        toast.error(data.message || 'Failed to upload study material');
      }
    } catch (error) {
      console.error('Error uploading material:', error);
      toast.error('Failed to upload study material');
    } finally {
      setUploadLoading(false);
    }
  };

  // Delete study material
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this study material?')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/study-materials/admin/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Study material deleted successfully!');
        fetchMaterials();
      } else {
        toast.error(data.message || 'Failed to delete study material');
      }
    } catch (error) {
      console.error('Error deleting material:', error);
      toast.error('Failed to delete study material');
    }
  };

  // Handle Preview
  const handlePreview = (material) => {
    setSelectedMaterial(material);
    setShowPreviewModal(true);
  };

  // Handle Edit - open edit modal with material data
  const handleEdit = (material) => {
    setSelectedMaterial(material);
    setEditData({
      title: material.title || '',
      description: material.description || '',
      subject: material.subject || 'Quantitative Aptitude',
      category: material.category || 'Study Materials',
      type: material.type || 'PDF',
      tags: material.tags ? (Array.isArray(material.tags) ? material.tags.join(', ') : material.tags) : ''
    });
    setShowEditModal(true);
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMaterial) return;

    setEditLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/study-materials/admin/${selectedMaterial._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: editData.title,
          description: editData.description,
          subject: editData.subject,
          category: editData.category,
          type: editData.type,
          tags: editData.tags
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Study material updated successfully!');
        setShowEditModal(false);
        setSelectedMaterial(null);
        fetchMaterials();
      } else {
        toast.error(data.message || 'Failed to update study material');
      }
    } catch (error) {
      console.error('Error updating material:', error);
      toast.error('Failed to update study material');
    } finally {
      setEditLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  useEffect(() => {
    fetchMaterials();
  }, [pagination.page, filters]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'PDF': return '📄';
      case 'Video': return '🎥';
      case 'Practice Sets': return '📝';
      case 'Notes': return '📖';
      default: return '📁';
    }
  };

  return (
    <div className="study-materials-container">
      <div className="study-materials-header">
        <div className="header-left">
          <h1><FaFileAlt /> Study Materials Management</h1>
          <p>Upload and manage study materials for students</p>
        </div>
        <div className="upload-buttons-group">
          <button 
            className="upload-btn upload-btn-pdf"
            onClick={() => openUploadModal('Study Materials', 'PDF')}
          >
            <FaFilePdf /> PDF Upload
          </button>
          <button 
            className="upload-btn upload-btn-study"
            onClick={() => openUploadModal('Study Materials')}
          >
            <FaBook /> Upload Study Material
          </button>
          <button 
            className="upload-btn upload-btn-video"
            onClick={() => openUploadModal('Video Lectures')}
          >
            <FaVideo /> Upload Video Lecture
          </button>
          <button 
            className="upload-btn upload-btn-papers"
            onClick={() => openUploadModal('Previous Year Papers')}
          >
            <FaHistory /> Upload Previous Year Paper
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="materials-filters">
        <div className="filter-group">
          <FaFilter className="filter-icon" />
          <select 
            value={filters.subject}
            onChange={(e) => handleFilterChange('subject', e.target.value)}
          >
            {subjects.map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <select 
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <select 
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
          >
            {types.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className="search-group">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search materials..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>
      </div>

      {/* Materials Table */}
      <div className="materials-table-container">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading study materials...</p>
          </div>
        ) : (
          <table className="materials-table">
            <thead>
              <tr>
                <th>Material</th>
                <th>Category</th>
                <th>Subject</th>
                <th>Type</th>
                <th>Size</th>
                <th>Downloads</th>
                <th>Uploaded</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {materials.length === 0 ? (
                <tr>
                  <td colSpan="7" className="no-data">
                    No study materials found
                  </td>
                </tr>
              ) : (
                materials.map((material) => (
                  <tr key={material._id}>
                    <td className="material-info">
                      <div className="material-details">
                        <span className="file-icon">{getFileIcon(material.type)}</span>
                        <div>
                          <h4>{material.title}</h4>
                          <p>{material.description}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="subject-badge">{material.subject}</span>
                    </td>
                    <td>
                      <span className="type-badge">{material.type}</span>
                    </td>
                    <td>{material.fileSize}</td>
                    <td>{material.downloadCount}</td>
                    <td>{formatDate(material.createdAt)}</td>
                    <td className="actions">
                      <button 
                        className="action-btn view-btn"
                        title="View Details"
                        onClick={() => handlePreview(material)}
                      >
                        <FaEye />
                      </button>
                      <button 
                        className="action-btn edit-btn"
                        title="Edit Material"
                        onClick={() => handleEdit(material)}
                      >
                        <FaEdit />
                      </button>
                      <button 
                        className="action-btn delete-btn"
                        title="Delete Material"
                        onClick={() => handleDelete(material._id)}
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="pagination">
          <button 
            disabled={pagination.page === 1}
            onClick={() => handlePageChange(pagination.page - 1)}
          >
            Previous
          </button>
          
          <span className="page-info">
            Page {pagination.page} of {pagination.pages}
          </span>
          
          <button 
            disabled={pagination.page === pagination.pages}
            onClick={() => handlePageChange(pagination.page + 1)}
          >
            Next
          </button>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="upload-modal">
            <div className="modal-header">
              <h2>Upload {selectedCategory}</h2>
              <button 
                className="close-btn"
                onClick={() => setShowUploadModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpload} className="upload-form">
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={uploadData.title}
                  onChange={(e) => setUploadData(prev => ({ ...prev, title: e.target.value }))}
                  required
                  placeholder="Enter material title"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={uploadData.description}
                  onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter description (optional)"
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Subject *</label>
                  <select
                    value={uploadData.subject}
                    onChange={(e) => setUploadData(prev => ({ ...prev, subject: e.target.value }))}
                    required
                  >
                    {subjects.filter(s => s !== 'All Subjects').map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Type *</label>
                  <select
                    value={uploadData.type}
                    onChange={(e) => setUploadData(prev => ({ ...prev, type: e.target.value }))}
                    required
                  >
                    {types.filter(t => t !== 'All Types').map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Tags</label>
                <input
                  type="text"
                  value={uploadData.tags}
                  onChange={(e) => setUploadData(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="Enter tags separated by commas"
                />
              </div>

              <div className="form-group">
                <label>File *</label>
                <input
                  type="file"
                  onChange={(e) => setUploadData(prev => ({ ...prev, file: e.target.files[0] }))}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.mp4,.avi,.mov,.wmv"
                  required
                />
                <small>Supported formats: PDF, Word documents, Images, Videos (Max: 100MB)</small>
              </div>

              <div className="form-actions">
                <button 
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowUploadModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="submit-btn"
                  disabled={uploadLoading}
                >
                  {uploadLoading ? 'Uploading...' : 'Upload Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && selectedMaterial && (
        <div className="modal-overlay">
          <div className="upload-modal preview-modal">
            <div className="modal-header">
              <h2>Material Details</h2>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowPreviewModal(false);
                  setSelectedMaterial(null);
                }}
              >
                ×
              </button>
            </div>
            <div className="preview-content">
              <div className="preview-item">
                <label>Title:</label>
                <span>{selectedMaterial.title}</span>
              </div>
              <div className="preview-item">
                <label>Description:</label>
                <span>{selectedMaterial.description || 'No description'}</span>
              </div>
              <div className="preview-item">
                <label>Subject:</label>
                <span>{selectedMaterial.subject}</span>
              </div>
              <div className="preview-item">
                <label>Category:</label>
                <span>{selectedMaterial.category}</span>
              </div>
              <div className="preview-item">
                <label>Type:</label>
                <span>{selectedMaterial.type}</span>
              </div>
              <div className="preview-item">
                <label>File Size:</label>
                <span>{selectedMaterial.fileSize || 'N/A'}</span>
              </div>
              <div className="preview-item">
                <label>Downloads:</label>
                <span>{selectedMaterial.downloadCount || 0}</span>
              </div>
              <div className="preview-item">
                <label>Tags:</label>
                <span>{selectedMaterial.tags ? (Array.isArray(selectedMaterial.tags) ? selectedMaterial.tags.join(', ') : selectedMaterial.tags) : 'No tags'}</span>
              </div>
              <div className="preview-item">
                <label>Uploaded:</label>
                <span>{formatDate(selectedMaterial.createdAt)}</span>
              </div>
              {selectedMaterial.filePath && (
                <div className="preview-item">
                  <label>File:</label>
                  <a href={`/api/study-materials/download/${selectedMaterial._id}`} target="_blank" rel="noopener noreferrer" className="download-link">
                    Download File
                  </a>
                </div>
              )}
            </div>
            <div className="form-actions">
              <button 
                type="button"
                className="cancel-btn"
                onClick={() => {
                  setShowPreviewModal(false);
                  setSelectedMaterial(null);
                }}
              >
                Close
              </button>
              <button 
                type="button"
                className="submit-btn"
                onClick={() => {
                  setShowPreviewModal(false);
                  handleEdit(selectedMaterial);
                }}
              >
                Edit Material
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedMaterial && (
        <div className="modal-overlay">
          <div className="upload-modal edit-modal">
            <div className="modal-header">
              <h2>Edit Study Material</h2>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedMaterial(null);
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="upload-form">
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={editData.title}
                  onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                  required
                  placeholder="Enter material title"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter description (optional)"
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Subject *</label>
                  <select
                    value={editData.subject}
                    onChange={(e) => setEditData(prev => ({ ...prev, subject: e.target.value }))}
                    required
                  >
                    {subjects.filter(s => s !== 'All Subjects').map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={editData.category}
                    onChange={(e) => setEditData(prev => ({ ...prev, category: e.target.value }))}
                    required
                  >
                    {categories.filter(c => c !== 'All Categories').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Type *</label>
                  <select
                    value={editData.type}
                    onChange={(e) => setEditData(prev => ({ ...prev, type: e.target.value }))}
                    required
                  >
                    {types.filter(t => t !== 'All Types').map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Tags</label>
                  <input
                    type="text"
                    value={editData.tags}
                    onChange={(e) => setEditData(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="Enter tags separated by commas"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedMaterial(null);
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="submit-btn"
                  disabled={editLoading}
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyMaterials;
