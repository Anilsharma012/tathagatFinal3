import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DownloadsManagement.css';

const API_BASE = '/api/downloads';

const DownloadsManagement = () => {
  const [activeTab, setActiveTab] = useState('PREVIOUS_YEAR');
  const [categories, setCategories] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingTest, setEditingTest] = useState(null);

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    displayOrder: 0
  });

  const [testForm, setTestForm] = useState({
    title: '',
    categoryId: '',
    description: '',
    questionCount: 0,
    totalMarks: 0,
    durationMinutes: 0,
    language: 'English',
    status: 'COMING_SOON',
    isFree: true,
    displayOrder: 0
  });

  const [uploadingPdf, setUploadingPdf] = useState(null);

  useEffect(() => {
    fetchCategories();
    fetchTests();
  }, [activeTab]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_BASE}/admin/categories?type=${activeTab}`, getAuthHeaders());
      if (response.data.success) {
        setCategories(response.data.categories);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchTests = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/admin/tests?type=${activeTab}`, getAuthHeaders());
      if (response.data.success) {
        setTests(response.data.tests);
      }
    } catch (err) {
      console.error('Error fetching tests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_BASE}/admin/categories`, {
        ...categoryForm,
        type: activeTab
      }, getAuthHeaders());
      
      if (response.data.success) {
        setSuccess('Category created successfully');
        setShowCategoryModal(false);
        setCategoryForm({ name: '', description: '', displayOrder: 0 });
        fetchCategories();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create category');
    }
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`${API_BASE}/admin/categories/${editingCategory._id}`, categoryForm, getAuthHeaders());
      
      if (response.data.success) {
        setSuccess('Category updated successfully');
        setShowCategoryModal(false);
        setEditingCategory(null);
        setCategoryForm({ name: '', description: '', displayOrder: 0 });
        fetchCategories();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update category');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    
    try {
      const response = await axios.delete(`${API_BASE}/admin/categories/${categoryId}?force=true`, getAuthHeaders());
      if (response.data.success) {
        setSuccess('Category deleted successfully');
        fetchCategories();
        fetchTests();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete category');
    }
  };

  const handleCreateTest = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_BASE}/admin/tests`, {
        ...testForm,
        type: activeTab
      }, getAuthHeaders());
      
      if (response.data.success) {
        setSuccess('Test created successfully');
        setShowTestModal(false);
        resetTestForm();
        fetchTests();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create test');
    }
  };

  const handleUpdateTest = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`${API_BASE}/admin/tests/${editingTest._id}`, testForm, getAuthHeaders());
      
      if (response.data.success) {
        setSuccess('Test updated successfully');
        setShowTestModal(false);
        setEditingTest(null);
        resetTestForm();
        fetchTests();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update test');
    }
  };

  const handleDeleteTest = async (testId) => {
    if (!window.confirm('Are you sure you want to delete this test?')) return;
    
    try {
      const response = await axios.delete(`${API_BASE}/admin/tests/${testId}`, getAuthHeaders());
      if (response.data.success) {
        setSuccess('Test deleted successfully');
        fetchTests();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete test');
    }
  };

  const handleToggleStatus = async (testId, currentStatus) => {
    const newStatus = currentStatus === 'PUBLISHED' ? 'COMING_SOON' : 'PUBLISHED';
    try {
      const response = await axios.patch(`${API_BASE}/admin/tests/${testId}/status`, { status: newStatus }, getAuthHeaders());
      if (response.data.success) {
        setSuccess(`Test ${newStatus === 'PUBLISHED' ? 'published' : 'set to coming soon'}`);
        fetchTests();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handlePdfUpload = async (testId, file) => {
    if (!file) return;
    
    setUploadingPdf(testId);
    const formData = new FormData();
    formData.append('pdf', file);
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(`${API_BASE}/admin/tests/${testId}/upload-pdf`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        setSuccess('PDF uploaded successfully');
        fetchTests();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload PDF');
    } finally {
      setUploadingPdf(null);
    }
  };

  const resetTestForm = () => {
    setTestForm({
      title: '',
      categoryId: '',
      description: '',
      questionCount: 0,
      totalMarks: 0,
      durationMinutes: 0,
      language: 'English',
      status: 'COMING_SOON',
      isFree: true,
      displayOrder: 0
    });
  };

  const openEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      displayOrder: category.displayOrder || 0
    });
    setShowCategoryModal(true);
  };

  const openEditTest = (test) => {
    setEditingTest(test);
    setTestForm({
      title: test.title,
      categoryId: test.categoryId?._id || test.categoryId,
      description: test.description || '',
      questionCount: test.questionCount || 0,
      totalMarks: test.totalMarks || 0,
      durationMinutes: test.durationMinutes || 0,
      language: test.language || 'English',
      status: test.status,
      isFree: test.isFree !== false,
      displayOrder: test.displayOrder || 0
    });
    setShowTestModal(true);
  };

  const openAddTest = () => {
    setEditingTest(null);
    resetTestForm();
    setShowTestModal(true);
  };

  const openAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', description: '', displayOrder: 0 });
    setShowCategoryModal(true);
  };

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const filteredTests = tests.filter(test => test.isActive !== false);

  return (
    <div className="downloads-management">
      <div className="downloads-header">
        <h1>Downloads Management</h1>
        <p>Manage Previous Years' Papers and Topic-Wise Questions</p>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="tabs-container">
        <button 
          className={`tab-btn ${activeTab === 'PREVIOUS_YEAR' ? 'active' : ''}`}
          onClick={() => setActiveTab('PREVIOUS_YEAR')}
        >
          Previous Years' Papers
        </button>
        <button 
          className={`tab-btn ${activeTab === 'TOPIC_WISE' ? 'active' : ''}`}
          onClick={() => setActiveTab('TOPIC_WISE')}
        >
          Topic-Wise Questions
        </button>
      </div>

      <div className="section-container">
        <div className="section-header">
          <h2>Categories ({activeTab === 'PREVIOUS_YEAR' ? 'Exams' : 'Topics'})</h2>
          <button className="btn-primary" onClick={openAddCategory}>
            + Add Category
          </button>
        </div>

        <div className="categories-grid">
          {categories.filter(c => c.isActive !== false).map(category => (
            <div key={category._id} className="category-card">
              <div className="category-info">
                <h3>{category.name}</h3>
                <span className="order-badge">Order: {category.displayOrder}</span>
              </div>
              <div className="category-actions">
                <button className="btn-edit" onClick={() => openEditCategory(category)}>Edit</button>
                <button className="btn-delete" onClick={() => handleDeleteCategory(category._id)}>Delete</button>
              </div>
            </div>
          ))}
          {categories.length === 0 && (
            <p className="empty-message">No categories yet. Add one to get started.</p>
          )}
        </div>
      </div>

      <div className="section-container">
        <div className="section-header">
          <h2>Tests/Papers</h2>
          <button className="btn-primary" onClick={openAddTest} disabled={categories.length === 0}>
            + Add Test
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className="tests-table-container">
            <table className="tests-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Questions</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>PDF</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTests.map(test => (
                  <tr key={test._id}>
                    <td>
                      <strong>{test.title}</strong>
                      {test.isFree && <span className="free-badge">Free</span>}
                    </td>
                    <td>{test.categoryId?.name || 'N/A'}</td>
                    <td>{test.questionCount}</td>
                    <td>{test.durationMinutes} min</td>
                    <td>
                      <button 
                        className={`status-btn ${test.status === 'PUBLISHED' ? 'published' : 'coming-soon'}`}
                        onClick={() => handleToggleStatus(test._id, test.status)}
                      >
                        {test.status === 'PUBLISHED' ? 'Published' : 'Coming Soon'}
                      </button>
                    </td>
                    <td>
                      {test.pdfUrl ? (
                        <a href={test.pdfUrl} target="_blank" rel="noopener noreferrer" className="pdf-link">
                          View PDF
                        </a>
                      ) : (
                        <label className="upload-label">
                          {uploadingPdf === test._id ? 'Uploading...' : 'Upload PDF'}
                          <input 
                            type="file" 
                            accept=".pdf"
                            onChange={(e) => handlePdfUpload(test._id, e.target.files[0])}
                            disabled={uploadingPdf === test._id}
                            style={{ display: 'none' }}
                          />
                        </label>
                      )}
                    </td>
                    <td>
                      <button className="btn-edit" onClick={() => openEditTest(test)}>Edit</button>
                      <button className="btn-delete" onClick={() => handleDeleteTest(test._id)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {filteredTests.length === 0 && (
                  <tr>
                    <td colSpan="7" className="empty-row">No tests yet. Add one to get started.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>{editingCategory ? 'Edit Category' : 'Add Category'}</h2>
            <form onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}>
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  required
                  placeholder={activeTab === 'PREVIOUS_YEAR' ? 'e.g., CAT, XAT, SNAP' : 'e.g., Algebra, Geometry'}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="Optional description"
                />
              </div>
              <div className="form-group">
                <label>Display Order</label>
                <input
                  type="number"
                  value={categoryForm.displayOrder}
                  onChange={(e) => setCategoryForm({ ...categoryForm, displayOrder: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowCategoryModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">{editingCategory ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTestModal && (
        <div className="modal-overlay" onClick={() => setShowTestModal(false)}>
          <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
            <h2>{editingTest ? 'Edit Test' : 'Add Test'}</h2>
            <form onSubmit={editingTest ? handleUpdateTest : handleCreateTest}>
              <div className="form-row">
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    value={testForm.title}
                    onChange={(e) => setTestForm({ ...testForm, title: e.target.value })}
                    required
                    placeholder="e.g., CAT Mock 01"
                  />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={testForm.categoryId}
                    onChange={(e) => setTestForm({ ...testForm, categoryId: e.target.value })}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.filter(c => c.isActive !== false).map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={testForm.description}
                  onChange={(e) => setTestForm({ ...testForm, description: e.target.value })}
                  placeholder="Optional description"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Questions</label>
                  <input
                    type="number"
                    value={testForm.questionCount}
                    onChange={(e) => setTestForm({ ...testForm, questionCount: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group">
                  <label>Total Marks</label>
                  <input
                    type="number"
                    value={testForm.totalMarks}
                    onChange={(e) => setTestForm({ ...testForm, totalMarks: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group">
                  <label>Duration (minutes)</label>
                  <input
                    type="number"
                    value={testForm.durationMinutes}
                    onChange={(e) => setTestForm({ ...testForm, durationMinutes: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Language</label>
                  <input
                    type="text"
                    value={testForm.language}
                    onChange={(e) => setTestForm({ ...testForm, language: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Display Order</label>
                  <input
                    type="number"
                    value={testForm.displayOrder}
                    onChange={(e) => setTestForm({ ...testForm, displayOrder: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={testForm.isFree}
                      onChange={(e) => setTestForm({ ...testForm, isFree: e.target.checked })}
                    />
                    Free Test
                  </label>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={testForm.status}
                    onChange={(e) => setTestForm({ ...testForm, status: e.target.value })}
                  >
                    <option value="COMING_SOON">Coming Soon</option>
                    <option value="PUBLISHED">Published</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowTestModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">{editingTest ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DownloadsManagement;
