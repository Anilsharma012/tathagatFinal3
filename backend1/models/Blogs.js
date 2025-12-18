const mongoose = require("mongoose");
const slugify = require("slugify");

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true
  },
  category: {
    type: String,
    enum: ["CAT", "IPMAT", "CUET", "MBA", "B-Schools", "Info Exam", "Topper's Journey", "Other"],
    required: true
  },
  isTopBlog: {
    type: Boolean,
    default: false
  },
  excerpt: {
    type: String,
    maxlength: 300
  },
  content: {
    type: String,
    required: true
  },
  featureImage: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  authorName: {
    type: String,
    default: "TathaGat Faculty"
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  views: {
    type: Number,
    default: 0
  },
  seoTitle: {
    type: String,
    maxlength: 70,
    trim: true
  },
  seoDescription: {
    type: String,
    maxlength: 160,
    trim: true
  },
  seoKeywords: {
    type: [String],
    default: []
  },
  canonicalUrl: {
    type: String,
    trim: true
  },
  ogImage: {
    type: String
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

blogSchema.pre("save", function (next) {
  if (this.title) {
    this.slug = slugify(this.title, { lower: true, strict: true }) + '-' + Date.now().toString(36);
  }
  if (!this.excerpt && this.content) {
    const plainText = this.content.replace(/<[^>]*>/g, '');
    this.excerpt = plainText.substring(0, 200) + (plainText.length > 200 ? '...' : '');
  }
  next();
});

module.exports = mongoose.model("Blog", blogSchema);
