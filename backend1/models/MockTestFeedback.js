const mongoose = require('mongoose');

const MockTestFeedbackSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  attemptId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MockTestAttempt',
    required: true
  },
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MockTest',
    required: true
  },
  studentName: {
    type: String,
    default: ''
  },
  studentEmail: {
    type: String,
    default: ''
  },
  responses: {
    q1_exam_support: {
      type: Number,
      min: 1,
      max: 4
    },
    q2_digital_exam_experience: {
      type: Number,
      min: 1,
      max: 4
    },
    q3_1_ease_of_locating: {
      type: Number,
      min: 1,
      max: 4
    },
    q3_2_finding_seat: {
      type: Number,
      min: 1,
      max: 4
    },
    q3_3_seating_arrangement: {
      type: Number,
      min: 1,
      max: 4
    },
    q3_4_basic_facilities: {
      type: Number,
      min: 1,
      max: 4
    },
    q3_5_exam_node_quality: {
      type: Number,
      min: 1,
      max: 4
    },
    q3_6_staff_behavior: {
      type: Number,
      min: 1,
      max: 4
    },
    q4_overall_experience: {
      type: String,
      default: ''
    }
  },
  averageRating: {
    type: Number,
    default: 0
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

MockTestFeedbackSchema.pre('save', function(next) {
  const ratings = [];
  const r = this.responses;
  if (r.q1_exam_support) ratings.push(r.q1_exam_support);
  if (r.q2_digital_exam_experience) ratings.push(r.q2_digital_exam_experience);
  if (r.q3_1_ease_of_locating) ratings.push(r.q3_1_ease_of_locating);
  if (r.q3_2_finding_seat) ratings.push(r.q3_2_finding_seat);
  if (r.q3_3_seating_arrangement) ratings.push(r.q3_3_seating_arrangement);
  if (r.q3_4_basic_facilities) ratings.push(r.q3_4_basic_facilities);
  if (r.q3_5_exam_node_quality) ratings.push(r.q3_5_exam_node_quality);
  if (r.q3_6_staff_behavior) ratings.push(r.q3_6_staff_behavior);
  
  if (ratings.length > 0) {
    this.averageRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
  }
  next();
});

module.exports = mongoose.model('MockTestFeedback', MockTestFeedbackSchema);
