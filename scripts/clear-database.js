#!/usr/bin/env node

const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const readline = require("readline");

// Database path (relative to project root)
const DB_PATH = path.join(__dirname, "..", "db", "coding_test.db");

// Create readline interface for user confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("🗑️  Database Cleanup Tool");
console.log("=".repeat(40));

// Function to ask for confirmation
function askConfirmation() {
  return new Promise((resolve) => {
    rl.question(
      "⚠️  Are you sure you want to clear ALL exam results? This action cannot be undone! (yes/no): ",
      (answer) => {
        resolve(answer.toLowerCase().trim());
      }
    );
  });
}

// Function to clear the database
function clearDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error("❌ Error connecting to database:", err.message);
        reject(err);
        return;
      }

      console.log("🔗 Connected to database...");

      // Delete all records from the results table
      db.run("DELETE FROM results", function (err) {
        if (err) {
          console.error("❌ Error clearing results:", err.message);
          reject(err);
          return;
        }

        console.log(`✅ Successfully cleared ${this.changes} exam result(s)`);

        // Reset the auto-increment counter
        db.run(
          "DELETE FROM sqlite_sequence WHERE name='results'",
          function (resetErr) {
            if (resetErr) {
              console.log(
                "⚠️  Note: Could not reset ID counter (this is usually fine)"
              );
            } else {
              console.log("🔄 Reset ID counter");
            }

            db.close((closeErr) => {
              if (closeErr) {
                console.error("❌ Error closing database:", closeErr.message);
                reject(closeErr);
              } else {
                console.log("📫 Database connection closed");
                resolve();
              }
            });
          }
        );
      });
    });
  });
}

// Main execution
async function main() {
  try {
    const confirmation = await askConfirmation();

    if (confirmation === "yes" || confirmation === "y") {
      console.log("\n🧹 Clearing exam results database...");
      await clearDatabase();
      console.log("\n✨ Database cleared successfully!");
      console.log("📝 Ready for fresh exam submissions");
    } else {
      console.log("\n❌ Operation cancelled. Database remains unchanged.");
    }
  } catch (error) {
    console.error("\n💥 Error:", error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the script
main();
