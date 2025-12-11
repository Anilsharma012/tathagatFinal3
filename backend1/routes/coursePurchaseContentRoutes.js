const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const CoursePurchaseContentController = require('../controllers/CoursePurchaseContentController');
const { authMiddleware } = require('../middleware/authMiddleware');

const uploadDir = path.join(__dirname, '../uploads/instructors');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'instructor-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.get('/public/:courseId', CoursePurchaseContentController.getPublicByCourseId);

router.get('/admin/courses', authMiddleware, CoursePurchaseContentController.getAllCourses);
router.get('/admin', authMiddleware, CoursePurchaseContentController.getAll);
router.get('/admin/course/:courseId', authMiddleware, CoursePurchaseContentController.getByCourseId);
router.get('/admin/check/:courseId', authMiddleware, CoursePurchaseContentController.checkExists);

router.post('/admin', authMiddleware, upload.any(), CoursePurchaseContentController.create);
router.put('/admin/course/:courseId', authMiddleware, upload.any(), CoursePurchaseContentController.update);
router.delete('/admin/course/:courseId', authMiddleware, CoursePurchaseContentController.delete);
router.patch('/admin/course/:courseId/toggle', authMiddleware, CoursePurchaseContentController.toggleStatus);

module.exports = router;
