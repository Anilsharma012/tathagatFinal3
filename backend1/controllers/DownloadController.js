const DownloadCategory = require('../models/DownloadCategory');
const DownloadTest = require('../models/DownloadTest');
const path = require('path');
const fs = require('fs');

const generateSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

exports.createCategory = async (req, res) => {
  try {
    const { name, type, description, displayOrder } = req.body;
    
    if (!name || !type) {
      return res.status(400).json({ success: false, message: 'Name and type are required' });
    }
    
    const slug = generateSlug(name);
    
    const existing = await DownloadCategory.findOne({ type, slug });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Category with this name already exists for this type' });
    }
    
    const category = new DownloadCategory({
      name,
      slug,
      type,
      description: description || '',
      displayOrder: displayOrder || 0,
      createdBy: req.user?.userId
    });
    
    await category.save();
    res.json({ success: true, category });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const { type } = req.query;
    const filter = { isActive: true };
    if (type) filter.type = type;
    
    const categories = await DownloadCategory.find(filter)
      .sort({ displayOrder: 1, name: 1 });
    
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllCategories = async (req, res) => {
  try {
    const { type } = req.query;
    const filter = {};
    if (type) filter.type = type;
    
    const categories = await DownloadCategory.find(filter)
      .sort({ type: 1, displayOrder: 1, name: 1 });
    
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, displayOrder, isActive } = req.body;
    
    const category = await DownloadCategory.findById(id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    
    if (name && name !== category.name) {
      const slug = generateSlug(name);
      const existing = await DownloadCategory.findOne({ 
        type: category.type, 
        slug, 
        _id: { $ne: id } 
      });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Category with this name already exists' });
      }
      category.name = name;
      category.slug = slug;
    }
    
    if (description !== undefined) category.description = description;
    if (displayOrder !== undefined) category.displayOrder = displayOrder;
    if (isActive !== undefined) category.isActive = isActive;
    
    await category.save();
    res.json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { force } = req.query;
    
    const testsCount = await DownloadTest.countDocuments({ categoryId: id, isActive: true });
    if (testsCount > 0 && force !== 'true') {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete category with ${testsCount} active tests. Use force=true to delete anyway.` 
      });
    }
    
    if (force === 'true') {
      await DownloadTest.updateMany({ categoryId: id }, { isActive: false });
    }
    
    await DownloadCategory.findByIdAndUpdate(id, { isActive: false });
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.reorderCategories = async (req, res) => {
  try {
    const { orders } = req.body;
    
    if (!Array.isArray(orders)) {
      return res.status(400).json({ success: false, message: 'Orders must be an array' });
    }
    
    const bulkOps = orders.map((item, index) => ({
      updateOne: {
        filter: { _id: item.id },
        update: { displayOrder: item.order !== undefined ? item.order : index }
      }
    }));
    
    await DownloadCategory.bulkWrite(bulkOps);
    res.json({ success: true, message: 'Categories reordered' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createTest = async (req, res) => {
  try {
    const { 
      title, categoryId, type, description, 
      questionCount, totalMarks, durationMinutes, 
      language, status, isFree, displayOrder 
    } = req.body;
    
    if (!title || !categoryId || !type) {
      return res.status(400).json({ success: false, message: 'Title, categoryId, and type are required' });
    }
    
    const category = await DownloadCategory.findById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    
    const test = new DownloadTest({
      title,
      categoryId,
      type,
      description: description || '',
      questionCount: questionCount || 0,
      totalMarks: totalMarks || 0,
      durationMinutes: durationMinutes || 0,
      language: language || 'English',
      status: status || 'COMING_SOON',
      isFree: isFree !== false,
      displayOrder: displayOrder || 0,
      createdBy: req.user?.userId
    });
    
    await test.save();
    res.json({ success: true, test });
  } catch (error) {
    console.error('Error creating test:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTests = async (req, res) => {
  try {
    const { categoryId, type, status } = req.query;
    const filter = { isActive: true };
    
    if (categoryId) filter.categoryId = categoryId;
    if (type) filter.type = type;
    if (status) filter.status = status;
    
    const tests = await DownloadTest.find(filter)
      .populate('categoryId', 'name slug type')
      .sort({ displayOrder: 1, title: 1 });
    
    res.json({ success: true, tests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllTests = async (req, res) => {
  try {
    const { categoryId, type } = req.query;
    const filter = {};
    
    if (categoryId) filter.categoryId = categoryId;
    if (type) filter.type = type;
    
    const tests = await DownloadTest.find(filter)
      .populate('categoryId', 'name slug type')
      .sort({ type: 1, displayOrder: 1, title: 1 });
    
    res.json({ success: true, tests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTestById = async (req, res) => {
  try {
    const { id } = req.params;
    const test = await DownloadTest.findById(id)
      .populate('categoryId', 'name slug type');
    
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }
    
    res.json({ success: true, test });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateTest = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const test = await DownloadTest.findById(id);
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }
    
    const allowedFields = [
      'title', 'categoryId', 'description', 'questionCount', 
      'totalMarks', 'durationMinutes', 'language', 'status', 
      'isFree', 'displayOrder', 'isActive', 'pdfUrl'
    ];
    
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        test[field] = updates[field];
      }
    });
    
    if (updates.title && updates.title !== test.title) {
      test.slug = generateSlug(updates.title);
    }
    
    if (updates.status === 'PUBLISHED' && !test.publishedAt) {
      test.publishedAt = new Date();
    }
    
    await test.save();
    
    const populatedTest = await DownloadTest.findById(id)
      .populate('categoryId', 'name slug type');
    
    res.json({ success: true, test: populatedTest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteTest = async (req, res) => {
  try {
    const { id } = req.params;
    
    const test = await DownloadTest.findById(id);
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }
    
    if (test.pdfUrl) {
      const pdfPath = path.join(__dirname, '..', test.pdfUrl.replace(/^\//, ''));
      if (fs.existsSync(pdfPath)) {
        fs.unlinkSync(pdfPath);
      }
    }
    
    await DownloadTest.findByIdAndUpdate(id, { isActive: false });
    res.json({ success: true, message: 'Test deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.toggleTestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['COMING_SOON', 'PUBLISHED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    
    const test = await DownloadTest.findById(id);
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }
    
    test.status = status;
    if (status === 'PUBLISHED' && !test.publishedAt) {
      test.publishedAt = new Date();
    }
    
    await test.save();
    res.json({ success: true, test });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.reorderTests = async (req, res) => {
  try {
    const { orders } = req.body;
    
    if (!Array.isArray(orders)) {
      return res.status(400).json({ success: false, message: 'Orders must be an array' });
    }
    
    const bulkOps = orders.map((item, index) => ({
      updateOne: {
        filter: { _id: item.id },
        update: { displayOrder: item.order !== undefined ? item.order : index }
      }
    }));
    
    await DownloadTest.bulkWrite(bulkOps);
    res.json({ success: true, message: 'Tests reordered' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.uploadPdf = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    const test = await DownloadTest.findById(id);
    if (!test) {
      if (req.file.path) fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: 'Test not found' });
    }
    
    if (test.pdfUrl) {
      const oldPath = path.join(__dirname, '..', test.pdfUrl.replace(/^\//, ''));
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }
    
    test.pdfUrl = `/uploads/downloads/${req.file.filename}`;
    await test.save();
    
    res.json({ success: true, test, pdfUrl: test.pdfUrl });
  } catch (error) {
    if (req.file?.path) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPublicCategories = async (req, res) => {
  try {
    const categories = await DownloadCategory.find({ isActive: true })
      .select('name slug type displayOrder')
      .sort({ displayOrder: 1, name: 1 });
    
    const grouped = {
      PREVIOUS_YEAR: categories.filter(c => c.type === 'PREVIOUS_YEAR'),
      TOPIC_WISE: categories.filter(c => c.type === 'TOPIC_WISE')
    };
    
    res.json({ success: true, categories: grouped });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPublicTests = async (req, res) => {
  try {
    const { type, categoryId } = req.query;
    const filter = { isActive: true };
    
    if (type) filter.type = type;
    if (categoryId) filter.categoryId = categoryId;
    
    const tests = await DownloadTest.find(filter)
      .select('title slug categoryId type description questionCount totalMarks durationMinutes language pdfUrl status isFree displayOrder')
      .populate('categoryId', 'name slug')
      .sort({ displayOrder: 1, title: 1 });
    
    res.json({ success: true, tests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
