const MockTestSeries = require("../models/MockTestSeries");
const MockTest = require("../models/MockTest");

const getCourseMockTestSeries = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const series = await MockTestSeries.find({ courseId }).sort({ createdAt: -1 });
    
    const seriesWithCount = await Promise.all(
      series.map(async (s) => {
        const testCount = await MockTest.countDocuments({ seriesId: s._id });
        return {
          ...s.toObject(),
          testCount
        };
      })
    );
    
    res.json({ success: true, series: seriesWithCount });
  } catch (error) {
    console.error("Error fetching course mock test series:", error);
    res.status(500).json({ success: false, message: "Failed to fetch mock test series" });
  }
};

const createCourseMockTestSeries = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, category, description, price, validity } = req.body;
    
    const newSeries = new MockTestSeries({
      title,
      category: category || "Modular",
      description: description || "",
      price: price || 0,
      validity: validity || 365,
      courseId,
      isActive: true
    });
    
    await newSeries.save();
    
    res.json({ success: true, series: newSeries, message: "Series created successfully" });
  } catch (error) {
    console.error("Error creating course mock test series:", error);
    res.status(500).json({ success: false, message: "Failed to create mock test series" });
  }
};

const updateCourseMockTestSeries = async (req, res) => {
  try {
    const { courseId, seriesId } = req.params;
    const { title, category, description, price, validity } = req.body;
    
    const series = await MockTestSeries.findOne({ _id: seriesId, courseId });
    
    if (!series) {
      return res.status(404).json({ success: false, message: "Series not found" });
    }
    
    series.title = title || series.title;
    series.category = category || series.category;
    series.description = description !== undefined ? description : series.description;
    series.price = price !== undefined ? price : series.price;
    series.validity = validity || series.validity;
    
    await series.save();
    
    res.json({ success: true, series, message: "Series updated successfully" });
  } catch (error) {
    console.error("Error updating course mock test series:", error);
    res.status(500).json({ success: false, message: "Failed to update mock test series" });
  }
};

const deleteCourseMockTestSeries = async (req, res) => {
  try {
    const { courseId, seriesId } = req.params;
    
    const series = await MockTestSeries.findOne({ _id: seriesId, courseId });
    
    if (!series) {
      return res.status(404).json({ success: false, message: "Series not found" });
    }
    
    await MockTest.deleteMany({ seriesId });
    
    await MockTestSeries.findByIdAndDelete(seriesId);
    
    res.json({ success: true, message: "Series and all its tests deleted successfully" });
  } catch (error) {
    console.error("Error deleting course mock test series:", error);
    res.status(500).json({ success: false, message: "Failed to delete mock test series" });
  }
};

const getSeriesTests = async (req, res) => {
  try {
    const { courseId, seriesId } = req.params;
    
    const series = await MockTestSeries.findOne({ _id: seriesId, courseId });
    
    if (!series) {
      return res.status(404).json({ success: false, message: "Series not found" });
    }
    
    const tests = await MockTest.find({ seriesId }).sort({ createdAt: -1 });
    
    res.json({ success: true, tests });
  } catch (error) {
    console.error("Error fetching series tests:", error);
    res.status(500).json({ success: false, message: "Failed to fetch tests" });
  }
};

const createSeriesTest = async (req, res) => {
  try {
    const { courseId, seriesId } = req.params;
    const { title, description, duration, totalQuestions, testType, exam, yearLabel } = req.body;
    
    if (!title || title.trim() === "") {
      return res.status(400).json({ success: false, message: "Test title is required" });
    }
    
    const series = await MockTestSeries.findOne({ _id: seriesId, courseId });
    
    if (!series) {
      return res.status(404).json({ success: false, message: "Series not found for this course" });
    }
    
    const validTestTypes = ['previousYear', 'full', 'series', 'module', 'sessional', 'modular', 'other'];
    const validExams = ['CAT', 'XAT', 'SNAP', 'IIFT', 'NMAT', 'MAT'];
    
    const newTest = new MockTest({
      title: title.trim(),
      description: description ? description.trim() : "",
      duration: parseInt(duration) || 120,
      totalQuestions: parseInt(totalQuestions) || 66,
      testType: validTestTypes.includes(testType) ? testType : "modular",
      exam: validExams.includes(exam) ? exam : "CAT",
      yearLabel: yearLabel || "2025",
      seriesId: seriesId,
      courseId: courseId,
      isActive: true,
      sections: []
    });
    
    await newTest.save();
    
    res.json({ success: true, test: newTest, message: "Test created successfully" });
  } catch (error) {
    console.error("Error creating series test:", error);
    res.status(500).json({ success: false, message: "Failed to create test: " + error.message });
  }
};

const updateSeriesTest = async (req, res) => {
  try {
    const { courseId, seriesId, testId } = req.params;
    const { title, description, duration, totalQuestions, testType, exam, yearLabel } = req.body;
    
    const series = await MockTestSeries.findOne({ _id: seriesId, courseId });
    if (!series) {
      return res.status(404).json({ success: false, message: "Series not found for this course" });
    }
    
    const test = await MockTest.findOne({ _id: testId, seriesId: seriesId, courseId: courseId });
    
    if (!test) {
      return res.status(404).json({ success: false, message: "Test not found in this series/course" });
    }
    
    const validTestTypes = ['previousYear', 'full', 'series', 'module', 'sessional', 'modular', 'other'];
    const validExams = ['CAT', 'XAT', 'SNAP', 'IIFT', 'NMAT', 'MAT'];
    
    if (title) test.title = title.trim();
    if (description !== undefined) test.description = description.trim();
    if (duration) test.duration = parseInt(duration);
    if (totalQuestions) test.totalQuestions = parseInt(totalQuestions);
    if (testType && validTestTypes.includes(testType)) test.testType = testType;
    if (exam && validExams.includes(exam)) test.exam = exam;
    if (yearLabel) test.yearLabel = yearLabel;
    
    await test.save();
    
    res.json({ success: true, test, message: "Test updated successfully" });
  } catch (error) {
    console.error("Error updating series test:", error);
    res.status(500).json({ success: false, message: "Failed to update test: " + error.message });
  }
};

const deleteSeriesTest = async (req, res) => {
  try {
    const { courseId, seriesId, testId } = req.params;
    
    const series = await MockTestSeries.findOne({ _id: seriesId, courseId });
    if (!series) {
      return res.status(404).json({ success: false, message: "Series not found for this course" });
    }
    
    const test = await MockTest.findOne({ _id: testId, seriesId: seriesId, courseId: courseId });
    
    if (!test) {
      return res.status(404).json({ success: false, message: "Test not found in this series/course" });
    }
    
    await MockTest.findOneAndDelete({ _id: testId, seriesId: seriesId, courseId: courseId });
    
    res.json({ success: true, message: "Test deleted successfully" });
  } catch (error) {
    console.error("Error deleting series test:", error);
    res.status(500).json({ success: false, message: "Failed to delete test: " + error.message });
  }
};

module.exports = {
  getCourseMockTestSeries,
  createCourseMockTestSeries,
  updateCourseMockTestSeries,
  deleteCourseMockTestSeries,
  getSeriesTests,
  createSeriesTest,
  updateSeriesTest,
  deleteSeriesTest
};
