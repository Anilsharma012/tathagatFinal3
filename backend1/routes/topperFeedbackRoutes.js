const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const TopperFeedback = require("../models/TopperFeedback");
const { adminAuth } = require("../middleware/authMiddleware");

const router = express.Router();

const uploadDir = path.join(__dirname, "../uploads/topper-feedback");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  }
});

router.get("/all", async (req, res) => {
  try {
    const { activeOnly } = req.query;
    let query = {};
    
    if (activeOnly === "true") {
      query.isActive = true;
    }
    
    const feedbacks = await TopperFeedback.find(query).sort({ order: 1, createdAt: -1 });
    res.status(200).json({ success: true, feedbacks });
  } catch (error) {
    console.error("Error fetching topper feedbacks:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

router.get("/public", async (req, res) => {
  try {
    const feedbacks = await TopperFeedback.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
    res.status(200).json({ success: true, feedbacks });
  } catch (error) {
    console.error("Error fetching public topper feedbacks:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

router.post("/create", adminAuth, upload.single("image"), async (req, res) => {
  try {
    const { studentName, order, isActive } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Image is required" });
    }

    const imageUrl = `/uploads/topper-feedback/${req.file.filename}`;

    const newFeedback = new TopperFeedback({
      imageUrl,
      studentName: studentName || "",
      order: order || 0,
      isActive: isActive !== "false"
    });

    await newFeedback.save();
    res.status(201).json({ 
      success: true, 
      message: "Topper feedback created successfully", 
      feedback: newFeedback 
    });
  } catch (error) {
    console.error("Error creating topper feedback:", error);
    res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
});

router.put("/update/:id", adminAuth, upload.single("image"), async (req, res) => {
  try {
    const { studentName, order, isActive } = req.body;
    const feedback = await TopperFeedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({ success: false, message: "Topper feedback not found" });
    }

    if (req.file) {
      if (feedback.imageUrl) {
        const oldPath = path.join(__dirname, "..", feedback.imageUrl);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      feedback.imageUrl = `/uploads/topper-feedback/${req.file.filename}`;
    }

    if (studentName !== undefined) feedback.studentName = studentName;
    if (order !== undefined) feedback.order = parseInt(order) || 0;
    if (isActive !== undefined) feedback.isActive = isActive === "true" || isActive === true;
    
    feedback.updatedAt = Date.now();
    await feedback.save();

    res.status(200).json({ 
      success: true, 
      message: "Topper feedback updated successfully", 
      feedback 
    });
  } catch (error) {
    console.error("Error updating topper feedback:", error);
    res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
});

router.delete("/delete/:id", adminAuth, async (req, res) => {
  try {
    const feedback = await TopperFeedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({ success: false, message: "Topper feedback not found" });
    }

    if (feedback.imageUrl) {
      const imagePath = path.join(__dirname, "..", feedback.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await feedback.deleteOne();
    res.status(200).json({ success: true, message: "Topper feedback deleted successfully" });
  } catch (error) {
    console.error("Error deleting topper feedback:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

router.patch("/toggle-active/:id", adminAuth, async (req, res) => {
  try {
    const feedback = await TopperFeedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ success: false, message: "Topper feedback not found" });
    }
    
    feedback.isActive = !feedback.isActive;
    feedback.updatedAt = Date.now();
    await feedback.save();
    
    res.status(200).json({ 
      success: true, 
      message: `Feedback ${feedback.isActive ? 'activated' : 'deactivated'} successfully`, 
      feedback 
    });
  } catch (error) {
    console.error("Error toggling feedback status:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

module.exports = router;
