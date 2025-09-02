const express = require("express");
const { adminAuth } = require("../middleware/auth");
const { getResults, clearResults, deleteSubmission } = require("../controllers/adminController");

const router = express.Router();

// Admin routes (all require authentication)
router.get("/results", adminAuth, getResults);
router.delete("/results/clear", adminAuth, clearResults);
router.delete("/results/:id", adminAuth, deleteSubmission);

module.exports = router;