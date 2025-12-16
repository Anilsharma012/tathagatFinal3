const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const CustomPermissionSchema = new mongoose.Schema({
  view: { type: Boolean },
  create: { type: Boolean },
  edit: { type: Boolean },
  delete: { type: Boolean },
  export: { type: Boolean },
  approve: { type: Boolean }
}, { _id: false });

const AdminUserSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      default: ""
    },
    password: {
      type: String,
      required: true
    },
    userType: {
      type: String,
      enum: ["superadmin", "subadmin", "teacher"],
      default: "subadmin"
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role"
    },
    customPermissions: {
      dashboard: CustomPermissionSchema,
      students: CustomPermissionSchema,
      courses: CustomPermissionSchema,
      batches: CustomPermissionSchema,
      liveClasses: CustomPermissionSchema,
      liveBatches: CustomPermissionSchema,
      mockTests: CustomPermissionSchema,
      mockTestFeedback: CustomPermissionSchema,
      practiceTests: CustomPermissionSchema,
      payments: CustomPermissionSchema,
      coupons: CustomPermissionSchema,
      notifications: CustomPermissionSchema,
      announcements: CustomPermissionSchema,
      popupAnnouncements: CustomPermissionSchema,
      leads: CustomPermissionSchema,
      reports: CustomPermissionSchema,
      faculty: CustomPermissionSchema,
      blogs: CustomPermissionSchema,
      demoVideos: CustomPermissionSchema,
      studyMaterials: CustomPermissionSchema,
      pdfManagement: CustomPermissionSchema,
      discussions: CustomPermissionSchema,
      bschools: CustomPermissionSchema,
      iimPredictor: CustomPermissionSchema,
      responseSheets: CustomPermissionSchema,
      downloads: CustomPermissionSchema,
      gallery: CustomPermissionSchema,
      scoreCards: CustomPermissionSchema,
      successStories: CustomPermissionSchema,
      topPerformers: CustomPermissionSchema,
      coursePurchaseContent: CustomPermissionSchema,
      crm: CustomPermissionSchema,
      billing: CustomPermissionSchema,
      roleManagement: CustomPermissionSchema
    },
    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active"
    },
    lastLogin: {
      type: Date
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser"
    }
  },
  {
    timestamps: true
  }
);

AdminUserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

AdminUserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

AdminUserSchema.methods.getEffectivePermissions = async function () {
  if (this.userType === "superadmin") {
    const allPermissions = {};
    const modules = [
      "dashboard", "students", "courses", "batches", "liveClasses", "liveBatches",
      "mockTests", "mockTestFeedback", "practiceTests", "payments", "coupons", "notifications",
      "announcements", "popupAnnouncements", "leads", "reports", "faculty", "blogs", "demoVideos",
      "studyMaterials", "pdfManagement", "discussions", "bschools", "iimPredictor", "responseSheets",
      "downloads", "gallery", "scoreCards", "successStories", "topPerformers", "coursePurchaseContent",
      "crm", "billing", "roleManagement"
    ];
    modules.forEach(mod => {
      allPermissions[mod] = {
        view: true, create: true, edit: true, delete: true, export: true, approve: true
      };
    });
    return allPermissions;
  }

  let rolePermissions = {};
  if (this.role) {
    const Role = mongoose.model("Role");
    const role = await Role.findById(this.role);
    if (role && role.permissions) {
      rolePermissions = role.permissions.toObject ? role.permissions.toObject() : role.permissions;
    }
  }

  const effectivePermissions = { ...rolePermissions };
  if (this.customPermissions) {
    const customPerms = this.customPermissions.toObject ? this.customPermissions.toObject() : this.customPermissions;
    Object.keys(customPerms).forEach(module => {
      if (customPerms[module]) {
        if (!effectivePermissions[module]) {
          effectivePermissions[module] = {};
        }
        Object.keys(customPerms[module]).forEach(action => {
          if (customPerms[module][action] !== undefined && customPerms[module][action] !== null) {
            effectivePermissions[module][action] = customPerms[module][action];
          }
        });
      }
    });
  }

  return effectivePermissions;
};

module.exports = mongoose.model("AdminUser", AdminUserSchema);
