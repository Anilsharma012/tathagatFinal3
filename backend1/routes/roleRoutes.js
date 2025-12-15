const express = require("express");
const router = express.Router();
const Role = require("../models/Role");
const AdminUser = require("../models/AdminUser");
const { adminAuth } = require("../middleware/authMiddleware");
const { checkPermission } = require("../middleware/permissionMiddleware");

router.get("/", adminAuth, checkPermission("roleManagement", "view"), async (req, res) => {
  try {
    const roles = await Role.find().sort({ createdAt: -1 });
    res.json({ success: true, roles });
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({ success: false, message: "Failed to fetch roles" });
  }
});

router.get("/:id", adminAuth, checkPermission("roleManagement", "view"), async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ success: false, message: "Role not found" });
    }
    res.json({ success: true, role });
  } catch (error) {
    console.error("Error fetching role:", error);
    res.status(500).json({ success: false, message: "Failed to fetch role" });
  }
});

router.post("/", adminAuth, checkPermission("roleManagement", "create"), async (req, res) => {
  try {
    const { name, description, permissions } = req.body;

    const existingRole = await Role.findOne({ name: name.trim() });
    if (existingRole) {
      return res.status(400).json({ success: false, message: "Role with this name already exists" });
    }

    const role = new Role({
      name: name.trim(),
      description,
      permissions,
      createdBy: req.user.id
    });

    await role.save();
    res.status(201).json({ success: true, message: "Role created successfully", role });
  } catch (error) {
    console.error("Error creating role:", error);
    res.status(500).json({ success: false, message: "Failed to create role" });
  }
});

router.put("/:id", adminAuth, checkPermission("roleManagement", "edit"), async (req, res) => {
  try {
    const { name, description, permissions } = req.body;

    const existingRole = await Role.findOne({ name: name.trim(), _id: { $ne: req.params.id } });
    if (existingRole) {
      return res.status(400).json({ success: false, message: "Role with this name already exists" });
    }

    const role = await Role.findByIdAndUpdate(
      req.params.id,
      { name: name.trim(), description, permissions },
      { new: true }
    );

    if (!role) {
      return res.status(404).json({ success: false, message: "Role not found" });
    }

    res.json({ success: true, message: "Role updated successfully", role });
  } catch (error) {
    console.error("Error updating role:", error);
    res.status(500).json({ success: false, message: "Failed to update role" });
  }
});

router.delete("/:id", adminAuth, checkPermission("roleManagement", "delete"), async (req, res) => {
  try {
    const usersWithRole = await AdminUser.countDocuments({ role: req.params.id });
    if (usersWithRole > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete role. ${usersWithRole} user(s) are assigned to this role.`
      });
    }

    const role = await Role.findByIdAndDelete(req.params.id);
    if (!role) {
      return res.status(404).json({ success: false, message: "Role not found" });
    }

    res.json({ success: true, message: "Role deleted successfully" });
  } catch (error) {
    console.error("Error deleting role:", error);
    res.status(500).json({ success: false, message: "Failed to delete role" });
  }
});

module.exports = router;
