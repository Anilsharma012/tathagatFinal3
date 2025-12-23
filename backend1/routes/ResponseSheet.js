const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const fs = require("fs");
const ResponseSheetSubmission = require("../models/ResponseSheetSubmission");

const router = express.Router();

// Multer setup for file uploads
const upload = multer({ dest: "uploads/" });



const predictPercentile = (score) => {
    if (score >= 320) return 99.9;
    if (score >= 300) return 99.5;
    if (score >= 280) return 98.0;
    if (score >= 260) return 95.0;
    if (score >= 240) return 90.0;
    if (score >= 220) return 85.0;
    if (score >= 200) return 75.0;
    if (score >= 180) return 60.0;
    return Math.max(40 - (200 - score) * 0.5, 10);
};




// ✅ Fetch User Details
router.post("/fetch-html", async (req, res) => {
    try {
        const { link } = req.body;
        if (!link) {
            return res.status(400).json({ error: "Response sheet link is required!" });
        }

        // ✅ Fetch HTML Page
        const { data } = await axios.get(link);
        const $ = cheerio.load(data);

        let userDetails = {};
        $("table").each((index, table) => {
            let text = $(table).text().trim();

            if (text.includes("Application No")) {
                userDetails.ApplicationNo = text.match(/Application No\s+(\d+)/)?.[1] || "";
                
                // ✅ Extract Candidate Name Properly
                let nameMatch = text.match(/Candidate Name\s+([\w\s]+)/);
                userDetails.CandidateName = nameMatch ? nameMatch[1].trim().replace(/Roll No.*/, '').trim() : "";

                userDetails.RollNo = text.match(/Roll No\.\s+(\w+)/)?.[1] || "";
                userDetails.TestDate = text.match(/Test Date\s+([\d\/]+)/)?.[1] || "";
                userDetails.TestTime = text.match(/Test Time\s+([\d:APM\s-]+)/)?.[1] || "";
                userDetails.Subject = text.match(/Subject\s+(\w+)/)?.[1] || "";
            }
        });

        return res.json({
            status: "success",
            userDetails,
        });

    } catch (error) {
        console.error("Error fetching response sheet:", error);
        res.status(500).json({ error: "Failed to fetch response sheet" });
    }
});




router.post("/fetch-questions", async (req, res) => {
    try {
        const { link, userId } = req.body;
        if (!link) {
            return res.status(400).json({ error: "Response sheet link is required!" });
        }

        console.log("📥 Fetching response sheet from:", link);

        // ✅ Fetch Full HTML with timeout and browser-like headers
        const { data } = await axios.get(link, {
            timeout: 60000, // 60 second timeout
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Cache-Control': 'no-cache',
            },
            maxRedirects: 5,
        });
        
        console.log("✅ Response sheet fetched successfully, parsing HTML...");
        const $ = cheerio.load(data);

        // ✅ Extract student details from HTML
        let studentDetails = {
            applicationNo: "",
            candidateName: "",
            rollNo: "",
            testDate: "",
            testTime: "",
            subject: ""
        };

        $("table").each((index, table) => {
            let text = $(table).text().trim();

            if (text.includes("Application No")) {
                studentDetails.applicationNo = text.match(/Application No\s+(\d+)/)?.[1] || "";
                
                let nameMatch = text.match(/Candidate Name\s+([A-Za-z\s]+?)(?=\s*Roll No)/);
                studentDetails.candidateName = nameMatch ? nameMatch[1].trim() : "";

                studentDetails.rollNo = text.match(/Roll No\.\s+(\w+)/)?.[1] || "";
                studentDetails.testDate = text.match(/Test Date\s+([\d\/]+)/)?.[1] || "";
                studentDetails.testTime = text.match(/Test Time\s+([\d:APM\s-]+)/)?.[1] || "";
                
                let subjectMatch = text.match(/Subject\s+([A-Za-z\s&]+?)(?=\s*(?:Test|$|\n))/i);
                studentDetails.subject = subjectMatch ? subjectMatch[1].trim() : "";
            }
        });

        // ✅ Save student details to database if we have valid data
        if (studentDetails.applicationNo && studentDetails.candidateName) {
            try {
                const existingSubmission = await ResponseSheetSubmission.findOne({
                    applicationNo: studentDetails.applicationNo,
                    rollNo: studentDetails.rollNo
                });

                if (!existingSubmission) {
                    const newSubmission = new ResponseSheetSubmission({
                        applicationNo: studentDetails.applicationNo,
                        candidateName: studentDetails.candidateName,
                        rollNo: studentDetails.rollNo,
                        subject: studentDetails.subject || "Unknown",
                        testDate: studentDetails.testDate,
                        testTime: studentDetails.testTime,
                        link: link,
                        userId: userId || null
                    });
                    await newSubmission.save();
                    console.log("✅ Student details saved to database:", studentDetails.candidateName);
                } else {
                    console.log("ℹ️ Student submission already exists:", studentDetails.applicationNo);
                }
            } catch (dbError) {
                console.error("⚠️ Error saving student details:", dbError.message);
            }
        }

        // ✅ Fix all image URLs
        $("img").each((index, img) => {
            let src = $(img).attr("src");
            if (src && !src.startsWith("http")) {
                $(img).attr("src", new URL(src, link).href); // ✅ Convert to full URL
            }
        });

        let fullHtmlContent = $("body").html(); // ✅ Extract full content (questions + images)

        // ✅ Extract Questions from HTML - CAT 2025 uses div.questionPnl for each question
        let extractedQuestions = [];
        
        // Try multiple selectors to find questions - CAT 2025 uses questionPnl divs
        let questionElements = $("div.questionPnl");
        console.log("🔍 Found", questionElements.length, "questionPnl elements");
        
        // Fallback to questionPnlTbl if questionPnl not found
        if (questionElements.length === 0) {
            questionElements = $("table.questionPnlTbl");
            console.log("🔍 Found", questionElements.length, "questionPnlTbl elements");
        }
        
        // Fallback to questionRowTbl for older formats
        if (questionElements.length === 0) {
            questionElements = $(".questionRowTbl");
            console.log("🔍 Found", questionElements.length, "questionRowTbl elements");
        }
        
        questionElements.each((index, element) => {
            const fullText = $(element).text();
            const elementHtml = $(element).html() || '';
            
            // Extract question text - look for Q.X pattern or first meaningful text
            let questionText = "";
            const qMatch = fullText.match(/Q\.\s*\d+/);
            if (qMatch) {
                questionText = fullText.substring(fullText.indexOf(qMatch[0]), fullText.indexOf(qMatch[0]) + 200).trim();
            } else {
                questionText = $(element).find("td").first().text().trim().substring(0, 200);
            }
            
            let options = [];
            let chosenOption = "";
            let correctAnswer = "";
            let status = "";
            let isCorrect = false;
            
            // ✅ CAT 2025 MCQ Format: Look for "Chosen Option" with number and check mark
            // Format: "Chosen Option : 2" with checkmark indicating correct
            const chosenOptionMatch = fullText.match(/Chosen\s*Option\s*:?\s*(\d+)/i);
            if (chosenOptionMatch) {
                chosenOption = chosenOptionMatch[1].trim();
                status = "Answered";
            }
            
            // Look for correct answer indicator - usually has a checkmark or "Right"
            // In CAT 2025, the correct option has a green checkmark
            const correctAnswerMatch = fullText.match(/Correct\s*Answer\s*:?\s*(\d+)/i);
            if (correctAnswerMatch) {
                correctAnswer = correctAnswerMatch[1].trim();
            }
            
            // ✅ Also look for "Right Option" pattern
            const rightOptionMatch = fullText.match(/Right\s*Option\s*:?\s*(\d+)/i);
            if (rightOptionMatch && !correctAnswer) {
                correctAnswer = rightOptionMatch[1].trim();
            }
            
            // ✅ CAT 2025 TITA Format: "Given Answer" and "Possible Answer"
            const givenAnswerMatch = fullText.match(/Given\s*Answer\s*:?\s*([^\s\n\r]+)/i);
            if (givenAnswerMatch) {
                const answer = givenAnswerMatch[1].trim();
                if (answer && answer !== '--' && answer !== '-' && answer !== '—') {
                    chosenOption = answer;
                    status = "Answered";
                } else {
                    status = "Not Answered";
                }
            }
            
            const possibleAnswerMatch = fullText.match(/Possible\s*Answer\s*:?\s*([^\s\n\r]+)/i);
            if (possibleAnswerMatch) {
                correctAnswer = possibleAnswerMatch[1].trim();
            }
            
            // ✅ Look for status if not yet determined
            if (!status) {
                if (fullText.includes("Not Answered")) {
                    status = "Not Answered";
                } else if (fullText.includes("Answered")) {
                    status = "Answered";
                } else if (fullText.includes("Marked for Review")) {
                    status = "Marked for Review";
                }
            }
            
            // ✅ Parse from table rows - look for label: value pattern
            $(element).find("tr, .menu-tbl tr").each((i, row) => {
                const rowText = $(row).text().trim();
                const cells = $(row).find("td");
                
                if (cells.length >= 2) {
                    const labelCell = $(cells[0]).text().trim().toLowerCase();
                    const valueCell = $(cells[1]).text().trim();
                    
                    if (labelCell.includes("chosen option") && !chosenOption) {
                        const numMatch = valueCell.match(/(\d+)/);
                        if (numMatch) {
                            chosenOption = numMatch[1];
                            status = "Answered";
                        }
                    } else if ((labelCell.includes("correct answer") || labelCell.includes("right option")) && !correctAnswer) {
                        const numMatch = valueCell.match(/(\d+)/);
                        if (numMatch) {
                            correctAnswer = numMatch[1];
                        }
                    } else if (labelCell.includes("given answer") && !chosenOption) {
                        const val = valueCell.trim();
                        if (val && val !== '--' && val !== '-') {
                            chosenOption = val;
                            status = "Answered";
                        } else {
                            status = "Not Answered";
                        }
                    } else if (labelCell.includes("possible answer") && !correctAnswer) {
                        correctAnswer = valueCell.trim();
                    }
                }
            });
            
            // ✅ CAT 2025 special parsing: Look for checkmark images to determine correctness
            // Check for visual indicators of correct/incorrect - more comprehensive patterns
            const hasCorrectIndicator = elementHtml.includes('right.gif') || 
                                        elementHtml.includes('correct.gif') || 
                                        elementHtml.includes('tick') ||
                                        elementHtml.includes('check') ||
                                        elementHtml.includes('✓') ||
                                        elementHtml.includes('✔') ||
                                        elementHtml.includes('&#10003') ||
                                        elementHtml.includes('&#10004') ||
                                        elementHtml.includes('#0f0') || // Green color
                                        elementHtml.includes('#00ff00') ||
                                        elementHtml.includes('#008000') ||
                                        elementHtml.includes('rgb(0, 128, 0)') ||
                                        elementHtml.includes('rgb(0,128,0)') ||
                                        elementHtml.includes('green') ||
                                        elementHtml.includes('success') ||
                                        elementHtml.includes('rightAns') ||
                                        elementHtml.includes('right-ans') ||
                                        fullText.toLowerCase().includes('correct');
            
            const hasWrongIndicator = elementHtml.includes('wrong.gif') || 
                                       elementHtml.includes('cross.gif') ||
                                       elementHtml.includes('wrongAns') ||
                                       elementHtml.includes('wrong-ans') ||
                                       elementHtml.includes('#f00') || // Red color
                                       elementHtml.includes('#ff0000') ||
                                       elementHtml.includes('rgb(255, 0, 0)') ||
                                       elementHtml.includes('rgb(255,0,0)') ||
                                       elementHtml.includes('red') ||
                                       elementHtml.includes('error') ||
                                       elementHtml.includes('✗') ||
                                       elementHtml.includes('✘') ||
                                       elementHtml.includes('&#10007') ||
                                       elementHtml.includes('&#10008');
            
            // ✅ Log first few questions' HTML structure for debugging
            if (index < 3) {
                console.log("🔍 Q" + (index + 1) + " HTML snippet:", elementHtml.substring(0, 500));
            }
            
            // ✅ If chosenOption exists but no correctAnswer, try to determine correctness from visual indicators
            if (chosenOption && !correctAnswer) {
                if (hasCorrectIndicator && !hasWrongIndicator) {
                    isCorrect = true;
                    correctAnswer = chosenOption; // Set correct answer to chosen for consistency
                    console.log("✅ Q" + (index + 1) + " detected as CORRECT via visual indicator");
                } else if (hasWrongIndicator) {
                    isCorrect = false;
                    console.log("❌ Q" + (index + 1) + " detected as WRONG via visual indicator");
                } else {
                    // Default to wrong if we can't detect either way
                    isCorrect = false;
                    console.log("⚠️ Q" + (index + 1) + " no indicator found, defaulting to wrong");
                }
            }
            
            // ✅ Determine if answer is correct
            if (chosenOption && correctAnswer) {
                const normalizedChosen = chosenOption.toString().trim().toLowerCase();
                const normalizedCorrect = correctAnswer.toString().trim().toLowerCase();
                isCorrect = normalizedChosen === normalizedCorrect;
            }
            
            // Only add if we have meaningful data (skip empty/header rows)
            if (status || chosenOption || correctAnswer) {
                console.log("🔍 Q" + (index + 1) + ":", { 
                    chosenOption, 
                    correctAnswer,
                    status,
                    isCorrect
                });
            
                extractedQuestions.push({ 
                    question: questionText, 
                    options, 
                    chosenOption, 
                    correctAnswer,
                    status,
                    isCorrect
                });
            }
        });
        
        console.log("✅ Extracted", extractedQuestions.length, "questions");
        console.log("📊 Summary:", {
            total: extractedQuestions.length,
            answered: extractedQuestions.filter(q => q.status === "Answered").length,
            correct: extractedQuestions.filter(q => q.isCorrect).length
        });

        return res.json({
            status: "success",
            fullHtmlContent,
            questions: extractedQuestions,
            studentDetails: studentDetails
        });

    } catch (error) {
        console.error("❌ Error fetching full HTML:", error.message);
        
        // Provide helpful error messages
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            return res.status(504).json({ 
                error: "The response sheet server is taking too long to respond. Please try again later.",
                code: "TIMEOUT"
            });
        }
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            return res.status(502).json({ 
                error: "Unable to reach the response sheet server. Please check the link.",
                code: "SERVER_UNREACHABLE"
            });
        }
        if (error.response && error.response.status === 403) {
            return res.status(403).json({ 
                error: "Access to the response sheet is forbidden. The link may have expired.",
                code: "ACCESS_DENIED"
            });
        }
        if (error.response && error.response.status === 404) {
            return res.status(404).json({ 
                error: "Response sheet not found. The link may have expired or is incorrect.",
                code: "NOT_FOUND"
            });
        }
        if (error.response && (error.response.status >= 400 && error.response.status < 500)) {
            return res.status(error.response.status).json({ 
                error: `Unable to access response sheet (Error ${error.response.status}). Please verify the link.`,
                code: "CLIENT_ERROR"
            });
        }
        
        res.status(500).json({ error: "Failed to fetch response sheet. The external server may be blocking our request. Please try again later." });
    }
});








router.post("/fetch-pdf", upload.single("pdfFile"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "Please upload a valid PDF file." });
    }

    try {
        const pdfBuffer = fs.readFileSync(req.file.path);
        const pdfData = await pdfParse(pdfBuffer);

        // ✅ Extracted text from PDF
        const extractedText = pdfData.text.split("\n").map(line => line.trim()).filter(line => line);

        let questions = [];
        let currentQuestion = null;

        // ✅ Loop through extracted text
        extractedText.forEach((line, index) => {
            if (line.startsWith("Q.")) {
                // ✅ New question detected
                if (currentQuestion) {
                    questions.push(currentQuestion);
                }
                currentQuestion = { "Question No": index + 1, "Question": line, "Options": [], "Your Answer": "", "Correct Answer": "" };
            } else if (line.startsWith("Your Answer :")) {
                currentQuestion["Your Answer"] = line.replace("Your Answer :", "").trim();
            } else if (line.startsWith("Correct Answer :")) {
                currentQuestion["Correct Answer"] = line.replace("Correct Answer :", "").trim();
            } else if (currentQuestion && line.match(/^\(\d+\)/)) {
                currentQuestion["Options"].push(line);
            }
        });

        // ✅ Push last question if any
        if (currentQuestion) {
            questions.push(currentQuestion);
        }

        res.json({ type: "PDF", questions });
    } catch (error) {
        console.error("Error extracting PDF response sheet:", error);
        res.status(500).json({ error: "Failed to extract data from PDF file." });
    }
});



router.post("/predict-percentile", (req, res) => {
    const { totalScore } = req.body;

    if (totalScore === undefined) {
        return res.status(400).json({ error: "Total score is required!" });
    }

    const predictedPercentile = predictPercentile(totalScore);
    res.json({ totalScore, predictedPercentile });
});




// ✅ Admin: Get all response sheet submissions
router.get("/admin/submissions", async (req, res) => {
    try {
        const { page = 1, limit = 20, search = "" } = req.query;
        
        let query = {};
        if (search) {
            query = {
                $or: [
                    { candidateName: { $regex: search, $options: "i" } },
                    { applicationNo: { $regex: search, $options: "i" } },
                    { rollNo: { $regex: search, $options: "i" } },
                    { subject: { $regex: search, $options: "i" } }
                ]
            };
        }

        const total = await ResponseSheetSubmission.countDocuments(query);
        const submissions = await ResponseSheetSubmission.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate("userId", "name email phoneNumber");

        res.json({
            success: true,
            submissions,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error("❌ Error fetching submissions:", error);
        res.status(500).json({ success: false, error: "Failed to fetch submissions" });
    }
});

// ✅ Admin: Delete a response sheet submission
router.delete("/admin/submissions/:id", async (req, res) => {
    try {
        const { id } = req.params;
        
        const deleted = await ResponseSheetSubmission.findByIdAndDelete(id);
        
        if (!deleted) {
            return res.status(404).json({ success: false, error: "Submission not found" });
        }

        res.json({
            success: true,
            message: "Submission deleted successfully"
        });
    } catch (error) {
        console.error("❌ Error deleting submission:", error);
        res.status(500).json({ success: false, error: "Failed to delete submission" });
    }
});

// ✅ Admin: Delete multiple submissions
router.post("/admin/submissions/bulk-delete", async (req, res) => {
    try {
        const { ids } = req.body;
        
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, error: "No IDs provided" });
        }

        const result = await ResponseSheetSubmission.deleteMany({ _id: { $in: ids } });

        res.json({
            success: true,
            message: `${result.deletedCount} submissions deleted successfully`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error("❌ Error bulk deleting submissions:", error);
        res.status(500).json({ success: false, error: "Failed to delete submissions" });
    }
});

module.exports = router;
