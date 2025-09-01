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
        rollNumber TEXT UNIQUE,
        totalScore INTEGER NOT NULL,
        maxScore INTEGER NOT NULL,
        codingScore INTEGER DEFAULT 0,
        codingMaxScore INTEGER DEFAULT 75,
        mcqScore INTEGER DEFAULT 0,
        mcqMaxScore INTEGER DEFAULT 25,
        percentage REAL NOT NULL,
        results TEXT NOT NULL,
        mcqResults TEXT,
        submittedCode TEXT,
        tabSwitchCount INTEGER DEFAULT 0,
        timestamp TEXT NOT NULL
    );`;
  
  // Optimize database for high concurrency
  db.run("PRAGMA journal_mode = WAL");
  db.run("PRAGMA synchronous = NORMAL");
  db.run("PRAGMA cache_size = 10000");
  db.run("PRAGMA temp_store = memory");
  
  db.run(createTableSql, (err) => {
    if (err) {
      console.error("Error creating table", err.message);
    } else {
      console.log("Results table optimized for high load.");
      // Create index for faster lookups
      db.run("CREATE INDEX IF NOT EXISTS idx_rollNumber ON results(rollNumber)", () => {});
      db.run("CREATE INDEX IF NOT EXISTS idx_timestamp ON results(timestamp)", () => {});
      db.run("ALTER TABLE results ADD COLUMN submittedCode TEXT", (err) => {
        if (err && !err.message.includes("duplicate column name")) {
          console.error("Error adding submittedCode column:", err.message);
        }
      });
      db.run("ALTER TABLE results ADD COLUMN tabSwitchCount INTEGER DEFAULT 0", (err) => {
        if (err && !err.message.includes("duplicate column name")) {
          console.error("Error adding tabSwitchCount column:", err.message);
        }
      });
    }
  });
};

// Optimized save with connection pooling
const saveResult = (result) => {
  return new Promise((resolve, reject) => {
    const insertSql = `
        INSERT INTO results (
          studentName, rollNumber, totalScore, maxScore, 
          codingScore, codingMaxScore, mcqScore, mcqMaxScore,
          percentage, results, mcqResults, submittedCode, tabSwitchCount, timestamp
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;

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
      JSON.stringify(result.submittedCode || {}),
      result.tabSwitchCount || 0,
      result.timestamp,
    ];

    // Use immediate mode for faster writes
    db.run("PRAGMA synchronous = NORMAL");
    db.run("PRAGMA journal_mode = WAL");
    
    db.run(insertSql, params, function (err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint')) {
          reject(new Error('Duplicate submission detected'));
        } else {
          console.error("Database error:", err.message);
          reject(new Error('Database temporarily unavailable'));
        }
      } else {
        resolve({ id: this.lastID, ...result });
      }
    });
  });
};

// Optimized results retrieval with caching
let resultsCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5000; // 5 seconds

const getResults = () => {
  return new Promise((resolve, reject) => {
    const now = Date.now();
    
    // Return cached results if still valid
    if (resultsCache && (now - cacheTimestamp) < CACHE_DURATION) {
      return resolve(resultsCache);
    }
    
    const selectAllSql = `SELECT * FROM results ORDER BY totalScore DESC, timestamp ASC;`;
    db.all(selectAllSql, [], (err, rows) => {
      if (err) {
        console.error("Error fetching results:", err.message);
        reject(new Error('Database temporarily unavailable'));
      } else {
        try {
          const results = rows.map((row) => ({
            ...row,
            name: row.studentName,
            results: JSON.parse(row.results || "{}"),
            mcqResults: JSON.parse(row.mcqResults || "{}"),
            submittedCode: JSON.parse(row.submittedCode || "{}"),
          }));
          
          // Update cache
          resultsCache = results;
          cacheTimestamp = now;
          
          resolve(results);
        } catch (parseError) {
          console.error("Error parsing results:", parseError.message);
          reject(new Error('Data parsing error'));
        }
      }
    });
  });
};

// Clear cache when new results are added
const clearResultsCache = () => {
  resultsCache = null;
  cacheTimestamp = 0;
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

// Function to delete a specific result by ID
const deleteResult = (id) => {
  return new Promise((resolve, reject) => {
    db.run("DELETE FROM results WHERE id = ?", [id], function (err) {
      if (err) {
        reject(err);
      } else if (this.changes === 0) {
        reject(new Error("No submission found with the given ID"));
      } else {
        resolve({
          message: "Submission deleted successfully",
          deletedCount: this.changes,
        });
      }
    });
  });
};

module.exports = {
  saveResult: (result) => {
    clearResultsCache();
    return saveResult(result);
  },
  getResults,
  clearResults: () => {
    clearResultsCache();
    return clearResults();
  },
  deleteResult: (id) => {
    clearResultsCache();
    return deleteResult(id);
  },
};
