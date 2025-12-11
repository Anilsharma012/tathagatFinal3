import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './CoursePurchaseContentManagement.css';

const CoursePurchaseContentManagement = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [contentExists, setContentExists] = useState(false);
  const [formData, setFormData] = useState(getDefaultFormData());

  function getDefaultFormData() {
    return {
      heroSection: {
        previewVideoUrl: '',
        mainTitle: '',
        currentPrice: 0,
        originalPrice: 0,
        keyBullets: ['']
      },
      aboutSection: {
        aboutTitle: 'About The Course',
        aboutDescription: '',
        learningHeading: 'What Will You Learn?',
        learningContent: ''
      },
      curriculumSections: [{ sectionTitle: '', sectionSubtitle: '', lessons: [] }],
      materialBox: {
        materialHeading: 'Material Includes',
        materialItems: ['']
      },
      requirementsBox: {
        requirementsHeading: 'Requirements',
        requirementsItems: ['']
      },
      instructors: [{ name: '', expertise: '', imageUrl: '' }],
      reviewsSection: {
        averageRating: 0,
        totalRatings: 0,
        ratingBreakdown: { fiveStar: 0, fourStar: 0, threeStar: 0, twoStar: 0, oneStar: 0 },
        reviews: []
      },
      infoGrid: {
        instructorName: '',
        category: '',
        studentsEnrolled: 0,
        reviewScore: ''
      },
      isActive: true
    };
  }

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const fetchCourses = useCallback(async () => {
    try {
      const res = await axios.get('/api/course-purchase-content/admin/courses', {
        headers: getAuthHeaders()
      });
      if (res.data.success) {
        setCourses(res.data.courses);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleCourseSelect = async (courseId) => {
    setSelectedCourseId(courseId);
    if (!courseId) {
      setFormData(getDefaultFormData());
      setContentExists(false);
      return;
    }

    setLoading(true);
    try {
      const checkRes = await axios.get(`/api/course-purchase-content/admin/check/${courseId}`, {
        headers: getAuthHeaders()
      });
      
      if (checkRes.data.exists) {
        const contentRes = await axios.get(`/api/course-purchase-content/admin/course/${courseId}`, {
          headers: getAuthHeaders()
        });
        if (contentRes.data.success) {
          setFormData(contentRes.data.content);
          setContentExists(true);
        }
      } else {
        const selectedCourse = courses.find(c => c._id === courseId);
        setFormData({
          ...getDefaultFormData(),
          heroSection: {
            ...getDefaultFormData().heroSection,
            mainTitle: selectedCourse?.name || '',
            currentPrice: selectedCourse?.price || 0
          }
        });
        setContentExists(false);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
      setFormData(getDefaultFormData());
      setContentExists(false);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleArrayChange = (section, field, index, value) => {
    setFormData(prev => {
      const newArray = [...(prev[section]?.[field] || [])];
      newArray[index] = value;
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: newArray
        }
      };
    });
  };

  const addArrayItem = (section, field) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: [...(prev[section]?.[field] || []), '']
      }
    }));
  };

  const removeArrayItem = (section, field, index) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: prev[section][field].filter((_, i) => i !== index)
      }
    }));
  };

  const handleCurriculumChange = (index, field, value) => {
    setFormData(prev => {
      const newSections = [...(prev.curriculumSections || [])];
      newSections[index] = { ...newSections[index], [field]: value };
      return { ...prev, curriculumSections: newSections };
    });
  };

  const addCurriculumSection = () => {
    setFormData(prev => ({
      ...prev,
      curriculumSections: [...(prev.curriculumSections || []), { sectionTitle: '', sectionSubtitle: '', lessons: [] }]
    }));
  };

  const removeCurriculumSection = (index) => {
    setFormData(prev => ({
      ...prev,
      curriculumSections: prev.curriculumSections.filter((_, i) => i !== index)
    }));
  };

  const handleInstructorChange = (index, field, value) => {
    setFormData(prev => {
      const newInstructors = [...(prev.instructors || [])];
      newInstructors[index] = { ...newInstructors[index], [field]: value };
      return { ...prev, instructors: newInstructors };
    });
  };

  const addInstructor = () => {
    setFormData(prev => ({
      ...prev,
      instructors: [...(prev.instructors || []), { name: '', expertise: '', imageUrl: '' }]
    }));
  };

  const removeInstructor = (index) => {
    setFormData(prev => ({
      ...prev,
      instructors: prev.instructors.filter((_, i) => i !== index)
    }));
  };

  const handleReviewChange = (index, field, value) => {
    setFormData(prev => {
      const newReviews = [...(prev.reviewsSection?.reviews || [])];
      newReviews[index] = { ...newReviews[index], [field]: value };
      return {
        ...prev,
        reviewsSection: { ...prev.reviewsSection, reviews: newReviews }
      };
    });
  };

  const addReview = () => {
    setFormData(prev => ({
      ...prev,
      reviewsSection: {
        ...prev.reviewsSection,
        reviews: [...(prev.reviewsSection?.reviews || []), { reviewerName: '', reviewText: '', rating: 5, timeAgo: '' }]
      }
    }));
  };

  const removeReview = (index) => {
    setFormData(prev => ({
      ...prev,
      reviewsSection: {
        ...prev.reviewsSection,
        reviews: prev.reviewsSection.reviews.filter((_, i) => i !== index)
      }
    }));
  };

  const handleRatingBreakdownChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      reviewsSection: {
        ...prev.reviewsSection,
        ratingBreakdown: {
          ...prev.reviewsSection?.ratingBreakdown,
          [field]: parseInt(value) || 0
        }
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourseId) {
      alert('Please select a course first');
      return;
    }

    setSaving(true);
    try {
      const submitData = new FormData();
      submitData.append('data', JSON.stringify({ ...formData, courseId: selectedCourseId }));

      if (contentExists) {
        await axios.put(`/api/course-purchase-content/admin/course/${selectedCourseId}`, submitData, {
          headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' }
        });
        alert('Content updated successfully!');
      } else {
        await axios.post('/api/course-purchase-content/admin', submitData, {
          headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' }
        });
        setContentExists(true);
        alert('Content created successfully!');
      }
    } catch (error) {
      console.error('Error saving content:', error);
      alert('Failed to save: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCourseId || !contentExists) return;
    if (!window.confirm('Are you sure you want to delete this content?')) return;

    try {
      await axios.delete(`/api/course-purchase-content/admin/course/${selectedCourseId}`, {
        headers: getAuthHeaders()
      });
      setFormData(getDefaultFormData());
      setContentExists(false);
      alert('Content deleted successfully');
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Failed to delete');
    }
  };

  return (
    <div className="course-purchase-management">
      <div className="page-header">
        <h1>Course Purchase Page Management</h1>
        <p>Manage content for course purchase/detail pages</p>
      </div>

      <div className="course-selector">
        <label>Select Course:</label>
        <select 
          value={selectedCourseId} 
          onChange={(e) => handleCourseSelect(e.target.value)}
        >
          <option value="">-- Select a Course --</option>
          {courses.map(course => (
            <option key={course._id} value={course._id}>
              {course.name} ({course.courseType})
            </option>
          ))}
        </select>
        {contentExists && <span className="status-badge exists">Content Exists</span>}
        {selectedCourseId && !contentExists && <span className="status-badge new">New Content</span>}
      </div>

      {loading && <div className="loading">Loading...</div>}

      {selectedCourseId && !loading && (
        <form onSubmit={handleSubmit} className="content-form">
          <section className="form-section">
            <h2>Hero Section</h2>
            <div className="form-group">
              <label>Preview Video URL (YouTube embed)</label>
              <input
                type="text"
                value={formData.heroSection?.previewVideoUrl || ''}
                onChange={(e) => handleInputChange('heroSection', 'previewVideoUrl', e.target.value)}
                placeholder="https://www.youtube.com/embed/..."
              />
            </div>
            <div className="form-group">
              <label>Main Title</label>
              <input
                type="text"
                value={formData.heroSection?.mainTitle || ''}
                onChange={(e) => handleInputChange('heroSection', 'mainTitle', e.target.value)}
                placeholder="CAT 2025 Full Course"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Current Price (Rs)</label>
                <input
                  type="number"
                  value={formData.heroSection?.currentPrice || 0}
                  onChange={(e) => handleInputChange('heroSection', 'currentPrice', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="form-group">
                <label>Original Price (Striked)</label>
                <input
                  type="number"
                  value={formData.heroSection?.originalPrice || 0}
                  onChange={(e) => handleInputChange('heroSection', 'originalPrice', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Key Bullets</label>
              {(formData.heroSection?.keyBullets || ['']).map((bullet, idx) => (
                <div key={idx} className="array-item">
                  <input
                    type="text"
                    value={bullet}
                    onChange={(e) => handleArrayChange('heroSection', 'keyBullets', idx, e.target.value)}
                    placeholder="e.g., Complete CAT preparation material"
                  />
                  <button type="button" className="btn-remove" onClick={() => removeArrayItem('heroSection', 'keyBullets', idx)}>x</button>
                </div>
              ))}
              <button type="button" className="btn-add-item" onClick={() => addArrayItem('heroSection', 'keyBullets')}>+ Add Bullet</button>
            </div>
          </section>

          <section className="form-section">
            <h2>Info Grid</h2>
            <div className="form-row">
              <div className="form-group">
                <label>Instructor Name</label>
                <input
                  type="text"
                  value={formData.infoGrid?.instructorName || ''}
                  onChange={(e) => handleInputChange('infoGrid', 'instructorName', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <input
                  type="text"
                  value={formData.infoGrid?.category || ''}
                  onChange={(e) => handleInputChange('infoGrid', 'category', e.target.value)}
                  placeholder="CAT"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Students Enrolled</label>
                <input
                  type="number"
                  value={formData.infoGrid?.studentsEnrolled || 0}
                  onChange={(e) => handleInputChange('infoGrid', 'studentsEnrolled', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="form-group">
                <label>Review Score (e.g., "4.8 (Google)")</label>
                <input
                  type="text"
                  value={formData.infoGrid?.reviewScore || ''}
                  onChange={(e) => handleInputChange('infoGrid', 'reviewScore', e.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="form-section">
            <h2>About Section</h2>
            <div className="form-group">
              <label>About Title</label>
              <input
                type="text"
                value={formData.aboutSection?.aboutTitle || ''}
                onChange={(e) => handleInputChange('aboutSection', 'aboutTitle', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>About Description</label>
              <textarea
                rows="5"
                value={formData.aboutSection?.aboutDescription || ''}
                onChange={(e) => handleInputChange('aboutSection', 'aboutDescription', e.target.value)}
                placeholder="Detailed description about the course..."
              />
            </div>
            <div className="form-group">
              <label>Learning Heading</label>
              <input
                type="text"
                value={formData.aboutSection?.learningHeading || ''}
                onChange={(e) => handleInputChange('aboutSection', 'learningHeading', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Learning Content</label>
              <textarea
                rows="4"
                value={formData.aboutSection?.learningContent || ''}
                onChange={(e) => handleInputChange('aboutSection', 'learningContent', e.target.value)}
              />
            </div>
          </section>

          <section className="form-section">
            <h2>Curriculum Sections</h2>
            {(formData.curriculumSections || []).map((section, idx) => (
              <div key={idx} className="curriculum-item">
                <div className="curriculum-header">
                  <span>Section {idx + 1}</span>
                  <button type="button" className="btn-remove" onClick={() => removeCurriculumSection(idx)}>Remove</button>
                </div>
                <div className="form-group">
                  <label>Section Title</label>
                  <input
                    type="text"
                    value={section.sectionTitle || ''}
                    onChange={(e) => handleCurriculumChange(idx, 'sectionTitle', e.target.value)}
                    placeholder="Welcome! Course Introduction"
                  />
                </div>
                <div className="form-group">
                  <label>Section Subtitle</label>
                  <input
                    type="text"
                    value={section.sectionSubtitle || ''}
                    onChange={(e) => handleCurriculumChange(idx, 'sectionSubtitle', e.target.value)}
                    placeholder="What does the course cover?"
                  />
                </div>
              </div>
            ))}
            <button type="button" className="btn-add-section" onClick={addCurriculumSection}>+ Add Curriculum Section</button>
          </section>

          <section className="form-section">
            <h2>Material Includes</h2>
            <div className="form-group">
              <label>Heading</label>
              <input
                type="text"
                value={formData.materialBox?.materialHeading || ''}
                onChange={(e) => handleInputChange('materialBox', 'materialHeading', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Material Items</label>
              {(formData.materialBox?.materialItems || ['']).map((item, idx) => (
                <div key={idx} className="array-item">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleArrayChange('materialBox', 'materialItems', idx, e.target.value)}
                    placeholder="e.g., Certificate of Completion"
                  />
                  <button type="button" className="btn-remove" onClick={() => removeArrayItem('materialBox', 'materialItems', idx)}>x</button>
                </div>
              ))}
              <button type="button" className="btn-add-item" onClick={() => addArrayItem('materialBox', 'materialItems')}>+ Add Item</button>
            </div>
          </section>

          <section className="form-section">
            <h2>Requirements</h2>
            <div className="form-group">
              <label>Heading</label>
              <input
                type="text"
                value={formData.requirementsBox?.requirementsHeading || ''}
                onChange={(e) => handleInputChange('requirementsBox', 'requirementsHeading', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Requirement Items</label>
              {(formData.requirementsBox?.requirementsItems || ['']).map((item, idx) => (
                <div key={idx} className="array-item">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleArrayChange('requirementsBox', 'requirementsItems', idx, e.target.value)}
                    placeholder="e.g., Minimum graduation score required"
                  />
                  <button type="button" className="btn-remove" onClick={() => removeArrayItem('requirementsBox', 'requirementsItems', idx)}>x</button>
                </div>
              ))}
              <button type="button" className="btn-add-item" onClick={() => addArrayItem('requirementsBox', 'requirementsItems')}>+ Add Item</button>
            </div>
          </section>

          <section className="form-section">
            <h2>Instructors</h2>
            {(formData.instructors || []).map((inst, idx) => (
              <div key={idx} className="instructor-item">
                <div className="instructor-header">
                  <span>Instructor {idx + 1}</span>
                  <button type="button" className="btn-remove" onClick={() => removeInstructor(idx)}>Remove</button>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Name</label>
                    <input
                      type="text"
                      value={inst.name || ''}
                      onChange={(e) => handleInstructorChange(idx, 'name', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Expertise</label>
                    <input
                      type="text"
                      value={inst.expertise || ''}
                      onChange={(e) => handleInstructorChange(idx, 'expertise', e.target.value)}
                      placeholder="Quant/LRDI"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Image URL (or upload)</label>
                  <input
                    type="text"
                    value={inst.imageUrl || ''}
                    onChange={(e) => handleInstructorChange(idx, 'imageUrl', e.target.value)}
                    placeholder="/uploads/instructors/..."
                  />
                </div>
              </div>
            ))}
            <button type="button" className="btn-add-section" onClick={addInstructor}>+ Add Instructor</button>
          </section>

          <section className="form-section">
            <h2>Reviews Section</h2>
            <div className="form-row">
              <div className="form-group">
                <label>Average Rating</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={formData.reviewsSection?.averageRating || 0}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    reviewsSection: { ...prev.reviewsSection, averageRating: parseFloat(e.target.value) || 0 }
                  }))}
                />
              </div>
              <div className="form-group">
                <label>Total Ratings</label>
                <input
                  type="number"
                  value={formData.reviewsSection?.totalRatings || 0}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    reviewsSection: { ...prev.reviewsSection, totalRatings: parseInt(e.target.value) || 0 }
                  }))}
                />
              </div>
            </div>
            <h4>Rating Breakdown</h4>
            <div className="rating-breakdown-grid">
              {['fiveStar', 'fourStar', 'threeStar', 'twoStar', 'oneStar'].map((key, idx) => (
                <div key={key} className="form-group">
                  <label>{5 - idx} Star</label>
                  <input
                    type="number"
                    value={formData.reviewsSection?.ratingBreakdown?.[key] || 0}
                    onChange={(e) => handleRatingBreakdownChange(key, e.target.value)}
                  />
                </div>
              ))}
            </div>

            <h4>Individual Reviews</h4>
            {(formData.reviewsSection?.reviews || []).map((review, idx) => (
              <div key={idx} className="review-item">
                <div className="review-header">
                  <span>Review {idx + 1}</span>
                  <button type="button" className="btn-remove" onClick={() => removeReview(idx)}>Remove</button>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Reviewer Name</label>
                    <input
                      type="text"
                      value={review.reviewerName || ''}
                      onChange={(e) => handleReviewChange(idx, 'reviewerName', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Rating</label>
                    <select
                      value={review.rating || 5}
                      onChange={(e) => handleReviewChange(idx, 'rating', parseInt(e.target.value))}
                    >
                      {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} Star</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Time Ago</label>
                    <input
                      type="text"
                      value={review.timeAgo || ''}
                      onChange={(e) => handleReviewChange(idx, 'timeAgo', e.target.value)}
                      placeholder="a year ago"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Review Text</label>
                  <textarea
                    rows="2"
                    value={review.reviewText || ''}
                    onChange={(e) => handleReviewChange(idx, 'reviewText', e.target.value)}
                  />
                </div>
              </div>
            ))}
            <button type="button" className="btn-add-section" onClick={addReview}>+ Add Review</button>
          </section>

          <section className="form-section">
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.isActive !== false}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                />
                Active (visible on public page)
              </label>
            </div>
          </section>

          <div className="form-actions">
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? 'Saving...' : contentExists ? 'Update Content' : 'Create Content'}
            </button>
            {contentExists && (
              <button type="button" className="btn-delete" onClick={handleDelete}>
                Delete Content
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
};

export default CoursePurchaseContentManagement;
