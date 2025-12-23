import React from "react";
import AdminLayout from "./AdminLayout/AdminLayout";
import "./AdminDashboard.css";
import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { FaUsers, FaBookOpen, FaChalkboardTeacher, FaUserGraduate, FaRupeeSign, FaCalendarCheck, FaClipboardList, FaArrowUp, FaArrowDown } from "react-icons/fa";

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [recentPayments, setRecentPayments] = useState([]);
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const response = await axios.get('/api/admin/dashboard-metrics', { headers });
        
        if (response.data?.success) {
          setMetrics(response.data.metrics);
          setRecentPayments(response.data.recentPayments || []);
          setUpcomingClasses(response.data.upcomingClasses || []);
        } else {
          setMetrics({
            totalUsers: 0,
            totalStudents: 0,
            totalTeachers: 0,
            totalCourses: 0,
            activeCourses: 0,
            newUsersThisWeek: 0,
            enrollments7d: 0,
            revenue7d: 0
          });
        }
      } catch (error) {
        console.error('Failed to fetch dashboard metrics:', error);
        setMetrics({
          totalUsers: 0,
          totalStudents: 0,
          totalTeachers: 0,
          totalCourses: 0,
          activeCourses: 0,
          newUsersThisWeek: 0,
          enrollments7d: 0,
          revenue7d: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const quickActions = [
    { label: 'Add Course', path: '/admin/courses/add' },
    { label: 'Manage Subjects', path: '/admin/subjects' },
    { label: 'Schedule Class', path: '/admin/live-classes' },
    { label: 'Create Invoice', path: '/admin/invoices/create' },
    { label: 'Announcement', path: '/admin/announcements' }
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-dashboard">
          <div className="dashboard-loading">
            <div className="loading-spinner"></div>
            <p>Loading dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-dashboard">
        <div className="dashboard-header">
          <h1>Admin Dashboard</h1>
          <p className="dashboard-subtitle">Welcome back! Here's your platform overview.</p>
        </div>

        <div className="metrics-grid">
          <div className="metric-card primary">
            <div className="metric-icon-wrapper">
              <FaUsers />
            </div>
            <div className="metric-content">
              <span className="metric-value">{metrics?.totalUsers?.toLocaleString() || '0'}</span>
              <span className="metric-label">Total Users</span>
            </div>
            {metrics?.newUsersThisWeek > 0 && (
              <div className="metric-badge positive">
                <FaArrowUp /> +{metrics.newUsersThisWeek} this week
              </div>
            )}
          </div>

          <div className="metric-card success">
            <div className="metric-icon-wrapper">
              <FaBookOpen />
            </div>
            <div className="metric-content">
              <span className="metric-value">{metrics?.activeCourses ?? 0}</span>
              <span className="metric-label">Active Courses</span>
            </div>
          </div>

          <div className="metric-card info">
            <div className="metric-icon-wrapper">
              <FaChalkboardTeacher />
            </div>
            <div className="metric-content">
              <span className="metric-value">{metrics?.totalTeachers || '0'}</span>
              <span className="metric-label">Teachers</span>
            </div>
          </div>

          <div className="metric-card warning">
            <div className="metric-icon-wrapper">
              <FaUserGraduate />
            </div>
            <div className="metric-content">
              <span className="metric-value">{metrics?.totalStudents?.toLocaleString() || '0'}</span>
              <span className="metric-label">Students</span>
            </div>
          </div>

          <div className="metric-card accent">
            <div className="metric-icon-wrapper">
              <FaCalendarCheck />
            </div>
            <div className="metric-content">
              <span className="metric-value">{metrics?.enrollments7d || '0'}</span>
              <span className="metric-label">Enrollments (7d)</span>
            </div>
          </div>

          <div className="metric-card revenue">
            <div className="metric-icon-wrapper">
              <FaRupeeSign />
            </div>
            <div className="metric-content">
              <span className="metric-value">{formatCurrency(metrics?.revenue7d)}</span>
              <span className="metric-label">Revenue (7d)</span>
            </div>
          </div>
        </div>

        <div className="dashboard-sections">
          <div className="dashboard-section upcoming-classes">
            <div className="section-header">
              <h2><FaCalendarCheck /> Upcoming Classes</h2>
            </div>
            <div className="section-content">
              {upcomingClasses.length > 0 ? (
                <ul className="class-list">
                  {upcomingClasses.map((cls, index) => (
                    <li key={cls.id || index} className="class-item">
                      <div className="class-info">
                        <span className="class-title">{cls.title}</span>
                        <span className="class-type">{cls.type === 'session' ? 'Batch Session' : 'Live Class'}</span>
                      </div>
                      <div className="class-time">
                        <span className="time">{formatTime(cls.startTime)}</span>
                        <span className="date">{formatDate(cls.startTime)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="empty-state">
                  <p>No upcoming classes scheduled</p>
                </div>
              )}
            </div>
          </div>

          <div className="dashboard-section recent-payments">
            <div className="section-header">
              <h2><FaRupeeSign /> Recent Payments</h2>
            </div>
            <div className="section-content">
              {recentPayments.length > 0 ? (
                <div className="payments-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Course</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentPayments.map((payment, index) => (
                        <tr key={payment.id || index}>
                          <td className="student-name">{payment.studentName}</td>
                          <td className="course-name">{payment.courseName}</td>
                          <td className="amount">{formatCurrency(payment.amount)}</td>
                          <td>
                            <span className={`status-badge ${payment.status?.toLowerCase() === 'paid' || payment.status?.toLowerCase() === 'success' ? 'success' : 'pending'}`}>
                              {payment.status}
                            </span>
                          </td>
                          <td className="date">{formatDate(payment.date)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">
                  <p>No recent payments</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            {quickActions.map((action, index) => (
              <a key={index} href={action.path} className="action-btn">
                {action.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
