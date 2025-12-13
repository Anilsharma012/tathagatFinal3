const LiveBatch = require('../models/LiveBatch');
const LiveSession = require('../models/LiveSession');
const CourseLiveBatch = require('../models/CourseLiveBatch');
const Subject = require('../models/course/Subject');
const Course = require('../models/course/Course');
const Enrollment = require('../models/Enrollment');
const mongoose = require('mongoose');
const { notifyEnrolledStudents } = require('./NotificationController');

const listSubjectsForBatches = async (req, res) => {
  try {
    const { courseId } = req.query;
    const filter = { isActive: true };
    if (courseId) filter.courseId = courseId;
    
    const subjects = await Subject.find(filter)
      .select('_id name courseId instructor')
      .populate('courseId', 'name')
      .sort({ name: 1 });
    res.json({ success: true, data: subjects });
  } catch (error) {
    console.error('Error listing subjects:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCourseSubjectMap = async (req, res) => {
  try {
    const courses = await Course.find({ isActive: true })
      .select('_id name courseType')
      .sort({ name: 1 });
    
    const courseIds = courses.map(c => c._id);
    
    const subjects = await Subject.find({ 
      courseId: { $in: courseIds },
      isActive: true 
    })
      .select('_id name courseId instructor order')
      .sort({ courseId: 1, order: 1, name: 1 });
    
    const subjectsByCourse = {};
    subjects.forEach(subject => {
      const cid = subject.courseId.toString();
      if (!subjectsByCourse[cid]) {
        subjectsByCourse[cid] = [];
      }
      subjectsByCourse[cid].push({
        _id: subject._id,
        name: subject.name,
        instructor: subject.instructor || ''
      });
    });
    
    const result = courses.map(course => ({
      _id: course._id,
      name: course.name,
      courseType: course.courseType,
      subjects: subjectsByCourse[course._id.toString()] || []
    }));
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error getting course-subject map:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const createBatch = async (req, res) => {
  try {
    const { name, courseId, subjectId, description, instructor, isActive } = req.body;
    
    if (!name || !courseId || !subjectId) {
      return res.status(400).json({ success: false, message: 'Name, courseId and subjectId are required' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    if (subject.courseId.toString() !== courseId) {
      return res.status(400).json({ success: false, message: 'Subject does not belong to the selected course' });
    }

    const batch = new LiveBatch({
      name,
      courseId,
      subjectId,
      description: description || '',
      instructor: instructor || subject.instructor || '',
      isActive: isActive !== false,
      createdBy: req.admin?._id
    });

    await batch.save();
    
    const populatedBatch = await LiveBatch.findById(batch._id)
      .populate('courseId', 'name')
      .populate('subjectId', 'name instructor');

    res.status(201).json({ success: true, data: populatedBatch });
  } catch (error) {
    console.error('Error creating batch:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const listBatches = async (req, res) => {
  try {
    const { courseId, subjectId, isActive } = req.query;
    const filter = {};
    
    if (courseId) filter.courseId = courseId;
    if (subjectId) filter.subjectId = subjectId;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const batches = await LiveBatch.find(filter)
      .populate('courseId', 'name')
      .populate('subjectId', 'name instructor')
      .sort({ createdAt: -1 });

    const batchesWithStats = await Promise.all(batches.map(async (batch) => {
      const sessionCount = await LiveSession.countDocuments({ liveBatchId: batch._id });
      const courseCount = await CourseLiveBatch.countDocuments({ liveBatchId: batch._id });
      return {
        ...batch.toObject(),
        sessionCount,
        courseCount
      };
    }));

    res.json({ success: true, data: batchesWithStats });
  } catch (error) {
    console.error('Error listing batches:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const batch = await LiveBatch.findById(id)
      .populate('subjectId', 'name courseId')
      .populate('courseId', 'name');
    
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    const sessions = await LiveSession.find({ liveBatchId: id }).sort({ date: 1, startTime: 1 });
    const linkedCourses = await CourseLiveBatch.find({ liveBatchId: id })
      .populate('courseId', 'name description courseType price');

    res.json({ 
      success: true, 
      data: { 
        ...batch.toObject(), 
        sessions, 
        linkedCourses 
      } 
    });
  } catch (error) {
    console.error('Error getting batch:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, courseId, subjectId, description, instructor, isActive } = req.body;

    const batch = await LiveBatch.findById(id);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    if (name) batch.name = name;
    if (courseId) batch.courseId = courseId;
    if (subjectId) batch.subjectId = subjectId;
    if (description !== undefined) batch.description = description;
    if (instructor !== undefined) batch.instructor = instructor;
    if (isActive !== undefined) batch.isActive = isActive;

    await batch.save();

    const updatedBatch = await LiveBatch.findById(id)
      .populate('courseId', 'name')
      .populate('subjectId', 'name instructor');

    res.json({ success: true, data: updatedBatch });
  } catch (error) {
    console.error('Error updating batch:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteBatch = async (req, res) => {
  try {
    const { id } = req.params;

    const sessionCount = await LiveSession.countDocuments({ liveBatchId: id });
    if (sessionCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete batch with ${sessionCount} sessions. Delete sessions first.` 
      });
    }

    await CourseLiveBatch.deleteMany({ liveBatchId: id });
    await LiveBatch.findByIdAndDelete(id);

    res.json({ success: true, message: 'Batch deleted successfully' });
  } catch (error) {
    console.error('Error deleting batch:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const createSession = async (req, res) => {
  try {
    const { 
      liveBatchId, topic, description, date, startTime, endTime, 
      duration, platform, meetingLink, meetingId, meetingPassword, notes,
      sendNotification = true
    } = req.body;

    if (!liveBatchId || !topic || !date || !startTime || !endTime) {
      return res.status(400).json({ 
        success: false, 
        message: 'liveBatchId, topic, date, startTime, and endTime are required' 
      });
    }

    const batch = await LiveBatch.findById(liveBatchId);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    const sessionCount = await LiveSession.countDocuments({ liveBatchId });
    
    const session = new LiveSession({
      liveBatchId,
      sessionNumber: sessionCount + 1,
      topic,
      description: description || '',
      date: new Date(date),
      startTime,
      endTime,
      duration: duration || 60,
      platform: platform || 'zoom',
      meetingLink: meetingLink || '',
      meetingId: meetingId || '',
      meetingPassword: meetingPassword || '',
      notes: notes || '',
      createdBy: req.admin?._id
    });

    await session.save();

    batch.totalSessions = sessionCount + 1;
    await batch.save();

    if (sendNotification) {
      try {
        const linkedCourses = await CourseLiveBatch.find({ liveBatchId });
        const courseIds = linkedCourses.map(lc => lc.courseId);
        
        if (courseIds.length > 0) {
          const notifiedCount = await notifyEnrolledStudents(session, batch, courseIds);
          console.log(`Notified ${notifiedCount} students about new session: ${topic}`);
        }
      } catch (notifyErr) {
        console.error('Error sending notifications (non-blocking):', notifyErr);
      }
    }

    res.status(201).json({ success: true, data: session });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const listSessions = async (req, res) => {
  try {
    const { liveBatchId, status, fromDate, toDate } = req.query;
    const filter = {};

    if (liveBatchId) filter.liveBatchId = liveBatchId;
    if (status) filter.status = status;
    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) filter.date.$gte = new Date(fromDate);
      if (toDate) filter.date.$lte = new Date(toDate);
    }

    const sessions = await LiveSession.find(filter)
      .populate({
        path: 'liveBatchId',
        select: 'name subjectId',
        populate: { path: 'subjectId', select: 'name' }
      })
      .sort({ date: 1, startTime: 1 });

    res.json({ success: true, data: sessions });
  } catch (error) {
    console.error('Error listing sessions:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSession = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await LiveSession.findById(id)
      .populate({
        path: 'liveBatchId',
        select: 'name subjectId',
        populate: { path: 'subjectId', select: 'name' }
      });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    res.json({ success: true, data: session });
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateSession = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const session = await LiveSession.findById(id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const allowedFields = [
      'topic', 'description', 'date', 'startTime', 'endTime', 'duration',
      'platform', 'meetingLink', 'meetingId', 'meetingPassword', 
      'recordingUrl', 'notes', 'status', 'materials'
    ];

    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        if (field === 'date') {
          session[field] = new Date(updates[field]);
        } else {
          session[field] = updates[field];
        }
      }
    });

    await session.save();

    res.json({ success: true, data: session });
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteSession = async (req, res) => {
  try {
    const { id } = req.params;
    
    const session = await LiveSession.findById(id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const batchId = session.liveBatchId;
    await LiveSession.findByIdAndDelete(id);

    const newCount = await LiveSession.countDocuments({ liveBatchId: batchId });
    await LiveBatch.findByIdAndUpdate(batchId, { totalSessions: newCount });

    res.json({ success: true, message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const attachCourses = async (req, res) => {
  try {
    const { liveBatchId, courses } = req.body;

    if (!liveBatchId || !courses || !Array.isArray(courses)) {
      return res.status(400).json({ 
        success: false, 
        message: 'liveBatchId and courses array are required' 
      });
    }

    const batch = await LiveBatch.findById(liveBatchId);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    const results = [];
    for (const courseData of courses) {
      const { courseId, visibleFrom, visibleTill } = courseData;

      if (!courseId || !visibleFrom) {
        results.push({ courseId, success: false, message: 'courseId and visibleFrom are required' });
        continue;
      }

      const course = await Course.findById(courseId);
      if (!course) {
        results.push({ courseId, success: false, message: 'Course not found' });
        continue;
      }

      try {
        const existing = await CourseLiveBatch.findOne({ courseId, liveBatchId });
        if (existing) {
          existing.visibleFrom = new Date(visibleFrom);
          if (visibleTill) existing.visibleTill = new Date(visibleTill);
          existing.subjectId = batch.subjectId;
          await existing.save();
          results.push({ courseId, success: true, message: 'Updated', data: existing });
        } else {
          const link = new CourseLiveBatch({
            courseId,
            liveBatchId,
            subjectId: batch.subjectId,
            visibleFrom: new Date(visibleFrom),
            visibleTill: visibleTill ? new Date(visibleTill) : null,
            createdBy: req.admin?._id
          });
          await link.save();
          results.push({ courseId, success: true, message: 'Created', data: link });
        }
      } catch (err) {
        results.push({ courseId, success: false, message: err.message });
      }
    }

    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Error attaching courses:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const detachCourse = async (req, res) => {
  try {
    const { liveBatchId, courseId } = req.params;

    const result = await CourseLiveBatch.findOneAndDelete({ liveBatchId, courseId });
    if (!result) {
      return res.status(404).json({ success: false, message: 'Link not found' });
    }

    res.json({ success: true, message: 'Course detached from batch' });
  } catch (error) {
    console.error('Error detaching course:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getLinkedCourses = async (req, res) => {
  try {
    const { liveBatchId } = req.params;

    const links = await CourseLiveBatch.find({ liveBatchId })
      .populate('courseId', 'name description courseType price')
      .sort({ visibleFrom: -1 });

    res.json({ success: true, data: links });
  } catch (error) {
    console.error('Error getting linked courses:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getStudentSchedule = async (req, res) => {
  try {
    const { courseId } = req.query;
    const userId = req.user?._id || req.user?.id;

    console.log('[getStudentSchedule] courseId:', courseId, 'userId:', userId);

    if (!courseId) {
      return res.status(400).json({ success: false, message: 'courseId is required' });
    }

    const User = require('../models/UserSchema');
    
    let enrollment = await Enrollment.findOne({ 
      userId, 
      courseId,
      status: 'active'
    });
    console.log('[getStudentSchedule] Enrollment found:', !!enrollment);

    let enrollmentDate = enrollment?.joinedAt || new Date();

    if (!enrollment) {
      const user = await User.findById(userId);
      const userEnrollment = user?.enrolledCourses?.find(
        ec => ec.courseId && ec.courseId.toString() === courseId && ec.status === 'unlocked'
      );
      
      if (userEnrollment) {
        enrollmentDate = userEnrollment.enrolledAt || new Date();
      } else {
        return res.status(403).json({ 
          success: false, 
          message: 'You are not enrolled in this course' 
        });
      }
    }

    const now = new Date();

    const courseBatches = await CourseLiveBatch.find({
      courseId,
      isActive: true,
      visibleFrom: { $lte: now },
      $or: [
        { visibleTill: null },
        { visibleTill: { $gte: now } }
      ]
    }).populate({
      path: 'liveBatchId',
      match: { isActive: true },
      populate: { path: 'subjectId', select: 'name' }
    });

    const validLinkedBatches = courseBatches.filter(cb => cb.liveBatchId);

    const directBatches = await LiveBatch.find({
      courseId,
      isActive: true
    }).populate('subjectId', 'name');

    const batchVisibilityMap = {};
    const allBatchIds = [];
    
    validLinkedBatches.forEach(cb => {
      const batchId = cb.liveBatchId._id.toString();
      if (!batchVisibilityMap[batchId]) {
        batchVisibilityMap[batchId] = cb.visibleFrom;
        allBatchIds.push(cb.liveBatchId._id);
      }
    });
    
    directBatches.forEach(batch => {
      const batchId = batch._id.toString();
      if (!batchVisibilityMap[batchId]) {
        batchVisibilityMap[batchId] = enrollmentDate;
        allBatchIds.push(batch._id);
      }
    });

    console.log('[getStudentSchedule] Linked batches:', validLinkedBatches.length, 'Direct batches:', directBatches.length);
    console.log('[getStudentSchedule] All batch IDs:', allBatchIds);

    const sessions = await LiveSession.find({
      liveBatchId: { $in: allBatchIds },
      status: { $ne: 'cancelled' }
    }).populate({
      path: 'liveBatchId',
      select: 'name subjectId courseId',
      populate: [
        { path: 'subjectId', select: 'name' },
        { path: 'courseId', select: 'name' }
      ]
    }).sort({ date: 1, startTime: 1 });

    console.log('[getStudentSchedule] Total sessions found:', sessions.length);
    console.log('[getStudentSchedule] Visibility map:', JSON.stringify(batchVisibilityMap, null, 2));
    
    const filteredSessions = sessions.filter(session => {
      if (!session.liveBatchId) return false;
      const batchVisibleFrom = batchVisibilityMap[session.liveBatchId._id.toString()];
      const sessionDate = new Date(session.date);
      const visibleFromDate = new Date(batchVisibleFrom);
      const isVisible = batchVisibleFrom && sessionDate >= visibleFromDate;
      console.log(`[getStudentSchedule] Session ${session._id}: date=${session.date}, visibleFrom=${batchVisibleFrom}, isVisible=${isVisible}`);
      return isVisible;
    });

    const upcomingSessions = [];
    const pastSessions = [];

    filteredSessions.forEach(session => {
      const sessionDate = new Date(session.date);
      const [endHour, endMin] = session.endTime.split(':').map(Number);
      sessionDate.setHours(endHour, endMin, 0, 0);

      if (sessionDate > now) {
        upcomingSessions.push(session);
      } else {
        pastSessions.push(session);
      }
    });

    res.json({
      success: true,
      data: {
        upcoming: upcomingSessions,
        past: pastSessions.reverse(),
        totalUpcoming: upcomingSessions.length,
        totalPast: pastSessions.length
      }
    });
  } catch (error) {
    console.error('Error getting student schedule:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllCoursesForLinking = async (req, res) => {
  try {
    const courses = await Course.find({ isActive: true })
      .select('_id name description price courseType published')
      .sort({ name: 1 });
    res.json({ success: true, data: courses });
  } catch (error) {
    console.error('Error listing courses:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  listSubjectsForBatches,
  getCourseSubjectMap,
  createBatch,
  listBatches,
  getBatch,
  updateBatch,
  deleteBatch,
  createSession,
  listSessions,
  getSession,
  updateSession,
  deleteSession,
  attachCourses,
  detachCourse,
  getLinkedCourses,
  getStudentSchedule,
  getAllCoursesForLinking
};
