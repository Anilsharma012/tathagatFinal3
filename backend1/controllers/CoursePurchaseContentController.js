const CoursePurchaseContent = require('../models/CoursePurchaseContent');
const Course = require('../models/course/Course');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads/instructors');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find({ isActive: true })
      .select('_id name courseType price')
      .sort({ name: 1 });
    res.json({ success: true, courses });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch courses' });
  }
};

exports.getAll = async (req, res) => {
  try {
    const contents = await CoursePurchaseContent.find()
      .populate('courseId', 'name courseType price')
      .sort({ createdAt: -1 });
    res.json({ success: true, contents });
  } catch (error) {
    console.error('Error fetching course purchase contents:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch contents' });
  }
};

exports.getByCourseId = async (req, res) => {
  try {
    const { courseId } = req.params;
    const content = await CoursePurchaseContent.findOne({ courseId })
      .populate('courseId', 'name courseType price description');
    
    if (!content) {
      return res.status(404).json({ success: false, message: 'Content not found for this course' });
    }
    res.json({ success: true, content });
  } catch (error) {
    console.error('Error fetching course purchase content:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch content' });
  }
};

exports.getPublicByCourseId = async (req, res) => {
  try {
    const { courseId } = req.params;
    const content = await CoursePurchaseContent.findOne({ courseId, isActive: true })
      .populate('courseId', 'name courseType price description thumbnail');
    
    if (!content) {
      const course = await Course.findById(courseId).select('name price description thumbnail');
      if (course) {
        return res.json({ 
          success: true, 
          content: null, 
          course,
          message: 'Course details coming soon'
        });
      }
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    res.json({ success: true, content });
  } catch (error) {
    console.error('Error fetching public course purchase content:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch content' });
  }
};

exports.create = async (req, res) => {
  try {
    const data = JSON.parse(req.body.data || '{}');
    
    if (!data.courseId) {
      return res.status(400).json({ success: false, message: 'Course ID is required' });
    }

    const existingContent = await CoursePurchaseContent.findOne({ courseId: data.courseId });
    if (existingContent) {
      return res.status(400).json({ 
        success: false, 
        message: 'Content already exists for this course. Use update instead.' 
      });
    }

    if (req.files && req.files.length > 0) {
      data.instructors = data.instructors || [];
      req.files.forEach((file, index) => {
        if (data.instructors[index]) {
          data.instructors[index].imageUrl = file.filename;
        }
      });
    }

    const content = new CoursePurchaseContent({
      ...data,
      createdBy: req.user?.id
    });

    await content.save();
    const populated = await CoursePurchaseContent.findById(content._id)
      .populate('courseId', 'name courseType price');
    
    res.status(201).json({ 
      success: true, 
      message: 'Course purchase content created successfully', 
      content: populated 
    });
  } catch (error) {
    console.error('Error creating course purchase content:', error);
    res.status(500).json({ success: false, message: 'Failed to create content: ' + error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { courseId } = req.params;
    const data = JSON.parse(req.body.data || '{}');

    const content = await CoursePurchaseContent.findOne({ courseId });
    if (!content) {
      return res.status(404).json({ success: false, message: 'Content not found for this course' });
    }

    if (req.files && req.files.length > 0) {
      data.instructors = data.instructors || content.instructors || [];
      req.files.forEach((file) => {
        const match = file.fieldname.match(/instructorImage(\d+)/);
        if (match) {
          const index = parseInt(match[1]);
          if (data.instructors[index]) {
            const oldImage = content.instructors[index]?.imageUrl;
            if (oldImage) {
              const oldPath = path.join(uploadDir, oldImage);
              if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
              }
            }
            data.instructors[index].imageUrl = file.filename;
          }
        }
      });
    }

    Object.keys(data).forEach(key => {
      content[key] = data[key];
    });

    await content.save();
    const populated = await CoursePurchaseContent.findById(content._id)
      .populate('courseId', 'name courseType price');

    res.json({ 
      success: true, 
      message: 'Course purchase content updated successfully', 
      content: populated 
    });
  } catch (error) {
    console.error('Error updating course purchase content:', error);
    res.status(500).json({ success: false, message: 'Failed to update content: ' + error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const { courseId } = req.params;
    const content = await CoursePurchaseContent.findOne({ courseId });
    
    if (!content) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }

    if (content.instructors) {
      content.instructors.forEach(inst => {
        if (inst.imageUrl) {
          const imgPath = path.join(uploadDir, inst.imageUrl);
          if (fs.existsSync(imgPath)) {
            fs.unlinkSync(imgPath);
          }
        }
      });
    }

    await CoursePurchaseContent.findByIdAndDelete(content._id);
    res.json({ success: true, message: 'Course purchase content deleted successfully' });
  } catch (error) {
    console.error('Error deleting course purchase content:', error);
    res.status(500).json({ success: false, message: 'Failed to delete content' });
  }
};

exports.toggleStatus = async (req, res) => {
  try {
    const { courseId } = req.params;
    const content = await CoursePurchaseContent.findOne({ courseId });
    
    if (!content) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }

    content.isActive = !content.isActive;
    await content.save();
    
    res.json({ 
      success: true, 
      message: `Content ${content.isActive ? 'activated' : 'deactivated'}`, 
      content 
    });
  } catch (error) {
    console.error('Error toggling content status:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle status' });
  }
};

exports.checkExists = async (req, res) => {
  try {
    const { courseId } = req.params;
    const content = await CoursePurchaseContent.findOne({ courseId });
    res.json({ success: true, exists: !!content, contentId: content?._id });
  } catch (error) {
    console.error('Error checking content existence:', error);
    res.status(500).json({ success: false, message: 'Failed to check' });
  }
};
