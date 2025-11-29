const mongoose = require('mongoose');

const popupAnnouncementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxLength: 200
  },
  text: {
    type: String,
    default: '',
    maxLength: 1000
  },
  image: {
    type: String,
    default: ''
  },
  link: {
    type: String,
    default: ''
  },
  linkText: {
    type: String,
    default: 'Learn More',
    maxLength: 50
  },
  isActive: {
    type: Boolean,
    default: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

popupAnnouncementSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

popupAnnouncementSchema.statics.getActivePopup = function() {
  const now = new Date();
  return this.findOne({
    isActive: true,
    startDate: { $lte: now },
    $or: [
      { endDate: null },
      { endDate: { $gte: now } }
    ]
  }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('PopupAnnouncement', popupAnnouncementSchema);
