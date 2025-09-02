const rateLimit = require("express-rate-limit");

// General rate limiter
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 1000, // Increased for exam load
  message: "Too many requests, please wait",
  standardHeaders: false,
  legacyHeaders: false,
});

// Submission-specific rate limiter
const submissionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // Max 3 submissions per minute per IP
  message: { error: "Too many submission attempts" },
  standardHeaders: false,
  legacyHeaders: false,
});

// Test code rate limiter
const testCodeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10, // Limit test runs
  message: { error: "Too many test runs" }
});

module.exports = {
  limiter,
  submissionLimiter,
  testCodeLimiter,
};