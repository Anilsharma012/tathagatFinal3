const jwt = require("jsonwebtoken");
const AdminUser = require("../models/AdminUser");

// SECURITY: JWT secret must be set in environment
const getJWTSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    console.error("CRITICAL: JWT_SECRET environment variable must be set and be at least 32 characters");
    throw new Error("Server configuration error - JWT secret not properly configured");
  }
  return secret;
};

// ✅ Helper: Token extract and verify - SECURE VERSION
const verifyToken = (req) => {
  const authHeader = req.headers.authorization || req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Token missing or malformed");
  }

  const token = authHeader.split(" ")[1];
  // SECURITY: Always verify JWT properly with secure secret
  return jwt.verify(token, getJWTSecret());
};

// ✅ 1. Normal user middleware - SECURE VERSION
const authMiddleware = async (req, res, next) => {
  try {
    // Check if this is an admin route - admin routes require proper authentication
    const isAdminRoute = req.path.includes('/admin') || req.baseUrl?.includes('/admin');
    
    const authHeader = req.headers.authorization || req.header("Authorization");

    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        // SECURITY: Always verify JWT properly with secure secret
        const decoded = jwt.verify(token, getJWTSecret());
        req.user = decoded;
        return next();
      } catch (tokenError) {
        console.log('⚠️ Invalid token provided:', tokenError.message);
        
        // SECURITY: Admin routes always require valid token
        if (isAdminRoute) {
          return res.status(401).json({ 
            success: false, 
            message: "Invalid or expired token. Please login again." 
          });
        }
      }
    } else {
      // No token provided
      if (isAdminRoute) {
        return res.status(401).json({ 
          success: false, 
          message: "Authentication required. Please login." 
        });
      }
    }

    // For student routes without token in development, use demo student
    if (process.env.NODE_ENV !== 'production') {
      const User = require("../models/UserSchema");
      const demoEmail = 'demo@test.com';
      let demoUser = await User.findOne({ email: demoEmail });

      if (demoUser) {
        req.user = {
          id: demoUser._id.toString(),
          role: 'student',
          email: demoUser.email || 'demo@test.com',
          name: demoUser.name || 'Demo Student'
        };
      } else {
        req.user = {
          id: '507f1f77bcf86cd799439011',
          role: 'student',
          email: 'demo@test.com',
          name: 'Demo Student'
        };
      }
      return next();
    }

    // In production without token, reject
    return res.status(401).json({ 
      success: false, 
      message: "Authentication required." 
    });
  } catch (error) {
    console.error('Error in authMiddleware:', error);
    return res.status(500).json({ 
      success: false, 
      message: "Authentication error." 
    });
  }
};

// ✅ 2. Admin + Subadmin + Teacher access middleware - SECURE VERSION
const adminAuth = async (req, res, next) => {
  try {
    const decoded = verifyToken(req);
    
    // SECURITY: Validate userType is one of allowed admin types
    const allowedUserTypes = ['superadmin', 'subadmin', 'teacher'];
    const allowedRoles = ['admin', 'subadmin'];
    
    // Check if token has valid admin userType or role
    const hasValidUserType = decoded.userType && allowedUserTypes.includes(decoded.userType);
    const hasValidRole = decoded.role && allowedRoles.includes(decoded.role);
    
    if (!hasValidUserType && !hasValidRole) {
      console.log(`❌ Access denied - userType: ${decoded.userType}, role: ${decoded.role}`);
      return res.status(403).json({ 
        success: false, 
        message: "Access denied. Admin panel is restricted to authorized administrators only." 
      });
    }
    
    // SECURITY: Always verify user exists in database
    let userExists = false;
    let userStatus = 'active';
    
    // Check AdminUser collection first
    const adminUser = await AdminUser.findById(decoded.id);
    if (adminUser) {
      userExists = true;
      userStatus = adminUser.status;
    } else {
      // Check legacy Admin collection
      const Admin = require("../models/Admin");
      const legacyAdmin = await Admin.findById(decoded.id);
      if (legacyAdmin) {
        userExists = true;
        // Legacy admins are always treated as active superadmins
      }
    }
    
    if (!userExists) {
      return res.status(401).json({ 
        success: false, 
        message: "User account not found. Please login again." 
      });
    }
    
    if (userStatus === 'suspended') {
      return res.status(403).json({ 
        success: false, 
        message: "Account suspended. Please contact administrator." 
      });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Admin auth error:", error.message);
    return res.status(401).json({ 
      success: false, 
      message: "Authentication failed. Please login again." 
    });
  }
};



const adminOnly = (req, res, next) => {
  try {
    const decoded = verifyToken(req);
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "❌ Access Denied! Admin only" });
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "❌ Unauthorized! Invalid Token" });
  }
};


const permitRoles = (...roles) => (req, res, next) => {
  try {
    const decoded = verifyToken(req);
    if (!roles.includes(decoded.role)) {
      return res.status(403).json({ message: "❌ Access Denied! Insufficient permissions" });
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "❌ Unauthorized! Invalid Token" });
  }
};


// ✅ Optional auth middleware - sets user if token is valid, but doesn't block request
const optionalAuth = (req, res, next) => {
  try {
    const decoded = verifyToken(req);
    req.user = decoded;
  } catch (error) {
    console.log('ℹ️ Optional Auth: No valid token provided, continuing as guest');
    req.user = null;
  }
  next();
};

module.exports = { authMiddleware, adminAuth, adminOnly, permitRoles, verifyToken, optionalAuth };
