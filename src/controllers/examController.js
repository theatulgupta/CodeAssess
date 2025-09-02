const db = require("../../database");
const { autoGrade, gradeMCQ } = require("../services/gradingService");

// Submit exam
async function submitExam(req, res) {
  const startTime = Date.now();
  const { name, rollNumber, answers, mcqAnswers: studentMCQAnswers, tabSwitchCount } = req.body;

  if (!name || name.trim() === "") {
    return res.status(400).json({
      error: "Missing student name",
      details: "Student name is required for submission",
    });
  }

  if (!rollNumber || !rollNumber.match(/^25MCS[AS]\d{2}$/)) {
    return res.status(400).json({
      error: "Invalid roll number format",
      details: "Roll number must be in format 25MCSXXX",
    });
  }

  try {
    // Check for duplicate submission
    const existingResults = await db.getResults();
    const duplicate = existingResults.find(r => r.rollNumber === rollNumber);
    if (duplicate) {
      return res.status(409).json({
        error: "Duplicate submission",
        details: "This student has already submitted",
        existing: duplicate
      });
    }

    // Grade coding questions with optimized timeout
    const codingResult = answers
      ? await Promise.race([
          autoGrade(name, answers),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Server busy, please retry')), 30000)
          )
        ])
      : {
          totalScore: 0,
          maxScore: 100,
          results: {},
        };

    const mcqResult = gradeMCQ(studentMCQAnswers);

    const finalResult = {
      name,
      rollNumber,
      totalScore: codingResult.totalScore,
      maxScore: codingResult.maxScore,
      codingScore: codingResult.totalScore,
      codingMaxScore: codingResult.maxScore,
      mcqScore: 0,
      mcqMaxScore: 0,
      results: codingResult.results,
      mcqResults: {},
      submittedCode: answers || {},
      tabSwitchCount: tabSwitchCount || 0,
      timestamp: new Date().toISOString(),
    };

    const savedResult = await db.saveResult(finalResult);
    
    // Log performance metrics
    const processingTime = Date.now() - startTime;
    console.log(`✅ Submission processed: ${rollNumber} in ${processingTime}ms`);
    
    res.status(201).json({
      ...savedResult,
      processingTime
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`❌ Submission failed: ${req.body.rollNumber} in ${processingTime}ms -`, error.message);
    
    if (error.message.includes('timeout') || error.message.includes('busy')) {
      res.status(503).json({ 
        error: "Server busy", 
        details: "High load detected. Please wait 10 seconds and try again.",
        retryAfter: 10
      });
    } else if (error.message.includes('Duplicate')) {
      res.status(409).json({ 
        error: "Already submitted", 
        details: error.message
      });
    } else {
      res.status(500).json({ 
        error: "Processing failed", 
        details: "Please try again in a moment"
      });
    }
  }
}

// Check if student already submitted
async function checkSubmission(req, res) {
  const { rollNumber } = req.body;
  
  if (!rollNumber) {
    return res.status(400).json({ error: "Roll number is required" });
  }
  
  try {
    const results = await db.getResults();
    const existingSubmission = results.find(r => r.rollNumber === rollNumber);
    
    if (existingSubmission) {
      res.json({
        alreadySubmitted: true,
        submission: existingSubmission
      });
    } else {
      res.json({
        alreadySubmitted: false
      });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to check submission status" });
  }
}

// Test code
async function testCode(req, res) {
  const { questionNumber, code, studentName } = req.body;
  
  if (!questionNumber || !code) {
    return res.status(400).json({ error: "Missing question number or code" });
  }
  
  try {
    const result = await autoGrade(studentName || "test", { [questionNumber]: code });
    const questionResult = result.results[questionNumber];
    
    if (questionResult) {
      res.json(questionResult);
    } else {
      res.json({ error: "No test results available" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  submitExam,
  checkSubmission,
  testCode,
};