const AdminUser = require("../models/AdminUser");

const checkPermission = (module, action) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ success: false, message: "Authentication required" });
      }

      if (req.user.role === "admin" || req.user.userType === "superadmin") {
        return next();
      }

      const adminUser = await AdminUser.findById(req.user.id).populate("role");

      if (!adminUser) {
        if (req.user.role === "admin") {
          return next();
        }
        return res.status(403).json({ success: false, message: "Access denied" });
      }

      if (adminUser.userType === "superadmin") {
        return next();
      }

      if (adminUser.status === "suspended") {
        return res.status(403).json({ success: false, message: "Your account has been suspended" });
      }

      const permissions = await adminUser.getEffectivePermissions();

      if (!permissions[module] || !permissions[module][action]) {
        return res.status(403).json({
          success: false,
          message: `Access denied. You don't have ${action} permission for ${module}.`
        });
      }

      req.permissions = permissions;
      next();
    } catch (error) {
      console.error("Permission check error:", error);
      return res.status(500).json({ success: false, message: "Permission verification failed" });
    }
  };
};

const requireSuperAdmin = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    if (req.user.role === "admin") {
      return next();
    }

    const adminUser = await AdminUser.findById(req.user.id);

    if (!adminUser || adminUser.userType !== "superadmin") {
      return res.status(403).json({ success: false, message: "Super Admin access required" });
    }

    next();
  } catch (error) {
    console.error("Super admin check error:", error);
    return res.status(500).json({ success: false, message: "Permission verification failed" });
  }
};

module.exports = { checkPermission, requireSuperAdmin };
