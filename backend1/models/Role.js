const mongoose = require("mongoose");

const PermissionSchema = new mongoose.Schema({
  view: { type: Boolean, default: false },
  create: { type: Boolean, default: false },
  edit: { type: Boolean, default: false },
  delete: { type: Boolean, default: false },
  export: { type: Boolean, default: false },
  approve: { type: Boolean, default: false }
}, { _id: false });

const RoleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    description: {
      type: String,
      default: ""
    },
    permissions: {
      dashboard: PermissionSchema,
      students: PermissionSchema,
      courses: PermissionSchema,
      batches: PermissionSchema,
      liveClasses: PermissionSchema,
      mockTests: PermissionSchema,
      practiceTests: PermissionSchema,
      payments: PermissionSchema,
      coupons: PermissionSchema,
      notifications: PermissionSchema,
      announcements: PermissionSchema,
      leads: PermissionSchema,
      reports: PermissionSchema,
      faculty: PermissionSchema,
      blogs: PermissionSchema,
      studyMaterials: PermissionSchema,
      discussions: PermissionSchema,
      bschools: PermissionSchema,
      iimPredictor: PermissionSchema,
      downloads: PermissionSchema,
      gallery: PermissionSchema,
      crm: PermissionSchema,
      billing: PermissionSchema,
      roleManagement: PermissionSchema
    },
    isDefault: {
      type: Boolean,
      default: false
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

module.exports = mongoose.model("Role", RoleSchema);
