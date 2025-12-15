const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const GalleryController = require('../controllers/GalleryController');
const { adminAuth } = require('../middleware/authMiddleware');

const uploadDir = path.join(__dirname, '../uploads/gallery');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'gallery-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.get('/public', GalleryController.getPublicItems);
router.get('/public/featured', GalleryController.getFeaturedVideo);

router.get('/admin', adminAuth, GalleryController.getAllItems);
router.get('/admin/:id', adminAuth, GalleryController.getItemById);
router.post('/admin', adminAuth, upload.single('image'), GalleryController.createItem);
router.put('/admin/:id', adminAuth, upload.single('image'), GalleryController.updateItem);
router.delete('/admin/:id', adminAuth, GalleryController.deleteItem);
router.post('/admin/reorder', adminAuth, GalleryController.reorderItems);

module.exports = router;
