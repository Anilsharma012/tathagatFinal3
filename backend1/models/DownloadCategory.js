const mongoose = require('mongoose');

const DownloadCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
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
  },
  { timestamps: true }
);

DownloadCategorySchema.index({ type: 1, slug: 1 }, { unique: true });
DownloadCategorySchema.index({ type: 1, displayOrder: 1 });

module.exports = mongoose.model('DownloadCategory', DownloadCategorySchema);
