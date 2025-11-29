const express = require("express");
const router = express.Router();
const IIMCollege = require("../models/IIMCollege");
const IIMPredictor = require("../models/IIMPredictorSchema");
const User = require("../models/UserSchema");

function calculateAcademicsScore(classX, classXII, gradPercentage) {
    const xWeight = 0.25;
    const xiiWeight = 0.35;
    const gradWeight = 0.40;
    
    const normalizedX = Math.min(classX, 100);
    const normalizedXII = Math.min(classXII, 100);
    const normalizedGrad = Math.min(gradPercentage, 100);
    
    const rawScore = (normalizedX * xWeight) + (normalizedXII * xiiWeight) + (normalizedGrad * gradWeight);
    
    if (rawScore >= 90) return Math.min(100, 80 + (rawScore - 90) * 2);
    if (rawScore >= 80) return 60 + (rawScore - 80) * 2;
    if (rawScore >= 70) return 40 + (rawScore - 70) * 2;
    if (rawScore >= 60) return 20 + (rawScore - 60) * 2;
    return Math.max(0, rawScore / 3);
}

function calculateWorkExScore(workExperience) {
    const months = parseInt(workExperience) || 0;
    
    if (months === 0) return 5;
    if (months <= 6) return 15;
    if (months <= 12) return 30;
    if (months <= 24) return 50;
    if (months <= 36) return 70;
    if (months <= 48) return 85;
    if (months <= 60) return 95;
    return 100;
}

function calculateBucketPercentiles(academicsScore, workExScore, category, gender) {
    const baseScore = (academicsScore * 0.6) + (workExScore * 0.4);
    
    let categoryBonus = 0;
    if (category === "SC/ST") categoryBonus = 3;
    else if (category === "OBC") categoryBonus = 1.5;
    
    let genderBonus = 0;
    if (gender === "Female") genderBonus = 1;
    
    const topIimsBase = 99.5 - ((100 - baseScore) * 0.15) + categoryBonus + genderBonus;
    const topIimsAndFmsPercentile = Math.min(99.99, Math.max(85, topIimsBase));
    
    const iitsBase = 98 - ((100 - baseScore) * 0.2) + categoryBonus + genderBonus;
    const iitsAndIiftPercentile = Math.min(99.5, Math.max(80, iitsBase));
    
    const newerBase = 95 - ((100 - baseScore) * 0.25) + categoryBonus + genderBonus;
    const newerIimsPercentile = Math.min(99, Math.max(75, newerBase));
    
    return {
        topIimsAndFmsPercentile: parseFloat(topIimsAndFmsPercentile.toFixed(2)),
        iitsAndIiftPercentile: parseFloat(iitsAndIiftPercentile.toFixed(2)),
        newerIimsPercentile: parseFloat(newerIimsPercentile.toFixed(2))
    };
}

function determineEligibility(college, percentiles) {
    let bucketPercentile;
    
    switch (college.collegeGroup) {
        case "Top IIMs and FMS":
            bucketPercentile = percentiles.topIimsAndFmsPercentile;
            break;
        case "IITs and IIFT":
            bucketPercentile = percentiles.iitsAndIiftPercentile;
            break;
        case "Newer IIMs":
            bucketPercentile = percentiles.newerIimsPercentile;
            break;
        default:
            bucketPercentile = percentiles.newerIimsPercentile;
    }
    
    const targetPercentile = college.targetPercentile;
    const isEligible = bucketPercentile >= targetPercentile;
    
    const gap = bucketPercentile - targetPercentile;
    let callStatus = "Not Eligible";
    
    if (gap >= 2) {
        callStatus = "Likely Call";
    } else if (gap >= 0) {
        callStatus = "Borderline";
    } else if (gap >= -2) {
        callStatus = "Stretch";
    }
    
    return {
        isEligible,
        callStatus,
        bucketPercentile,
        gap: parseFloat(gap.toFixed(2))
    };
}

router.post("/evaluate", async (req, res) => {
    try {
        const {
            userId,
            category,
            gender,
            classX,
            classXII,
            discipline,
            graduation,
            gradPercentage,
            workExperience,
            takenCATBefore,
            catYear,
            interestedCourses
        } = req.body;
        
        if (!category || !gender || !classX || !classXII || !gradPercentage) {
            return res.status(400).json({
                success: false,
                message: "Required fields: category, gender, classX, classXII, gradPercentage"
            });
        }
        
        const academicsScore = calculateAcademicsScore(
            parseFloat(classX),
            parseFloat(classXII),
            parseFloat(gradPercentage)
        );
        
        const workExScore = calculateWorkExScore(workExperience);
        
        const percentiles = calculateBucketPercentiles(
            academicsScore,
            workExScore,
            category,
            gender
        );
        
        const colleges = await IIMCollege.find({ isActive: true })
            .sort({ collegeGroup: 1, displayOrder: 1, collegeName: 1 });
        
        const collegesWithEligibility = colleges.map(college => {
            const eligibility = determineEligibility(college, percentiles);
            return {
                _id: college._id,
                collegeGroup: college.collegeGroup,
                collegeName: college.collegeName,
                programName: college.programName,
                varcCutoff: college.varcCutoff,
                dilrCutoff: college.dilrCutoff,
                qaCutoff: college.qaCutoff,
                overallMinCutoff: college.overallMinCutoff,
                targetPercentile: college.targetPercentile,
                conversionCalls: college.conversionCalls,
                shortlistingUrl: college.shortlistingUrl,
                ...eligibility
            };
        });
        
        let userName = "Your";
        if (userId) {
            try {
                const user = await User.findById(userId).select("name");
                if (user && user.name) {
                    userName = user.name.split(" ")[0];
                }
            } catch (e) {
                console.log("Could not fetch user name:", e.message);
            }
            
            try {
                await IIMPredictor.findOneAndUpdate(
                    { userId },
                    {
                        userId,
                        category,
                        gender,
                        classX: parseFloat(classX),
                        classXII: parseFloat(classXII),
                        discipline: discipline || "",
                        graduation: graduation || "",
                        gradPercentage: parseFloat(gradPercentage),
                        workExperience: parseInt(workExperience) || 0,
                        takenCATBefore: takenCATBefore || "No",
                        catYear: parseInt(catYear) || new Date().getFullYear(),
                        interestedCourses: interestedCourses || []
                    },
                    { upsert: true, new: true }
                );
            } catch (e) {
                console.log("Could not save predictor data:", e.message);
            }
        }
        
        const eligibleCount = collegesWithEligibility.filter(c => c.isEligible).length;
        const likelyCallsCount = collegesWithEligibility.filter(c => c.callStatus === "Likely Call").length;
        
        res.json({
            success: true,
            userName,
            academicsScore: parseFloat(academicsScore.toFixed(1)),
            workExScore: parseFloat(workExScore.toFixed(1)),
            ...percentiles,
            colleges: collegesWithEligibility,
            summary: {
                totalColleges: collegesWithEligibility.length,
                eligibleColleges: eligibleCount,
                likelyCallsCount,
                borderlineCount: collegesWithEligibility.filter(c => c.callStatus === "Borderline").length,
                stretchCount: collegesWithEligibility.filter(c => c.callStatus === "Stretch").length
            }
        });
        
    } catch (error) {
        console.error("Error in IIM Predictor evaluation:", error);
        res.status(500).json({
            success: false,
            message: "Failed to evaluate profile"
        });
    }
});

router.get("/colleges", async (req, res) => {
    try {
        const colleges = await IIMCollege.find({ isActive: true })
            .sort({ collegeGroup: 1, displayOrder: 1, collegeName: 1 });
        
        res.json({ success: true, colleges });
    } catch (error) {
        console.error("Error fetching colleges:", error);
        res.status(500).json({ success: false, message: "Failed to fetch colleges" });
    }
});

module.exports = router;
