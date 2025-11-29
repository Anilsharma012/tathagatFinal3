const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const PopupAnnouncement = require('../models/PopupAnnouncement');
const { adminAuth } = require('../middleware/authMiddleware');

const uploadDir = path.join(__dirname, '../uploads/popups');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

router.get('/active', async (req, res) => {
  try {
    const popup = await PopupAnnouncement.getActivePopup();
    res.json({ success: true, data: popup });
  } catch (error) {
    console.error('Error fetching active popup:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/', adminAuth, async (req, res) => {
  try {
    const popups = await PopupAnnouncement.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email');
    res.json({ success: true, data: popups });
  } catch (error) {
    console.error('Error fetching popups:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', adminAuth, async (req, res) => {
  try {
    const popup = await PopupAnnouncement.findById(req.params.id);
    if (!popup) {
      return res.status(404).json({ success: false, message: 'Popup not found' });
    }
    res.json({ success: true, data: popup });
  } catch (error) {
    console.error('Error fetching popup:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const { title, text, link, linkText, isActive, startDate, endDate } = req.body;
    
    const popupData = {
      title,
      text: text || '',
      link: link || '',
      linkText: linkText || 'Learn More',
      isActive: isActive === 'true' || isActive === true,
      startDate: startDate || new Date(),
      endDate: endDate || null,
      createdBy: req.user?._id || req.user?.id
    };

    if (req.file) {
      popupData.image = req.file.filename;
    }

    const popup = new PopupAnnouncement(popupData);
    await popup.save();

    res.status(201).json({ success: true, data: popup, message: 'Popup announcement created successfully' });
  } catch (error) {
    console.error('Error creating popup:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const { title, text, link, linkText, isActive, startDate, endDate } = req.body;
    
    const popup = await PopupAnnouncement.findById(req.params.id);
    if (!popup) {
      return res.status(404).json({ success: false, message: 'Popup not found' });
    }

    if (title) popup.title = title;
    if (text !== undefined) popup.text = text;
    if (link !== undefined) popup.link = link;
    if (linkText !== undefined) popup.linkText = linkText;
    if (isActive !== undefined) popup.isActive = isActive === 'true' || isActive === true;
    if (startDate) popup.startDate = startDate;
    if (endDate !== undefined) popup.endDate = endDate || null;

    if (req.file) {
      if (popup.image) {
        const oldImagePath = path.join(uploadDir, popup.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      popup.image = req.file.filename;
    }

    await popup.save();
    res.json({ success: true, data: popup, message: 'Popup announcement updated successfully' });
  } catch (error) {
    console.error('Error updating popup:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const popup = await PopupAnnouncement.findById(req.params.id);
    if (!popup) {
      return res.status(404).json({ success: false, message: 'Popup not found' });
    }

    if (popup.image) {
      const imagePath = path.join(uploadDir, popup.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await PopupAnnouncement.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Popup announcement deleted successfully' });
  } catch (error) {
    console.error('Error deleting popup:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/:id/toggle', adminAuth, async (req, res) => {
  try {
    const popup = await PopupAnnouncement.findById(req.params.id);
    if (!popup) {
      return res.status(404).json({ success: false, message: 'Popup not found' });
    }

    popup.isActive = !popup.isActive;
    await popup.save();

    res.json({ 
      success: true, 
      data: popup, 
      message: `Popup ${popup.isActive ? 'activated' : 'deactivated'} successfully` 
    });
  } catch (error) {
    console.error('Error toggling popup:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
