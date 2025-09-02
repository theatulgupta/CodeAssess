const db = require("../../database");

// Get all results
async function getResults(req, res) {
  try {
    const results = await db.getResults();
    res.json(results);
  } catch (error) {
    res.status(500).json({ 
      error: "Failed to load results", 
      details: error.message 
    });
  }
}

// Clear all results
async function clearResults(req, res) {
  try {
    const result = await db.clearResults();
    res.json({
      success: true,
      message: result.message,
      deletedCount: result.deletedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ 
      error: "Failed to clear results", 
      details: error.message 
    });
  }
}

// Delete individual submission
async function deleteSubmission(req, res) {
  try {
    const { id } = req.params;
    const result = await db.deleteResult(id);
    res.json({
      success: true,
      message: "Submission deleted successfully",
      deletedId: id,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ 
      error: "Failed to delete submission", 
      details: error.message 
    });
  }
}

module.exports = {
  getResults,
  clearResults,
  deleteSubmission,
};