const mongoose = require("mongoose");
const Course = require("../models/course/Course");
const Subject = require("../models/course/Subject");
const Chapter = require("../models/course/Chapter");
const Topic = require("../models/course/Topic");
const Test = require("../models/course/Test");
const VideoContent = require("../models/course/VideoContent");
const MockTestSeries = require("../models/MockTestSeries");
const MockTest = require("../models/MockTest");
const User = require("../models/UserSchema");

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id) && (new mongoose.Types.ObjectId(id)).toString() === id;
};

// Helper function to check course date-based access
const checkCourseDateAccess = (course) => {
  const now = new Date();
  const startDate = course.startDate ? new Date(course.startDate) : null;
  const endDate = course.endDate ? new Date(course.endDate) : null;
  
  // Check if course has not started yet
  if (startDate && now < startDate) {
    const formattedDate = startDate.toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
    return { 
      hasAccess: false, 
      isUpcoming: true,
      message: `Course content will be available from ${formattedDate}`,
      startDate: course.startDate 
    };
  }
  
  // Check if course has expired and access is not kept
  if (endDate && now > endDate && !course.keepAccessAfterEnd) {
    return { 
      hasAccess: false, 
      isExpired: true,
      message: "Course access has expired" 
    };
  }
  
  return { hasAccess: true };
};

// Helper function to check if student has access to course
const checkCourseAccess = async (userId, courseId, skipDateCheck = false) => {
  try {
    console.log(`🔍 checkCourseAccess: userId=${userId}, courseId=${courseId}`);
    
    // Check if course exists (don't check published yet - enrolled users can access unpublished courses)
    const course = await Course.findById(courseId);
    if (!course) {
      console.log('❌ Course not found');
      return { hasAccess: false, message: "Course not available" };
    }

    // In development mode with dev admin ID, grant access to all courses
    if (process.env.NODE_ENV === 'development' && userId === '507f1f77bcf86cd799439011') {
      console.log('🔧 Admin dev user detected, granting course access');
      return { hasAccess: true, course };
    }

    // Try to find user by ID first
    let user = await User.findById(userId);
    
    // In development mode, if user not found by ID, try demo user
    if (!user && process.env.NODE_ENV === 'development') {
      console.log('🔧 Dev mode: User not found by ID, checking demo user');
      user = await User.findOne({ email: 'demo@test.com' });
    }
    
    if (!user) {
      console.log('❌ User not found:', userId);
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 Dev mode: Granting access despite user not found');
        return { hasAccess: true, course };
      }
      return { hasAccess: false, message: "User not found" };
    }

    console.log('👤 Found user:', user._id);
    console.log('📚 User enrolled courses:', user.enrolledCourses?.length || 0);

    // Check if user is enrolled and has unlocked the course
    const enrollment = user.enrolledCourses?.find(
      (c) => c.courseId && c.courseId.toString() === courseId && c.status === "unlocked"
    );

    // If user is enrolled with unlocked status, grant access even if course is not published
    if (enrollment) {
      console.log('✅ User has unlocked access to this course (enrolled)');
      
      // Still check date-based access for enrolled users
      if (!skipDateCheck) {
        const dateAccess = checkCourseDateAccess(course);
        if (!dateAccess.hasAccess) {
          console.log(`📅 Date-based access denied: ${dateAccess.message}`);
          return { ...dateAccess, course };
        }
      }
      
      return { hasAccess: true, course };
    }

    // For non-enrolled users, course must be published
    if (!course.published) {
      console.log('❌ Course not published and user not enrolled');
      return { hasAccess: false, message: "Course not available" };
    }

    // Check date-based access for non-enrolled users
    if (!skipDateCheck) {
      const dateAccess = checkCourseDateAccess(course);
      if (!dateAccess.hasAccess) {
        console.log(`📅 Date-based access denied: ${dateAccess.message}`);
        return { ...dateAccess, course };
      }
    }

    // In dev mode, be more lenient
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Dev mode: Course not in user enrollments, but granting access for testing');
      return { hasAccess: true, course };
    }

    console.log('❌ Course not unlocked for user');
    return { hasAccess: false, message: "You need to purchase this course to access its content." };
  } catch (error) {
    console.error("Error checking course access:", error);
    if (process.env.NODE_ENV === 'development') {
      const course = await Course.findById(courseId);
      if (course) {
        console.log('🔧 Dev mode: Granting access despite error');
        return { hasAccess: true, course };
      }
    }
    return { hasAccess: false, message: "Access check failed" };
  }
};

// Get course subjects for students
exports.getStudentCourseSubjects = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    // Check course access
    const accessCheck = await checkCourseAccess(userId, courseId);
    if (!accessCheck.hasAccess) {
      return res.status(403).json({
        success: false,
        message: accessCheck.message
      });
    }

    // Get subjects for the course
    const subjects = await Subject.find({ courseId }).sort({ order: 1 });

    res.status(200).json({
      success: true,
      subjects,
      course: accessCheck.course
    });
  } catch (error) {
    console.error("Error fetching student course subjects:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch course subjects"
    });
  }
};

// Get chapters for a subject (with course access check)
exports.getStudentSubjectChapters = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const userId = req.user.id;

    // Get subject and its course
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found"
      });
    }

    // Check course access
    const accessCheck = await checkCourseAccess(userId, subject.courseId);
    if (!accessCheck.hasAccess) {
      return res.status(403).json({
        success: false,
        message: accessCheck.message
      });
    }

    // Get chapters for the subject
    const chapters = await Chapter.find({ subjectId }).sort({ order: 1 });

    res.status(200).json({
      success: true,
      chapters,
      subject
    });
  } catch (error) {
    console.error("Error fetching student subject chapters:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch subject chapters"
    });
  }
};

// Get topics for a chapter (with course access check)
exports.getStudentChapterTopics = async (req, res) => {
  try {
    const { chapterId } = req.params;
    const userId = req.user.id;

    // Get chapter and its course
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: "Chapter not found"
      });
    }

    // Check course access
    const accessCheck = await checkCourseAccess(userId, chapter.courseId);
    if (!accessCheck.hasAccess) {
      return res.status(403).json({
        success: false,
        message: accessCheck.message
      });
    }

    // Get topics for the chapter
    const topics = await Topic.find({ chapterId }).sort({ order: 1 });

    res.status(200).json({
      success: true,
      topics,
      chapter
    });
  } catch (error) {
    console.error("Error fetching student chapter topics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch chapter topics"
    });
  }
};

// Get tests for a topic (with course access check)
exports.getStudentTopicTests = async (req, res) => {
  try {
    const { topicId } = req.params;
    const userId = req.user.id;

    // Get topic and its course
    const topic = await Topic.findById(topicId);
    if (!topic) {
      return res.status(404).json({
        success: false,
        message: "Topic not found"
      });
    }

    // Check course access
    const accessCheck = await checkCourseAccess(userId, topic.courseId);
    if (!accessCheck.hasAccess) {
      return res.status(403).json({
        success: false,
        message: accessCheck.message
      });
    }

    // Get tests for the topic
    const tests = await Test.find({ topicId }).sort({ order: 1 });

    res.status(200).json({
      success: true,
      tests,
      topic
    });
  } catch (error) {
    console.error("Error fetching student topic tests:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch topic tests"
    });
  }
};

// Get complete course structure for students (optimized single call)
exports.getStudentCourseStructure = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    // Check course access
    const accessCheck = await checkCourseAccess(userId, courseId);
    if (!accessCheck.hasAccess) {
      return res.status(403).json({
        success: false,
        message: accessCheck.message
      });
    }

    // Get complete course structure
    // Note: Subject and Chapter models use 'courseId', but Topic model uses 'course'
    const subjects = await Subject.find({ courseId }).sort({ order: 1 });
    const chapters = await Chapter.find({ courseId }).sort({ order: 1 });
    const topics = await Topic.find({ course: courseId }).sort({ order: 1 });

    // Fix: Use correct field names from Test model schema
    const tests = await Test.find({ course: courseId }).sort({ title: 1 });

    console.log('🔍 DEBUG: Checking for tests in course:', courseId);
    console.log('📊 Subjects found:', subjects.length);
    console.log('📊 Chapters found:', chapters.length);
    console.log('📊 Topics found:', topics.length);
    console.log('📊 Tests found:', tests.length);

    // Check for tests associated with different entities
    const allTests = await Test.find({}).limit(20);
    console.log('🧪 Sample tests in database:');
    allTests.forEach((test, i) => {
      console.log(`  Test ${i}: ${test.title} | Course: ${test.course} | Chapter: ${test.chapter} | Topic: ${test.topic}`);
    });

    // Check for tests that might be associated directly with chapters
    const chaptersWithTests = await Test.find({
      $or: [
        { course: courseId },
        { chapter: { $in: chapters.map(c => c._id) } }
      ]
    });
    console.log('🧪 Tests associated with this course or its chapters:', chaptersWithTests.length);
    chaptersWithTests.forEach((test, i) => {
      console.log(`  Test ${i}: ${test.title} | Course: ${test.course} | Chapter: ${test.chapter} | Topic: ${test.topic}`);
    });

    // Organize the structure
    // Note: Topic model uses 'chapter' field, not 'chapterId'
    const courseStructure = subjects.map(subject => ({
      ...subject.toObject(),
      chapters: chapters
        .filter(chapter => chapter.subjectId && chapter.subjectId.toString() === subject._id.toString())
        .map(chapter => ({
          ...chapter.toObject(),
          topics: topics
            .filter(topic => topic.chapter && topic.chapter.toString() === chapter._id.toString())
            .map(topic => ({
              ...topic.toObject(),
              tests: tests.filter(test => test.topic && test.topic.toString() === topic._id.toString())
            }))
        }))
    }));

    // Also check for tests that might be directly associated with chapters (if no topics exist)
    courseStructure.forEach(subject => {
      subject.chapters.forEach(chapter => {
        if (chapter.topics.length === 0) {
          // If no topics, attach tests directly to chapter
          const chapterTests = tests.filter(test => test.chapter && test.chapter.toString() === chapter._id.toString());
          if (chapterTests.length > 0) {
            // Create a default topic for chapter-level tests
            chapter.topics.push({
              _id: `${chapter._id}_tests`,
              name: `${chapter.name} Tests`,
              chapterId: chapter._id,
              tests: chapterTests,
              createdAt: chapter.createdAt,
              updatedAt: chapter.updatedAt
            });
          }
        }
      });
    });

    res.status(200).json({
      success: true,
      course: accessCheck.course,
      structure: courseStructure
    });
  } catch (error) {
    console.error("Error fetching student course structure:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch course structure"
    });
  }
};

// Get comprehensive course content for students (videos, mock tests, full structure)
exports.getComprehensiveCourseContent = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    console.log(`📚 Fetching comprehensive course content for course: ${courseId}, user: ${userId}`);

    // Validate courseId is a valid MongoDB ObjectId
    if (!isValidObjectId(courseId)) {
      console.log(`❌ Invalid courseId format: ${courseId}`);
      return res.status(400).json({
        success: false,
        message: "Invalid course ID format. Please provide a valid course ID."
      });
    }

    // Check course access
    const accessCheck = await checkCourseAccess(userId, courseId);
    if (!accessCheck.hasAccess) {
      return res.status(403).json({
        success: false,
        message: accessCheck.message,
        isUpcoming: accessCheck.isUpcoming || false,
        isExpired: accessCheck.isExpired || false,
        startDate: accessCheck.startDate || null
      });
    }

    const course = accessCheck.course;

    // 1. Get Recorded Video Classes
    const videoContent = await VideoContent.find({ courseId })
      .sort({ serialNumber: 1 })
      .lean();

    console.log(`🎥 Found ${videoContent.length} video lectures for course`);

    // Group videos by topic if available
    const groupedVideos = {};
    videoContent.forEach(video => {
      const topicKey = video.topicName || 'General';
      if (!groupedVideos[topicKey]) {
        groupedVideos[topicKey] = [];
      }
      groupedVideos[topicKey].push(video);
    });

    // 2. Get Mock Tests for this specific course
    // First, get mock tests directly linked to this course (courseId)
    const directCourseMockTests = await MockTest.find({
      courseId: courseId,
      isActive: true,
      $or: [{ isPublished: true }, { isPublished: { $exists: false } }]
    }).sort({ testNumber: 1, createdAt: -1 }).lean();

    console.log(`📝 Found ${directCourseMockTests.length} mock tests directly linked to course`);

    // Get mock test series that are linked to this course
    const courseLinkedSeries = await MockTestSeries.find({
      courseId: courseId,
      isActive: true,
      $or: [{ isPublished: true }, { isPublished: { $exists: false } }]
    }).lean();

    // Get mock tests within each course-linked series
    const courseSeriesWithTests = await Promise.all(
      courseLinkedSeries.map(async (series) => {
        const tests = await MockTest.find({
          seriesId: series._id,
          isActive: true,
          $or: [{ isPublished: true }, { isPublished: { $exists: false } }]
        }).sort({ testNumber: 1 }).lean();
        return {
          ...series,
          tests
        };
      })
    );

    // Also get globally published mock test series (not course-specific)
    const globalMockTestSeries = await MockTestSeries.find({
      courseId: { $exists: false },
      isActive: true,
      isPublished: true
    }).lean();

    // Get mock tests within each global series
    const globalSeriesWithTests = await Promise.all(
      globalMockTestSeries.map(async (series) => {
        const tests = await MockTest.find({
          seriesId: series._id,
          isActive: true,
          isPublished: true
        }).sort({ testNumber: 1 }).lean();
        return {
          ...series,
          tests
        };
      })
    );

    // Combine all series (course-specific first, then global)
    const mockTestsWithTests = [...courseSeriesWithTests, ...globalSeriesWithTests];

    // Create a virtual series for direct course mock tests if any exist
    if (directCourseMockTests.length > 0) {
      mockTestsWithTests.unshift({
        _id: 'course-direct-tests',
        title: 'Course Mock Tests',
        description: 'Mock tests for this course',
        isActive: true,
        isPublished: true,
        tests: directCourseMockTests
      });
    }

    console.log(`📝 Total: ${directCourseMockTests.length} direct tests, ${courseLinkedSeries.length} course series, ${globalMockTestSeries.length} global series`);

    // 3. Get Full Course Structure (Subjects -> Chapters -> Topics -> Tests)
    const subjects = await Subject.find({ courseId }).sort({ order: 1 }).lean();
    const chapters = await Chapter.find({ courseId }).sort({ order: 1 }).lean();
    const topics = await Topic.find({ course: courseId }).sort({ order: 1 }).lean();
    const tests = await Test.find({ course: courseId }).sort({ title: 1 }).lean();

    console.log(`📊 Course Structure: ${subjects.length} subjects, ${chapters.length} chapters, ${topics.length} topics, ${tests.length} tests`);

    // Organize the hierarchical structure
    const fullCourseStructure = subjects.map(subject => ({
      ...subject,
      chapters: chapters
        .filter(chapter => chapter.subjectId && chapter.subjectId.toString() === subject._id.toString())
        .map(chapter => ({
          ...chapter,
          topics: topics
            .filter(topic => topic.chapter && topic.chapter.toString() === chapter._id.toString())
            .map(topic => ({
              ...topic,
              tests: tests.filter(test => test.topic && test.topic.toString() === topic._id.toString()),
              videos: videoContent.filter(v => v.topicName === topic.name)
            })),
          // Also attach tests directly to chapters if they don't have topics
          directTests: tests.filter(test => test.chapter && test.chapter.toString() === chapter._id.toString() && !test.topic)
        }))
    }));

    // 4. Calculate progress stats
    const totalVideos = videoContent.length;
    const totalTests = tests.length;
    const totalMockTests = mockTestsWithTests.reduce((acc, series) => acc + series.tests.length, 0);

    console.log("✅ Preparing response with", totalVideos, "videos");

    const responseData = {
      success: true,
      course: {
        _id: course._id,
        name: course.name,
        description: course.description,
        courseType: course.courseType,
        thumbnail: course.thumbnail,
        overview: course.overview
      },
      recordedClasses: {
        totalVideos,
        videos: videoContent,
        groupedByTopic: groupedVideos
      },
      mockTests: {
        totalSeries: mockTestsWithTests.length,
        totalTests: totalMockTests,
        series: mockTestsWithTests
      },
      fullCourseContent: {
        totalSubjects: subjects.length,
        totalChapters: chapters.length,
        totalTopics: topics.length,
        totalTests,
        structure: fullCourseStructure
      },
      stats: {
        totalVideos,
        totalTests,
        totalMockTests,
        totalContent: totalVideos + totalTests + totalMockTests
      }
    };

    console.log("✅ Sending response, data size:", JSON.stringify(responseData).length, "bytes");
    res.status(200).json(responseData);
    console.log("✅ Response sent successfully");

  } catch (error) {
    console.error("Error fetching comprehensive course content:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch course content",
      error: error.message
    });
  }
};
