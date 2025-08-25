#!/usr/bin/env node

const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Database path (relative to project root)
const DB_PATH = path.join(__dirname, "..", "db", "coding_test.db");

console.log("📊 Database Status Check");
console.log("=".repeat(40));

// Function to check database status
function checkDatabaseStatus() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error("❌ Error connecting to database:", err.message);
        reject(err);
        return;
      }

      console.log("🔗 Connected to database successfully");
      console.log("📂 Database location:", DB_PATH);

      // Count total results
      db.get("SELECT COUNT(*) as count FROM results", (err, row) => {
        if (err) {
          console.error("❌ Error counting results:", err.message);
          reject(err);
          return;
        }

        console.log(`📝 Total exam submissions: ${row.count}`);

        if (row.count > 0) {
          // Get latest submission
          db.get(
            "SELECT studentName, rollNumber, totalScore, timestamp FROM results ORDER BY timestamp DESC LIMIT 1",
            (err, latest) => {
              if (err) {
                console.error("❌ Error getting latest result:", err.message);
              } else {
                console.log("🕒 Latest submission:");
                console.log(
                  `   Student: ${latest.studentName} (${
                    latest.rollNumber || "No roll number"
                  })`
                );
                console.log(`   Score: ${latest.totalScore}`);
                console.log(
                  `   Time: ${new Date(latest.timestamp).toLocaleString()}`
                );
              }

              db.close((closeErr) => {
                if (closeErr) {
                  console.error("❌ Error closing database:", closeErr.message);
                  reject(closeErr);
                } else {
                  console.log("📫 Database connection closed");
                  console.log("✅ Status check complete");
                  resolve();
                }
              });
            }
          );
        } else {
          console.log("📭 No submissions found - database is empty");
          db.close((closeErr) => {
            if (closeErr) {
              console.error("❌ Error closing database:", closeErr.message);
              reject(closeErr);
            } else {
              console.log("📫 Database connection closed");
              console.log("✅ Status check complete");
              resolve();
            }
          });
        }
      });
    });
  });
}

// Run the status check
checkDatabaseStatus().catch((error) => {
  console.error("\n💥 Error:", error.message);
  process.exit(1);
});
