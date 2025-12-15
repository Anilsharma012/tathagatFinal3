import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaEye, FaFilePdf, FaFilter, FaSearch, FaUpload, FaVideo, FaFile } from 'react-icons/fa';
import { toast } from 'react-toastify';
import './PdfManagement.css';

const PdfManagement = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [filters, setFilters] = useState({
    subject: 'All Subjects',
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

  const categoryOptions = ['Study Materials', 'Video Lectures', 'Previous Year Papers'];

  const [uploadLoading, setUploadLoading] = useState(false);
  
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    subject: '',
    type: '',
    tags: ''
  });
  const [editLoading, setEditLoading] = useState(false);

  const subjects = ['All Subjects', 'Quantitative Aptitude', 'Verbal Ability', 'Data Interpretation', 'Logical Reasoning', 'General Knowledge'];
  const types = ['All Types', 'PDF', 'Video'];

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
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
        const filteredMaterials = (data.data || []).filter(m => 
          filters.type === 'All Types' || m.type === filters.type
        );
        setMaterials(filteredMaterials);
        setPagination(data.pagination);
      } else {
        toast.error(data.message || 'Failed to fetch materials');
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
      toast.error('Failed to fetch materials');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!uploadData.file) {
      toast.error('Please select a file to upload');
      return;
    }

    const fileName = uploadData.file.name.toLowerCase();
    const isPdf = fileName.endsWith('.pdf');
    const isVideo = fileName.endsWith('.mp4') || fileName.endsWith('.mov') || fileName.endsWith('.avi') || fileName.endsWith('.wmv');

    if (uploadData.type === 'PDF' && !isPdf) {
      toast.error('Please select a valid PDF file');
      return;
    }

    if (uploadData.type === 'Video' && !isVideo) {
      toast.error('Please select a valid video file (MP4, MOV, AVI, WMV)');
      return;
    }

    setUploadLoading(true);
    
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
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
        toast.success(`${uploadData.type} uploaded successfully!`);
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
        toast.error(data.message || `Failed to upload ${uploadData.type}`);
      }
    } catch (error) {
      console.error('Error uploading:', error);
      toast.error(`Failed to upload ${uploadData.type}`);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this material?')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
      const response = await fetch(`/api/study-materials/admin/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Material deleted successfully!');
        fetchMaterials();
      } else {
        toast.error(data.message || 'Failed to delete material');
      }
    } catch (error) {
      console.error('Error deleting material:', error);
      toast.error('Failed to delete material');
    }
  };

  const handlePreview = (material) => {
    if (material.type === 'PDF') {
      window.open(`/api/study-materials/view/${material._id}`, '_blank');
    } else {
      setSelectedMaterial(material);
      setShowPreviewModal(true);
    }
  };

  const handleEdit = (material) => {
    setSelectedMaterial(material);
    setEditData({
      title: material.title || '',
      description: material.description || '',
      subject: material.subject || 'Quantitative Aptitude',
      type: material.type || 'PDF',
      tags: material.tags ? (Array.isArray(material.tags) ? material.tags.join(', ') : material.tags) : ''
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMaterial) return;

    setEditLoading(true);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
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
          category: 'Study Materials',
          type: editData.type,
          tags: editData.tags
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Material updated successfully!');
        setShowEditModal(false);
        fetchMaterials();
      } else {
        toast.error(data.message || 'Failed to update material');
      }
    } catch (error) {
      console.error('Error updating material:', error);
      toast.error('Failed to update material');
    } finally {
      setEditLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

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

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type) => {
    if (type === 'Video') return <FaVideo className="file-icon video" />;
    if (type === 'PDF') return <FaFilePdf className="file-icon pdf" />;
    return <FaFile className="file-icon" />;
  };

  const getAcceptedFileTypes = () => {
    if (uploadData.type === 'PDF') return '.pdf';
    if (uploadData.type === 'Video') return '.mp4,.mov,.avi,.wmv';
    return '.pdf,.mp4,.mov,.avi,.wmv';
  };

  return (
    <div className="pdf-management-container">
      <div className="pdf-management-header">
        <div className="header-left">
          <h1><FaFile /> Study Materials Management</h1>
          <p>Upload and manage PDFs and Videos</p>
        </div>
        <button 
          className="upload-btn"
          onClick={() => setShowUploadModal(true)}
        >
          <FaUpload /> Upload Material
        </button>
      </div>

      <div className="pdf-filters">
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

      <div className="pdf-table-container">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading materials...</p>
          </div>
        ) : (
          <table className="pdf-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Subject</th>
                <th>Size</th>
                <th>Views</th>
                <th>Uploaded</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {materials.length === 0 ? (
                <tr>
                  <td colSpan="7" className="no-data">
                    No materials found. Upload your first PDF or Video!
                  </td>
                </tr>
              ) : (
                materials.map((material) => (
                  <tr key={material._id}>
                    <td className="material-title">
                      {getFileIcon(material.type)}
                      <div>
                        <span className="title">{material.title}</span>
                        {material.description && (
                          <span className="description">{material.description.substring(0, 50)}...</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`type-badge ${material.type?.toLowerCase()}`}>
                        {material.type}
                      </span>
                    </td>
                    <td>{material.subject}</td>
                    <td>{material.fileSize || formatFileSize(material.size)}</td>
                    <td>{material.viewCount || material.downloadCount || 0}</td>
                    <td>{formatDate(material.createdAt)}</td>
                    <td className="actions">
                      <button 
                        className="action-btn view"
                        onClick={() => handlePreview(material)}
                        title="Preview"
                      >
                        <FaEye />
                      </button>
                      <button 
                        className="action-btn edit"
                        onClick={() => handleEdit(material)}
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        className="action-btn delete"
                        onClick={() => handleDelete(material._id)}
                        title="Delete"
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

      {pagination.pages > 1 && (
        <div className="pagination">
          <button 
            disabled={pagination.page === 1}
            onClick={() => handlePageChange(pagination.page - 1)}
          >
            Previous
          </button>
          <span>Page {pagination.page} of {pagination.pages}</span>
          <button 
            disabled={pagination.page === pagination.pages}
            onClick={() => handlePageChange(pagination.page + 1)}
          >
            Next
          </button>
        </div>
      )}

      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><FaUpload /> Upload Study Material</h2>
              <button className="close-btn" onClick={() => setShowUploadModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleUpload}>
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
                  placeholder="Enter description"
                  rows="3"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Type *</label>
                  <select
                    value={uploadData.type}
                    onChange={(e) => {
                      setUploadData(prev => ({ ...prev, type: e.target.value, file: null }));
                    }}
                    required
                  >
                    <option value="PDF">PDF</option>
                    <option value="Video">Video</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={uploadData.category}
                    onChange={(e) => setUploadData(prev => ({ ...prev, category: e.target.value }))}
                    required
                  >
                    {categoryOptions.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Subject *</label>
                <select
                  value={uploadData.subject}
                  onChange={(e) => setUploadData(prev => ({ ...prev, subject: e.target.value }))}
                  required
                >
                  <option value="Quantitative Aptitude">Quantitative Aptitude</option>
                  <option value="Verbal Ability">Verbal Ability</option>
                  <option value="Data Interpretation">Data Interpretation</option>
                  <option value="Logical Reasoning">Logical Reasoning</option>
                  <option value="General Knowledge">General Knowledge</option>
                </select>
              </div>
              <div className="form-group">
                <label>Tags</label>
                <input
                  type="text"
                  value={uploadData.tags}
                  onChange={(e) => setUploadData(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="Enter tags (comma separated)"
                />
              </div>
              <div className="form-group">
                <label>{uploadData.type} File *</label>
                <input
                  type="file"
                  accept={getAcceptedFileTypes()}
                  onChange={(e) => setUploadData(prev => ({ ...prev, file: e.target.files[0] }))}
                  required
                />
                <small>
                  {uploadData.type === 'PDF' 
                    ? 'Only PDF files are allowed (Max: 100MB)' 
                    : 'Allowed formats: MP4, MOV, AVI, WMV (Max: 100MB)'}
                </small>
              </div>
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowUploadModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn" disabled={uploadLoading}>
                  {uploadLoading ? 'Uploading...' : `Upload ${uploadData.type}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><FaEdit /> Edit Material</h2>
              <button className="close-btn" onClick={() => setShowEditModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={editData.title}
                  onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                  rows="3"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Type</label>
                  <select
                    value={editData.type}
                    onChange={(e) => setEditData(prev => ({ ...prev, type: e.target.value }))}
                  >
                    <option value="PDF">PDF</option>
                    <option value="Video">Video</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Subject *</label>
                  <select
                    value={editData.subject}
                    onChange={(e) => setEditData(prev => ({ ...prev, subject: e.target.value }))}
                    required
                  >
                    <option value="Quantitative Aptitude">Quantitative Aptitude</option>
                    <option value="Verbal Ability">Verbal Ability</option>
                    <option value="Data Interpretation">Data Interpretation</option>
                    <option value="Logical Reasoning">Logical Reasoning</option>
                    <option value="General Knowledge">General Knowledge</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Tags</label>
                <input
                  type="text"
                  value={editData.tags}
                  onChange={(e) => setEditData(prev => ({ ...prev, tags: e.target.value }))}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn" disabled={editLoading}>
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPreviewModal && selectedMaterial && (
        <div className="modal-overlay" onClick={() => setShowPreviewModal(false)}>
          <div className="modal-content preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><FaEye /> {selectedMaterial.title}</h2>
              <button className="close-btn" onClick={() => setShowPreviewModal(false)}>&times;</button>
            </div>
            <div className="preview-body">
              <div className="preview-info">
                <p><strong>Type:</strong> {selectedMaterial.type}</p>
                <p><strong>Subject:</strong> {selectedMaterial.subject}</p>
                <p><strong>Size:</strong> {selectedMaterial.fileSize}</p>
                <p><strong>Views:</strong> {selectedMaterial.viewCount || selectedMaterial.downloadCount || 0}</p>
                {selectedMaterial.description && (
                  <p><strong>Description:</strong> {selectedMaterial.description}</p>
                )}
              </div>
              <div className="media-preview">
                {selectedMaterial.type === 'PDF' ? (
                  <iframe
                    src={`/api/study-materials/view/${selectedMaterial._id}#toolbar=0&navpanes=0`}
                    title="PDF Preview"
                  />
                ) : selectedMaterial.type === 'Video' ? (
                  <video 
                    controls 
                    controlsList="nodownload"
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    <source src={`/api/study-materials/view/${selectedMaterial._id}`} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <p>Preview not available for this file type</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfManagement;
