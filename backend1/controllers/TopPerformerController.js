const TopPerformer = require('../models/TopPerformer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads/top-performers');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

exports.getAll = async (req, res) => {
  try {
    const performers = await TopPerformer.find()
      .sort({ displayOrder: 1, createdAt: -1 });
    res.json({ success: true, performers });
  } catch (error) {
    console.error('Error fetching top performers:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch top performers' });
  }
};

exports.getPublic = async (req, res) => {
  try {
    const performers = await TopPerformer.find({ isActive: true })
      .select('name percentile photoUrl displayOrder')
      .sort({ displayOrder: 1 });
    res.json({ success: true, performers });
  } catch (error) {
    console.error('Error fetching public top performers:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch top performers' });
  }
};

exports.getById = async (req, res) => {
  try {
    const performer = await TopPerformer.findById(req.params.id);
    if (!performer) {
      return res.status(404).json({ success: false, message: 'Top performer not found' });
    }
    res.json({ success: true, performer });
  } catch (error) {
    console.error('Error fetching top performer:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch top performer' });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, percentile, displayOrder, isActive } = req.body;
    
    let photoUrl = '';
    if (req.file) {
      photoUrl = req.file.filename;
    }

    const maxOrder = await TopPerformer.findOne().sort({ displayOrder: -1 });
    const order = displayOrder || (maxOrder ? maxOrder.displayOrder + 1 : 1);

    const performer = new TopPerformer({
      name,
      percentile,
      photoUrl,
      displayOrder: order,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user?.id
    });

    await performer.save();
    res.status(201).json({ success: true, message: 'Top performer created successfully', performer });
  } catch (error) {
    console.error('Error creating top performer:', error);
    res.status(500).json({ success: false, message: 'Failed to create top performer' });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, percentile, displayOrder, isActive } = req.body;
    
    const performer = await TopPerformer.findById(req.params.id);
    if (!performer) {
      return res.status(404).json({ success: false, message: 'Top performer not found' });
    }

    if (req.file) {
      if (performer.photoUrl) {
        const oldPath = path.join(uploadDir, performer.photoUrl);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      performer.photoUrl = req.file.filename;
    }

    if (name) performer.name = name;
    if (percentile) performer.percentile = percentile;
    if (displayOrder !== undefined) performer.displayOrder = displayOrder;
    if (isActive !== undefined) performer.isActive = isActive;

    await performer.save();
    res.json({ success: true, message: 'Top performer updated successfully', performer });
  } catch (error) {
    console.error('Error updating top performer:', error);
    res.status(500).json({ success: false, message: 'Failed to update top performer' });
  }
};

exports.delete = async (req, res) => {
  try {
    const performer = await TopPerformer.findById(req.params.id);
    if (!performer) {
      return res.status(404).json({ success: false, message: 'Top performer not found' });
    }

    if (performer.photoUrl) {
      const photoPath = path.join(uploadDir, performer.photoUrl);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    await TopPerformer.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Top performer deleted successfully' });
  } catch (error) {
    console.error('Error deleting top performer:', error);
    res.status(500).json({ success: false, message: 'Failed to delete top performer' });
  }
};

exports.toggleStatus = async (req, res) => {
  try {
    const performer = await TopPerformer.findById(req.params.id);
    if (!performer) {
      return res.status(404).json({ success: false, message: 'Top performer not found' });
    }

    performer.isActive = !performer.isActive;
    await performer.save();
    res.json({ success: true, message: `Top performer ${performer.isActive ? 'activated' : 'deactivated'}`, performer });
  } catch (error) {
    console.error('Error toggling top performer status:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle status' });
  }
};

exports.reorder = async (req, res) => {
  try {
    const { orderedIds } = req.body;
    
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ success: false, message: 'orderedIds must be an array' });
    }

    for (let i = 0; i < orderedIds.length; i++) {
      await TopPerformer.findByIdAndUpdate(orderedIds[i], { displayOrder: i + 1 });
    }

    res.json({ success: true, message: 'Order updated successfully' });
  } catch (error) {
    console.error('Error reordering top performers:', error);
    res.status(500).json({ success: false, message: 'Failed to reorder' });
  }
};
