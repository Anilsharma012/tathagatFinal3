const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const TopPerformerController = require('../controllers/TopPerformerController');
const { authMiddleware, adminAuth } = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/top-performers'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
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

router.get('/public', TopPerformerController.getPublic);

router.get('/admin', authMiddleware, TopPerformerController.getAll);
router.get('/admin/:id', authMiddleware, TopPerformerController.getById);
router.post('/admin', authMiddleware, upload.single('photo'), TopPerformerController.create);
router.put('/admin/:id', authMiddleware, upload.single('photo'), TopPerformerController.update);
router.delete('/admin/:id', authMiddleware, TopPerformerController.delete);
router.patch('/admin/:id/toggle', authMiddleware, TopPerformerController.toggleStatus);
router.post('/admin/reorder', authMiddleware, TopPerformerController.reorder);

module.exports = router;
