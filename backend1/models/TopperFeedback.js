const mongoose = require("mongoose");

const TopperFeedbackSchema = new mongoose.Schema({
  imageUrl: {
    type: String,
    required: true
  },
  studentName: {
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

module.exports = mongoose.model("TopperFeedback", TopperFeedbackSchema);
