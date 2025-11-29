const mongoose = require("mongoose");

const iimCollegeSchema = new mongoose.Schema({
    collegeGroup: {
        type: String,
        required: true,
        enum: ["Top IIMs and FMS", "IITs and IIFT", "Newer IIMs", "Other Top B-Schools"]
    },
    collegeName: {
        type: String,
        required: true,
        trim: true
    },
    programName: {
        type: String,
        trim: true,
        default: ""
    },
    varcCutoff: {
        type: Number,
        default: null
    },
    dilrCutoff: {
        type: Number,
        default: null
    },
    qaCutoff: {
        type: Number,
        default: null
    },
    overallMinCutoff: {
        type: Number,
        default: null
    },
    targetPercentile: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    conversionCalls: {
        type: String,
        trim: true,
        default: "NA"
    },
    shortlistingUrl: {
        type: String,
        trim: true,
        default: ""
    },
    displayOrder: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

iimCollegeSchema.index({ collegeGroup: 1, displayOrder: 1 });
iimCollegeSchema.index({ isActive: 1 });

module.exports = mongoose.model("IIMCollege", iimCollegeSchema);
