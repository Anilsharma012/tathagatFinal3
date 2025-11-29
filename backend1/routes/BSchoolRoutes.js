const express = require("express");
const router = express.Router();
const BSchool = require("../models/BSchool");
const { adminAuth } = require("../middleware/authMiddleware");

// Get all B-Schools (Public - for frontend display)
router.get("/", async (req, res) => {
  try {
    const { category } = req.query;
    
    let query = { isActive: true };
    if (category) {
      query.category = category;
    }
    
    const schools = await BSchool.find(query).sort({ order: 1, createdAt: -1 });
    
    // Group by category
    const grouped = {
      noSectionalCutOffs: schools.filter(s => s.category === "noSectionalCutOffs"),
      lessAcadsWeightage: schools.filter(s => s.category === "lessAcadsWeightage"),
      bSchoolsViaXAT: schools.filter(s => s.category === "bSchoolsViaXAT")
    };
    
    res.json({ success: true, schools: category ? schools : grouped });
  } catch (error) {
    console.error("Error fetching B-Schools:", error);
    res.status(500).json({ success: false, error: "Failed to fetch B-Schools" });
  }
});

// Admin: Get all B-Schools (including inactive)
router.get("/admin/all", adminAuth, async (req, res) => {
  try {
    const schools = await BSchool.find().sort({ category: 1, order: 1, createdAt: -1 });
    res.json({ success: true, schools });
  } catch (error) {
    console.error("Error fetching B-Schools:", error);
    res.status(500).json({ success: false, error: "Failed to fetch B-Schools" });
  }
});

// Admin: Create new B-School
router.post("/admin", adminAuth, async (req, res) => {
  try {
    const { name, category, highestPackage, avgPackage, exams, order, isActive } = req.body;
    
    if (!name || !category || !highestPackage || !avgPackage || !exams) {
      return res.status(400).json({ success: false, error: "All fields are required" });
    }
    
    const school = new BSchool({
      name,
      category,
      highestPackage,
      avgPackage,
      exams,
      order: order || 0,
      isActive: isActive !== undefined ? isActive : true
    });
    
    await school.save();
    res.status(201).json({ success: true, school, message: "B-School created successfully" });
  } catch (error) {
    console.error("Error creating B-School:", error);
    res.status(500).json({ success: false, error: "Failed to create B-School" });
  }
});

// Admin: Update B-School
router.put("/admin/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, highestPackage, avgPackage, exams, order, isActive } = req.body;
    
    const school = await BSchool.findByIdAndUpdate(
      id,
      { name, category, highestPackage, avgPackage, exams, order, isActive },
      { new: true }
    );
    
    if (!school) {
      return res.status(404).json({ success: false, error: "B-School not found" });
    }
    
    res.json({ success: true, school, message: "B-School updated successfully" });
  } catch (error) {
    console.error("Error updating B-School:", error);
    res.status(500).json({ success: false, error: "Failed to update B-School" });
  }
});

// Admin: Delete B-School
router.delete("/admin/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const school = await BSchool.findByIdAndDelete(id);
    
    if (!school) {
      return res.status(404).json({ success: false, error: "B-School not found" });
    }
    
    res.json({ success: true, message: "B-School deleted successfully" });
  } catch (error) {
    console.error("Error deleting B-School:", error);
    res.status(500).json({ success: false, error: "Failed to delete B-School" });
  }
});

// Admin: Bulk create B-Schools (for initial data import)
router.post("/admin/bulk", adminAuth, async (req, res) => {
  try {
    const { schools } = req.body;
    
    if (!schools || !Array.isArray(schools) || schools.length === 0) {
      return res.status(400).json({ success: false, error: "Schools array is required" });
    }
    
    const createdSchools = await BSchool.insertMany(schools);
    res.status(201).json({ 
      success: true, 
      count: createdSchools.length,
      message: `${createdSchools.length} B-Schools created successfully` 
    });
  } catch (error) {
    console.error("Error bulk creating B-Schools:", error);
    res.status(500).json({ success: false, error: "Failed to bulk create B-Schools" });
  }
});

module.exports = router;
