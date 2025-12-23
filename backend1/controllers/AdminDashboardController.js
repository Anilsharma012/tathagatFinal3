const mongoose = require('mongoose');
const User = require('../models/UserSchema');
const Course = require('../models/course/Course');
const Payment = require('../models/Payment');
const MockTestAttempt = require('../models/MockTestAttempt');
const LiveClass = require('../models/LiveClass');
const LiveSession = require('../models/LiveSession');

const getAdminDashboardMetrics = async (req, res) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalStudents,
      totalTeachers,
      totalCourses,
      activeCourses,
      newUsersThisWeek,
      newUsersThisMonth
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: { $in: ['subadmin', 'teacher'] } }),
      Course.countDocuments({}),
      Course.countDocuments({ status: 'active' }),
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } })
    ]);

    let revenue7d = 0;
    let revenue30d = 0;
    let enrollments7d = 0;
    let enrollments30d = 0;
    let recentPayments = [];

    try {
      const validPaidStatuses = ['paid'];
      
      const payments7d = await Payment.find({
        createdAt: { $gte: sevenDaysAgo },
        status: { $in: validPaidStatuses }
      }).populate('userId', 'name email').populate('courseId', 'name').sort({ createdAt: -1 }).limit(20).lean();

      const payments30d = await Payment.find({
        createdAt: { $gte: thirtyDaysAgo },
        status: { $in: validPaidStatuses }
      }).lean();

      revenue7d = payments7d.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) / 100;
      revenue30d = payments30d.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) / 100;
      enrollments7d = payments7d.length;
      enrollments30d = payments30d.length;

      recentPayments = payments7d.slice(0, 5).map(p => ({
        id: p._id,
        studentName: p.userId?.name || p.studentName || 'Unknown',
        courseName: p.courseId?.name || p.courseName || 'Unknown',
        amount: (Number(p.amount) || 0) / 100,
        status: p.status,
        date: p.createdAt
      }));
    } catch (e) {
      console.warn('Error fetching payments:', e.message);
    }

    let totalMockTests = 0;
    let testsThisWeek = 0;

    try {
      totalMockTests = await MockTestAttempt.countDocuments({ status: { $in: ['completed', 'submitted'] } });
      testsThisWeek = await MockTestAttempt.countDocuments({
        status: { $in: ['completed', 'submitted'] },
        createdAt: { $gte: sevenDaysAgo }
      });
    } catch (e) {
      console.warn('Error fetching mock test stats:', e.message);
    }

    let upcomingClasses = [];
    try {
      const liveClasses = await LiveClass.find({
        startTime: { $gte: now }
      }).sort({ startTime: 1 }).limit(5).lean();

      const liveSessions = await LiveSession.find({
        startTime: { $gte: now }
      }).sort({ startTime: 1 }).limit(5).lean();

      const allUpcoming = [
        ...liveClasses.map(c => ({
          id: c._id,
          title: c.title || c.topic || 'Live Class',
          startTime: c.startTime,
          type: 'class'
        })),
        ...liveSessions.map(s => ({
          id: s._id,
          title: s.title || s.topic || 'Session',
          startTime: s.startTime,
          type: 'session'
        }))
      ].sort((a, b) => new Date(a.startTime) - new Date(b.startTime)).slice(0, 5);

      upcomingClasses = allUpcoming;
    } catch (e) {
      console.warn('Error fetching upcoming classes:', e.message);
    }

    res.json({
      success: true,
      metrics: {
        totalUsers,
        totalStudents,
        totalTeachers,
        totalCourses,
        activeCourses,
        newUsersThisWeek,
        newUsersThisMonth,
        revenue7d,
        revenue30d,
        enrollments7d,
        enrollments30d,
        totalMockTests,
        testsThisWeek
      },
      recentPayments,
      upcomingClasses
    });
  } catch (error) {
    console.error('Admin dashboard metrics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard metrics' });
  }
};

module.exports = {
  getAdminDashboardMetrics
};
