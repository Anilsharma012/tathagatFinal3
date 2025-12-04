const mongoose = require("mongoose");

const ResponseSheetSubmissionSchema = new mongoose.Schema({
  applicationNo: {
    type: String,
    required: true,
  },
  candidateName: {
    type: String,
    required: true,
  },
  rollNo: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  testDate: {
    type: String,
    default: "",
  },
  testTime: {
    type: String,
    default: "",
  },
  link: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

ResponseSheetSubmissionSchema.index({ applicationNo: 1, rollNo: 1 });

module.exports = mongoose.model("ResponseSheetSubmission", ResponseSheetSubmissionSchema);
