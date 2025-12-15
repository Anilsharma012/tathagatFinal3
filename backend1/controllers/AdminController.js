const Payment = require("../models/Payment");
const Receipt = require("../models/Receipt");
const Course = require("../models/course/Course");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/UserSchema");
const Admin = require("../models/Admin");
const UserProgress = require("../models/UserProgress");

// SECURITY: JWT secret must be set in environment - no fallback
const getJWTSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    console.error("CRITICAL: JWT_SECRET environment variable must be set and be at least 32 characters");
    throw new Error("Server configuration error - JWT secret not properly configured");
  }
  return secret;
};

// Create admin (temporary use)
exports.createAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const adminExists = await Admin.findOne({ email });
    if (adminExists) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const admin = new Admin({ email, password });
    await admin.save();

    res.status(201).json({ message: "Admin created successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Admin login - SECURE VERSION
exports.loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required" });
  }

  try {
    const AdminUser = require("../models/AdminUser");
    
    // First check AdminUser collection (for superadmin/subadmin/teacher)
    let adminUser = await AdminUser.findOne({ email: email.toLowerCase() }).populate("role");
    
    if (adminUser) {
      // Found in AdminUser collection
      if (adminUser.status === 'suspended') {
        return res.status(403).json({ 
          success: false, 
          message: "Account suspended. Please contact administrator." 
        });
      }
      
      const isMatch = await adminUser.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: "Invalid email or password" });
      }
      
      // Update last login
      adminUser.lastLogin = new Date();
      await adminUser.save();
      
      // Get effective permissions
      const permissions = await adminUser.getEffectivePermissions();
      
      const token = jwt.sign(
        { 
          id: adminUser._id, 
          email: adminUser.email,
          name: adminUser.fullName,
          role: adminUser.userType === 'superadmin' ? 'admin' : 'subadmin',
          userType: adminUser.userType,
          roleId: adminUser.role?._id
        }, 
        getJWTSecret(), 
        { expiresIn: "7d" }
      );
      
      return res.status(200).json({ 
        success: true,
        token,
        user: {
          _id: adminUser._id,
          fullName: adminUser.fullName,
          email: adminUser.email,
          userType: adminUser.userType,
          role: adminUser.role,
          status: adminUser.status
        },
        permissions
      });
    }
    
    // Fallback: Check legacy Admin collection
    let admin = await Admin.findOne({ email });
    
    if (!admin) {
      // SECURITY: Never auto-create admins
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // Generate full permissions for legacy admin (treated as superadmin)
    const allPermissions = {};
    const modules = [
      "dashboard", "students", "courses", "batches", "liveClasses",
      "mockTests", "practiceTests", "payments", "coupons", "notifications",
      "announcements", "leads", "reports", "faculty", "blogs",
      "studyMaterials", "discussions", "bschools", "iimPredictor",
      "downloads", "gallery", "crm", "billing", "roleManagement"
    ];
    modules.forEach(mod => {
      allPermissions[mod] = {
        view: true, create: true, edit: true, delete: true, export: true, approve: true
      };
    });

    const token = jwt.sign(
      { 
        id: admin._id, 
        role: "admin",
        userType: "superadmin",
        email: admin.email,
        name: admin.name || "Admin"
      }, 
      getJWTSecret(), 
      { expiresIn: "7d" }
    );
    
    res.status(200).json({ 
      success: true,
      token,
      user: {
        _id: admin._id,
        fullName: admin.name || "Admin",
        email: admin.email,
        userType: "superadmin"
      },
      permissions: allPermissions
    });
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ success: false, message: "Login failed. Please try again." });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "Please fill all fields." });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "New password and confirm password do not match." });
    }

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found." });
    }

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect." });
    }

    admin.password = newPassword;
    await admin.save();

    res.json({ message: "Password changed successfully." });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

exports.getStudents = async (req, res) => {
  try {
    const students = await User.find({ role: "student" }).select(
      "name email phoneNumber selectedCategory selectedExam createdAt"
    );
    res.status(200).json({ students });
  } catch (error) {
    console.log("❌ Error in getStudents:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    let student = await User.findById(id);
    if (!student) return res.status(404).json({ message: "Student not found!" });

    student = await User.findByIdAndUpdate(id, updatedData, { new: true });

    res.status(200).json({ message: "Student updated successfully!", student });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    let student = await User.findById(id);
    if (!student) return res.status(404).json({ message: "Student not found!" });

    await User.findByIdAndDelete(id);

    res.status(200).json({ message: "Student deleted successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Get current admin details
exports.getProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id).select("-password");
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    res.json({ admin });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getPaidUsers = async (req, res) => {
  try {
    const users = await User.find({
      "enrolledCourses.status": "unlocked"
    })
      .select("name email phoneNumber enrolledCourses")
      .populate("enrolledCourses.courseId");

    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error("❌ Error in getPaidUsers:", error);
    res.status(500).json({ success: false, message: "Server error", error });
  }
};

// Get all students with their course purchases
exports.getStudentsWithPurchases = async (req, res) => {
  try {
    const students = await User.find({}, "name email phoneNumber selectedCategory selectedExam createdAt enrolledCourses")
      .populate('enrolledCourses.courseId', 'name price description')
      .sort({ createdAt: -1 });

    const studentsWithPayments = await Promise.all(
      students.map(async (student) => {
        const payments = await Payment.find({ userId: student._id })
          .populate('courseId', 'name price description')
          .sort({ createdAt: -1 });

        return {
          ...student.toObject(),
          payments: payments,
          totalSpent: payments
            .filter(p => p.status === 'paid')
            .reduce((sum, p) => sum + p.amount, 0)
        };
      })
    );

    res.status(200).json({
      success: true,
      students: studentsWithPayments,
      count: studentsWithPayments.length
    });
  } catch (error) {
    console.error("❌ Error in getStudentsWithPurchases:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Get all payments/purchases
exports.getAllPayments = async (req, res) => {
  try {
    const { status, courseId, startDate, endDate } = req.query;

    let filter = {};
    if (status) filter.status = status;
    if (courseId) filter.courseId = courseId;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const payments = await Payment.find(filter)
      .populate('userId', 'name email phoneNumber')
      .populate('courseId', 'name price description')
      .sort({ createdAt: -1 });

    const summary = {
      totalPayments: payments.length,
      successfulPayments: payments.filter(p => p.status === 'paid').length,
      totalRevenue: payments
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + p.amount, 0),
      pendingPayments: payments.filter(p => p.status === 'created').length,
      failedPayments: payments.filter(p => p.status === 'failed').length,
    };

    res.status(200).json({
      success: true,
      payments: payments,
      summary: summary
    });
  } catch (error) {
    console.error("❌ Error in getAllPayments:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Get course-wise purchase statistics
exports.getCourseStatistics = async (req, res) => {
  try {
    const courses = await Course.find({}, 'name price description published');

    const courseStats = await Promise.all(
      courses.map(async (course) => {
        const payments = await Payment.find({
          courseId: course._id,
          status: 'paid'
        });

        const enrolledStudents = await User.find({
          'enrolledCourses.courseId': course._id,
          'enrolledCourses.status': 'unlocked'
        }).countDocuments();

        return {
          course: course,
          totalEnrollments: enrolledStudents,
          totalPayments: payments.length,
          totalRevenue: payments.reduce((sum, p) => sum + p.amount, 0),
          averagePayment: payments.length > 0
            ? payments.reduce((sum, p) => sum + p.amount, 0) / payments.length
            : 0
        };
      })
    );

    res.status(200).json({
      success: true,
      courseStatistics: courseStats
    });
  } catch (error) {
    console.error("❌ Error in getCourseStatistics:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Update student course status
exports.updateStudentCourseStatus = async (req, res) => {
  try {
    const { studentId, courseId } = req.params;
    const { status } = req.body; // locked or unlocked

    if (!['locked', 'unlocked'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be 'locked' or 'unlocked'"
      });
    }

    const user = await User.findById(studentId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    const courseEntry = user.enrolledCourses.find(
      c => c.courseId.toString() === courseId
    );

    if (!courseEntry) {
      user.enrolledCourses.push({
        courseId: courseId,
        status: status,
        enrolledAt: new Date()
      });
    } else {
      courseEntry.status = status;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: `Course status updated to ${status}`,
      user: user
    });
  } catch (error) {
    console.error("❌ Error in updateStudentCourseStatus:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Download receipt for admin
exports.downloadStudentReceipt = async (req, res) => {
  try {
    const { receiptId } = req.params;
    const { format = 'json' } = req.query; // json, html, or text

    const receipt = await Receipt.findById(receiptId)
      .populate('paymentId')
      .populate('userId', 'name email phoneNumber')
      .populate('courseId', 'name description price');

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: "Receipt not found"
      });
    }

    await receipt.markAsDownloaded();

    const receiptData = receipt.getReceiptData();

    if (format === 'html') {
      const { generateReceiptHTML } = require('../utils/receiptGenerator');
      const html = generateReceiptHTML(receiptData);

      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `inline; filename="receipt-${receipt.receiptNumber}.html"`);
      return res.send(html);
    }

    if (format === 'text') {
      const { generateReceiptText } = require('../utils/receiptGenerator');
      const text = generateReceiptText(receiptData);

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="receipt-${receipt.receiptNumber}.txt"`);
      return res.send(text);
    }

    res.status(200).json({
      success: true,
      receipt: receiptData,
      student: {
        name: receipt.userId.name,
        email: receipt.userId.email,
        phone: receipt.userId.phoneNumber
      },
      formats: {
        html: `/api/admin/receipt/${receiptId}/download?format=html`,
        text: `/api/admin/receipt/${receiptId}/download?format=text`
      }
    });
  } catch (error) {
    console.error("❌ Error in downloadStudentReceipt:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Admin: get a student's course progress
exports.getStudentCourseProgress = async (req, res) => {
  try {
    const { studentId, courseId } = req.params;
    let progress = await UserProgress.findOne({ userId: studentId, courseId });
    if (!progress) {
      progress = new UserProgress({ userId: studentId, courseId, lessonProgress: [], overallProgress: 0 });
      await progress.save();
    }
    res.status(200).json({ success: true, progress });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: update/toggle a lesson status for a student
exports.updateStudentLessonProgress = async (req, res) => {
  try {
    const { studentId, courseId } = req.params;
    const { lessonId, lessonType, status, progress } = req.body;

    if (!lessonId || !lessonType) {
      return res.status(400).json({ success: false, message: 'lessonId and lessonType are required' });
    }

    let userProgress = await UserProgress.findOne({ userId: studentId, courseId });
    if (!userProgress) {
      userProgress = new UserProgress({ userId: studentId, courseId, lessonProgress: [], overallProgress: 0 });
    }

    const data = {};
    if (status) data.status = status;
    if (progress !== undefined) data.progress = progress;
    if (status === 'completed') data.completedAt = new Date();

    userProgress.updateLessonProgress(lessonId, lessonType, data);
    await userProgress.save();

    res.status(200).json({ success: true, progress: userProgress });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// List offline payments (pending/rejected or all offline)
exports.listOfflinePayments = async (req, res) => {
  try {
    const { status = '' } = req.query;
    const filter = { $or: [{ paymentMethod: 'offline' }, { paymentMethod: 'manual' }] };
    if (status) filter.status = status;
    const items = await Payment.find(filter)
      .populate('userId', 'name email phoneNumber')
      .populate('courseId', 'name price')
      .sort({ createdAt: -1 });
    res.json({ success: true, items });
  } catch (e) {
    console.error('listOfflinePayments error:', e);
    res.status(500).json({ success: false, message: 'Failed to list offline payments', error: e.message });
  }
};

// Approve offline payment -> mark paid, unlock course, generate receipt
exports.approveOfflinePayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const adminId = req.user.id;

    const payment = await Payment.findById(paymentId).populate('courseId');
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

    if (!['offline', 'manual'].includes(payment.paymentMethod)) {
      return res.status(400).json({ success: false, message: 'Not an offline/manual payment' });
    }

    payment.status = 'paid';
    payment.offlineReviewedAt = new Date();
    payment.offlineReviewedBy = adminId;
    await payment.save();

    // Unlock course for user
    const user = await User.findById(payment.userId);
    if (user) {
      let courseEntry = user.enrolledCourses.find(c => c.courseId.toString() === payment.courseId._id.toString());
      if (!courseEntry) {
        user.enrolledCourses.push({ courseId: payment.courseId._id, status: 'unlocked', enrolledAt: new Date() });
      } else {
        courseEntry.status = 'unlocked';
      }
      await user.save();
    }

    // Generate receipt
    const receipt = new Receipt({
      paymentId: payment._id,
      userId: payment.userId,
      courseId: payment.courseId._id,
      receiptNumber: Receipt.generateReceiptNumber(),
      amount: payment.amount,
      totalAmount: payment.amount,
      customerDetails: {
        name: (typeof user !== 'undefined' && user) ? (user.name || user.email || 'Student') : 'Student',
        email: (typeof user !== 'undefined' && user) ? (user.email || '') : '',
        phone: (typeof user !== 'undefined' && user) ? (user.phoneNumber || '') : '',
        address: (typeof user !== 'undefined' && user) ? (user.city || '') : ''
      },
      courseDetails: {
        name: payment.courseId.name,
        description: payment.courseId.description,
        price: payment.courseId.price,
      },
    });
    await receipt.save();

    res.json({ success: true, payment, receipt });
  } catch (e) {
    console.error('approveOfflinePayment error:', e);
    res.status(500).json({ success: false, message: 'Failed to approve offline payment', error: e.message });
  }
};

// Reject offline payment
exports.rejectOfflinePayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { reason = '' } = req.body;
    const adminId = req.user.id;

    const payment = await Payment.findById(paymentId);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

    payment.status = 'rejected';
    payment.offlineReviewedAt = new Date();
    payment.offlineReviewedBy = adminId;
    payment.offlineNote = [payment.offlineNote, reason].filter(Boolean).join(' | ');
    await payment.save();

    res.json({ success: true, payment });
  } catch (e) {
    console.error('rejectOfflinePayment error:', e);
    res.status(500).json({ success: false, message: 'Failed to reject offline payment', error: e.message });
  }
};

// Admin manual upload (optionally mark paid immediately)
exports.manualUploadPayment = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { userId, courseId, amount, note = '', status = 'paid' } = req.body;

    if (!userId || !courseId || !amount) {
      return res.status(400).json({ success: false, message: 'userId, courseId, and amount are required' });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    const file = req.file || null;
    const filename = file ? file.filename : null;
    const url = filename ? `${req.protocol}://${req.get('host')}/uploads/${filename}` : null;

    const payment = new Payment({
      userId,
      courseId,
      razorpay_order_id: `manual_${Date.now()}`,
      amount: Number(amount),
      currency: 'INR',
      status: status === 'paid' ? 'paid' : 'pending_offline',
      paymentMethod: 'manual',
      offlineSlipFilename: filename,
      offlineSlipUrl: url,
      offlineNote: note,
      uploadedByRole: 'admin',
      offlineReviewedAt: status === 'paid' ? new Date() : undefined,
      offlineReviewedBy: status === 'paid' ? adminId : undefined,
    });

    await payment.save();

    let receipt = null;
    if (payment.status === 'paid') {
      // Unlock + receipt
      const user = await User.findById(userId);
      if (user) {
        let courseEntry = user.enrolledCourses.find(c => c.courseId.toString() === courseId.toString());
        if (!courseEntry) {
          user.enrolledCourses.push({ courseId, status: 'unlocked', enrolledAt: new Date() });
        } else {
          courseEntry.status = 'unlocked';
        }
        await user.save();
      }

      receipt = new Receipt({
        paymentId: payment._id,
        userId,
        courseId,
        receiptNumber: Receipt.generateReceiptNumber(),
        amount: payment.amount,
        totalAmount: payment.amount,
        customerDetails: {
          name: (typeof user !== 'undefined' && user) ? (user.name || user.email || 'Student') : 'Student',
          email: (typeof user !== 'undefined' && user) ? (user.email || '') : '',
          phone: (typeof user !== 'undefined' && user) ? (user.phoneNumber || '') : '',
          address: (typeof user !== 'undefined' && user) ? (user.city || '') : ''
        },
        courseDetails: {
          name: course.name,
          description: course.description,
          price: course.price,
        },
      });
      await receipt.save();
    }

    res.status(201).json({ success: true, payment, receipt });
  } catch (e) {
    console.error('manualUploadPayment error:', e);
    res.status(500).json({ success: false, message: 'Failed to create manual payment', error: e.message });
  }
};
