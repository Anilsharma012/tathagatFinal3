const mongoose = require('mongoose');

const LiveSessionSchema = new mongoose.Schema({
  liveBatchId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'LiveBatch', 
    required: true, 
    index: true 
  },
  sessionNumber: {
    type: Number,
    default: 1
  },
  topic: { 
    type: String, 
    required: true, 
    trim: true 
  },
  description: {
    type: String,
    default: ''
  },
  date: { 
    type: Date, 
    required: true, 
    index: true 
  },
  startTime: { 
    type: String, 
    required: true 
  },
  endTime: { 
    type: String, 
    required: true 
  },
  duration: {
    type: Number,
    default: 60
  },
  platform: { 
    type: String, 
    enum: ['zoom', 'google_meet', 'youtube_live', 'custom'], 
    default: 'zoom' 
  },
  meetingLink: { 
    type: String, 
    default: '' 
  },
  meetingId: {
    type: String,
    default: ''
  },
  meetingPassword: {
    type: String,
    default: ''
  },
  recordingUrl: { 
    type: String, 
    default: '' 
  },
  notes: { 
    type: String, 
    default: '' 
  },
  materials: [{
    title: String,
    url: String,
    type: { type: String, enum: ['pdf', 'doc', 'ppt', 'link', 'other'], default: 'link' }
  }],
  status: { 
    type: String, 
    enum: ['scheduled', 'live', 'completed', 'cancelled'], 
    default: 'scheduled',
    index: true 
  },
  attendanceCount: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, { timestamps: true });

LiveSessionSchema.pre('save', function(next) {
  try {
    const now = new Date();
    const sessionDate = new Date(this.date);
    const [startHour, startMin] = this.startTime.split(':').map(Number);
    const [endHour, endMin] = this.endTime.split(':').map(Number);
    
    const startDateTime = new Date(sessionDate);
    startDateTime.setHours(startHour, startMin, 0, 0);
    
    const endDateTime = new Date(sessionDate);
    endDateTime.setHours(endHour, endMin, 0, 0);
    
    if (this.status !== 'cancelled') {
      if (now < startDateTime) this.status = 'scheduled';
      else if (now >= startDateTime && now <= endDateTime) this.status = 'live';
      else if (now > endDateTime) this.status = 'completed';
    }
  } catch (_) {}
  next();
});

LiveSessionSchema.index({ liveBatchId: 1, date: 1 });
LiveSessionSchema.index({ date: 1, status: 1 });

module.exports = mongoose.models.LiveSession || mongoose.model('LiveSession', LiveSessionSchema);
