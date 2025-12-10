const mongoose = require('mongoose');

const DownloadTestSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DownloadCategory',
      required: true
    },
    type: {
      type: String,
      enum: ['PREVIOUS_YEAR', 'TOPIC_WISE'],
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    questionCount: {
      type: Number,
      default: 0
    },
    totalMarks: {
      type: Number,
      default: 0
    },
    durationMinutes: {
      type: Number,
      default: 0
    },
    language: {
      type: String,
      default: 'English'
    },
    pdfUrl: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['COMING_SOON', 'PUBLISHED'],
      default: 'COMING_SOON'
    },
    isFree: {
      type: Boolean,
      default: true
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
    },
    publishedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

DownloadTestSchema.index({ categoryId: 1, displayOrder: 1 });
DownloadTestSchema.index({ type: 1, status: 1 });
DownloadTestSchema.index({ type: 1, categoryId: 1, isActive: 1 });

DownloadTestSchema.pre('save', function(next) {
  if (!this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  if (this.status === 'PUBLISHED' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('DownloadTest', DownloadTestSchema);
