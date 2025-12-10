const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/permissionMiddleware');

const {
  createCategory,
  getCategories,
  getAllCategories,
  updateCategory,
  deleteCategory,
  reorderCategories,
  createTest,
  getTests,
  getAllTests,
  getTestById,
  updateTest,
  deleteTest,
  toggleTestStatus,
  reorderTests,
  uploadPdf,
  getPublicCategories,
  getPublicTests
} = require('../controllers/DownloadController');

const uploadsDir = path.join(__dirname, '..', 'uploads', 'downloads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }
});

router.get('/public/categories', getPublicCategories);
router.get('/public/tests', getPublicTests);

router.get('/admin/categories', authMiddleware, getAllCategories);
router.post('/admin/categories', authMiddleware, createCategory);
router.put('/admin/categories/:id', authMiddleware, updateCategory);
router.delete('/admin/categories/:id', authMiddleware, deleteCategory);
router.patch('/admin/categories/reorder', authMiddleware, reorderCategories);

router.get('/admin/tests', authMiddleware, getAllTests);
router.post('/admin/tests', authMiddleware, createTest);
router.get('/admin/tests/:id', authMiddleware, getTestById);
router.put('/admin/tests/:id', authMiddleware, updateTest);
router.delete('/admin/tests/:id', authMiddleware, deleteTest);
router.patch('/admin/tests/:id/status', authMiddleware, toggleTestStatus);
router.patch('/admin/tests/reorder', authMiddleware, reorderTests);
router.post('/admin/tests/:id/upload-pdf', authMiddleware, upload.single('pdf'), uploadPdf);

module.exports = router;
