const MockTest = require("../models/MockTest");
const Course = require("../models/course/Course");

const getCourseMockTests = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }
    
    if (course.courseType !== 'mock_tests') {
      return res.status(400).json({ success: false, message: "This course is not a mock tests type course" });
    }
    
    const tests = await MockTest.find({ courseId }).sort({ createdAt: -1 });
    
    res.json({ success: true, tests, course: { _id: course._id, name: course.name } });
  } catch (error) {
    console.error("Error fetching course mock tests:", error);
    res.status(500).json({ success: false, message: "Failed to fetch mock tests" });
  }
};

const createCourseMockTest = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, duration, totalQuestions, testType, exam, yearLabel, sections } = req.body;
    
    if (!title || title.trim() === "") {
      return res.status(400).json({ success: false, message: "Test title is required" });
    }
    
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }
    
    if (course.courseType !== 'mock_tests') {
      return res.status(400).json({ success: false, message: "This course is not a mock tests type course" });
    }
    
    const validTestTypes = ['previousYear', 'full', 'series', 'module', 'sessional', 'other'];
    const validExams = ['CAT', 'XAT', 'SNAP', 'IIFT', 'NMAT', 'MAT'];
    
    const defaultSections = [
      { name: 'VARC', duration: 40, totalQuestions: 24, totalMarks: 72, questions: [] },
      { name: 'DILR', duration: 40, totalQuestions: 20, totalMarks: 60, questions: [] },
      { name: 'QA', duration: 40, totalQuestions: 22, totalMarks: 66, questions: [] }
    ];
    
    const newTest = new MockTest({
      title: title.trim(),
      description: description ? description.trim() : "",
      duration: parseInt(duration) || 120,
      totalQuestions: parseInt(totalQuestions) || 66,
      totalMarks: (parseInt(totalQuestions) || 66) * 3,
      testType: validTestTypes.includes(testType) ? testType : "full",
      exam: validExams.includes(exam) ? exam : "CAT",
      yearLabel: yearLabel || "2025",
      courseId: courseId,
      isActive: true,
      sections: sections && sections.length > 0 ? sections : defaultSections
    });
    
    await newTest.save();
    
    res.json({ success: true, test: newTest, message: "Mock test created successfully" });
  } catch (error) {
    console.error("Error creating course mock test:", error);
    res.status(500).json({ success: false, message: "Failed to create mock test: " + error.message });
  }
};

const updateCourseMockTest = async (req, res) => {
  try {
    const { courseId, testId } = req.params;
    const { title, description, duration, totalQuestions, testType, exam, yearLabel, sections } = req.body;
    
    const course = await Course.findById(courseId);
    if (!course || course.courseType !== 'mock_tests') {
      return res.status(404).json({ success: false, message: "Mock tests course not found" });
    }
    
    const test = await MockTest.findOne({ _id: testId, courseId: courseId });
    if (!test) {
      return res.status(404).json({ success: false, message: "Test not found in this course" });
    }
    
    const validTestTypes = ['previousYear', 'full', 'series', 'module', 'sessional', 'other'];
    const validExams = ['CAT', 'XAT', 'SNAP', 'IIFT', 'NMAT', 'MAT'];
    
    if (title) test.title = title.trim();
    if (description !== undefined) test.description = description.trim();
    if (duration) test.duration = parseInt(duration);
    if (totalQuestions) {
      test.totalQuestions = parseInt(totalQuestions);
      test.totalMarks = parseInt(totalQuestions) * 3;
    }
    if (testType && validTestTypes.includes(testType)) test.testType = testType;
    if (exam && validExams.includes(exam)) test.exam = exam;
    if (yearLabel) test.yearLabel = yearLabel;
    if (sections && sections.length > 0) test.sections = sections;
    
    await test.save();
    
    res.json({ success: true, test, message: "Mock test updated successfully" });
  } catch (error) {
    console.error("Error updating course mock test:", error);
    res.status(500).json({ success: false, message: "Failed to update mock test: " + error.message });
  }
};

const deleteCourseMockTest = async (req, res) => {
  try {
    const { courseId, testId } = req.params;
    
    const course = await Course.findById(courseId);
    if (!course || course.courseType !== 'mock_tests') {
      return res.status(404).json({ success: false, message: "Mock tests course not found" });
    }
    
    const test = await MockTest.findOne({ _id: testId, courseId: courseId });
    if (!test) {
      return res.status(404).json({ success: false, message: "Test not found in this course" });
    }
    
    await MockTest.findOneAndDelete({ _id: testId, courseId: courseId });
    
    res.json({ success: true, message: "Mock test deleted successfully" });
  } catch (error) {
    console.error("Error deleting course mock test:", error);
    res.status(500).json({ success: false, message: "Failed to delete mock test: " + error.message });
  }
};

module.exports = {
  getCourseMockTests,
  createCourseMockTest,
  updateCourseMockTest,
  deleteCourseMockTest
};
