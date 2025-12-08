const mongoose = require("mongoose");

const successStorySchema = new mongoose.Schema({
  studentName: {
    type: String,
    required: true,
    trim: true
  },
  university: {
    type: String,
    required: true,
    trim: true
  },
  youtubeUrl: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String,
    default: ""
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

successStorySchema.pre("save", function(next) {
  this.updatedAt = Date.now();
  if (this.youtubeUrl && !this.thumbnailUrl) {
    const videoId = extractYouTubeId(this.youtubeUrl);
    if (videoId) {
      this.thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }
  }
  next();
});

function extractYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/live\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

module.exports = mongoose.model("SuccessStory", successStorySchema);
