const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const studentDashboardController = require("../controllers/StudentDashboardController");
const { authMiddleware } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// -------- Auth --------
router.post("/signup", userController.signup);
router.post("/login", userController.login);
router.get("/verify-token", userController.verifyToken);
router.get("/auto-login", authMiddleware, userController.autoLogin);

// -------- Profile --------
router.post(
  "/upload-profile",
  authMiddleware,
  upload.single("profilePic"),
  userController.uploadProfilePic
);

router.post("/update-details", authMiddleware, userController.updateDetails);

// -------- Dashboard selections --------
router.post("/save-category", authMiddleware, userController.saveCategory);
router.post("/save-exam", authMiddleware, userController.saveExam);

// -------- Courses --------
router.post(
  "/student/enroll/:courseId",
  authMiddleware,
  userController.enrollInCourse
);

router.get(
  "/student/my-courses",
  authMiddleware,
  userController.getUnlockedCourses
);

// Self-unlock route (if you want to keep it)
router.put(
  "/student/unlock/:courseId",
  authMiddleware,
  userController.unlockCourseForStudent
);

// -------- Payments --------
router.post("/payment/create-order", authMiddleware, userController.createOrder);
router.post(
  "/payment/verify-and-unlock",
  authMiddleware,
  userController.verifyAndUnlockPayment
);

router.get(
  "/payment/history",
  authMiddleware,
  userController.getPaymentHistory
);

// -------- Receipts --------
router.get("/receipts", authMiddleware, userController.getReceipts);
router.get(
  "/receipts/download/:receiptId",
  authMiddleware,
  userController.downloadReceipt
);
// Alternative route for frontend compatibility
router.get(
  "/receipt/:receiptId/download",
  authMiddleware,
  userController.downloadReceipt
);

// -------- Student Dashboard --------
router.get(
  "/student/dashboard/metrics",
  authMiddleware,
  studentDashboardController.getDashboardMetrics
);

router.get(
  "/student/dashboard/course-progress",
  authMiddleware,
  studentDashboardController.getCourseProgress
);

router.get(
  "/student/dashboard/upcoming-classes",
  authMiddleware,
  studentDashboardController.getUpcomingClasses
);

module.exports = router;
