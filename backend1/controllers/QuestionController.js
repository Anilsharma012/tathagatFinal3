const mongoose = require("mongoose");
const Question = require("../models/test/Question");
const Test = require("../models/course/Test");




// ✅ Create Question
const createQuestion = async (req, res) => {
  try {
    const {
      testId,
      questionText,
      options,
      correctOption,
      explanation,
      difficulty,
      marks,
      negativeMarks,
      isActive
    } = req.body;

    // ✅ Validate required fields
    if (
      !testId ||
      !questionText ||
      !options ||
      !options.A ||
      !options.B ||
      !options.C ||
      !options.D ||
      !correctOption
    ) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing: testId, questionText, options.A/B/C/D, correctOption"
      });
    }

    // ✅ Validate correctOption
    if (!["A", "B", "C", "D"].includes(correctOption)) {
      return res.status(400).json({
        success: false,
        message: "Correct option must be A, B, C, or D"
      });
    }

    const question = new Question({
      testId,
      test: testId, // for backward compatibility
      questionText,
      options,
      correctOption,
      explanation: explanation || "",
      difficulty: difficulty || "Medium",
      marks: marks || 2,
      negativeMarks: negativeMarks || 0.66,
      isActive: isActive !== undefined ? isActive : true
    });

    await question.save();
    console.log("✅ Question created:", question._id);

    res.status(201).json({ success: true, question });

  } catch (err) {
    console.error("❌ Question creation error:", err.message);
    res.status(500).json({ success: false, message: "Failed to create question", error: err.message });
  }
};

// ✅ Get All Questions for a Test
const getQuestionsByTest = async (req, res) => {
  try {
    // Support both query parameter (?testId=) and path parameter (/:testId)
    const testId = req.query.testId || req.params.testId;

    if (!testId) {
      return res.status(400).json({ success: false, message: "Test ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(testId)) {
      return res.status(400).json({ success: false, message: "Invalid test ID" });
    }

    // Search by both testId and test for backward compatibility
    const questions = await Question.find({
      $or: [{ testId: testId }, { test: testId }]
    }).sort({ createdAt: 1 });

    res.status(200).json({ success: true, questions });

  } catch (err) {
    console.error("❌ Question fetch error:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch questions", error: err.message });
  }
};

// ✅ Update Question
const updateQuestion = async (req, res) => {
  try {
    const updated = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!updated) {
      return res.status(404).json({ success: false, message: "Question not found" });
    }

    res.status(200).json({ success: true, question: updated });

  } catch (err) {
    console.error("❌ Update error:", err.message);
    res.status(500).json({ success: false, message: "Update failed", error: err.message });
  }
};

// ✅ Delete Question
const deleteQuestion = async (req, res) => {
  try {
    const deleted = await Question.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Question not found" });
    }

    res.status(200).json({ success: true, message: "Question deleted" });

  } catch (err) {
    console.error("❌ Delete error:", err.message);
    res.status(500).json({ success: false, message: "Delete failed", error: err.message });
  }
};

// ✅ Bulk Upload Questions
const bulkUploadQuestions = async (req, res) => {
  try {
    const { testId, questions } = req.body;

    console.log('📤 Bulk uploading questions for test:', testId);
    console.log('📊 Questions count:', questions?.length);

    // Validate testId
    if (!testId || !mongoose.Types.ObjectId.isValid(testId)) {
      return res.status(400).json({
        success: false,
        message: "Valid testId is required"
      });
    }

    // Verify test exists in database
    const testExists = await Test.findById(testId);
    if (!testExists) {
      return res.status(404).json({
        success: false,
        message: "Test not found with the provided testId"
      });
    }

    // Validate questions array
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Questions array is required and must not be empty"
      });
    }

    // Validate and normalize each question
    const normalizedQuestions = [];
    const errors = [];

    questions.forEach((q, index) => {
      const rowNum = index + 2; // +2 because row 1 is header, and index is 0-based
      
      // Validate required fields
      if (!q.questionText || !q.questionText.trim()) {
        errors.push(`Row ${rowNum}: Question text is required`);
        return;
      }

      if (!q.optionA || !q.optionB || !q.optionC || !q.optionD) {
        errors.push(`Row ${rowNum}: All options (A, B, C, D) are required`);
        return;
      }

      // Normalize correct option
      let correctOption = String(q.correctOption || '').toUpperCase().trim();
      if (!['A', 'B', 'C', 'D'].includes(correctOption)) {
        errors.push(`Row ${rowNum}: Correct option must be A, B, C, or D (got: ${q.correctOption})`);
        return;
      }

      // Normalize difficulty
      let difficulty = String(q.difficulty || 'Medium').trim();
      const difficultyMap = {
        'easy': 'Easy',
        'medium': 'Medium',
        'hard': 'Hard',
        'difficult': 'Hard'
      };
      difficulty = difficultyMap[difficulty.toLowerCase()] || 'Medium';

      // Create normalized question object
      normalizedQuestions.push({
        testId,
        test: testId,
        questionText: q.questionText.trim(),
        direction: q.direction || '',
        options: {
          A: q.optionA.trim(),
          B: q.optionB.trim(),
          C: q.optionC.trim(),
          D: q.optionD.trim()
        },
        correctOption,
        explanation: q.explanation || '',
        difficulty,
        marks: parseFloat(q.marks) || 2,
        negativeMarks: parseFloat(q.negativeMarks) || 0.66,
        type: q.type || 'MCQ',
        order: parseInt(q.order) || (index + 1),
        isActive: true
      });
    });

    // If there are validation errors, return them
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation errors found",
        errors,
        validCount: normalizedQuestions.length,
        errorCount: errors.length
      });
    }

    // Insert all questions
    const insertedQuestions = await Question.insertMany(normalizedQuestions);

    console.log(`✅ Successfully uploaded ${insertedQuestions.length} questions`);

    res.status(201).json({
      success: true,
      message: `${insertedQuestions.length} questions uploaded successfully`,
      count: insertedQuestions.length,
      questions: insertedQuestions
    });

  } catch (err) {
    console.error("❌ Bulk upload error:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to upload questions",
      error: err.message
    });
  }
};

// ✅ Get Demo CSV Template
const getDemoTemplate = async (req, res) => {
  try {
    const demoData = [
      {
        questionText: "What is the capital of India?",
        optionA: "Mumbai",
        optionB: "Delhi",
        optionC: "Chennai",
        optionD: "Kolkata",
        correctOption: "B",
        explanation: "New Delhi is the capital of India, located in the National Capital Territory.",
        difficulty: "Easy",
        marks: 2,
        negativeMarks: 0.66
      },
      {
        questionText: "If 2x + 5 = 15, what is the value of x?",
        optionA: "3",
        optionB: "5",
        optionC: "7",
        optionD: "10",
        correctOption: "B",
        explanation: "2x + 5 = 15 => 2x = 10 => x = 5",
        difficulty: "Medium",
        marks: 2,
        negativeMarks: 0.66
      },
      {
        questionText: "In a class of 40 students, 25 play cricket and 20 play football. If 10 students play both, how many play neither?",
        optionA: "5",
        optionB: "10",
        optionC: "15",
        optionD: "0",
        correctOption: "A",
        explanation: "Using n(A∪B) = n(A) + n(B) - n(A∩B) = 25 + 20 - 10 = 35. Neither = 40 - 35 = 5",
        difficulty: "Hard",
        marks: 3,
        negativeMarks: 1
      }
    ];

    res.status(200).json({
      success: true,
      message: "Demo template data",
      demoData,
      columns: [
        "questionText",
        "optionA",
        "optionB",
        "optionC",
        "optionD",
        "correctOption",
        "explanation",
        "difficulty",
        "marks",
        "negativeMarks"
      ]
    });

  } catch (err) {
    console.error("❌ Demo template error:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to get demo template",
      error: err.message
    });
  }
};

module.exports = {
  createQuestion,
  getQuestionsByTest,
  updateQuestion,
  deleteQuestion,
  bulkUploadQuestions,
  getDemoTemplate
};
