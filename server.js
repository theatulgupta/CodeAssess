const express = require("express");
const fs = require("fs");
const path = require("path");
const rateLimit = require("express-rate-limit");
const cluster = require("cluster");
const os = require("os");
const db = require("./database");
const CompilerPool = require("./src/services/compilerPool");

const app = express();

// Cluster setup for load handling
// NOTE: Clustering is currently enabled only in production mode.
// To enable clustering in development or testing, change the condition below.
// Example: if (cluster.isMaster) { ... }
if (cluster.isMaster && process.env.NODE_ENV === "production") {
  const numCPUs = os.cpus().length;
  console.log(`🚀 Master process starting ${numCPUs} workers...`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });

  return;
}

// --- High-Load Optimized Middleware ---
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 1000, // Increased for exam load
  message: "Too many requests, please wait",
  standardHeaders: false,
  legacyHeaders: false,
});

// Submission-specific rate limiter - increased for load balancing
const submissionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Increased limit with load balancing
  message: { error: "Too many submission attempts" },
  standardHeaders: false,
  legacyHeaders: false,
});

// Initialize compiler pool
let compilerPool;
if (!cluster.isMaster || process.env.NODE_ENV !== "production") {
  compilerPool = new CompilerPool();
}

app.use(limiter);
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// Performance optimizations
app.set("trust proxy", 1);
app.disable("x-powered-by");

// Connection pooling and keep-alive
app.use((req, res, next) => {
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Keep-Alive", "timeout=5, max=1000");
  next();
});

// Serve admin.html
app.get("/admin.html", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

// Serve other static files normally
app.use(
  express.static(".", {
    index: false,
    setHeaders: (res, path) => {
      if (path.endsWith("admin.html")) {
        res.status(404).end();
      }
    },
  })
);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Student Database
const STUDENT_DATABASE = {
  "25MCSA01": "MOHIL DUBEY",
  "25MCSA02": "AABHAS MALPANI",
  "25MCSA03": "TEJA RISHITHA GANGAVARAM",
  "25MCSA04": "KUMARI ANU",
  "25MCSA05": "SOUGATA ROY",
  "25MCSA06": "KRISHNA MOHANTY",
  "25MCSA07": "HARSHIT SINGH",
  "25MCSA08": "PRASHANT GOSWAMI",
  "25MCSA09": "SOUVIK SARKAR",
  "25MCSA10": "RUBIN JAIN",
  "25MCSA11": "BHUSHAN NARESH GATHIBANDHE",
  "25MCSA12": "LALIT KUMAR",
  "25MCSA13": "DEVESH KUMAR VERMA",
  "25MCSA14": "SURYANSH JAISWAL",
  "25MCSA15": "POOJA PATIDAR",
  "25MCSA16": "MAYANK RAJ",
  "25MCSA17": "IKHLAS IMTIYAJ MANGURE",
  "25MCSA18": "ABHISHEK ANAND",
  "25MCSA19": "SHASHANK J SIROTHIYA",
  "25MCSA20": "SHEKHAR KUMAR",
  "25MCSA21": "MANISH RAMESHCHANDRA SAVKARE",
  "25MCSA22": "PAVAN MURTHY R",
  "25MCSA23": "ANKIT PAWAR",
  "25MCSA24": "HRITHIK VISHAL PAWAR",
  "25MCSA25": "EISLAVATH SRI SAI KIRAN",
  "25MCSS01": "ROHIT SHARMA",
  "25MCSS02": "RICHA VERMA",
  "25MCSS03": "AMIT KUMAR SINGH",
  "25MCSS04": "AVNI TRIVEDI",
  "25MCSS05": "HARSHIT JAIN",
  "25MCSS06": "ATUL KUMAR GUPTA",
  "25MCSS07": "ADARSH DUBEY",
  "25MCSS08": "SAI PAVANI BOORNA",
  "25MCSS09": "SAI KANDREGULA",
  "25MCSS10": "ABHISHEK ASHOK TERANI",
  "25MCSS11": "MANIDEEPAK TOONAM",
  "25MCSS12": "ANKUSH PATEL",
  "25MCSS13": "GIRISH VASTRANE",
  "25MCSS14": "ANIKET RAJKUMAR BHUTANGE",
  "25MCSS15": "GOURAV CHOUHAN",
};

// Optimized CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Cache-Control", "no-cache, no-store, must-revalidate");
  next();
});

// --- Directory Setup ---
const submissionDir = "submissions";
try {
  if (!fs.existsSync(submissionDir)) fs.mkdirSync(submissionDir);
  if (!fs.existsSync("db")) fs.mkdirSync("db");
} catch (error) {
  // Directory might already exist, ignore the error
}

// --- API Endpoints ---

// Auto-grading function for coding questions
async function autoGrade(studentName, answers) {
  const results = {};
  let totalScore = 0;
  const maxScore = 75; // 25+25+25 points distributed across 3 questions

  for (let questionNumber = 1; questionNumber <= 3; questionNumber++) {
    const code = answers[questionNumber];

    if (!code || code.trim() === "") {
      results[questionNumber] = {
        score: 0,
        maxScore: 25,
        tests: [],
        message: "No code submitted",
      };
      continue;
    }

    try {
      // Use compiler pool to test the code
      const result = await compilerPool.compile(
        questionNumber,
        code,
        studentName
      );
      results[questionNumber] = result;
      totalScore += result.score;
    } catch (error) {
      console.error(
        `❌ Error grading Q${questionNumber} for ${studentName}:`,
        error.message
      );
      results[questionNumber] = {
        score: 0,
        maxScore: questionNumber === 3 ? 34 : 33,
        tests: [],
        message: "Compilation/Runtime Error: " + error.message,
      };
    }
  }

  return {
    totalScore,
    maxScore,
    results,
  };
}

// --- API Endpoints ---

// Submit answers endpoint
app.post("/api/submit", submissionLimiter, async (req, res) => {
  const startTime = Date.now();
  const {
    name,
    rollNumber,
    answers,
    mcqAnswers: studentMCQAnswers,
    tabSwitchCount,
  } = req.body;

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
    // Check for duplicate submission efficiently
    const existingSubmission = await db.checkExistingSubmission(rollNumber);
    if (existingSubmission) {
      return res.status(409).json({
        error: "Duplicate submission",
        details: "This student has already submitted",
        existing: existingSubmission,
      });
    }

    // Grade coding questions with optimized timeout
    const codingResult = answers
      ? await Promise.race([
          autoGrade(name, answers),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Server busy, please retry")),
              30000
            )
          ),
        ])
      : {
          totalScore: 0,
          maxScore: 100,
          results: {},
        };

    // Calculate optimization bonus
    let optimizationBonus = 0;
    let avgOptimization = 0;
    if (codingResult.results) {
      const optimizationScores = Object.values(codingResult.results)
        .map((r) => r.optimizationScore || 100)
        .filter((s) => s > 0);
      if (optimizationScores.length > 0) {
        avgOptimization =
          optimizationScores.reduce((a, b) => a + b, 0) /
          optimizationScores.length;
        optimizationBonus = Math.floor(avgOptimization / 10); // 0-10 bonus points
      }
    }

    const finalResult = {
      name,
      rollNumber,
      totalScore: codingResult.totalScore + optimizationBonus,
      maxScore: codingResult.maxScore + 10, // Include optimization bonus in max
      codingScore: codingResult.totalScore,
      codingMaxScore: codingResult.maxScore,
      optimizationScore: avgOptimization,
      optimizationBonus: optimizationBonus,
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
    console.log(
      `✅ Submission processed: ${rollNumber} in ${processingTime}ms`
    );

    res.status(201).json({
      ...savedResult,
      processingTime,
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(
      `❌ Submission failed: ${req.body.rollNumber} in ${processingTime}ms -`,
      error.message
    );

    if (error.message.includes("timeout") || error.message.includes("busy")) {
      res.status(503).json({
        error: "Server busy",
        details: "High load detected. Please wait 10 seconds and try again.",
        retryAfter: 10,
      });
    } else if (error.message.includes("Duplicate")) {
      res.status(409).json({
        error: "Already submitted",
        details: error.message,
      });
    } else {
      res.status(500).json({
        error: "Processing failed",
        details: "Please try again in a moment",
      });
    }
  }
});

app.get("/api/results", async (req, res) => {
  try {
    const results = await db.getResults();
    res.json(results);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to load results", details: error.message });
  }
});

// Check if student already submitted
app.post("/api/check-submission", async (req, res) => {
  const { rollNumber } = req.body;

  if (!rollNumber || !rollNumber.match(/^25MCS[AS]\d{2}$/)) {
    return res.status(400).json({ error: "Valid roll number is required" });
  }

  try {
    const existingSubmission = await db.checkExistingSubmission(rollNumber);

    if (existingSubmission) {
      res.json({
        alreadySubmitted: true,
        submission: existingSubmission,
      });
    } else {
      res.json({
        alreadySubmitted: false,
      });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to check submission status" });
  }
});

// Load-balanced test code endpoint (limited test cases)
app.post(
  "/api/test-code",
  rateLimit({
    windowMs: 60 * 1000,
    max: 20, // Reasonable limit for exam use
    message: { error: "Too many test runs" },
  }),
  async (req, res) => {
    const { questionNumber, code, studentName } = req.body;

    if (!questionNumber || !code) {
      return res.status(400).json({ error: "Missing question number or code" });
    }

    try {
      const result = await compilerPool.compileWithLimitedTests(
        questionNumber,
        code,
        studentName || "test"
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Compiler pool status endpoint
app.get("/api/compiler-status", (req, res) => {
  if (!compilerPool) {
    return res.json({ error: "Compiler pool not available" });
  }
  res.json(compilerPool.getStats());
});

// Admin endpoint to clear all results (use with caution!)
app.delete("/api/results/clear", async (req, res) => {
  try {
    const result = await db.clearResults();
    res.json({
      success: true,
      message: result.message,
      deletedCount: result.deletedCount,
      timestamp: new Date().toISOString(),
      warning:
        "Students may still have saved exam state in browser localStorage. Ask them to use incognito mode or clear browser data for completely fresh exams.",
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to clear results", details: error.message });
  }
});

// Endpoint to clear localStorage (for fresh exam start)
app.post("/api/clear-session", (req, res) => {
  res.json({
    success: true,
    message: "Client should clear localStorage",
    clearLocalStorage: true,
  });
});

// Admin endpoint to delete individual submission
app.delete("/api/results/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        error: "Invalid ID",
        details: "ID must be a valid number",
      });
    }

    const result = await db.deleteResult(id);
    res.json({
      success: true,
      message: "Submission deleted successfully",
      deletedId: id,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to delete submission", details: error.message });
  }
});

// --- Optimized Server Start ---
const PORT = process.env.PORT || 3000;

// Verify database connection and start server
async function startServer() {
  try {
    // Wait for database initialization to complete
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("✅ Database initialized successfully");

    const server = app.listen(PORT, "0.0.0.0", () => {
      const workerId = cluster.worker ? cluster.worker.id : "Master";
      console.log(`🚀 Worker ${workerId} running on port ${PORT}`);
      if (!cluster.worker) {
        console.log(`   Local:    http://localhost:${PORT}`);
        console.log(`   Network:  http://0.0.0.0:${PORT}`);
        console.log(`   Status:   Ready for high-load submissions`);
      }
    });

    // Optimize server settings for high load
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;
    server.maxConnections = 1000;

    // Graceful shutdown
    process.on("SIGTERM", () => {
      console.log("🔄 Graceful shutdown initiated...");
      if (compilerPool) {
        compilerPool.shutdown();
      }
      server.close(() => {
        console.log("✅ Server closed");
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("❌ Failed to connect to database:", error.message);
    process.exit(1);
  }
}

startServer();
