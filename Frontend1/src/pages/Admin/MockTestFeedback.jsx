import React, { useState, useEffect } from 'react';
import './MockTestFeedback.css';

const MockTestFeedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  useEffect(() => {
    fetchFeedbacks();
  }, [page, search]);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const authToken = localStorage.getItem('authToken');
      const response = await fetch(`/api/mock-test-feedback/admin/all?page=${page}&limit=20&search=${search}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setFeedbacks(data.feedbacks);
        setStats(data.stats);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (feedbackId) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;
    
    try {
      const authToken = localStorage.getItem('authToken');
      const response = await fetch(`/api/mock-test-feedback/admin/${feedbackId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      const data = await response.json();
      if (data.success) {
        fetchFeedbacks();
      }
    } catch (error) {
      console.error('Error deleting feedback:', error);
    }
  };

  const handleExportCSV = async () => {
    try {
      const authToken = localStorage.getItem('authToken');
      const response = await fetch('/api/mock-test-feedback/admin/export', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      const data = await response.json();
      
      if (data.success && data.feedbacks.length > 0) {
        const headers = [
          'Student Name', 'Email', 'Test', 'Exam Support', 'Digital Experience',
          'Locating Center', 'Finding Seat', 'Seating', 'Facilities',
          'Desktop Quality', 'Staff Behavior', 'Overall Experience', 'Average', 'Submitted At'
        ];
        
        const rows = data.feedbacks.map(f => [
          f.studentName || '',
          f.studentEmail || '',
          f.testId?.title || '',
          f.responses?.q1_exam_support || '',
          f.responses?.q2_digital_exam_experience || '',
          f.responses?.q3_1_ease_of_locating || '',
          f.responses?.q3_2_finding_seat || '',
          f.responses?.q3_3_seating_arrangement || '',
          f.responses?.q3_4_basic_facilities || '',
          f.responses?.q3_5_exam_node_quality || '',
          f.responses?.q3_6_staff_behavior || '',
          f.responses?.q4_overall_experience || '',
          f.averageRating?.toFixed(2) || '',
          new Date(f.submittedAt).toLocaleString()
        ]);

        const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mock_test_feedbacks_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
      }
    } catch (error) {
      console.error('Error exporting:', error);
    }
  };

  const getRatingColor = (rating) => {
    if (rating >= 3.5) return '#27ae60';
    if (rating >= 2.5) return '#f39c12';
    return '#e74c3c';
  };

  const getRatingLabel = (rating) => {
    if (rating === 4) return 'Exceeded';
    if (rating === 3) return 'Met';
    if (rating === 2) return 'Needs Improvement';
    if (rating === 1) return 'Failed';
    return '-';
  };

  return (
    <div className="admin-feedback-container">
      <div className="feedback-header-section">
        <h1>Mock Test Feedback Management</h1>
        <p>View and manage student feedback for mock tests</p>
      </div>

      {stats && (
        <div className="feedback-stats-row">
          <div className="stat-card">
            <h3>Total Feedbacks</h3>
            <p className="stat-value">{stats.totalFeedbacks}</p>
          </div>
          <div className="stat-card">
            <h3>Average Rating</h3>
            <p className="stat-value" style={{ color: getRatingColor(parseFloat(stats.averageRating)) }}>
              {stats.averageRating}/4
            </p>
          </div>
          <div className="stat-card">
            <h3>Exceeded (4)</h3>
            <p className="stat-value green">{stats.ratingDistribution[4]}</p>
          </div>
          <div className="stat-card">
            <h3>Met (3)</h3>
            <p className="stat-value blue">{stats.ratingDistribution[3]}</p>
          </div>
          <div className="stat-card">
            <h3>Needs Improvement (2)</h3>
            <p className="stat-value yellow">{stats.ratingDistribution[2]}</p>
          </div>
          <div className="stat-card">
            <h3>Failed (1)</h3>
            <p className="stat-value red">{stats.ratingDistribution[1]}</p>
          </div>
        </div>
      )}

      <div className="feedback-controls">
        <input
          type="text"
          placeholder="Search by student name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <button onClick={handleExportCSV} className="export-btn">
          Export CSV
        </button>
      </div>

      {loading ? (
        <div className="loading-state">Loading feedbacks...</div>
      ) : feedbacks.length === 0 ? (
        <div className="empty-state">No feedbacks found</div>
      ) : (
        <div className="feedback-table-container">
          <table className="feedback-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Test</th>
                <th>Avg Rating</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {feedbacks.map(feedback => (
                <tr key={feedback._id}>
                  <td>
                    <div className="student-info">
                      <span className="name">{feedback.studentName || 'N/A'}</span>
                      <span className="email">{feedback.studentEmail || ''}</span>
                    </div>
                  </td>
                  <td>{feedback.testId?.title || 'Unknown Test'}</td>
                  <td>
                    <span 
                      className="rating-badge"
                      style={{ backgroundColor: getRatingColor(feedback.averageRating) }}
                    >
                      {feedback.averageRating?.toFixed(1)}/4
                    </span>
                  </td>
                  <td>{new Date(feedback.submittedAt).toLocaleDateString()}</td>
                  <td>
                    <button 
                      className="view-btn"
                      onClick={() => setSelectedFeedback(feedback)}
                    >
                      View
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDelete(feedback._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <span>Page {page} of {totalPages}</span>
          <button 
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      )}

      {selectedFeedback && (
        <div className="modal-overlay" onClick={() => setSelectedFeedback(null)}>
          <div className="feedback-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Feedback Details</h2>
              <button onClick={() => setSelectedFeedback(null)}>×</button>
            </div>
            <div className="modal-content">
              <div className="detail-row">
                <span className="label">Student:</span>
                <span className="value">{selectedFeedback.studentName}</span>
              </div>
              <div className="detail-row">
                <span className="label">Email:</span>
                <span className="value">{selectedFeedback.studentEmail}</span>
              </div>
              <div className="detail-row">
                <span className="label">Test:</span>
                <span className="value">{selectedFeedback.testId?.title}</span>
              </div>
              <div className="detail-row">
                <span className="label">Submitted:</span>
                <span className="value">{new Date(selectedFeedback.submittedAt).toLocaleString()}</span>
              </div>
              
              <h3>Ratings</h3>
              <div className="ratings-grid">
                <div className="rating-item">
                  <span>Exam Support</span>
                  <span className="rating">{getRatingLabel(selectedFeedback.responses?.q1_exam_support)}</span>
                </div>
                <div className="rating-item">
                  <span>Digital Experience</span>
                  <span className="rating">{getRatingLabel(selectedFeedback.responses?.q2_digital_exam_experience)}</span>
                </div>
                <div className="rating-item">
                  <span>Locating Center</span>
                  <span className="rating">{getRatingLabel(selectedFeedback.responses?.q3_1_ease_of_locating)}</span>
                </div>
                <div className="rating-item">
                  <span>Finding Seat</span>
                  <span className="rating">{getRatingLabel(selectedFeedback.responses?.q3_2_finding_seat)}</span>
                </div>
                <div className="rating-item">
                  <span>Seating Arrangement</span>
                  <span className="rating">{getRatingLabel(selectedFeedback.responses?.q3_3_seating_arrangement)}</span>
                </div>
                <div className="rating-item">
                  <span>Basic Facilities</span>
                  <span className="rating">{getRatingLabel(selectedFeedback.responses?.q3_4_basic_facilities)}</span>
                </div>
                <div className="rating-item">
                  <span>Desktop Quality</span>
                  <span className="rating">{getRatingLabel(selectedFeedback.responses?.q3_5_exam_node_quality)}</span>
                </div>
                <div className="rating-item">
                  <span>Staff Behavior</span>
                  <span className="rating">{getRatingLabel(selectedFeedback.responses?.q3_6_staff_behavior)}</span>
                </div>
              </div>
              
              {selectedFeedback.responses?.q4_overall_experience && (
                <div className="overall-experience">
                  <h3>Overall Experience</h3>
                  <p>{selectedFeedback.responses.q4_overall_experience}</p>
                </div>
              )}
              
              <div className="average-rating">
                <span>Average Rating:</span>
                <span 
                  className="rating-value"
                  style={{ color: getRatingColor(selectedFeedback.averageRating) }}
                >
                  {selectedFeedback.averageRating?.toFixed(2)}/4
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MockTestFeedback;
