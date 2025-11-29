const mongoose = require("mongoose");

const BSchoolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ["noSectionalCutOffs", "lessAcadsWeightage", "bSchoolsViaXAT"],
    index: true
  },
  highestPackage: {
    type: String,
    required: true,
    trim: true
  },
  avgPackage: {
    type: String,
    required: true,
    trim: true
  },
  exams: {
    type: String,
    required: true,
    trim: true
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model("BSchool", BSchoolSchema);
