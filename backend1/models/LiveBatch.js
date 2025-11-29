const mongoose = require('mongoose');

const LiveBatchSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  subjectId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Subject', 
    required: true, 
    index: true 
  },
  description: { 
    type: String, 
    default: '' 
  },
  instructor: {
    type: String,
    default: ''
  },
  isActive: { 
    type: Boolean, 
    default: true, 
    index: true 
  },
  totalSessions: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, { timestamps: true });

LiveBatchSchema.index({ courseId: 1, subjectId: 1, isActive: 1 });

module.exports = mongoose.models.LiveBatch || mongoose.model('LiveBatch', LiveBatchSchema);
