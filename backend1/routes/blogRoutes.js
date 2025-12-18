const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Blog = require("../models/Blogs");
const { adminAuth, authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

const uploadsDir = path.join(__dirname, "../uploads/blogs");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error("Only image files are allowed"));
  }
});

router.post("/create", adminAuth, upload.single("featureImage"), async (req, res) => {
  try {
    const { title, category, content, excerpt, isTopBlog, authorName, seoTitle, seoDescription, seoKeywords } = req.body;
    
    if (!title || !category || !content) {
      return res.status(400).json({ success: false, message: "Title, category, and content are required" });
    }

    let featureImagePath = req.body.featureImage || "";
    if (req.file) {
      featureImagePath = `/uploads/blogs/${req.file.filename}`;
    }

    if (!featureImagePath) {
      return res.status(400).json({ success: false, message: "Feature image is required" });
    }

    const keywordsArray = seoKeywords 
      ? seoKeywords.split(",").map(k => k.trim()).filter(k => k)
      : [];

    const newBlog = new Blog({
      title,
      category,
      content,
      excerpt: excerpt || "",
      featureImage: featureImagePath,
      isTopBlog: isTopBlog === "true" || isTopBlog === true,
      authorName: authorName || "TathaGat Faculty",
      author: req.user?.id,
      seoTitle: seoTitle || title,
      seoDescription: seoDescription || excerpt || "",
      seoKeywords: keywordsArray,
      ogImage: featureImagePath
    });

    await newBlog.save();
    res.status(201).json({ success: true, message: "Blog created successfully", blog: newBlog });

  } catch (error) {
    console.error("Error creating blog:", error);
    res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
});

router.get("/all", async (req, res) => {
  try {
    const { category, search, limit, page, topOnly } = req.query;
    
    let query = { isPublished: true };
    
    if (category && category !== "All") {
      query.category = category;
    }
    
    if (topOnly === "true") {
      query.isTopBlog = true;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { excerpt: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } }
      ];
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [blogs, total] = await Promise.all([
      Blog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .select("title slug category excerpt featureImage authorName isTopBlog views createdAt"),
      Blog.countDocuments(query)
    ]);

    res.status(200).json({ 
      success: true, 
      blogs,
      pagination: {
        current: pageNum,
        total: Math.ceil(total / limitNum),
        count: total
      }
    });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

router.get("/admin/all", adminAuth, async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, blogs });
  } catch (error) {
    console.error("Error fetching admin blogs:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

router.get("/blogs", async (req, res) => {
  try {
    const blogs = await Blog.find({ isPublished: true })
      .sort({ createdAt: -1 })
      .populate("author", "name email");
    res.status(200).json({ success: true, blogs });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

router.get("/featured", async (req, res) => {
  try {
    const featured = await Blog.findOne({ isPublished: true, isTopBlog: true })
      .sort({ createdAt: -1 });
    
    const latest = featured || await Blog.findOne({ isPublished: true }).sort({ createdAt: -1 });
    
    res.status(200).json({ success: true, blog: latest });
  } catch (error) {
    console.error("Error fetching featured blog:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

router.get("/categories", async (req, res) => {
  try {
    const categories = ["All", "Top Blogs", "Topper's Journey", "MBA", "CAT", "IPMAT", "CUET", "Info Exam", "B-Schools"];
    res.status(200).json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

router.get("/slug/:slug", async (req, res) => {
  try {
    const blog = await Blog.findOneAndUpdate(
      { slug: req.params.slug, isPublished: true },
      { $inc: { views: 1 } },
      { new: true }
    ).populate("author", "name");

    if (!blog) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }

    res.status(200).json({ success: true, blog });
  } catch (error) {
    console.error("Error fetching blog:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid blog ID" });
    }
    
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }
    res.status(200).json({ success: true, blog });
  } catch (error) {
    console.error("Error fetching blog:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

router.put("/update/:id", adminAuth, upload.single("featureImage"), async (req, res) => {
  try {
    const { title, category, content, excerpt, isTopBlog, isPublished, authorName, seoTitle, seoDescription, seoKeywords } = req.body;
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }

    if (title) blog.title = title;
    if (category) blog.category = category;
    if (content) blog.content = content;
    if (excerpt !== undefined) blog.excerpt = excerpt;
    if (authorName) blog.authorName = authorName;
    if (isTopBlog !== undefined) blog.isTopBlog = isTopBlog === "true" || isTopBlog === true;
    if (isPublished !== undefined) blog.isPublished = isPublished === "true" || isPublished === true;
    
    if (seoTitle !== undefined) blog.seoTitle = seoTitle;
    if (seoDescription !== undefined) blog.seoDescription = seoDescription;
    if (seoKeywords !== undefined) {
      blog.seoKeywords = seoKeywords 
        ? seoKeywords.split(",").map(k => k.trim()).filter(k => k)
        : [];
    }
    
    if (req.file) {
      blog.featureImage = `/uploads/blogs/${req.file.filename}`;
      blog.ogImage = `/uploads/blogs/${req.file.filename}`;
    }
    
    blog.updatedAt = Date.now();

    await blog.save();
    res.status(200).json({ success: true, message: "Blog updated successfully", blog });
  } catch (error) {
    console.error("Error updating blog:", error);
    res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
});

router.delete("/delete/:id", adminAuth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }

    await blog.deleteOne();
    res.status(200).json({ success: true, message: "Blog deleted successfully" });
  } catch (error) {
    console.error("Error deleting blog:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

router.patch("/toggle-publish/:id", adminAuth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }
    
    blog.isPublished = !blog.isPublished;
    blog.updatedAt = Date.now();
    await blog.save();
    
    res.status(200).json({ success: true, message: `Blog ${blog.isPublished ? 'published' : 'unpublished'} successfully`, blog });
  } catch (error) {
    console.error("Error toggling publish:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

router.patch("/toggle-top/:id", adminAuth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }
    
    blog.isTopBlog = !blog.isTopBlog;
    blog.updatedAt = Date.now();
    await blog.save();
    
    res.status(200).json({ success: true, message: `Blog ${blog.isTopBlog ? 'marked as' : 'removed from'} top blog`, blog });
  } catch (error) {
    console.error("Error toggling top blog:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

module.exports = router;
