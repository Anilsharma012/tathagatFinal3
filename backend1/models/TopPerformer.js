const mongoose = require('mongoose');

const topPerformerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Student name is required'],
    trim: true
  },
  percentile: {
    type: String,
    required: [true, 'Percentile is required'],
    trim: true
  },
  photoUrl: {
    type: String,
    default: ''
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

topPerformerSchema.index({ isActive: 1, displayOrder: 1 });

module.exports = mongoose.model('TopPerformer', topPerformerSchema);
