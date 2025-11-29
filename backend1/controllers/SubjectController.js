const Subject = require("../models/course/Subject");
const Chapter = require("../models/course/Chapter");
const Topic = require("../models/course/Topic");
const Test = require("../models/course/Test");
const Question = require("../models/course/Question");
const mongoose = require("mongoose");

// ✅ Create Subject
exports.createSubject = async (req, res) => {
  try {
    const { courseId, name, description, order } = req.body;

    const existing = await Subject.findOne({ courseId, name });
    if (existing) {
      return res.status(400).json({ message: "Subject already exists in this course" });
    }

    const subject = new Subject({ courseId, name, description, order });
    await subject.save();

    res.status(201).json({ success: true, message: "Subject created", subject });
  } catch (err) {
    console.error("Subject create error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ✅ Get All Subjects for a course
exports.getSubjectsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const subjects = await Subject.find({ courseId }).sort({ order: 1 });

    res.status(200).json({ success: true, subjects });
  } catch (err) {
    res.status(500).json({ success: false, message: "Unable to fetch subjects" });
  }
};

// ✅ Update Subject
exports.updateSubject = async (req, res) => {
  try {
    const updated = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, subject: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: "Update failed" });
  }
};

// ✅ Delete Subject
exports.deleteSubject = async (req, res) => {
  try {
    await Subject.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Subject deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Delete failed" });
  }
};



// ✅ Bulk Add Subjects
exports.bulkAddSubjects = async (req, res) => {
  try {
    const { courseId, subjects } = req.body;

    if (!Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ message: "Subjects array is required" });
    }

    const newSubjects = subjects.map((subject, index) => ({
      courseId,
      name: subject.name,
      description: subject.description || "",
      order: subject.order || index + 1
    }));

    const inserted = await Subject.insertMany(newSubjects);

    res.status(201).json({ success: true, message: "Subjects added", subjects: inserted });
  } catch (err) {
    console.error("Bulk insert error:", err);
    res.status(500).json({ success: false, message: "Bulk subject insert failed" });
  }
};

// ✅ Copy Subject to Another Course (with all nested content)
exports.copySubjectToCourse = async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    const { subjectId } = req.params;
    const { targetCourseId } = req.body;

    console.log(`📋 Starting subject copy: ${subjectId} to course: ${targetCourseId}`);

    if (!targetCourseId) {
      return res.status(400).json({ 
        success: false, 
        message: "Target course ID is required" 
      });
    }

    // Find the source subject
    const sourceSubject = await Subject.findById(subjectId);
    if (!sourceSubject) {
      return res.status(404).json({ 
        success: false, 
        message: "Source subject not found" 
      });
    }

    // Check if same course
    if (sourceSubject.courseId.toString() === targetCourseId) {
      return res.status(400).json({ 
        success: false, 
        message: "Cannot copy subject to the same course" 
      });
    }

    // Start transaction
    session.startTransaction();

    // Check for duplicate name in target course
    let newSubjectName = sourceSubject.name;
    const existingSubject = await Subject.findOne({ 
      courseId: targetCourseId, 
      name: sourceSubject.name 
    });
    if (existingSubject) {
      newSubjectName = `${sourceSubject.name} (Copy)`;
      // Check if copy also exists
      const copyExists = await Subject.findOne({ 
        courseId: targetCourseId, 
        name: newSubjectName 
      });
      if (copyExists) {
        newSubjectName = `${sourceSubject.name} (Copy ${Date.now()})`;
      }
    }

    // 1. Create new subject
    const newSubject = new Subject({
      courseId: targetCourseId,
      name: newSubjectName,
      description: sourceSubject.description,
      order: sourceSubject.order,
      isActive: sourceSubject.isActive
    });
    await newSubject.save({ session });
    console.log(`✅ Created new subject: ${newSubject._id}`);

    // 2. Get all chapters for this subject (use session for consistency)
    const chapters = await Chapter.find({ subjectId: subjectId }).session(session);
    console.log(`📚 Found ${chapters.length} chapters to copy`);

    const chapterIdMap = new Map(); // oldId -> newId
    const topicIdMap = new Map();
    const testIdMap = new Map();

    let totalChapters = 0;
    let totalTopics = 0;
    let totalTests = 0;
    let totalQuestions = 0;

    // 3. Copy chapters
    for (const chapter of chapters) {
      const newChapter = new Chapter({
        courseId: targetCourseId,
        subjectId: newSubject._id,
        name: chapter.name,
        description: chapter.description,
        order: chapter.order,
        isActive: chapter.isActive
      });
      await newChapter.save({ session });
      chapterIdMap.set(chapter._id.toString(), newChapter._id);
      totalChapters++;
    }
    console.log(`✅ Copied ${totalChapters} chapters`);

    // 4. Get and copy all topics for these chapters (use session for consistency)
    const oldChapterIds = chapters.map(c => c._id);
    const topics = await Topic.find({ chapter: { $in: oldChapterIds } }).session(session);
    console.log(`📝 Found ${topics.length} topics to copy`);

    for (const topic of topics) {
      const newChapterId = chapterIdMap.get(topic.chapter.toString());
      if (!newChapterId) continue;

      const newTopic = new Topic({
        course: targetCourseId,
        subject: newSubject._id,
        chapter: newChapterId,
        name: topic.name,
        description: topic.description,
        order: topic.order,
        isFullTestSection: topic.isFullTestSection,
        isActive: topic.isActive
      });
      await newTopic.save({ session });
      topicIdMap.set(topic._id.toString(), newTopic._id);
      totalTopics++;
    }
    console.log(`✅ Copied ${totalTopics} topics`);

    // 5. Get and copy all tests for these topics (use session for consistency)
    const oldTopicIds = topics.map(t => t._id);
    const tests = await Test.find({ topic: { $in: oldTopicIds } }).session(session);
    console.log(`📋 Found ${tests.length} tests to copy`);

    for (const test of tests) {
      const newChapterId = chapterIdMap.get(test.chapter.toString());
      const newTopicId = topicIdMap.get(test.topic.toString());
      if (!newChapterId || !newTopicId) continue;

      const newTest = new Test({
        course: targetCourseId,
        subject: newSubject._id,
        chapter: newChapterId,
        topic: newTopicId,
        title: test.title,
        duration: test.duration,
        totalMarks: test.totalMarks,
        instructions: test.instructions,
        isActive: test.isActive
      });
      await newTest.save({ session });
      testIdMap.set(test._id.toString(), newTest._id);
      totalTests++;
    }
    console.log(`✅ Copied ${totalTests} tests`);

    // 6. Get and copy all questions for these tests (use session for consistency)
    const oldTestIds = tests.map(t => t._id);
    const questions = await Question.find({ testId: { $in: oldTestIds } }).session(session);
    console.log(`❓ Found ${questions.length} questions to copy`);

    const newQuestions = [];
    for (const question of questions) {
      const newTestId = testIdMap.get(question.testId.toString());
      if (!newTestId) continue;

      newQuestions.push({
        testId: newTestId,
        test: newTestId,
        questionText: question.questionText,
        direction: question.direction,
        options: question.options,
        correctOption: question.correctOption,
        explanation: question.explanation,
        difficulty: question.difficulty,
        marks: question.marks,
        negativeMarks: question.negativeMarks,
        type: question.type,
        order: question.order,
        isActive: question.isActive
      });
    }

    if (newQuestions.length > 0) {
      await Question.insertMany(newQuestions, { session });
      totalQuestions = newQuestions.length;
    }
    console.log(`✅ Copied ${totalQuestions} questions`);

    // Commit transaction
    await session.commitTransaction();

    console.log(`🎉 Subject copy completed successfully!`);
    res.status(200).json({
      success: true,
      message: `Subject "${newSubjectName}" copied successfully with all content`,
      data: {
        newSubjectId: newSubject._id,
        newSubjectName: newSubjectName,
        counts: {
          chapters: totalChapters,
          topics: totalTopics,
          tests: totalTests,
          questions: totalQuestions
        }
      }
    });

  } catch (err) {
    await session.abortTransaction();
    console.error("❌ Subject copy error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to copy subject: " + err.message 
    });
  } finally {
    session.endSession();
  }
};
