const sqlite3 = require("sqlite3").verbose();
const DB_PATH = "./db/coding_test.db";

// Connect to the database, create it if it doesn't exist
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error("Error opening database", err.message);
  } else {
    console.log("Connected to the SQLite database.");
    createTable();
  }
});

// Create the results table if it doesn't already exist
const createTable = () => {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        studentName TEXT NOT NULL,
        rollNumber TEXT,
        totalScore INTEGER NOT NULL,
        maxScore INTEGER NOT NULL,
        codingScore INTEGER DEFAULT 0,
        codingMaxScore INTEGER DEFAULT 75,
        mcqScore INTEGER DEFAULT 0,
        mcqMaxScore INTEGER DEFAULT 25,
        percentage REAL NOT NULL,
        results TEXT NOT NULL,
        mcqResults TEXT,
        timestamp TEXT NOT NULL
    );`;
  db.run(createTableSql, (err) => {
    if (err) {
      console.error("Error creating table", err.message);
    } else {
      console.log("Results table is ready.");
    }
  });
};

// Function to save a new test result
const saveResult = (result) => {
  return new Promise((resolve, reject) => {
    const insertSql = `
        INSERT INTO results (
          studentName, rollNumber, totalScore, maxScore, 
          codingScore, codingMaxScore, mcqScore, mcqMaxScore,
          percentage, results, mcqResults, timestamp
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;

    const params = [
      result.name,
      result.rollNumber || null,
      result.totalScore,
      result.maxScore,
      result.codingScore || 0,
      result.codingMaxScore || 75,
      result.mcqScore || 0,
      result.mcqMaxScore || 25,
      (result.totalScore / result.maxScore) * 100,
      JSON.stringify(result.results || {}),
      JSON.stringify(result.mcqResults || {}),
      result.timestamp,
    ];

    db.run(insertSql, params, function (err) {
      if (err) {
        console.error("Error saving result to database", err.message);
        reject(err);
      } else {
        console.log(`A new result has been added with rowid ${this.lastID}`);
        resolve({ id: this.lastID, ...result });
      }
    });
  });
};

// Function to retrieve all test results
const getResults = () => {
  return new Promise((resolve, reject) => {
    const selectAllSql = `SELECT * FROM results ORDER BY timestamp DESC;`;
    db.all(selectAllSql, [], (err, rows) => {
      if (err) {
        console.error("Error fetching results from database", err.message);
        reject(err);
      } else {
        // Parse the JSON strings back into objects and map studentName to name
        const results = rows.map((row) => ({
          ...row,
          name: row.studentName, // Map studentName to name for consistency
          results: JSON.parse(row.results || "{}"),
          mcqResults: JSON.parse(row.mcqResults || "{}"),
        }));
        resolve(results);
      }
    });
  });
};

// Function to clear all results (for testing/reset purposes)
const clearResults = () => {
  return new Promise((resolve, reject) => {
    db.run("DELETE FROM results", function (err) {
      if (err) {
        reject(err);
      } else {
        // Reset the auto-increment counter
        db.run(
          "DELETE FROM sqlite_sequence WHERE name='results'",
          function (resetErr) {
            if (resetErr) {
              console.log("Warning: Could not reset ID counter");
            }
            resolve({
              message: "Database cleared successfully",
              deletedCount: this.changes,
            });
          }
        );
      }
    });
  });
};

module.exports = {
  saveResult,
  getResults,
  clearResults,
};
