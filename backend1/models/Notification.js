const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['live_session', 'course_update', 'payment', 'announcement', 'reminder', 'system'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    liveBatchId: { type: mongoose.Schema.Types.ObjectId, ref: 'LiveBatch' },
    liveSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'LiveSession' },
    meetingLink: String,
    sessionDate: Date,
    sessionTime: String
  },
  read: {
    type: Boolean,
    default: false
  },
  channels: {
    inApp: { type: Boolean, default: true },
    email: { type: Boolean, default: false },
    sms: { type: Boolean, default: false }
  },
  sentAt: {
    email: Date,
    sms: Date
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true
});

NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, type: 1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

NotificationSchema.statics.createLiveSessionNotification = async function(userId, session, course, batch) {
  const sessionDate = new Date(session.date);
  const formattedDate = sessionDate.toLocaleDateString('en-IN', { 
    weekday: 'short', day: 'numeric', month: 'short' 
  });
  
  return this.create({
    userId,
    type: 'live_session',
    title: `New Live Session: ${session.topic}`,
    message: `A new live class "${session.topic}" has been scheduled for ${formattedDate} at ${session.startTime}. Don't miss it!`,
    data: {
      courseId: course._id,
      liveBatchId: batch._id,
      liveSessionId: session._id,
      meetingLink: session.meetingLink,
      sessionDate: session.date,
      sessionTime: session.startTime
    },
    priority: 'high',
    channels: { inApp: true, email: true }
  });
};

NotificationSchema.statics.createReminderNotification = async function(userId, session, minutesBefore) {
  const timeLabel = minutesBefore >= 60 ? `${minutesBefore / 60} hour${minutesBefore > 60 ? 's' : ''}` : `${minutesBefore} minutes`;
  
  return this.create({
    userId,
    type: 'reminder',
    title: `Reminder: Live Session Starting Soon`,
    message: `Your live class "${session.topic}" starts in ${timeLabel}. Click to join!`,
    data: {
      liveSessionId: session._id,
      meetingLink: session.meetingLink,
      sessionDate: session.date,
      sessionTime: session.startTime
    },
    priority: 'urgent',
    channels: { inApp: true, email: true },
    expiresAt: new Date(Date.now() + (minutesBefore + 30) * 60 * 1000)
  });
};

NotificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({ userId, read: false });
};

NotificationSchema.statics.markAllRead = async function(userId) {
  return this.updateMany({ userId, read: false }, { $set: { read: true } });
};

module.exports = mongoose.model('Notification', NotificationSchema);
