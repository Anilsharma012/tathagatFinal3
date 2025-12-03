const express = require("express");
const mongoose = require("mongoose");
const User=require("../models/UserSchema")

const IIMPredictor =  require("../models/IIMPredictorSchema")
const { adminAuth } = require("../middleware/authMiddleware");

const router=express.Router()



// ✅ POST Route to Save IIM Predictor Data
router.post("/iim-predictor", async (req, res) => {
    try {
        const { userId, category, gender, classX, classXII, discipline, graduation, gradPercentage, workExperience, takenCATBefore, catYear, interestedCourses } = req.body;

        // Check only truly required fields
        if (!userId || !category || !gender || !classX || !classXII || !discipline || !graduation || !gradPercentage || !takenCATBefore) {
            return res.status(400).json({ 
                message: "Please fill all required fields: Category, Gender, 10th%, 12th%, Discipline, Degree, Graduation% and CAT status." 
            });
        }

        // ✅ Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            console.log('❌ Invalid ObjectId format for userId:', userId);
            return res.status(400).json({
                success: false,
                message: "Invalid user ID. Please login with a valid account to submit the form."
            });
        }

        // Convert string values to proper types
        const parsedData = {
            userId,
            category,
            gender,
            classX: parseFloat(classX) || 0,
            classXII: parseFloat(classXII) || 0,
            discipline,
            graduation,
            gradPercentage: parseFloat(gradPercentage) || 0,
            workExperience: parseInt(workExperience) || 0,
            takenCATBefore,
            catYear: catYear ? parseInt(catYear) : null,
            interestedCourses: Array.isArray(interestedCourses) ? interestedCourses : []
        };

        // ✅ Check if the user already has an entry
        let existingPrediction = await IIMPredictor.findOne({ userId });

        if (existingPrediction) {
            // ✅ Update existing entry
            Object.assign(existingPrediction, parsedData);
            existingPrediction.updatedAt = new Date();

            await existingPrediction.save();
            return res.status(200).json({ message: "Data updated successfully!", data: existingPrediction });
        }

        // ✅ If no existing entry, create new
        const newPrediction = new IIMPredictor(parsedData);

        await newPrediction.save();
        res.status(201).json({ message: "Data saved successfully!", data: newPrediction });

    } catch (error) {
        console.error("❌ Error saving/updating data:", error);
        res.status(500).json({ message: "Server error. Please try again later." });
    }
});


router.get("/iim-predictor/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        console.log('🔍 IIM Predictor request for userId:', userId);

        if (!userId) {
            return res.status(400).json({ message: "❌ userId is missing in the request!" });
        }

        // ✅ Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            console.log('❌ Invalid ObjectId format:', userId);
            return res.status(400).json({
                success: false,
                message: "❌ Invalid userId format!"
            });
        }

        // ✅ Find the user's submitted IIM predictor data
        const predictionData = await IIMPredictor.findOne({ userId });

        if (!predictionData) {
            console.log('⚠️ No prediction data found for userId:', userId);
            return res.status(404).json({ message: "No data found for this user!" });
        }

        // ✅ Fetch user name using `userId`
        let user = null;
        try {
            user = await User.findById(userId).select("name");
        } catch (userError) {
            console.error('❌ Error fetching user:', userError);
            // Continue without user name if user fetch fails
        }

        if (!user) {
            console.log('⚠️ User not found for userId:', userId);
            // Return prediction data without user name instead of failing
            return res.status(200).json({
                success: true,
                data: {
                    ...predictionData._doc,
                    name: 'Unknown User'
                }
            });
        }

        // ✅ Merge User Name into Response
        const responseData = {
            ...predictionData._doc,  // Predictor Data
            name: user.name           // User Name
        };

        console.log("✅ Data Found:", responseData);
        res.status(200).json(responseData);

    } catch (error) {
        console.error("❌ Error in IIM Predictor route:", error);
        console.error("❌ Error stack:", error.stack);
        res.status(500).json({
            success: false,
            message: "Server error. Please try again later.",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});




router.post("/submit-cmat-score", async (req, res) => {
    try {
        const { userId, qtCorrect, qtWrong, lrCorrect, lrWrong, lcCorrect, lcWrong, gaCorrect, gaWrong } = req.body;

        if (!userId) {
            return res.status(400).json({ message: "❌ User ID is required!" });
        }

        // ✅ Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            console.log('❌ Invalid ObjectId format for userId:', userId);
            return res.status(400).json({
                success: false,
                message: "Invalid user ID. Please login with a valid account."
            });
        }

        // ✅ Score Calculation Logic
        const qt = (qtCorrect * 4) - (qtWrong * 1);
        const lr = (lrCorrect * 4) - (lrWrong * 1);
        const lc = (lcCorrect * 4) - (lcWrong * 1);
        const ga = (gaCorrect * 4) - (gaWrong * 1);
        const totalScore = qt + lr + lc + ga;

        // ✅ Predicted Percentile Logic (Using Historical Trends)
        let predictedPercentile = 0;
        if (totalScore >= 300) predictedPercentile = 99;
        else if (totalScore >= 250) predictedPercentile = 95;
        else if (totalScore >= 200) predictedPercentile = 85;
        else if (totalScore >= 150) predictedPercentile = 75;
        else if (totalScore >= 100) predictedPercentile = 60;
        else predictedPercentile = 40;

        // ✅ Find User's Prediction Entry
        let predictor = await IIMPredictor.findOne({ userId });

        if (!predictor) {
            return res.status(404).json({ message: "❌ No user data found, please complete registration first." });
        }

        // ✅ Update User's Scores & Prediction
        predictor.qt = qt;
        predictor.lr = lr;
        predictor.lc = lc;
        predictor.ga = ga;
        predictor.totalScore = totalScore;
        predictor.predictedPercentile = predictedPercentile;

        await predictor.save();

        res.status(200).json({
            message: "✅ CMAT Scores & Percentile Saved Successfully!",
            qt, lr, lc, ga,
            totalScore,
            predictedPercentile
        });

    } catch (error) {
        console.error("❌ Error calculating CMAT scores:", error);
        res.status(500).json({ message: "❌ Server error, please try again later." });
    }
});

// ✅ CMAT Score Fetch API
router.get("/get-cmat-score/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ message: "❌ User ID is required!" });
        }

        // ✅ Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID format."
            });
        }

        const predictor = await IIMPredictor.findOne({ userId });

        if (!predictor) {
            return res.status(404).json({ message: "❌ No CMAT data found for this user!" });
        }

        res.status(200).json({
            qt: predictor.qt,
            lr: predictor.lr,
            lc: predictor.lc,
            ga: predictor.ga,
            totalScore: predictor.totalScore,
            predictedPercentile: predictor.predictedPercentile
        });

    } catch (error) {
        console.error("❌ Error fetching CMAT scores:", error);
        res.status(500).json({ message: "❌ Server error, please try again later." });
    }
});

// ✅ Admin API - Get all student IIM Predictor submissions
router.get("/admin/all-submissions", adminAuth, async (req, res) => {
    try {
        const { search, category, gender, page = 1, limit = 20 } = req.query;
        
        let filter = {};
        
        if (category) {
            filter.category = category;
        }
        
        if (gender) {
            filter.gender = gender;
        }
        
        // Get all submissions with user details
        const submissions = await IIMPredictor.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));
        
        // Get user details for each submission
        const submissionsWithUserDetails = await Promise.all(
            submissions.map(async (submission) => {
                let userName = "Unknown User";
                let userEmail = "";
                let userPhone = "";
                
                try {
                    const user = await User.findById(submission.userId).select("name email phone");
                    if (user) {
                        userName = user.name || "Unknown User";
                        userEmail = user.email || "";
                        userPhone = user.phone || "";
                    }
                } catch (err) {
                    console.error("Error fetching user:", err);
                }
                
                return {
                    _id: submission._id,
                    userId: submission.userId,
                    userName,
                    userEmail,
                    userPhone,
                    category: submission.category,
                    gender: submission.gender,
                    classX: submission.classX,
                    classXII: submission.classXII,
                    discipline: submission.discipline,
                    graduation: submission.graduation,
                    gradPercentage: submission.gradPercentage,
                    workExperience: submission.workExperience,
                    takenCATBefore: submission.takenCATBefore,
                    catYear: submission.catYear,
                    interestedCourses: submission.interestedCourses,
                    totalScore: submission.totalScore,
                    predictedPercentile: submission.predictedPercentile,
                    createdAt: submission.createdAt,
                    updatedAt: submission.updatedAt
                };
            })
        );
        
        // Apply search filter on user details
        let filteredSubmissions = submissionsWithUserDetails;
        if (search) {
            const searchLower = search.toLowerCase();
            filteredSubmissions = submissionsWithUserDetails.filter(sub => 
                sub.userName.toLowerCase().includes(searchLower) ||
                sub.userEmail.toLowerCase().includes(searchLower) ||
                sub.userPhone.includes(search)
            );
        }
        
        const totalCount = await IIMPredictor.countDocuments(filter);
        
        res.status(200).json({
            success: true,
            data: filteredSubmissions,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / limit),
                totalCount,
                hasMore: page * limit < totalCount
            }
        });
        
    } catch (error) {
        console.error("❌ Error fetching all submissions:", error);
        res.status(500).json({ 
            success: false, 
            message: "Server error fetching submissions." 
        });
    }
});

// ✅ Admin API - Get single submission detail
router.get("/admin/submission/:id", adminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid submission ID" });
        }
        
        const submission = await IIMPredictor.findById(id);
        
        if (!submission) {
            return res.status(404).json({ success: false, message: "Submission not found" });
        }
        
        let user = null;
        try {
            user = await User.findById(submission.userId).select("name email phone");
        } catch (err) {
            console.error("Error fetching user:", err);
        }
        
        res.status(200).json({
            success: true,
            data: {
                ...submission._doc,
                userName: user?.name || "Unknown User",
                userEmail: user?.email || "",
                userPhone: user?.phone || ""
            }
        });
        
    } catch (error) {
        console.error("❌ Error fetching submission:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

module.exports = router;
