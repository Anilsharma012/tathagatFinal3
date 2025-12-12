const express = require('express');
const router = express.Router();
const MockTestFeedback = require('../models/MockTestFeedback');
const MockTestAttempt = require('../models/MockTestAttempt');
const { authMiddleware, adminAuth } = require('../middleware/authMiddleware');

router.post('/submit', authMiddleware, async (req, res) => {
  try {
    const { attemptId, testId, responses } = req.body;
    const userId = req.user.id;

    const existingFeedback = await MockTestFeedback.findOne({ attemptId, userId });
    if (existingFeedback) {
      return res.status(400).json({
        success: false,
        message: 'Feedback already submitted for this attempt'
      });
    }

    const attempt = await MockTestAttempt.findById(attemptId).populate('userId', 'name email');
    
    const feedback = new MockTestFeedback({
      userId,
      attemptId,
      testId,
      studentName: attempt?.userId?.name || req.user.name || '',
      studentEmail: attempt?.userId?.email || req.user.email || '',
      responses
    });

    await feedback.save();

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback',
      error: error.message
    });
  }
});

router.get('/my-feedback/:attemptId', authMiddleware, async (req, res) => {
  try {
    const { attemptId } = req.params;
    const userId = req.user.id;

    const feedback = await MockTestFeedback.findOne({ attemptId, userId });

    res.json({
      success: true,
      feedback
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback',
      error: error.message
    });
  }
});

router.get('/student/all', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const feedbacks = await MockTestFeedback.find({ userId })
      .populate('testId', 'title')
      .sort({ submittedAt: -1 });

    const allFeedbacks = await MockTestFeedback.find({});
    let globalAverages = {};
    
    if (allFeedbacks.length > 0) {
      const fields = [
        'q1_exam_support', 'q2_digital_exam_experience',
        'q3_1_ease_of_locating', 'q3_2_finding_seat', 'q3_3_seating_arrangement',
        'q3_4_basic_facilities', 'q3_5_exam_node_quality', 'q3_6_staff_behavior'
      ];

      fields.forEach(field => {
        const values = allFeedbacks
          .map(f => f.responses?.[field])
          .filter(v => v !== undefined && v !== null);
        globalAverages[field] = values.length > 0 
          ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)
          : 0;
      });
    }

    res.json({
      success: true,
      feedbacks,
      globalAverages,
      totalFeedbacks: allFeedbacks.length
    });
  } catch (error) {
    console.error('Error fetching student feedbacks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedbacks',
      error: error.message
    });
  }
});

router.get('/admin/all', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', testId } = req.query;

    let query = {};
    if (testId) {
      query.testId = testId;
    }
    if (search) {
      query.$or = [
        { studentName: { $regex: search, $options: 'i' } },
        { studentEmail: { $regex: search, $options: 'i' } }
      ];
    }

    const feedbacks = await MockTestFeedback.find(query)
      .populate('testId', 'title')
      .populate('userId', 'name email phone')
      .sort({ submittedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await MockTestFeedback.countDocuments(query);

    const allFeedbacks = await MockTestFeedback.find({});
    let stats = {
      totalFeedbacks: allFeedbacks.length,
      averageRating: 0,
      ratingDistribution: { 4: 0, 3: 0, 2: 0, 1: 0 }
    };

    if (allFeedbacks.length > 0) {
      stats.averageRating = (allFeedbacks.reduce((sum, f) => sum + (f.averageRating || 0), 0) / allFeedbacks.length).toFixed(2);
      
      allFeedbacks.forEach(f => {
        const avg = Math.round(f.averageRating || 0);
        if (avg >= 1 && avg <= 4) {
          stats.ratingDistribution[avg]++;
        }
      });
    }

    res.json({
      success: true,
      feedbacks,
      stats,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching admin feedbacks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedbacks',
      error: error.message
    });
  }
});

router.delete('/admin/:feedbackId', adminAuth, async (req, res) => {
  try {
    const { feedbackId } = req.params;

    const feedback = await MockTestFeedback.findByIdAndDelete(feedbackId);
    
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    res.json({
      success: true,
      message: 'Feedback deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete feedback',
      error: error.message
    });
  }
});

router.get('/admin/export', adminAuth, async (req, res) => {
  try {
    const feedbacks = await MockTestFeedback.find({})
      .populate('testId', 'title')
      .populate('userId', 'name email phone')
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      feedbacks
    });
  } catch (error) {
    console.error('Error exporting feedbacks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export feedbacks',
      error: error.message
    });
  }
});

module.exports = router;
