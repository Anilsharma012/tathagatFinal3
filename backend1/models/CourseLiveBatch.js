const mongoose = require('mongoose');

const CourseLiveBatchSchema = new mongoose.Schema({
  courseId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Course', 
    required: true, 
    index: true 
  },
  liveBatchId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'LiveBatch', 
    required: true, 
    index: true 
  },
  subjectId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Subject', 
    required: true, 
    index: true 
  },
  visibleFrom: { 
    type: Date, 
    required: true, 
    index: true 
  },
  visibleTill: {
    type: Date,
    default: null
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, { timestamps: true });

CourseLiveBatchSchema.index({ courseId: 1, liveBatchId: 1 }, { unique: true });
CourseLiveBatchSchema.index({ courseId: 1, visibleFrom: 1 });

module.exports = mongoose.models.CourseLiveBatch || mongoose.model('CourseLiveBatch', CourseLiveBatchSchema);
