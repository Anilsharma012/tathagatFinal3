const StudyMaterial = require('../models/StudyMaterial');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Base directory for uploads (absolute path)
const UPLOADS_BASE_DIR = path.join(__dirname, '..', 'uploads', 'study-materials');

// Helper function to resolve file path (handles both relative and absolute paths)
const resolveFilePath = (filePath) => {
  if (!filePath) return null;
  
  // If path is absolute and exists, use it
  if (path.isAbsolute(filePath) && fs.existsSync(filePath)) {
    return filePath;
  }
  
  // Try relative to backend1 directory
  const backendPath = path.join(__dirname, '..', filePath);
  if (fs.existsSync(backendPath)) {
    return backendPath;
  }
  
  // Try just the filename in uploads/study-materials
  const fileName = path.basename(filePath);
  const uploadsPath = path.join(UPLOADS_BASE_DIR, fileName);
  if (fs.existsSync(uploadsPath)) {
    return uploadsPath;
  }
  
  // Return the backend-relative path as fallback
  return backendPath;
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!fs.existsSync(UPLOADS_BASE_DIR)) {
      fs.mkdirSync(UPLOADS_BASE_DIR, { recursive: true });
    }
    cb(null, UPLOADS_BASE_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  // Allow PDF, Word docs, images, and video files
  const allowedTypes = /pdf|doc|docx|jpg|jpeg|png|mp4|avi|mov|wmv/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only PDF, Word documents, images, and video files are allowed!'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: fileFilter
});

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (!bytes) return '0 MB';
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

// Helper function to determine file type from extension
const getFileType = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  if (['.pdf'].includes(ext)) return 'PDF';
  if (['.doc', '.docx'].includes(ext)) return 'Notes';
  if (['.mp4', '.avi', '.mov', '.wmv'].includes(ext)) return 'Video';
  if (['.jpg', '.jpeg', '.png'].includes(ext)) return 'Other';
  return 'Other';
};

// Upload study material
const uploadStudyMaterial = async (req, res) => {
  try {
    console.log('📚 Upload study material request:', req.body);
    
    const { title, description, subject, category, tags, courseId } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Get file stats for size
    const stats = fs.statSync(req.file.path);
    const fileSize = formatFileSize(stats.size);
    const fileType = req.body.type || getFileType(req.file.originalname);

    const studyMaterial = new StudyMaterial({
      title,
      description,
      subject,
      category: category || 'Study Materials',
      type: fileType,
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileSize,
      uploadedBy: req.user.id, // From auth middleware
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      courseId: courseId || null
    });

    await studyMaterial.save();

    console.log('✅ Study material uploaded successfully:', studyMaterial._id);
    
    res.status(201).json({
      success: true,
      message: 'Study material uploaded successfully',
      data: studyMaterial
    });

  } catch (error) {
    console.error('❌ Error uploading study material:', error);
    
    // Delete uploaded file if database save fails
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Error uploading study material',
      error: error.message
    });
  }
};

// Get all study materials (for admin)
const getAllStudyMaterials = async (req, res) => {
  try {
    console.log('📚 Get all study materials request');
    
    const { page = 1, limit = 20, subject, type, category, search } = req.query;
    
    let query = {};
    
    if (subject && subject !== 'All Subjects') {
      query.subject = subject;
    }
    
    if (type && type !== 'All Types') {
      query.type = type;
    }
    
    if (category && category !== 'All Categories') {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const materials = await StudyMaterial.find(query)
      .populate('uploadedBy', 'name email')
      .populate('courseId', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await StudyMaterial.countDocuments(query);

    console.log(`✅ Found ${materials.length} study materials`);
    
    res.status(200).json({
      success: true,
      data: materials,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('❌ Error fetching study materials:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching study materials',
      error: error.message
    });
  }
};

// Get study materials for students (only active)
const getStudentStudyMaterials = async (req, res) => {
  try {
    console.log('👨‍🎓 Get student study materials request');
    
    const { subject, type, category, search, page = 1, limit = 20 } = req.query;
    
    let query = { isActive: true };
    
    if (subject && subject !== 'All Subjects') {
      query.subject = subject;
    }
    
    if (type && type !== 'All Types') {
      query.type = type;
    }
    
    if (category && category !== 'All Category') {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const materials = await StudyMaterial.find(query)
      .populate('uploadedBy', 'name')
      .select('-filePath') // Don't expose file path to students
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await StudyMaterial.countDocuments(query);

    console.log(`✅ Found ${materials.length} study materials for students`);
    
    res.status(200).json({
      success: true,
      data: materials,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('❌ Error fetching student study materials:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching study materials',
      error: error.message
    });
  }
};

// View study material (inline display, not download)
const viewStudyMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('👁️ View study material request for ID:', id);

    const material = await StudyMaterial.findById(id);

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Study material not found'
      });
    }

    if (!material.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This study material is no longer available'
      });
    }

    // Resolve and check if file exists
    const resolvedPath = resolveFilePath(material.filePath);
    console.log('📁 Resolved file path:', resolvedPath, 'from:', material.filePath);
    
    if (!resolvedPath || !fs.existsSync(resolvedPath)) {
      console.log('❌ File not found at path:', resolvedPath);
      return res.status(404).json({
        success: false,
        message: 'File not found on server. The study material file may not have been uploaded yet.'
      });
    }

    // Increment download count for view tracking
    await material.incrementDownload();

    console.log('✅ Serving file for inline viewing:', material.fileName);

    // Determine content type based on file extension
    const ext = path.extname(material.fileName).toLowerCase();
    let contentType = 'application/octet-stream';
    
    if (ext === '.pdf') {
      contentType = 'application/pdf';
    } else if (ext === '.mp4') {
      contentType = 'video/mp4';
    } else if (ext === '.mov') {
      contentType = 'video/quicktime';
    } else if (ext === '.avi') {
      contentType = 'video/x-msvideo';
    } else if (ext === '.wmv') {
      contentType = 'video/x-ms-wmv';
    }

    // Set headers for inline display (not download)
    res.setHeader('Content-Disposition', `inline; filename="${material.fileName}"`);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    // For video files, support range requests for seeking
    if (contentType.startsWith('video/')) {
      const stat = fs.statSync(resolvedPath);
      const fileSize = stat.size;
      const range = req.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(resolvedPath, { start, end });
        
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': contentType,
        });
        file.pipe(res);
        return;
      } else {
        res.setHeader('Content-Length', fileSize);
        res.setHeader('Accept-Ranges', 'bytes');
      }
    }

    // Stream the file
    const fileStream = fs.createReadStream(resolvedPath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('❌ Error viewing study material:', error);
    res.status(500).json({
      success: false,
      message: 'Error viewing study material',
      error: error.message
    });
  }
};

// Download study material
const downloadStudyMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📥 Download study material request for ID:', id);

    const material = await StudyMaterial.findById(id);

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Study material not found'
      });
    }

    if (!material.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This study material is no longer available'
      });
    }

    // Resolve and check if file exists
    const resolvedPath = resolveFilePath(material.filePath);
    console.log('📁 Resolved file path:', resolvedPath, 'from:', material.filePath);
    
    if (!resolvedPath || !fs.existsSync(resolvedPath)) {
      console.log('❌ File not found at path:', resolvedPath);
      return res.status(404).json({
        success: false,
        message: 'File not found on server. The study material file may not have been uploaded yet.'
      });
    }

    // Increment download count
    await material.incrementDownload();

    console.log('✅ Serving file for download:', material.fileName);

    // Set headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${material.fileName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    // Stream the file
    const fileStream = fs.createReadStream(resolvedPath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('❌ Error downloading study material:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading study material',
      error: error.message
    });
  }
};

// Update study material
const updateStudyMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, subject, category, type, tags, isActive } = req.body;
    
    console.log('📝 Update study material request for ID:', id);
    
    const material = await StudyMaterial.findById(id);
    
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Study material not found'
      });
    }

    // Update fields
    if (title) material.title = title;
    if (description) material.description = description;
    if (subject) material.subject = subject;
    if (category) material.category = category;
    if (type) material.type = type;
    if (tags) material.tags = tags.split(',').map(tag => tag.trim());
    if (typeof isActive !== 'undefined') material.isActive = isActive;

    await material.save();

    console.log('✅ Study material updated successfully');
    
    res.status(200).json({
      success: true,
      message: 'Study material updated successfully',
      data: material
    });

  } catch (error) {
    console.error('❌ Error updating study material:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating study material',
      error: error.message
    });
  }
};

// Delete study material
const deleteStudyMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Delete study material request for ID:', id);
    
    const material = await StudyMaterial.findById(id);
    
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Study material not found'
      });
    }

    // Delete file from filesystem using resolved path
    const resolvedPath = resolveFilePath(material.filePath);
    if (resolvedPath && fs.existsSync(resolvedPath)) {
      fs.unlinkSync(resolvedPath);
    }

    // Delete from database
    await StudyMaterial.findByIdAndDelete(id);

    console.log('✅ Study material deleted successfully');
    
    res.status(200).json({
      success: true,
      message: 'Study material deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting study material:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting study material',
      error: error.message
    });
  }
};

// Get study material by ID
const getStudyMaterialById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📚 Get study material by ID:', id);
    
    const material = await StudyMaterial.findById(id)
      .populate('uploadedBy', 'name email')
      .populate('courseId', 'name');
    
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Study material not found'
      });
    }

    console.log('✅ Study material found');
    
    res.status(200).json({
      success: true,
      data: material
    });

  } catch (error) {
    console.error('❌ Error fetching study material:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching study material',
      error: error.message
    });
  }
};

module.exports = {
  upload,
  uploadStudyMaterial,
  getAllStudyMaterials,
  getStudentStudyMaterials,
  downloadStudyMaterial,
  viewStudyMaterial,
  updateStudyMaterial,
  deleteStudyMaterial,
  getStudyMaterialById
};
