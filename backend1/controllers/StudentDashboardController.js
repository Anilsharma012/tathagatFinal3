const MockTestAttempt = require('../models/MockTestAttempt');
const User = require('../models/UserSchema');
const LiveClass = require('../models/LiveClass');
const LiveSession = require('../models/LiveSession');
const VideoContent = require('../models/course/VideoContent');
const Course = require('../models/course/Course');
const mongoose = require('mongoose');

exports.getDashboardMetrics = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const enrolledCourseIds = (user.enrolledCourses || [])
      .filter(e => e.status === 'unlocked')
      .map(e => e.courseId);

    const testsTaken = await MockTestAttempt.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      status: { $in: ['completed', 'submitted'] }
    });

    const completedAttempts = await MockTestAttempt.find({
      userId: new mongoose.Types.ObjectId(userId),
      status: { $in: ['completed', 'submitted'] }
    }).lean();

    let totalScore = 0;
    let totalMaxScore = 0;
    completedAttempts.forEach(attempt => {
      if (attempt.score !== undefined && attempt.totalMarks) {
        totalScore += attempt.score;
        totalMaxScore += attempt.totalMarks;
      }
    });
    const averageScore = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weeklyActivity = await MockTestAttempt.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dayOfWeek: '$createdAt' },
          count: { $sum: 1 }
        }
      }
    ]);

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const learningProgress = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayOfWeek = date.getDay() + 1;
      
      const activityForDay = weeklyActivity.find(a => a._id === dayOfWeek);
      learningProgress.push({
        day: dayNames[date.getDay()],
        activities: activityForDay ? activityForDay.count : 0
      });
    }

    let totalCourseItems = 0;
    let completedItems = 0;
    let totalVideos = 0;
    let totalMockTests = 0;

    for (const courseId of enrolledCourseIds) {
      try {
        const course = await Course.findById(courseId).lean();
        if (course) {
          const videoCount = await VideoContent.countDocuments({ courseId });
          totalVideos += videoCount;
          
          // Count mock tests available in the course (assume 5 per course as baseline)
          totalMockTests += 5;
        }
      } catch (e) {
        console.warn('Error counting course items:', e.message);
      }
    }

    // Total items = videos + mock tests available
    totalCourseItems = totalVideos + totalMockTests;
    
    // Completed items = tests taken (video progress tracking not yet implemented)
    completedItems = testsTaken;

    // Calculate completion rate based on completed tests vs total expected items
    // Note: Video progress tracking would improve this metric
    const completionRate = totalCourseItems > 0 
      ? Math.round((completedItems / totalCourseItems) * 100) 
      : 0;

    const coursesEnrolled = enrolledCourseIds.length;

    res.json({
      success: true,
      data: {
        testsTaken,
        averageScore,
        completionRate: Math.min(completionRate, 100),
        coursesEnrolled,
        learningProgress,
        streak: user.streak || 0
      }
    });

  } catch (error) {
    console.error('getDashboardMetrics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard metrics' });
  }
};

exports.getCourseProgress = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const enrolledCourses = (user.enrolledCourses || [])
      .filter(e => e.status === 'unlocked');

    const courseProgressData = [];
    let totalCompleted = 0;
    let totalInProgress = 0;
    let totalNotStarted = 0;

    for (const enrollment of enrolledCourses) {
      try {
        const course = await Course.findById(enrollment.courseId).lean();
        if (!course) continue;

        const videoCount = await VideoContent.countDocuments({ courseId: enrollment.courseId });

        const testAttempts = await MockTestAttempt.countDocuments({
          userId: new mongoose.Types.ObjectId(userId),
          courseId: enrollment.courseId,
          status: { $in: ['completed', 'submitted'] }
        });

        // Calculate total items: videos + estimated mock tests per course
        // Using a reasonable baseline of 5 mock tests per course
        const estimatedMockTests = 5;
        const totalItems = videoCount + estimatedMockTests;
        
        // Completed items = tests completed (video progress tracking not yet implemented)
        const completedItems = testAttempts;
        const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

        if (progressPercent >= 80) {
          totalCompleted++;
        } else if (progressPercent > 0) {
          totalInProgress++;
        } else {
          totalNotStarted++;
        }

        courseProgressData.push({
          courseId: course._id,
          courseName: course.name,
          thumbnail: course.thumbnail,
          totalVideos: videoCount,
          watchedVideos: 0,
          testsCompleted: testAttempts,
          progressPercent: Math.min(progressPercent, 100)
        });

      } catch (e) {
        console.warn('Error calculating course progress:', e.message);
      }
    }

    const total = totalCompleted + totalInProgress + totalNotStarted;
    const chartData = total > 0 
      ? [
          Math.round((totalCompleted / total) * 100),
          Math.round((totalInProgress / total) * 100),
          Math.round((totalNotStarted / total) * 100)
        ]
      : [0, 0, 100];

    res.json({
      success: true,
      data: {
        courses: courseProgressData,
        summary: {
          completed: totalCompleted,
          inProgress: totalInProgress,
          notStarted: totalNotStarted,
          chartData
        }
      }
    });

  } catch (error) {
    console.error('getCourseProgress error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch course progress' });
  }
};

exports.getUpcomingClasses = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const enrolledCourseIds = (user.enrolledCourses || [])
      .filter(e => e.status === 'unlocked')
      .map(e => e.courseId);

    const now = new Date();

    const liveClasses = await LiveClass.find({
      courseId: { $in: enrolledCourseIds },
      startTime: { $gte: now },
      status: { $ne: 'cancelled' }
    })
    .populate('courseId', 'name')
    .sort({ startTime: 1 })
    .limit(5)
    .lean();

    let batchSessions = [];
    try {
      batchSessions = await LiveSession.find({
        date: { $gte: now }
      })
      .populate({
        path: 'liveBatchId',
        populate: { path: 'courseId', select: 'name' }
      })
      .sort({ date: 1 })
      .limit(5)
      .lean();

      batchSessions = batchSessions.filter(session => {
        const courseId = session.liveBatchId?.courseId?._id;
        return courseId && enrolledCourseIds.some(id => id.toString() === courseId.toString());
      });
    } catch (e) {
      console.warn('Error fetching batch sessions:', e.message);
    }

    const upcomingClasses = [
      ...liveClasses.map(lc => ({
        _id: lc._id,
        title: lc.title,
        courseName: lc.courseId?.name || 'Live Class',
        startTime: lc.startTime,
        endTime: lc.endTime,
        joinLink: lc.joinLink,
        platform: lc.platform,
        type: 'live_class',
        canJoin: true
      })),
      ...batchSessions.map(bs => ({
        _id: bs._id,
        title: bs.topic || bs.liveBatchId?.name || 'Batch Session',
        courseName: bs.liveBatchId?.courseId?.name || 'Batch Class',
        startTime: bs.date,
        endTime: bs.date,
        joinLink: bs.meetingLink,
        platform: bs.platform,
        type: 'batch_session',
        canJoin: !!bs.meetingLink
      }))
    ].sort((a, b) => new Date(a.startTime) - new Date(b.startTime)).slice(0, 5);

    res.json({
      success: true,
      data: upcomingClasses
    });

  } catch (error) {
    console.error('getUpcomingClasses error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch upcoming classes' });
  }
};
