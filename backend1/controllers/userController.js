const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");

const Razorpay = require("razorpay");

const User = require("../models/UserSchema");
const Course = require("../models/course/Course");
const Payment = require("../models/Payment");
const Receipt = require("../models/Receipt");

// ---------------- Helpers ----------------
const getUserId = (req) => req.user?.id || req.user?._id || req.user?.userId;

const signToken = (user) => {
  const secret = process.env.JWT_SECRET || "dev_jwt_secret_change_me";
  return jwt.sign(
    { id: user._id, email: user.email },
    secret,
    { expiresIn: "30d" }
  );
};

const getRazorpay = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    // Dev-friendly error
    throw new Error("Razorpay keys missing in env");
  }

  return new Razorpay({ key_id, key_secret });
};

// ---------------- Auth ----------------
exports.signup = async (req, res) => {
  try {
    const { name, email, phoneNumber, password } = req.body;

    if (!name || !email || !phoneNumber || !password) {
      return res.status(400).json({
        status: false,
        msg: "All fields are required",
      });
    }

    const existing = await User.findOne({
      $or: [{ email }, { phoneNumber }],
    });

    if (existing) {
      return res.status(409).json({
        status: false,
        msg: "User already exists with this email/phone",
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      phoneNumber,
      password: hashed,
    });

    const token = signToken(user);

    return res.json({
      status: true,
      msg: "Signup successful",
      token,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
      },
    });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({
      status: false,
      msg: "Signup failed",
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, phoneNumber, password } = req.body;

    if ((!email && !phoneNumber) || !password) {
      return res.status(400).json({
        status: false,
        msg: "Email/Phone and password required",
      });
    }

    const user = await User.findOne(
      email ? { email } : { phoneNumber }
    );

    if (!user) {
      return res.status(404).json({
        status: false,
        msg: "User not found",
      });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({
        status: false,
        msg: "Invalid credentials",
      });
    }

    const token = signToken(user);

    return res.json({
      status: true,
      msg: "Login successful",
      token,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        profilePic: user.profilePic,
        city: user.city,
        selectedExam: user.selectedExam,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({
      status: false,
      msg: "Login failed",
    });
  }
};

exports.verifyToken = async (req, res) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ")
      ? header.split(" ")[1]
      : req.query.token;

    if (!token) {
      return res.status(401).json({
        status: false,
        msg: "Token missing",
      });
    }

    const secret = process.env.JWT_SECRET || "default_secret_key";
    const decoded = jwt.verify(token, secret);

    // Fetch full user from database
    const user = await User.findById(decoded.id).select("-password");
    
    if (!user) {
      return res.status(404).json({
        status: false,
        msg: "User not found",
      });
    }

    // Determine redirect based on onboarding status
    let redirectTo = "/student/dashboard";
    if (!user.isOnboardingComplete) {
      redirectTo = "/student/onboarding";
    } else if (!user.name || !user.email) {
      redirectTo = "/user-details";
    }

    return res.json({
      status: true,
      msg: "Token valid",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        profilePic: user.profilePic,
        isPhoneVerified: user.isPhoneVerified,
        isOnboardingComplete: user.isOnboardingComplete,
        targetYear: user.targetYear,
        selectedExam: user.selectedExam,
        selectedCategory: user.selectedCategory,
        state: user.state,
        city: user.city,
        gender: user.gender,
        dob: user.dob
      },
      redirectTo
    });
  } catch (err) {
    console.error("Token verify error:", err);
    return res.status(401).json({
      status: false,
      msg: "Token invalid",
    });
  }
};

exports.autoLogin = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        status: false,
        msg: "Unauthorized",
      });
    }

    const user = await User.findById(userId)
      .select("-password")
      .populate("enrolledCourses.courseId");

    if (!user) {
      return res.status(404).json({
        status: false,
        msg: "User not found",
      });
    }

    return res.json({
      status: true,
      msg: "Auto login success",
      data: user,
    });
  } catch (err) {
    console.error("AutoLogin error:", err);
    return res.status(500).json({
      status: false,
      msg: "Auto login failed",
    });
  }
};

// ---------------- Profile ----------------
exports.updateDetails = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ status: false, msg: "Unauthorized" });
    }

    const allowed = [
      "name",
      "email",
      "phoneNumber",
      "city",
      "state",
      "profilePic",
    ];

    const updates = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    }

    // Get current user to check login method
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ status: false, msg: "User not found" });
    }

    // Handle email conflict - merge accounts if user logged in via phone
    if (updates.email) {
      const existingEmailUser = await User.findOne({
        email: updates.email,
        _id: { $ne: userId },
      });
      
      if (existingEmailUser) {
        // If current user logged in via phone and email account exists, merge them
        if (currentUser.isPhoneVerified && currentUser.phoneNumber) {
          console.log(`[Account Merge] Merging phone account ${userId} into email account ${existingEmailUser._id}`);
          
          // Update existing email account with phone details
          existingEmailUser.phoneNumber = currentUser.phoneNumber;
          existingEmailUser.isPhoneVerified = true;
          
          // Copy any missing fields from phone account to email account
          if (!existingEmailUser.city && currentUser.city) existingEmailUser.city = currentUser.city;
          if (!existingEmailUser.state && currentUser.state) existingEmailUser.state = currentUser.state;
          if (!existingEmailUser.name && currentUser.name) existingEmailUser.name = currentUser.name;
          if (!existingEmailUser.gender && currentUser.gender) existingEmailUser.gender = currentUser.gender;
          if (!existingEmailUser.dob && currentUser.dob) existingEmailUser.dob = currentUser.dob;
          if (!existingEmailUser.targetYear && currentUser.targetYear) existingEmailUser.targetYear = currentUser.targetYear;
          if (!existingEmailUser.selectedExam && currentUser.selectedExam) existingEmailUser.selectedExam = currentUser.selectedExam;
          
          existingEmailUser.isOnboardingComplete = true;
          await existingEmailUser.save();
          
          // Delete the temporary phone-only account
          await User.findByIdAndDelete(userId);
          
          // Generate new token for merged account
          const newToken = signToken(existingEmailUser);
          
          return res.json({
            status: true,
            msg: "Accounts merged successfully",
            merged: true,
            token: newToken,
            data: existingEmailUser,
            redirectTo: "/student/dashboard"
          });
        }
        
        return res.status(409).json({
          status: false,
          msg: "Email already in use",
        });
      }
    }

    if (updates.phoneNumber) {
      const exists = await User.findOne({
        phoneNumber: updates.phoneNumber,
        _id: { $ne: userId },
      });
      if (exists) {
        return res.status(409).json({
          status: false,
          msg: "Phone already in use",
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true }
    ).select("-password");

    return res.json({
      status: true,
      msg: "Profile updated",
      data: user,
    });
  } catch (err) {
    console.error("updateDetails error:", err);
    return res.status(500).json({
      status: false,
      msg: "Update failed",
    });
  }
};

exports.uploadProfilePic = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ status: false, msg: "Unauthorized" });
    }

    if (!req.file) {
      return res.status(400).json({
        status: false,
        msg: "No file uploaded",
      });
    }

    // Store as URL path that can be used directly in frontend
    const filename = req.file.filename;
    const profilePicUrl = `/uploads/${filename}`;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { profilePic: profilePicUrl } },
      { new: true }
    ).select("-password");

    return res.json({
      status: true,
      msg: "Profile pic updated",
      data: user,
      profilePic: profilePicUrl,
    });
  } catch (err) {
    console.error("uploadProfilePic error:", err);
    return res.status(500).json({
      status: false,
      msg: "Upload failed",
    });
  }
};

// ---------------- Dashboard selections ----------------
exports.saveCategory = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { category } = req.body;

    if (!userId) {
      return res.status(401).json({ status: false, msg: "Unauthorized" });
    }

    if (!category) {
      return res.status(400).json({ status: false, msg: "Category required" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { selectedCategory: category } },
      { new: true }
    ).select("-password");

    return res.json({
      status: true,
      msg: "Category saved",
      data: user,
    });
  } catch (err) {
    console.error("saveCategory error:", err);
    return res.status(500).json({ status: false, msg: "Save failed" });
  }
};

exports.saveExam = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { exam } = req.body;

    if (!userId) {
      return res.status(401).json({ status: false, msg: "Unauthorized" });
    }

    if (!exam) {
      return res.status(400).json({ status: false, msg: "Exam required" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { selectedExam: exam } },
      { new: true }
    ).select("-password");

    return res.json({
      status: true,
      msg: "Exam saved",
      data: user,
    });
  } catch (err) {
    console.error("saveExam error:", err);
    return res.status(500).json({ status: false, msg: "Save failed" });
  }
};

// ---------------- Courses ----------------
exports.enrollInCourse = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { courseId } = req.params;

    if (!userId) {
      return res.status(401).json({ status: false, msg: "Unauthorized" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ status: false, msg: "Course not found" });
    }

    const user = await User.findById(userId);
    user.enrolledCourses = user.enrolledCourses || [];

    const existing = user.enrolledCourses.find(
      (c) => String(c.courseId) === String(courseId)
    );

    if (!existing) {
      user.enrolledCourses.push({
        courseId,
        status: "locked",
        enrolledAt: new Date(),
      });
    }

    await user.save();

    return res.json({
      status: true,
      msg: "Enrolled (locked). Complete payment to unlock.",
      data: user.enrolledCourses,
    });
  } catch (err) {
    console.error("enrollInCourse error:", err);
    return res.status(500).json({ status: false, msg: "Enroll failed" });
  }
};

exports.unlockCourseForStudent = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { courseId } = req.params;
    const { amount, paymentMethod = 'manual', notes = '' } = req.body || {};

    if (!userId) {
      return res.status(401).json({ status: false, msg: "Unauthorized" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ status: false, msg: "User not found" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ status: false, msg: "Course not found" });
    }

    const existingPayment = await Payment.findOne({
      userId,
      courseId,
      status: 'paid',
    });

    if (existingPayment) {
      user.enrolledCourses = user.enrolledCourses || [];
      const existingEnrollment = user.enrolledCourses.find(
        (c) => String(c.courseId) === String(courseId)
      );
      if (existingEnrollment && existingEnrollment.status !== 'unlocked') {
        existingEnrollment.status = 'unlocked';
        await user.save();
      }
      const existingReceipt = await Receipt.findOne({ paymentId: existingPayment._id });
      return res.json({
        status: true,
        msg: "Course already unlocked",
        data: user.enrolledCourses,
        paymentId: existingPayment._id,
        receiptNumber: existingReceipt?.receiptNumber || existingPayment.receiptNumber || null,
      });
    }

    user.enrolledCourses = user.enrolledCourses || [];

    const existing = user.enrolledCourses.find(
      (c) => String(c.courseId) === String(courseId)
    );

    if (!existing) {
      user.enrolledCourses.push({
        courseId,
        status: "unlocked",
        enrolledAt: new Date(),
      });
    } else {
      existing.status = "unlocked";
    }

    await user.save();

    const finalAmountRupees = amount !== undefined ? Number(amount) : (course.price || 0);
    const amountInPaise = Math.round(finalAmountRupees * 100);

    const BillingSettings = require('../models/BillingSettings');
    let billingSettings = await BillingSettings.findOne({ isActive: true }).lean();

    let companyDetails = {
      name: 'Tathagat Education',
      address: '',
      phone: '',
      email: '',
      gstin: '',
    };

    if (billingSettings) {
      const addressParts = [
        billingSettings.address?.street,
        billingSettings.address?.city,
        billingSettings.address?.state,
        billingSettings.address?.pincode,
        billingSettings.address?.country
      ].filter(Boolean);

      companyDetails = {
        name: billingSettings.companyName || 'Tathagat Education',
        address: addressParts.join(', '),
        phone: billingSettings.phone || '',
        email: billingSettings.email || '',
        gstin: billingSettings.gstNumber || '',
      };
    }

    const payment = await Payment.create({
      userId,
      courseId,
      razorpay_order_id: `manual_unlock_${userId}_${courseId}_${Date.now()}`,
      razorpay_payment_id: null,
      amount: amountInPaise,
      originalAmount: amountInPaise,
      currency: "INR",
      status: "paid",
      paymentMethod: paymentMethod || 'manual',
      notes: notes || 'Course unlocked manually',
      validityStartDate: new Date(),
    });

    const receiptNumber = Receipt.generateReceiptNumber();
    await Receipt.create({
      paymentId: payment._id,
      userId,
      courseId,
      receiptNumber,
      amount: amountInPaise,
      totalAmount: amountInPaise,
      taxAmount: 0,
      currency: "INR",
      customerDetails: {
        name: user.name || 'Student',
        email: user.email || 'no-email@example.com',
        phone: user.phoneNumber || '',
      },
      courseDetails: {
        name: course.name || 'Course',
        description: course.description || '',
        price: amountInPaise,
      },
      companyDetails,
      receiptType: 'course_purchase',
      status: 'generated',
      generatedAt: new Date(),
    });

    return res.json({
      status: true,
      msg: "Course unlocked",
      data: user.enrolledCourses,
      paymentId: payment._id,
      receiptNumber,
    });
  } catch (err) {
    console.error("unlockCourseForStudent error:", err);
    return res.status(500).json({ status: false, msg: "Unlock failed" });
  }
};

exports.getUnlockedCourses = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ status: false, msg: "Unauthorized" });
    }

    const user = await User.findById(userId)
      .populate("enrolledCourses.courseId")
      .select("-password");

    if (!user) {
      return res.status(404).json({ status: false, msg: "User not found" });
    }

    const enrolled = user.enrolledCourses || [];
    const unlocked = enrolled.filter((c) => c.status === "unlocked");

    return res.json({
      status: true,
      msg: "My courses fetched",
      enrolledCourses: enrolled,
      unlockedCourses: unlocked,
    });
  } catch (err) {
    console.error("getUnlockedCourses error:", err);
    return res.status(500).json({ status: false, msg: "Fetch failed" });
  }
};

// ---------------- Payments ----------------
exports.createOrder = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { courseId } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, status: false, msg: "Unauthorized", message: "Unauthorized" });
    }
    if (!courseId) {
      return res.status(400).json({ success: false, status: false, msg: "courseId required", message: "courseId required" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, status: false, msg: "Course not found", message: "Course not found" });
    }

    const amount = Number(course.price || 0);
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        status: false,
        msg: "Invalid course price",
        message: "Invalid course price",
      });
    }

    const razorpay = getRazorpay();

    const options = {
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `rcpt_${userId}_${courseId}_${Date.now()}`,
      notes: { userId: String(userId), courseId: String(courseId) },
    };

    const order = await razorpay.orders.create(options);

    // Save a "created" payment entry
    try {
      await Payment.create({
        userId,
        courseId,
        razorpay_order_id: order.id,
        amount,
        currency: "INR",
        status: "created",
        originalAmount: amount,
      });
    } catch (e) {
      // If schema differs, don't break order creation
      console.warn("Payment create warning:", e?.message);
    }

    return res.json({
      success: true,
      status: true,
      msg: "Order created",
      message: "Order created",
      order,
      key: process.env.RAZORPAY_KEY_ID,
      keyId: process.env.RAZORPAY_KEY_ID,
      amount,
      courseId,
    });
  } catch (err) {
    console.error("createOrder error:", err);
    return res.status(500).json({
      success: false,
      status: false,
      msg: err.message || "Order creation failed",
      message: err.message || "Order creation failed",
    });
  }
};

exports.verifyAndUnlockPayment = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, status: false, msg: "Unauthorized", message: "Unauthorized" });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      courseId,
      // optional dev friendly payload:
      devMode,
    } = req.body;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        status: false,
        msg: "courseId required",
        message: "courseId required",
      });
    }

    // Dev bypass ONLY if you explicitly pass devMode=true
    if (devMode === true && process.env.NODE_ENV !== "production") {
      console.log("🔧 Dev bypass enabled by request");
    } else {
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({
          success: false,
          status: false,
          msg: "Payment verification fields are required",
          message: "Payment verification fields are required",
        });
      }

      const secret = process.env.RAZORPAY_KEY_SECRET;
      if (!secret) {
        return res.status(500).json({
          success: false,
          status: false,
          msg: "Razorpay secret missing",
          message: "Razorpay secret missing",
        });
      }

      const generated = crypto
        .createHmac("sha256", secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (generated !== razorpay_signature) {
        return res.status(400).json({
          success: false,
          status: false,
          msg: "Invalid payment signature",
          message: "Invalid payment signature",
        });
      }
    }

    // Mark payment paid (best-effort)
    try {
      const payment =
        (razorpay_order_id &&
          (await Payment.findOne({ razorpay_order_id }))) ||
        null;

      if (payment) {
        payment.status = "paid";
        payment.razorpay_payment_id = razorpay_payment_id;
        payment.razorpay_signature = razorpay_signature;
        await payment.save();
      } else {
        await Payment.create({
          userId,
          courseId,
          razorpay_order_id: razorpay_order_id || `dev_${Date.now()}`,
          razorpay_payment_id: razorpay_payment_id || `dev_pay_${Date.now()}`,
          razorpay_signature: razorpay_signature || "dev_signature",
          amount: 0,
          currency: "INR",
          status: "paid",
        });
      }
    } catch (e) {
      console.warn("Payment update warning:", e?.message);
    }

    // Unlock course in user doc
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, status: false, msg: "User not found", message: "User not found" });
    }

    user.enrolledCourses = user.enrolledCourses || [];
    const existing = user.enrolledCourses.find(
      (c) => String(c.courseId) === String(courseId)
    );

    if (!existing) {
      user.enrolledCourses.push({
        courseId,
        status: "unlocked",
        enrolledAt: new Date(),
      });
    } else {
      existing.status = "unlocked";
    }

    await user.save();

    // Create receipt (best-effort)
    try {
      await Receipt.create({
        userId,
        courseId,
        razorpay_order_id: razorpay_order_id || null,
        razorpay_payment_id: razorpay_payment_id || null,
        amount: 0,
        status: "paid",
        createdAt: new Date(),
      });
    } catch (e) {
      console.warn("Receipt create warning:", e?.message);
    }

    return res.json({
      success: true,
      status: true,
      msg: "Payment verified & course unlocked",
      message: "Payment verified & course unlocked",
      enrolledCourses: user.enrolledCourses,
    });
  } catch (err) {
    console.error("verifyAndUnlockPayment error:", err);
    return res.status(500).json({
      success: false,
      status: false,
      msg: "Payment verification failed",
      message: "Payment verification failed",
    });
  }
};

exports.getPaymentHistory = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ status: false, msg: "Unauthorized" });
    }

    const payments = await Payment.find({ userId }).sort({ createdAt: -1 });

    return res.json({
      status: true,
      msg: "Payment history",
      data: payments,
    });
  } catch (err) {
    console.error("getPaymentHistory error:", err);
    return res.status(500).json({ status: false, msg: "Fetch failed" });
  }
};

exports.getReceipts = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ status: false, msg: "Unauthorized" });
    }

    const receipts = await Receipt.find({ userId }).sort({ createdAt: -1 });

    return res.json({
      status: true,
      msg: "Receipts fetched",
      data: receipts,
    });
  } catch (err) {
    console.error("getReceipts error:", err);
    return res.status(500).json({ status: false, msg: "Fetch failed" });
  }
};

exports.downloadReceipt = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { receiptId } = req.params;
    const format = req.query.format || 'json';

    if (!userId) {
      return res.status(401).json({ status: false, msg: "Unauthorized" });
    }

    const receipt = await Receipt.findOne({ _id: receiptId, userId });
    if (!receipt) {
      return res.status(404).json({ status: false, msg: "Receipt not found" });
    }

    if (format === 'html') {
      const { generateReceiptHTML } = require('../utils/receiptGenerator');
      const BillingSettings = require('../models/BillingSettings');
      
      let billingSettings = await BillingSettings.findOne({ isActive: true }).lean();
      
      let receiptData = receipt.getReceiptData();
      
      if (billingSettings) {
        const addressParts = [
          billingSettings.address?.street,
          billingSettings.address?.city,
          billingSettings.address?.state,
          billingSettings.address?.pincode,
          billingSettings.address?.country
        ].filter(Boolean);
        
        receiptData.company = {
          name: billingSettings.companyName || receiptData.company?.name || 'Tathagat Education',
          address: addressParts.join(', ') || receiptData.company?.address || '',
          phone: billingSettings.phone || receiptData.company?.phone || '',
          email: billingSettings.email || receiptData.company?.email || '',
          gstin: billingSettings.gstNumber || receiptData.company?.gstin || ''
        };
      }
      
      const html = generateReceiptHTML(receiptData);
      
      await receipt.markAsDownloaded();
      
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `inline; filename="receipt-${receipt.receiptNumber}.html"`);
      return res.send(html);
    }

    if (format === 'text') {
      const { generateReceiptText } = require('../utils/receiptGenerator');
      const receiptData = receipt.getReceiptData();
      const text = generateReceiptText(receiptData);
      
      await receipt.markAsDownloaded();
      
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="receipt-${receipt.receiptNumber}.txt"`);
      return res.send(text);
    }

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=receipt_${receiptId}.json`
    );
    return res.send(JSON.stringify(receipt, null, 2));
  } catch (err) {
    console.error("downloadReceipt error:", err);
    return res.status(500).json({ status: false, msg: "Download failed" });
  }
};
