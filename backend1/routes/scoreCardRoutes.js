const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const ScoreCard = require("../models/ScoreCard");
const { adminAuth } = require("../middleware/authMiddleware");

const router = express.Router();

const uploadDir = path.join(__dirname, "../uploads/scorecards");
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
    const { category, activeOnly } = req.query;
    let query = {};
    
    if (category && category !== "All") {
      query.percentileCategory = category;
    }
    
    if (activeOnly === "true") {
      query.isActive = true;
    }
    
    const scorecards = await ScoreCard.find(query).sort({ order: 1, createdAt: -1 });
    res.status(200).json({ success: true, scorecards });
  } catch (error) {
    console.error("Error fetching scorecards:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

router.get("/public", async (req, res) => {
  try {
    const { category } = req.query;
    let query = { isActive: true };
    
    if (category && category !== "All") {
      query.percentileCategory = category;
    }
    
    const scorecards = await ScoreCard.find(query).sort({ order: 1, createdAt: -1 });
    res.status(200).json({ success: true, scorecards });
  } catch (error) {
    console.error("Error fetching public scorecards:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

router.post("/create", adminAuth, upload.single("image"), async (req, res) => {
  try {
    const { percentileCategory, studentName, percentileScore, order, isActive } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Image is required" });
    }
    
    if (!percentileCategory) {
      return res.status(400).json({ success: false, message: "Percentile category is required" });
    }

    const imageUrl = `/uploads/scorecards/${req.file.filename}`;

    const newScoreCard = new ScoreCard({
      imageUrl,
      percentileCategory,
      studentName: studentName || "",
      percentileScore: percentileScore || "",
      order: order || 0,
      isActive: isActive !== "false"
    });

    await newScoreCard.save();
    res.status(201).json({ 
      success: true, 
      message: "Score card created successfully", 
      scorecard: newScoreCard 
    });
  } catch (error) {
    console.error("Error creating scorecard:", error);
    res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
});

router.put("/update/:id", adminAuth, upload.single("image"), async (req, res) => {
  try {
    const { percentileCategory, studentName, percentileScore, order, isActive } = req.body;
    const scorecard = await ScoreCard.findById(req.params.id);

    if (!scorecard) {
      return res.status(404).json({ success: false, message: "Score card not found" });
    }

    if (req.file) {
      if (scorecard.imageUrl) {
        const oldPath = path.join(__dirname, "..", scorecard.imageUrl);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      scorecard.imageUrl = `/uploads/scorecards/${req.file.filename}`;
    }

    if (percentileCategory) scorecard.percentileCategory = percentileCategory;
    if (studentName !== undefined) scorecard.studentName = studentName;
    if (percentileScore !== undefined) scorecard.percentileScore = percentileScore;
    if (order !== undefined) scorecard.order = parseInt(order) || 0;
    if (isActive !== undefined) scorecard.isActive = isActive === "true" || isActive === true;
    
    scorecard.updatedAt = Date.now();
    await scorecard.save();

    res.status(200).json({ 
      success: true, 
      message: "Score card updated successfully", 
      scorecard 
    });
  } catch (error) {
    console.error("Error updating scorecard:", error);
    res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
});

router.delete("/delete/:id", adminAuth, async (req, res) => {
  try {
    const scorecard = await ScoreCard.findById(req.params.id);

    if (!scorecard) {
      return res.status(404).json({ success: false, message: "Score card not found" });
    }

    if (scorecard.imageUrl) {
      const imagePath = path.join(__dirname, "..", scorecard.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await scorecard.deleteOne();
    res.status(200).json({ success: true, message: "Score card deleted successfully" });
  } catch (error) {
    console.error("Error deleting scorecard:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

router.patch("/toggle-active/:id", adminAuth, async (req, res) => {
  try {
    const scorecard = await ScoreCard.findById(req.params.id);
    if (!scorecard) {
      return res.status(404).json({ success: false, message: "Score card not found" });
    }
    
    scorecard.isActive = !scorecard.isActive;
    scorecard.updatedAt = Date.now();
    await scorecard.save();
    
    res.status(200).json({ 
      success: true, 
      message: `Score card ${scorecard.isActive ? 'activated' : 'deactivated'} successfully`, 
      scorecard 
    });
  } catch (error) {
    console.error("Error toggling scorecard status:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

module.exports = router;
