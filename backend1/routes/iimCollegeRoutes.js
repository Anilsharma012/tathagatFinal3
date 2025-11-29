const express = require("express");
const router = express.Router();
const IIMCollege = require("../models/IIMCollege");
const { adminAuth } = require("../middleware/authMiddleware");

router.get("/", adminAuth, async (req, res) => {
    try {
        const { search, collegeGroup, isActive } = req.query;
        
        let filter = {};
        
        if (search) {
            filter.collegeName = { $regex: search, $options: "i" };
        }
        
        if (collegeGroup) {
            filter.collegeGroup = collegeGroup;
        }
        
        if (isActive !== undefined) {
            filter.isActive = isActive === "true";
        }
        
        const colleges = await IIMCollege.find(filter)
            .sort({ collegeGroup: 1, displayOrder: 1, collegeName: 1 });
        
        res.json({ success: true, colleges });
    } catch (error) {
        console.error("Error fetching colleges:", error);
        res.status(500).json({ success: false, message: "Failed to fetch colleges" });
    }
});

router.get("/:id", adminAuth, async (req, res) => {
    try {
        const college = await IIMCollege.findById(req.params.id);
        
        if (!college) {
            return res.status(404).json({ success: false, message: "College not found" });
        }
        
        res.json({ success: true, college });
    } catch (error) {
        console.error("Error fetching college:", error);
        res.status(500).json({ success: false, message: "Failed to fetch college" });
    }
});

router.post("/", adminAuth, async (req, res) => {
    try {
        const {
            collegeGroup,
            collegeName,
            programName,
            varcCutoff,
            dilrCutoff,
            qaCutoff,
            overallMinCutoff,
            targetPercentile,
            conversionCalls,
            shortlistingUrl,
            displayOrder,
            isActive
        } = req.body;
        
        if (!collegeGroup || !collegeName || targetPercentile === undefined) {
            return res.status(400).json({
                success: false,
                message: "College group, college name, and target percentile are required"
            });
        }
        
        const newCollege = new IIMCollege({
            collegeGroup,
            collegeName,
            programName: programName || "",
            varcCutoff: varcCutoff || null,
            dilrCutoff: dilrCutoff || null,
            qaCutoff: qaCutoff || null,
            overallMinCutoff: overallMinCutoff || null,
            targetPercentile,
            conversionCalls: conversionCalls || "NA",
            shortlistingUrl: shortlistingUrl || "",
            displayOrder: displayOrder || 0,
            isActive: isActive !== false
        });
        
        await newCollege.save();
        
        res.status(201).json({
            success: true,
            message: "College added successfully",
            college: newCollege
        });
    } catch (error) {
        console.error("Error creating college:", error);
        res.status(500).json({ success: false, message: "Failed to create college" });
    }
});

router.put("/:id", adminAuth, async (req, res) => {
    try {
        const {
            collegeGroup,
            collegeName,
            programName,
            varcCutoff,
            dilrCutoff,
            qaCutoff,
            overallMinCutoff,
            targetPercentile,
            conversionCalls,
            shortlistingUrl,
            displayOrder,
            isActive
        } = req.body;
        
        const college = await IIMCollege.findById(req.params.id);
        
        if (!college) {
            return res.status(404).json({ success: false, message: "College not found" });
        }
        
        if (collegeGroup) college.collegeGroup = collegeGroup;
        if (collegeName) college.collegeName = collegeName;
        if (programName !== undefined) college.programName = programName;
        if (varcCutoff !== undefined) college.varcCutoff = varcCutoff;
        if (dilrCutoff !== undefined) college.dilrCutoff = dilrCutoff;
        if (qaCutoff !== undefined) college.qaCutoff = qaCutoff;
        if (overallMinCutoff !== undefined) college.overallMinCutoff = overallMinCutoff;
        if (targetPercentile !== undefined) college.targetPercentile = targetPercentile;
        if (conversionCalls !== undefined) college.conversionCalls = conversionCalls;
        if (shortlistingUrl !== undefined) college.shortlistingUrl = shortlistingUrl;
        if (displayOrder !== undefined) college.displayOrder = displayOrder;
        if (isActive !== undefined) college.isActive = isActive;
        
        await college.save();
        
        res.json({
            success: true,
            message: "College updated successfully",
            college
        });
    } catch (error) {
        console.error("Error updating college:", error);
        res.status(500).json({ success: false, message: "Failed to update college" });
    }
});

router.delete("/:id", adminAuth, async (req, res) => {
    try {
        const college = await IIMCollege.findByIdAndDelete(req.params.id);
        
        if (!college) {
            return res.status(404).json({ success: false, message: "College not found" });
        }
        
        res.json({
            success: true,
            message: "College deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting college:", error);
        res.status(500).json({ success: false, message: "Failed to delete college" });
    }
});

router.patch("/:id/toggle-active", adminAuth, async (req, res) => {
    try {
        const college = await IIMCollege.findById(req.params.id);
        
        if (!college) {
            return res.status(404).json({ success: false, message: "College not found" });
        }
        
        college.isActive = !college.isActive;
        await college.save();
        
        res.json({
            success: true,
            message: `College ${college.isActive ? "activated" : "deactivated"} successfully`,
            college
        });
    } catch (error) {
        console.error("Error toggling college status:", error);
        res.status(500).json({ success: false, message: "Failed to toggle college status" });
    }
});

module.exports = router;
