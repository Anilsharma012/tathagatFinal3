const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },
    phoneNumber: {
        type: String,
        unique: true,
        sparse: true,
        match: [/^\d{10}$/, "Invalid phone number"],
    },
    isEmailVerified: {
        type: Boolean,
        default: false,
    },
    isPhoneVerified: {
        type: Boolean,
        default: false,
    },
    role: {
        type: String,
        enum: ["admin", "student", "subadmin"],
        default: "student",
    },
    name: {
        type: String,
        default: null,
    },
    dob: {
        type: String,
        default: null,
    },
    gender: {
        type: String,
        enum: ["Male", "Female", "Other"],
        default: null,
    },
    city: {
        type: String,
        default: null,
    },
    state: {
        type: String,
        default: null,
    },
    profilePic: {
        type: String,
        default: null,
    },
    selectedCategory: {
        type: String,
        default: null,
    },
    targetYear: {
        type: String,
        default: null,
    },
    isOnboardingComplete: {
        type: Boolean,
        default: false,
    },
    notificationPreferences: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: true },
        analytics: { type: Boolean, default: true }
    },
    streak: {
        type: Number,
        default: 0,
    },
    points: {
        type: Number,
        default: 0,
    },
    enrolledCourses: [
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
    status: {
      type: String,
      enum: ["locked", "unlocked"],
      default: "locked",
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
  },
],

    selectedExam: {
        type: String,
        default: null, // ✅ CAT, XAT, UPSC, GRE, etc.
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    
}
,{ timestamps: true });

module.exports = mongoose.models.User || mongoose.model("User", userSchema);

