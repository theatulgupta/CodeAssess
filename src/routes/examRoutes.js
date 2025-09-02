const express = require("express");
const { submissionLimiter, testCodeLimiter } = require("../middleware/rateLimiter");
const { submitExam, checkSubmission, testCode } = require("../controllers/examController");

const router = express.Router();

// Exam routes
router.post("/submit", submissionLimiter, submitExam);
router.post("/check-submission", checkSubmission);
router.post("/test-code", testCodeLimiter, testCode);

module.exports = router;