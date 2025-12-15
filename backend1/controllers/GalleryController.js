const GalleryItem = require('../models/GalleryItem');
const path = require('path');
const fs = require('fs');

const extractYouTubeId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const getYouTubeThumbnail = (videoId) => {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
};

exports.createItem = async (req, res) => {
  try {
    const { type, title, description, youtubeUrl, order, isActive, isFeatured } = req.body;

    let imagePath = null;
    let thumbnailUrl = null;

    if (type === 'video' && youtubeUrl) {
      const videoId = extractYouTubeId(youtubeUrl);
      if (videoId) {
        thumbnailUrl = getYouTubeThumbnail(videoId);
      }
    }

    if (type === 'image' && req.file) {
      imagePath = `/uploads/gallery/${req.file.filename}`;
    }

    const item = new GalleryItem({
      type,
      title,
      description,
      youtubeUrl: type === 'video' ? youtubeUrl : undefined,
      thumbnailUrl,
      imagePath,
      order: order || 0,
      isActive: isActive !== undefined ? isActive : true,
      isFeatured: isFeatured !== undefined ? isFeatured : false
    });

    await item.save();

    res.status(201).json({
      success: true,
      message: 'Gallery item created successfully',
      data: item
    });
  } catch (error) {
    console.error('Error creating gallery item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create gallery item',
      error: error.message
    });
  }
};

exports.getAllItems = async (req, res) => {
  try {
    const { type, isActive } = req.query;
    const filter = {};

    if (type) filter.type = type;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const items = await GalleryItem.find(filter).sort({ order: 1, createdAt: -1 });

    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    console.error('Error fetching gallery items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch gallery items',
      error: error.message
    });
  }
};

exports.getPublicItems = async (req, res) => {
  try {
    const { type } = req.query;
    const filter = { isActive: true };

    if (type) filter.type = type;

    const items = await GalleryItem.find(filter).sort({ order: 1, createdAt: -1 });

    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    console.error('Error fetching public gallery items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch gallery items',
      error: error.message
    });
  }
};

exports.getFeaturedVideo = async (req, res) => {
  try {
    const featured = await GalleryItem.findOne({ 
      type: 'video', 
      isActive: true, 
      isFeatured: true 
    });

    res.json({
      success: true,
      data: featured
    });
  } catch (error) {
    console.error('Error fetching featured video:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured video',
      error: error.message
    });
  }
};

exports.getItemById = async (req, res) => {
  try {
    const item = await GalleryItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Gallery item not found'
      });
    }

    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    console.error('Error fetching gallery item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch gallery item',
      error: error.message
    });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const { type, title, description, youtubeUrl, order, isActive, isFeatured } = req.body;

    const item = await GalleryItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Gallery item not found'
      });
    }

    if (type) item.type = type;
    if (title) item.title = title;
    if (description !== undefined) item.description = description;
    if (order !== undefined) item.order = order;
    if (isActive !== undefined) item.isActive = isActive;
    if (isFeatured !== undefined) item.isFeatured = isFeatured;

    if (type === 'video' && youtubeUrl) {
      item.youtubeUrl = youtubeUrl;
      const videoId = extractYouTubeId(youtubeUrl);
      if (videoId) {
        item.thumbnailUrl = getYouTubeThumbnail(videoId);
      }
    }

    if (type === 'image' && req.file) {
      if (item.imagePath) {
        const oldPath = path.join(__dirname, '..', item.imagePath);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      item.imagePath = `/uploads/gallery/${req.file.filename}`;
    }

    await item.save();

    res.json({
      success: true,
      message: 'Gallery item updated successfully',
      data: item
    });
  } catch (error) {
    console.error('Error updating gallery item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update gallery item',
      error: error.message
    });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const item = await GalleryItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Gallery item not found'
      });
    }

    if (item.imagePath) {
      const imagePath = path.join(__dirname, '..', item.imagePath);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await GalleryItem.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Gallery item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting gallery item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete gallery item',
      error: error.message
    });
  }
};

exports.reorderItems = async (req, res) => {
  try {
    const { items } = req.body;

    for (const item of items) {
      await GalleryItem.findByIdAndUpdate(item.id, { order: item.order });
    }

    res.json({
      success: true,
      message: 'Items reordered successfully'
    });
  } catch (error) {
    console.error('Error reordering items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reorder items',
      error: error.message
    });
  }
};
