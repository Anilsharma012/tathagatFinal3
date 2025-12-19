import React, { useEffect, useState } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import http from '../../../utils/http';
import './StudentReports.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const StudentReports = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [performanceTrend, setPerformanceTrend] = useState([]);
  const [sectionAnalysis, setSectionAnalysis] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [userRank, setUserRank] = useState(null);
  const [totalParticipants, setTotalParticipants] = useState(0);

  useEffect(() => {
    fetchReportsData();
  }, []);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      console.log('📊 StudentReports: Fetching reports data...');
      
      const [summaryRes, sectionRes] = await Promise.all([
        http.get('/mock-tests/reports/summary'),
        http.get('/mock-tests/reports/section-analysis')
      ]);

      console.log('📊 Summary response:', summaryRes.data);
      console.log('📊 Section response:', sectionRes.data);

      if (summaryRes.data?.success) {
        setSummary(summaryRes.data.summary);
        setAttempts(summaryRes.data.attempts);
        setPerformanceTrend(summaryRes.data.performanceTrend);
        console.log('📊 Set summary:', summaryRes.data.summary);
      }

      if (sectionRes.data?.success) {
        setSectionAnalysis(sectionRes.data.analysis);
        setUserRank(sectionRes.data.userRank);
        setTotalParticipants(sectionRes.data.totalParticipants);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
      console.log('📊 Finished loading reports');
    }
  };

  const fetchLeaderboard = async (testId, testName) => {
    try {
      const response = await http.get(`/mock-tests/reports/${testId}/leaderboard`);
      if (response.data?.success) {
        setLeaderboard(response.data);
        setSelectedTest({ id: testId, name: testName });
        setShowLeaderboard(true);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const trendChartData = {
    labels: performanceTrend.map(p => p.testName),
    datasets: [{
      label: 'Score',
      data: performanceTrend.map(p => p.score),
      fill: true,
      backgroundColor: 'rgba(45, 140, 255, 0.1)',
      borderColor: '#2d8cff',
      tension: 0.4,
      pointBackgroundColor: '#2d8cff',
      pointRadius: 5
    }]
  };

  const sectionChartData = {
    labels: sectionAnalysis.map(s => s.section),
    datasets: [{
      label: 'Average Score',
      data: sectionAnalysis.map(s => parseFloat(s.averageScore)),
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
      borderWidth: 0
    }]
  };

  const accuracyChartData = {
    labels: sectionAnalysis.map(s => s.section),
    datasets: [{
      label: 'Accuracy %',
      data: sectionAnalysis.map(s => parseFloat(s.averageAccuracy)),
      backgroundColor: ['rgba(255, 99, 132, 0.7)', 'rgba(54, 162, 235, 0.7)', 'rgba(255, 206, 86, 0.7)'],
      borderColor: ['#FF6384', '#36A2EB', '#FFCE56'],
      borderWidth: 2
    }]
  };

  console.log('📊 Render - loading state:', loading, 'summary:', summary ? 'present' : 'null');
  
  if (loading) {
    return (
      <div className="reports-container">
        <div className="loading-state">Loading your reports...</div>
      </div>
    );
  }

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h1>Analysis & Reports</h1>
        <p>Track your mock test performance and compare with top students</p>
      </div>

      <div className="stats-cards-row">
        <div className="stat-card blue">
          <div className="stat-icon">
            <span>📝</span>
          </div>
          <div className="stat-info">
            <h3>{summary?.totalAttempts || 0}</h3>
            <p>Tests Taken</p>
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon">
            <span>📊</span>
          </div>
          <div className="stat-info">
            <h3>{summary?.averageScore || 0}</h3>
            <p>Average Score</p>
          </div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon">
            <span>🏆</span>
          </div>
          <div className="stat-info">
            <h3>{summary?.bestScore || 0}</h3>
            <p>Best Score</p>
          </div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon">
            <span>⏱️</span>
          </div>
          <div className="stat-info">
            <h3>{summary?.averageTimeMinutes || 0} min</h3>
            <p>Avg. Time</p>
          </div>
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-card">
          <h3>Performance Trend</h3>
          <div className="chart-container">
            {performanceTrend.length > 0 ? (
              <Line 
                data={trendChartData}
                height={150}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: { beginAtZero: true, max: 200 }
                  }
                }}
              />
            ) : (
              <div className="empty-chart">No data available yet</div>
            )}
          </div>
        </div>
        <div className="chart-card">
          <h3>Section-wise Performance</h3>
          <div className="chart-container">
            {sectionAnalysis.length > 0 ? (
              <Doughnut 
                data={sectionChartData}
                height={150}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } }
                  }
                }}
              />
            ) : (
              <div className="empty-chart">No data available yet</div>
            )}
          </div>
        </div>
        <div className="chart-card">
          <h3>Section Accuracy</h3>
          <div className="chart-container">
            {sectionAnalysis.length > 0 ? (
              <Bar 
                data={accuracyChartData}
                height={150}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: { beginAtZero: true, max: 100 }
                  }
                }}
              />
            ) : (
              <div className="empty-chart">No data available yet</div>
            )}
          </div>
        </div>
      </div>

      {userRank && (
        <div className="rank-progress-card">
          <h3>Your Overall Ranking</h3>
          <div className="rank-stats">
            <div className="rank-item">
              <span className="rank-value">#{userRank}</span>
              <span className="rank-label">Current Rank</span>
            </div>
            <div className="rank-item">
              <span className="rank-value">{totalParticipants}</span>
              <span className="rank-label">Total Participants</span>
            </div>
            <div className="rank-item">
              <span className="rank-value">{totalParticipants > 0 ? ((1 - (userRank / totalParticipants)) * 100).toFixed(1) : 0}%</span>
              <span className="rank-label">Percentile</span>
            </div>
          </div>
        </div>
      )}

      <div className="comparison-section">
        <h2>Subject-wise Performance vs Top 10</h2>
        <p className="section-subtitle">Compare your scores with top 10 performers in each subject</p>
        <div className="section-stats-row">
          {sectionAnalysis.map(section => (
            <div key={section.section} className={`section-stat-card ${section.section.toLowerCase()}`}>
              <h4>{section.section === 'VARC' ? 'Verbal Ability & Reading Comprehension' : section.section === 'DILR' ? 'Data Interpretation & Logical Reasoning' : section.section === 'QA' ? 'Quantitative Aptitude' : section.section}</h4>
              <div className="section-metrics">
                <div className="metric">
                  <span className="value">{section.averageScore}</span>
                  <span className="label">Your Score</span>
                </div>
                <div className="metric">
                  <span className="value">{section.top10AverageScore || 0}</span>
                  <span className="label">Top 10 Avg</span>
                </div>
                <div className="metric">
                  <span className={`value ${parseFloat(section.scoreDifference) >= 0 ? 'positive' : 'negative'}`}>
                    {parseFloat(section.scoreDifference) >= 0 ? '+' : ''}{section.scoreDifference}
                  </span>
                  <span className="label">Difference</span>
                </div>
              </div>
              <div className="accuracy-comparison">
                <div className="accuracy-bar">
                  <div className="accuracy-label">Your Accuracy: {section.averageAccuracy}%</div>
                  <div className="accuracy-progress">
                    <div className="progress-fill user" style={{width: `${Math.min(100, section.averageAccuracy)}%`}}></div>
                  </div>
                </div>
                <div className="accuracy-bar">
                  <div className="accuracy-label">Top 10 Accuracy: {section.top10AverageAccuracy || 0}%</div>
                  <div className="accuracy-progress">
                    <div className="progress-fill top10" style={{width: `${Math.min(100, section.top10AverageAccuracy || 0)}%`}}></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="attempts-section">
        <h2>Your Test Attempts</h2>
        {attempts.length === 0 ? (
          <div className="empty-state">
            <p>You haven't taken any mock tests yet.</p>
            <a href="/student/mock-tests" className="start-test-btn">Start a Mock Test</a>
          </div>
        ) : (
          <div className="attempts-table-container">
            <table className="attempts-table">
              <thead>
                <tr>
                  <th>Test Name</th>
                  <th>Score</th>
                  <th>Time Taken</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map(attempt => (
                  <tr key={attempt._id}>
                    <td>
                      <div className="test-name-cell">
                        <span className="test-name">{attempt.testName}</span>
                        {attempt.seriesName && <span className="series-name">{attempt.seriesName}</span>}
                      </div>
                    </td>
                    <td>
                      <span className="score-badge">{attempt.score}/{attempt.maxScore}</span>
                    </td>
                    <td>{attempt.timeTakenMinutes} min</td>
                    <td>{new Date(attempt.completedAt).toLocaleDateString()}</td>
                    <td>
                      <button 
                        className="action-btn leaderboard-btn"
                        onClick={() => fetchLeaderboard(attempt.testId, attempt.testName)}
                      >
                        Leaderboard
                      </button>
                      <a 
                        href={`/student/mock-test/review/${attempt._id}`}
                        className="action-btn review-btn"
                      >
                        Review
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showLeaderboard && leaderboard && (
        <div className="modal-overlay" onClick={() => setShowLeaderboard(false)}>
          <div className="leaderboard-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Top 10 - {selectedTest?.name}</h2>
              <button onClick={() => setShowLeaderboard(false)}>x</button>
            </div>
            <div className="modal-content">
              <div className="leaderboard-stats">
                <div className="lb-stat">
                  <span className="lb-value">{leaderboard.totalParticipants}</span>
                  <span className="lb-label">Total Participants</span>
                </div>
                {leaderboard.currentUserRank && (
                  <div className="lb-stat highlight">
                    <span className="lb-value">#{leaderboard.currentUserRank}</span>
                    <span className="lb-label">Your Rank</span>
                  </div>
                )}
                {leaderboard.currentUserScore !== null && (
                  <div className="lb-stat">
                    <span className="lb-value">{leaderboard.currentUserScore}</span>
                    <span className="lb-label">Your Score</span>
                  </div>
                )}
              </div>
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Student</th>
                    <th>Score</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.topTen.map(student => (
                    <tr key={student.rank} className={student.isCurrentUser ? 'current-user' : ''}>
                      <td>
                        <span className={`rank-badge rank-${student.rank}`}>
                          {student.rank <= 3 ? ['🥇', '🥈', '🥉'][student.rank - 1] : `#${student.rank}`}
                        </span>
                      </td>
                      <td>
                        {student.studentName}
                        {student.isCurrentUser && <span className="you-tag">(You)</span>}
                      </td>
                      <td className="score-cell">{student.score}</td>
                      <td>{student.timeTakenMinutes} min</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentReports;
