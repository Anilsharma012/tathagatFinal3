import React, { useState, useEffect } from 'react';
import { fetchWithErrorHandling } from '../../../utils/api';
import './StudentPerformance.css';

const StudentPerformance = () => {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentPerformance, setStudentPerformance] = useState(null);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState('');
  const [testLeaderboard, setTestLeaderboard] = useState(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('students');

  useEffect(() => {
    fetchStudents();
    fetchTests();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/users?role=student&limit=100', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success || data.users) {
        setStudents(data.users || data.data || []);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTests = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/mock-tests/tests?limit=100', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success || data.tests) {
        setTests(data.tests || []);
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
    }
  };

  const fetchStudentPerformance = async (studentId) => {
    setPerformanceLoading(true);
    setSelectedStudent(studentId);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/mock-tests/student-performance/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setStudentPerformance(data);
      }
    } catch (error) {
      console.error('Error fetching student performance:', error);
      setStudentPerformance(null);
    } finally {
      setPerformanceLoading(false);
    }
  };

  const fetchTestLeaderboard = async (testId) => {
    if (!testId) return;
    setLeaderboardLoading(true);
    setSelectedTest(testId);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/mock-tests/test-leaderboard/${testId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setTestLeaderboard(data);
      }
    } catch (error) {
      console.error('Error fetching test leaderboard:', error);
      setTestLeaderboard(null);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const filteredStudents = students.filter(student => 
    (student.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (student.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (student.phoneNumber || '').includes(searchQuery)
  );

  const renderStudentsTab = () => (
    <div className="students-performance-section">
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search students by name, email, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="students-list-container">
        <div className="students-list">
          <h3>Students ({filteredStudents.length})</h3>
          {loading ? (
            <div className="loading">Loading students...</div>
          ) : (
            <div className="students-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map(student => (
                    <tr 
                      key={student._id} 
                      className={selectedStudent === student._id ? 'selected' : ''}
                    >
                      <td>{student.name || 'N/A'}</td>
                      <td>{student.email || 'N/A'}</td>
                      <td>{student.phoneNumber || 'N/A'}</td>
                      <td>
                        <button 
                          className="view-btn"
                          onClick={() => fetchStudentPerformance(student._id)}
                        >
                          View Performance
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selectedStudent && (
          <div className="performance-details">
            <h3>Performance Details</h3>
            {performanceLoading ? (
              <div className="loading">Loading performance data...</div>
            ) : studentPerformance ? (
              <div className="performance-content">
                <div className="student-info">
                  <h4>{studentPerformance.student?.name || 'Student'}</h4>
                  <p>{studentPerformance.student?.email}</p>
                </div>

                <div className="summary-cards">
                  <div className="summary-card">
                    <span className="card-value">{studentPerformance.summary?.totalAttempts || 0}</span>
                    <span className="card-label">Tests Taken</span>
                  </div>
                  <div className="summary-card">
                    <span className="card-value">{studentPerformance.summary?.averageScore || 0}</span>
                    <span className="card-label">Avg Score</span>
                  </div>
                  <div className="summary-card">
                    <span className="card-value">{studentPerformance.summary?.bestScore || 0}</span>
                    <span className="card-label">Best Score</span>
                  </div>
                  <div className="summary-card">
                    <span className="card-value">{studentPerformance.summary?.averagePercentile || 0}%</span>
                    <span className="card-label">Avg Percentile</span>
                  </div>
                </div>

                {studentPerformance.sectionAnalysis?.length > 0 && (
                  <div className="section-analysis">
                    <h5>Section-wise Performance</h5>
                    <div className="section-cards">
                      {studentPerformance.sectionAnalysis.map(section => (
                        <div key={section.section} className="section-card">
                          <h6>{section.section}</h6>
                          <div className="section-stats">
                            <div>
                              <span className="stat-value">{section.averageScore}</span>
                              <span className="stat-label">Avg Score</span>
                            </div>
                            <div>
                              <span className="stat-value">{section.averageAccuracy}%</span>
                              <span className="stat-label">Accuracy</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {studentPerformance.attempts?.length > 0 && (
                  <div className="attempts-list">
                    <h5>Test History</h5>
                    <table>
                      <thead>
                        <tr>
                          <th>Test Name</th>
                          <th>Score</th>
                          <th>Rank</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentPerformance.attempts.map((attempt, index) => (
                          <tr key={index}>
                            <td>{attempt.testName}</td>
                            <td>{attempt.score}</td>
                            <td>#{attempt.rank || '-'}</td>
                            <td>{new Date(attempt.completedAt).toLocaleDateString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <div className="no-data">No performance data available for this student.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderTestsTab = () => (
    <div className="tests-performance-section">
      <div className="test-selector">
        <label>Select Test:</label>
        <select 
          value={selectedTest}
          onChange={(e) => fetchTestLeaderboard(e.target.value)}
        >
          <option value="">-- Select a test --</option>
          {tests.map(test => (
            <option key={test._id} value={test._id}>
              {test.title}
            </option>
          ))}
        </select>
      </div>

      {selectedTest && (
        <div className="leaderboard-section">
          {leaderboardLoading ? (
            <div className="loading">Loading leaderboard...</div>
          ) : testLeaderboard ? (
            <>
              <div className="test-summary">
                <h3>{testLeaderboard.testName}</h3>
                <div className="summary-row">
                  <span>Total Participants: <strong>{testLeaderboard.totalParticipants}</strong></span>
                  <span>Average Score: <strong>{testLeaderboard.averageScore}</strong></span>
                  <span>Highest Score: <strong>{testLeaderboard.highestScore}</strong></span>
                </div>
              </div>

              <div className="leaderboard-table">
                <h4>Top 10 Leaderboard</h4>
                <table>
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Student Name</th>
                      <th>Email</th>
                      <th>Score</th>
                      <th>Time Taken</th>
                      <th>Percentile</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(testLeaderboard.topTen || []).map((entry, index) => (
                      <tr key={index} className={index < 3 ? 'top-three' : ''}>
                        <td>
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${entry.rank}`}
                        </td>
                        <td>{entry.studentName}</td>
                        <td>{entry.email || '-'}</td>
                        <td className="score">{entry.score}</td>
                        <td>{entry.timeTakenMinutes} min</td>
                        <td>{entry.percentile}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {testLeaderboard.allAttempts?.length > 10 && (
                <div className="all-attempts-table">
                  <h4>All Participants ({testLeaderboard.allAttempts.length})</h4>
                  <table>
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Student Name</th>
                        <th>Score</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testLeaderboard.allAttempts.slice(10).map((entry, index) => (
                        <tr key={index}>
                          <td>#{index + 11}</td>
                          <td>{entry.studentName}</td>
                          <td>{entry.score}</td>
                          <td>{new Date(entry.completedAt).toLocaleDateString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <div className="no-data">No leaderboard data available for this test.</div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="student-performance-admin">
      <div className="page-header">
        <h1>Student Performance Analytics</h1>
        <p>View mock test performance and rankings for all students</p>
      </div>

      <div className="tabs">
        <button 
          className={activeTab === 'students' ? 'active' : ''}
          onClick={() => setActiveTab('students')}
        >
          By Student
        </button>
        <button 
          className={activeTab === 'tests' ? 'active' : ''}
          onClick={() => setActiveTab('tests')}
        >
          By Test
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'students' ? renderStudentsTab() : renderTestsTab()}
      </div>
    </div>
  );
};

export default StudentPerformance;
