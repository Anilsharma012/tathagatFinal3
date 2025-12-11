const mongoose = require('mongoose');

const instructorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  expertise: { type: String, default: '' },
  imageUrl: { type: String, default: '' }
}, { _id: false });

const curriculumSectionSchema = new mongoose.Schema({
  sectionTitle: { type: String, required: true },
  sectionSubtitle: { type: String, default: '' },
  lessons: [{ type: String }]
}, { _id: false });

const reviewSchema = new mongoose.Schema({
  reviewerName: { type: String, required: true },
  reviewText: { type: String, default: '' },
  rating: { type: Number, min: 1, max: 5, default: 5 },
  timeAgo: { type: String, default: '' }
}, { _id: false });

const ratingBreakdownSchema = new mongoose.Schema({
  fiveStar: { type: Number, default: 0 },
  fourStar: { type: Number, default: 0 },
  threeStar: { type: Number, default: 0 },
  twoStar: { type: Number, default: 0 },
  oneStar: { type: Number, default: 0 }
}, { _id: false });

const coursePurchaseContentSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    unique: true
  },

  heroSection: {
    previewVideoUrl: { type: String, default: '' },
    mainTitle: { type: String, default: '' },
    currentPrice: { type: Number, default: 0 },
    originalPrice: { type: Number, default: 0 },
    keyBullets: [{ type: String }]
  },

  aboutSection: {
    aboutTitle: { type: String, default: 'About The Course' },
    aboutDescription: { type: String, default: '' },
    learningHeading: { type: String, default: 'What Will You Learn?' },
    learningContent: { type: String, default: '' }
  },

  curriculumSections: [curriculumSectionSchema],

  materialBox: {
    materialHeading: { type: String, default: 'Material Includes' },
    materialItems: [{ type: String }]
  },

  requirementsBox: {
    requirementsHeading: { type: String, default: 'Requirements' },
    requirementsItems: [{ type: String }]
  },

  instructors: [instructorSchema],

  reviewsSection: {
    averageRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
    ratingBreakdown: { type: ratingBreakdownSchema, default: () => ({}) },
    reviews: [reviewSchema]
  },

  infoGrid: {
    instructorName: { type: String, default: '' },
    category: { type: String, default: '' },
    studentsEnrolled: { type: Number, default: 0 },
    reviewScore: { type: String, default: '' }
  },

  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('CoursePurchaseContent', coursePurchaseContentSchema);
