const mongoose = require('mongoose');

const galleryItemSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['video', 'image'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  youtubeUrl: {
    type: String,
    trim: true
  },
  thumbnailUrl: {
    type: String,
    trim: true
  },
  imagePath: {
    type: String,
    trim: true
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

galleryItemSchema.index({ type: 1, isActive: 1, order: 1 });

module.exports = mongoose.model('GalleryItem', galleryItemSchema);
