import React, { useState, useEffect } from 'react';
import { fetchWithErrorHandling } from '../../../utils/api';
import PaperWiseManagement from './PaperWiseManagement';
import TopicWiseManagement from './TopicWiseManagement';
import QuestionBuilder from './QuestionBuilder';
import './MockTestManagement.css';

const MockTestManagement = () => {
  const [activeTab, setActiveTab] = useState('previousYear');
  const [subTab, setSubTab] = useState('paperWise');
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [showQuestionBuilder, setShowQuestionBuilder] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [isFreeTestMode, setIsFreeTestMode] = useState(false);
  
  const getDefaultSection = (sectionName) => {
    const defaults = {
      'VARC': { duration: 40, totalQuestions: 24, totalMarks: 72 },
      'DILR': { duration: 40, totalQuestions: 20, totalMarks: 60 },
      'QA': { duration: 40, totalQuestions: 22, totalMarks: 66 }
    };
    return {
      name: sectionName,
      ...defaults[sectionName],
      questions: []
    };
  };

  const getDefaultSections = () => ['VARC', 'DILR', 'QA'].map(getDefaultSection);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 120,
    totalQuestions: 66,
    testType: 'previousYear',
    paperType: 'paperWise',
    exam: 'CAT',
    yearLabel: '2024',
    subject: '',
    topic: '',
    sessionYear: '2024',
    sections: getDefaultSections()
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const data = await fetchWithErrorHandling('/api/courses');
      if (data && data.courses) {
        setCourses(data.courses);
        if (data.courses.length > 0) {
          setSelectedCourse(data.courses[0]._id);
        }
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTests = async (courseId) => {
    try {
      const data = await fetchWithErrorHandling(`/api/admin/mock-tests/tests?courseId=${courseId}`);
      if (data && data.tests) {
        setTests(data.tests);
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
    }
  };

  const fetchFreeTests = async () => {
    try {
      setLoading(true);
      const data = await fetchWithErrorHandling('/api/admin/mock-tests/tests?courseId=free');
      if (data && data.tests) {
        setTests(data.tests);
      }
    } catch (error) {
      console.error('Error fetching free tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFreeTestModeToggle = (isEnabled) => {
    setIsFreeTestMode(isEnabled);
    handleCancelEdit();
    if (isEnabled) {
      fetchFreeTests();
    } else if (selectedCourse) {
      fetchTests(selectedCourse);
    }
  };

  const handleEditTest = (test) => {
    setEditingTest(test);
    const sections = test.sections && test.sections.length > 0 ? test.sections : getDefaultSections();
    setFormData({
      title: test.title || '',
      description: test.description || '',
      duration: test.duration || 120,
      totalQuestions: test.totalQuestions || 66,
      testType: test.testType || activeTab,
      paperType: test.paperType || subTab,
      exam: test.exam || 'CAT',
      yearLabel: test.yearLabel || '2024',
      subject: test.subject || '',
      topic: test.topic || '',
      sessionYear: test.sessionYear || '2024',
      sections: sections
    });
    setActiveTab(test.testType || activeTab);
    if (test.testType === 'previousYear') {
      setSubTab(test.paperType || 'paperWise');
    }
  };

  const handleCancelEdit = () => {
    setEditingTest(null);
    setFormData({
      title: '',
      description: '',
      duration: 120,
      totalQuestions: 66,
      testType: activeTab,
      paperType: subTab,
      exam: 'CAT',
      yearLabel: '2024',
      subject: '',
      topic: '',
      sessionYear: '2024',
      sections: getDefaultSections()
    });
  };

  const handleManageQuestions = (test) => {
    setSelectedTest(test);
    setShowQuestionBuilder(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isFreeTestMode && !selectedCourse && !editingTest) {
      alert('Please select a course first');
      return;
    }

    const requiredSections = ['VARC', 'DILR', 'QA'];
    for (const sectionName of requiredSections) {
      const section = formData.sections.find(s => s.name === sectionName);
      if (!section || !section.duration || section.duration <= 0) {
        alert(`Please enter a valid duration for ${sectionName} section (must be greater than 0)`);
        return;
      }
      if (!section.totalQuestions || section.totalQuestions < 0) {
        alert(`Please enter a valid question count for ${sectionName} section (must be 0 or greater)`);
        return;
      }
    }

    try {
      setLoading(true);
      
      const testData = {
        ...formData,
        testType: activeTab,
        paperType: activeTab === 'previousYear' ? subTab : null,
        positiveMarks: 3,
        negativeMarks: -1,
        isFree: isFreeTestMode,
        difficulty: 'Medium'
      };

      if (!isFreeTestMode) {
        testData.courseId = editingTest ? editingTest.courseId : selectedCourse;
      }

      let data;
      if (editingTest) {
        data = await fetchWithErrorHandling(`/api/admin/mock-tests/tests/${editingTest._id}`, {
          method: 'PUT',
          body: JSON.stringify(testData)
        });
      } else {
        data = await fetchWithErrorHandling('/api/admin/mock-tests/test', {
          method: 'POST',
          body: JSON.stringify(testData)
        });
      }

      if (data && data.success) {
        alert(`Test ${editingTest ? 'updated' : 'created'} successfully!`);
        handleCancelEdit();
        if (isFreeTestMode) {
          fetchFreeTests();
        } else {
          fetchTests(selectedCourse);
        }
      }
    } catch (error) {
      alert(`Failed to ${editingTest ? 'update' : 'create'} test: ` + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTest = async (testId) => {
    if (!window.confirm('Are you sure you want to delete this test?')) return;
    
    try {
      const data = await fetchWithErrorHandling(`/api/admin/mock-tests/tests/${testId}`, {
        method: 'DELETE'
      });
      
      if (data && data.success) {
        alert('Test deleted successfully!');
        if (editingTest && editingTest._id === testId) {
          handleCancelEdit();
        }
        if (isFreeTestMode) {
          fetchFreeTests();
        } else {
          fetchTests(selectedCourse);
        }
      }
    } catch (error) {
      alert('Failed to delete test: ' + error.message);
    }
  };

  useEffect(() => {
    if (!isFreeTestMode && selectedCourse) {
      fetchTests(selectedCourse);
    }
  }, [selectedCourse, isFreeTestMode]);

  const renderForm = () => {
    return (
      <form onSubmit={handleSubmit} className="mock-test-form">
        {editingTest && (
          <div className="edit-banner">
            Editing: {editingTest.title}
            <button type="button" onClick={handleCancelEdit} className="btn-cancel">
              Cancel
            </button>
          </div>
        )}
        
        <div className="form-group">
          <label>Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows="3"
          />
        </div>

        <div className="sections-configuration">
          <h3>Section-wise Configuration</h3>
          <p className="helper-text">Configure duration and question count for each section</p>
          
          {['VARC', 'DILR', 'QA'].map((sectionName) => {
            const sectionIndex = formData.sections.findIndex(s => s.name === sectionName);
            const section = sectionIndex >= 0 
              ? formData.sections[sectionIndex] 
              : getDefaultSection(sectionName);
            
            const updateSection = (updates) => {
              const sectionsMap = new Map(formData.sections.map(s => [s.name, s]));
              sectionsMap.set(sectionName, { ...section, ...updates });
              
              const canonicalOrder = ['VARC', 'DILR', 'QA'];
              const newSections = canonicalOrder.map(name => 
                sectionsMap.get(name) || getDefaultSection(name)
              );
              
              const totalDuration = newSections.reduce((sum, s) => sum + (s.duration || 0), 0);
              const totalQuestions = newSections.reduce((sum, s) => sum + (s.totalQuestions || 0), 0);
              
              setFormData({ 
                ...formData, 
                sections: newSections, 
                duration: totalDuration,
                totalQuestions 
              });
            };
            
            return (
              <div key={sectionName} className="section-config-row">
                <div className="section-label">
                  <strong>{sectionName}</strong>
                </div>
                <div className="section-inputs">
                  <div className="form-group">
                    <label>Duration (min) *</label>
                    <input
                      type="number"
                      min="1"
                      value={section.duration || 0}
                      onChange={(e) => {
                        const duration = parseInt(e.target.value) || 0;
                        updateSection({ duration });
                      }}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Questions *</label>
                    <input
                      type="number"
                      min="0"
                      value={section.totalQuestions || 0}
                      onChange={(e) => {
                        const totalQuestions = parseInt(e.target.value) || 0;
                        const totalMarks = totalQuestions * 3;
                        updateSection({ totalQuestions, totalMarks });
                      }}
                      required
                    />
                  </div>
                </div>
              </div>
            );
          })}

          <div className="totals-summary">
            <div className="total-item">
              <strong>Total Duration:</strong> <span>{formData.duration} minutes</span>
            </div>
            <div className="total-item">
              <strong>Total Questions:</strong> <span>{formData.totalQuestions}</span>
            </div>
          </div>
        </div>

        {activeTab === 'previousYear' && subTab === 'paperWise' && (
          <>
            <div className="form-group">
              <label>Exam *</label>
              <select 
                value={formData.exam}
                onChange={(e) => setFormData({ ...formData, exam: e.target.value })}
              >
                <option value="CAT">CAT</option>
                <option value="XAT">XAT</option>
                <option value="SNAP">SNAP</option>
                <option value="IIFT">IIFT</option>
                <option value="NMAT">NMAT</option>
              </select>
            </div>

            <div className="form-group">
              <label>Year Label *</label>
              <input
                type="text"
                value={formData.yearLabel}
                onChange={(e) => setFormData({ ...formData, yearLabel: e.target.value })}
                placeholder="e.g., 2024, 2024A, 2024B"
                required
              />
            </div>
          </>
        )}

        {activeTab === 'previousYear' && subTab === 'topicWise' && (
          <>
            <div className="form-group">
              <label>Subject *</label>
              <select 
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              >
                <option value="">Select Subject</option>
                <option value="VARC">VARC</option>
                <option value="LRDI">LRDI</option>
                <option value="Quant">Quant</option>
              </select>
            </div>

            <div className="form-group">
              <label>Topic *</label>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                placeholder="e.g., Algebra, RC, Geometry"
                required
              />
            </div>
          </>
        )}

        {activeTab === 'sessional' && (
          <div className="form-group">
            <label>Session Year *</label>
            <input
              type="text"
              value={formData.sessionYear}
              onChange={(e) => setFormData({ ...formData, sessionYear: e.target.value })}
              placeholder="e.g., 2024, 2025"
              required
            />
          </div>
        )}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? (editingTest ? 'Updating...' : 'Creating...') : (editingTest ? 'Update Test' : 'Create Test')}
        </button>
      </form>
    );
  };

  return (
    <div className="mock-test-management">
      <div className="page-header">
        <h1>Mock Test Management</h1>
      </div>

      <div className="mode-toggle-container" style={{ marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
        <button
          className={`mode-btn ${!isFreeTestMode ? 'active' : ''}`}
          onClick={() => handleFreeTestModeToggle(false)}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: !isFreeTestMode ? '2px solid #10b981' : '2px solid #ddd',
            backgroundColor: !isFreeTestMode ? '#10b981' : '#fff',
            color: !isFreeTestMode ? '#fff' : '#333',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Course Mock Tests
        </button>
        <button
          className={`mode-btn ${isFreeTestMode ? 'active' : ''}`}
          onClick={() => handleFreeTestModeToggle(true)}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: isFreeTestMode ? '2px solid #f59e0b' : '2px solid #ddd',
            backgroundColor: isFreeTestMode ? '#f59e0b' : '#fff',
            color: isFreeTestMode ? '#fff' : '#333',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Free Mock Tests
        </button>
      </div>

      {!isFreeTestMode && (
        <div className="course-selector">
          <label>Select Course:</label>
          <select
            value={selectedCourse || ''}
            onChange={(e) => setSelectedCourse(e.target.value)}
          >
            <option value="">-- Select Course --</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {isFreeTestMode && (
        <div className="free-mode-info" style={{ 
          padding: '15px', 
          backgroundColor: '#fef3c7', 
          borderRadius: '8px', 
          marginBottom: '20px',
          border: '1px solid #f59e0b'
        }}>
          <strong>Free Mock Tests Mode</strong> - Tests created here will be available to all students without course enrollment.
        </div>
      )}

      <div className="tabs-container">
        <div className="main-tabs">
          <button
            className={activeTab === 'previousYear' ? 'active' : ''}
            onClick={() => setActiveTab('previousYear')}
          >
            Previous Year Papers
          </button>
          <button
            className={activeTab === 'full' ? 'active' : ''}
            onClick={() => setActiveTab('full')}
          >
            Full Tests
          </button>
          <button
            className={activeTab === 'series' ? 'active' : ''}
            onClick={() => setActiveTab('series')}
          >
            Series Tests
          </button>
          <button
            className={activeTab === 'module' ? 'active' : ''}
            onClick={() => setActiveTab('module')}
          >
            Module Tests
          </button>
          <button
            className={activeTab === 'sessional' ? 'active' : ''}
            onClick={() => setActiveTab('sessional')}
          >
            Sessional Tests
          </button>
        </div>

        {activeTab === 'previousYear' && (
          <div className="sub-tabs">
            <button
              className={subTab === 'paperWise' ? 'active' : ''}
              onClick={() => setSubTab('paperWise')}
            >
              Paper Wise
            </button>
            <button
              className={subTab === 'topicWise' ? 'active' : ''}
              onClick={() => setSubTab('topicWise')}
            >
              Topic Wise
            </button>
          </div>
        )}
      </div>

      {/* Render Question Builder if managing questions */}
      {showQuestionBuilder ? (
        <QuestionBuilder
          testPaperId={selectedTest._id}
          onClose={() => {
            setShowQuestionBuilder(false);
            setSelectedTest(null);
            if (selectedCourse) {
              fetchTests(selectedCourse);
            }
          }}
          onQuestionSaved={() => {
            if (selectedCourse) {
              fetchTests(selectedCourse);
            }
          }}
        />
      ) : activeTab === 'previousYear' ? (
        /* Render hierarchy management for Previous Year Papers */
        <div className="management-content">
          {subTab === 'paperWise' ? (
            <PaperWiseManagement selectedCourse={selectedCourse} />
          ) : (
            <TopicWiseManagement selectedCourse={selectedCourse} />
          )}
        </div>
      ) : (
        /* Render test creation form for other test types */
        <div className="content-area">
          <div className="form-section">
            <h2>{editingTest ? 'Edit Test' : 'Create New Test'}</h2>
            {renderForm()}
          </div>

          <div className="tests-list-section">
            <h2>Existing Tests</h2>
            {loading ? (
              <p>Loading...</p>
            ) : tests.length === 0 ? (
              <p>{isFreeTestMode ? 'No free tests created yet' : 'No tests found for this course'}</p>
            ) : (
              <div className="tests-grid">
                {tests.map((test) => (
                  <div key={test._id} className={`test-card ${editingTest?._id === test._id ? 'editing' : ''}`}>
                    <div className="test-header">
                      <h3>{test.title}</h3>
                      <span className={`test-type ${test.testType}`}>
                        {test.testType}
                      </span>
                    </div>
                    <p>{test.description}</p>
                    <div className="test-meta">
                      <span>⏱️ {test.duration} min</span>
                      <span>📝 {test.totalQuestions} questions</span>
                      <span>🎯 {test.totalMarks} marks</span>
                    </div>
                    {test.exam && <div className="test-exam">Exam: {test.exam}</div>}
                    {test.yearLabel && <div className="test-year">Year: {test.yearLabel}</div>}
                    {test.subject && <div className="test-subject">Subject: {test.subject}</div>}
                    {test.topic && <div className="test-topic">Topic: {test.topic}</div>}
                    <div className="test-actions">
                      <button
                        onClick={() => handleManageQuestions(test)}
                        className="btn-questions"
                      >
                        📚 Manage Questions
                      </button>
                      <button
                        onClick={() => handleEditTest(test)}
                        className="btn-edit"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTest(test._id)}
                        className="btn-delete"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MockTestManagement;
