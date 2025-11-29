const mongoose = require("mongoose");

const ScoreCardSchema = new mongoose.Schema({
  imageUrl: {
    type: String,
    required: true
  },
  percentileCategory: {
    type: String,
    enum: ["99", "98", "97", "95"],
    required: true
  },
  studentName: {
    type: String,
    default: ""
  },
  percentileScore: {
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

module.exports = mongoose.model("ScoreCard", ScoreCardSchema);
