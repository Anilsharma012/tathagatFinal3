const express = require("express");
const DemoVideo = require("../models/DemoVideo");
const { adminAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/all", async (req, res) => {
  try {
    const { category, activeOnly } = req.query;
    let query = {};
    
    if (category && category !== "All") {
      query.category = category;
    }
    
    if (activeOnly === "true") {
      query.isActive = true;
    }
    
    const videos = await DemoVideo.find(query).sort({ order: 1, createdAt: -1 });
    res.status(200).json({ success: true, videos });
  } catch (error) {
    console.error("Error fetching demo videos:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

router.get("/public", async (req, res) => {
  try {
    const { category } = req.query;
    let query = { isActive: true };
    
    if (category && category !== "All") {
      query.category = category;
    }
    
    const videos = await DemoVideo.find(query).sort({ order: 1, createdAt: -1 });
    res.status(200).json({ success: true, videos });
  } catch (error) {
    console.error("Error fetching public demo videos:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

router.post("/create", adminAuth, async (req, res) => {
  try {
    const { title, category, youtubeUrl, order, isActive } = req.body;
    
    if (!title || !category || !youtubeUrl) {
      return res.status(400).json({ 
        success: false, 
        message: "Title, category, and YouTube URL are required" 
      });
    }

    const videoId = extractYouTubeId(youtubeUrl);
    const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "";

    const newVideo = new DemoVideo({
      title,
      category,
      youtubeUrl,
      thumbnailUrl,
      order: order || 0,
      isActive: isActive !== false
    });

    await newVideo.save();
    res.status(201).json({ 
      success: true, 
      message: "Demo video created successfully", 
      video: newVideo 
    });
  } catch (error) {
    console.error("Error creating demo video:", error);
    res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
});

router.put("/update/:id", adminAuth, async (req, res) => {
  try {
    const { title, category, youtubeUrl, order, isActive } = req.body;
    const video = await DemoVideo.findById(req.params.id);

    if (!video) {
      return res.status(404).json({ success: false, message: "Video not found" });
    }

    if (title) video.title = title;
    if (category) video.category = category;
    if (youtubeUrl) {
      video.youtubeUrl = youtubeUrl;
      const videoId = extractYouTubeId(youtubeUrl);
      video.thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "";
    }
    if (order !== undefined) video.order = order;
    if (isActive !== undefined) video.isActive = isActive;
    
    video.updatedAt = Date.now();
    await video.save();

    res.status(200).json({ 
      success: true, 
      message: "Demo video updated successfully", 
      video 
    });
  } catch (error) {
    console.error("Error updating demo video:", error);
    res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
});

router.delete("/delete/:id", adminAuth, async (req, res) => {
  try {
    const video = await DemoVideo.findById(req.params.id);

    if (!video) {
      return res.status(404).json({ success: false, message: "Video not found" });
    }

    await video.deleteOne();
    res.status(200).json({ success: true, message: "Demo video deleted successfully" });
  } catch (error) {
    console.error("Error deleting demo video:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

router.patch("/toggle-active/:id", adminAuth, async (req, res) => {
  try {
    const video = await DemoVideo.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ success: false, message: "Video not found" });
    }
    
    video.isActive = !video.isActive;
    video.updatedAt = Date.now();
    await video.save();
    
    res.status(200).json({ 
      success: true, 
      message: `Video ${video.isActive ? 'activated' : 'deactivated'} successfully`, 
      video 
    });
  } catch (error) {
    console.error("Error toggling video status:", error);
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
