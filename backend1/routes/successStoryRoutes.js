const express = require("express");
const SuccessStory = require("../models/SuccessStory");
const { adminAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/all", async (req, res) => {
  try {
    const { activeOnly } = req.query;
    let query = {};
    
    if (activeOnly === "true") {
      query.isActive = true;
    }
    
    const stories = await SuccessStory.find(query).sort({ order: 1, createdAt: -1 });
    res.status(200).json({ success: true, stories });
  } catch (error) {
    console.error("Error fetching success stories:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

router.get("/public", async (req, res) => {
  try {
    const stories = await SuccessStory.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
    res.status(200).json({ success: true, stories });
  } catch (error) {
    console.error("Error fetching public success stories:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

router.post("/create", adminAuth, async (req, res) => {
  try {
    const { studentName, university, youtubeUrl, order, isActive } = req.body;
    
    if (!studentName || !university || !youtubeUrl) {
      return res.status(400).json({ 
        success: false, 
        message: "Student name, university, and YouTube URL are required" 
      });
    }

    const videoId = extractYouTubeId(youtubeUrl);
    const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "";

    const newStory = new SuccessStory({
      studentName,
      university,
      youtubeUrl,
      thumbnailUrl,
      order: order || 0,
      isActive: isActive !== false
    });

    await newStory.save();
    res.status(201).json({ 
      success: true, 
      message: "Success story created successfully", 
      story: newStory 
    });
  } catch (error) {
    console.error("Error creating success story:", error);
    res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
});

router.put("/update/:id", adminAuth, async (req, res) => {
  try {
    const { studentName, university, youtubeUrl, order, isActive } = req.body;
    const story = await SuccessStory.findById(req.params.id);

    if (!story) {
      return res.status(404).json({ success: false, message: "Success story not found" });
    }

    if (studentName) story.studentName = studentName;
    if (university) story.university = university;
    if (youtubeUrl) {
      story.youtubeUrl = youtubeUrl;
      const videoId = extractYouTubeId(youtubeUrl);
      story.thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "";
    }
    if (order !== undefined) story.order = order;
    if (isActive !== undefined) story.isActive = isActive;
    
    story.updatedAt = Date.now();
    await story.save();

    res.status(200).json({ 
      success: true, 
      message: "Success story updated successfully", 
      story 
    });
  } catch (error) {
    console.error("Error updating success story:", error);
    res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
});

router.delete("/delete/:id", adminAuth, async (req, res) => {
  try {
    const story = await SuccessStory.findById(req.params.id);

    if (!story) {
      return res.status(404).json({ success: false, message: "Success story not found" });
    }

    await story.deleteOne();
    res.status(200).json({ success: true, message: "Success story deleted successfully" });
  } catch (error) {
    console.error("Error deleting success story:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

router.patch("/toggle-active/:id", adminAuth, async (req, res) => {
  try {
    const story = await SuccessStory.findById(req.params.id);
    if (!story) {
      return res.status(404).json({ success: false, message: "Success story not found" });
    }
    
    story.isActive = !story.isActive;
    story.updatedAt = Date.now();
    await story.save();
    
    res.status(200).json({ 
      success: true, 
      message: `Story ${story.isActive ? 'activated' : 'deactivated'} successfully`, 
      story 
    });
  } catch (error) {
    console.error("Error toggling story status:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

function extractYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/live\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

module.exports = router;
