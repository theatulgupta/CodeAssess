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
if (cluster.isMaster && process.env.NODE_ENV === 'production') {
  const numCPUs = os.cpus().length;
  console.log(`🚀 Master process starting ${numCPUs} workers...`);
  
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  
  cluster.on('exit', (worker, code, signal) => {
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
if (!cluster.isMaster || process.env.NODE_ENV !== 'production') {
  compilerPool = new CompilerPool();
}


app.use(limiter);
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// Performance optimizations
app.set('trust proxy', 1);
app.disable('x-powered-by');

// Connection pooling and keep-alive
app.use((req, res, next) => {
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', 'timeout=5, max=1000');
  next();
});



// Serve admin.html
app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Serve other static files normally
app.use(express.static('.', {
  index: false,
  setHeaders: (res, path) => {
    if (path.endsWith('admin.html')) {
      res.status(404).end();
    }
  }
}));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// MCQ Correct Answers
const mcqAnswers = {
  mcq1: "b", // 40 20 (ptr points to arr[2]=30, ptr+1=arr[3]=40, ptr-1=arr[1]=20)
  mcq2: "a", // ELLO L (p points to str[1], so p prints "ELLO", *(p+2) = str[3] = 'L')
  mcq3: "b", // 3 times (i=0: prints, i=1: prints, i=2: continue, i=3: prints, i=4: break)
  mcq4: "b", // 7 (mystery(4) = 4 + mystery(2) = 4 + (2 + mystery(0)) = 4 + (2 + 1) = 7)
  mcq5: "b", // 9 (i=0: arr[0]=1, i=2: arr[2]=3, i=4: arr[4]=5, total=1+3+5=9)
};

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

// --- Test Cases ---
const testCases = {
  1: [
    // Q1: Transpose of Matrix
    { input: [[1,2,3],[4,5,6]], expected: "1 4\n2 5\n3 6", points: 7 },
    { input: [[1,2],[3,4],[5,6]], expected: "1 3 5\n2 4 6", points: 7 },
    { input: [[1]], expected: "1", points: 6 },
    { input: [[1,2,3],[4,5,6],[7,8,9]], expected: "1 4 7\n2 5 8\n3 6 9", points: 7 },
    { input: [[1,2,3,4]], expected: "1\n2\n3\n4", points: 6 },
  ],
  2: [
    // Q2: Merge Two Sorted Arrays
    { input: {nums1: [1,2,3], nums2: [2,5,6]}, expected: "1 2 2 3 5 6", points: 7 },
    { input: {nums1: [1], nums2: []}, expected: "1", points: 7 },
    { input: {nums1: [], nums2: [1]}, expected: "1", points: 6 },
    { input: {nums1: [1,3,5], nums2: [2,4,6]}, expected: "1 2 3 4 5 6", points: 7 },
    { input: {nums1: [4,5,6], nums2: [1,2,3]}, expected: "1 2 3 4 5 6", points: 6 },
  ],
  3: [
    // Q3: Intersection of Two Vectors
    { input: {nums1: [1,2,2,1], nums2: [2,2]}, expected: "2", points: 7 },
    { input: {nums1: [4,9,5], nums2: [9,4,9,8,4]}, expected: "4 9", points: 7 },
    { input: {nums1: [1,2,3], nums2: [4,5,6]}, expected: "", points: 6 },
    { input: {nums1: [1,2,3,4], nums2: [3,4,5,6]}, expected: "3 4", points: 7 },
    { input: {nums1: [1], nums2: [1,1]}, expected: "1", points: 6 },
  ],
};

// Limited test cases for testing (first 3 only)
const limitedTestCases = {
  1: testCases[1].slice(0, 3),
  2: testCases[2].slice(0, 3),
  3: testCases[3].slice(0, 3),
};

// --- Load-Balanced Auto-Grading ---
function autoGrade(studentName, answers) {
  return new Promise(async (resolve, reject) => {
    let totalScore = 0;
    let maxScore = 0;
    let results = {};

    const questions = Object.keys(answers).filter(
      (q) => answers[q] && answers[q].trim() && parseInt(q) <= 3
    );

    if (questions.length === 0) {
      return resolve({
        totalScore: 0,
        maxScore: 100,
        results: {},
        error: "No valid answers submitted",
      });
    }

    try {
      // Process all questions concurrently using compiler pool
      const compilationPromises = questions.map(async (qNum) => {
        const tests = testCases[qNum];
        if (!tests) {
          return {
            qNum,
            score: 0,
            error: "No test cases available for this question",
            tests: [],
          };
        }

        try {
          const result = await compilerPool.compile(qNum, answers[qNum], studentName);
          return { qNum, ...result };
        } catch (error) {
          console.error(`Compilation error for Q${qNum}:`, error.message);
          return {
            qNum,
            score: 0,
            error: error.message,
            tests: [],
          };
        }
      });

      const compilationResults = await Promise.all(compilationPromises);
      
      // Calculate scores and organize results
      compilationResults.forEach(result => {
        totalScore += result.score || 0;
        const tests = testCases[result.qNum];
        if (tests) {
          maxScore += tests.reduce((sum, test) => sum + test.points, 0);
        }
        results[result.qNum] = {
          score: result.score || 0,
          error: result.error,
          tests: result.tests || [],
          complexity: result.complexity || 'O(n)',
          optimizationScore: result.optimizationScore || 100
        };
      });

      resolve({
        totalScore,
        maxScore: Math.max(maxScore, 100),
        results,
      });
    } catch (error) {
      console.error('Auto-grading error:', error);
      reject(error);
    }
  });
}

// Function to grade MCQ answers
function gradeMCQ(studentMCQAnswers) {
  let mcqScore = 0;
  let mcqMaxScore = 25; // 5 questions × 5 points each
  let mcqResults = {};

  for (let i = 1; i <= 5; i++) {
    const questionKey = `mcq${i}`;
    const studentAnswer = studentMCQAnswers
      ? studentMCQAnswers[questionKey]
      : null;
    const correctAnswer = mcqAnswers[questionKey];

    if (studentAnswer === correctAnswer) {
      mcqScore += 5;
      mcqResults[questionKey] = {
        score: 5,
        maxScore: 5,
        studentAnswer,
        correctAnswer,
        status: "Correct",
      };
    } else {
      mcqResults[questionKey] = {
        score: 0,
        maxScore: 5,
        studentAnswer: studentAnswer || "Not answered",
        correctAnswer,
        status: "Incorrect",
      };
    }
  }

  return {
    mcqScore,
    mcqMaxScore,
    mcqResults,
  };
}

// --- Helper Functions ---
function cleanupFiles(fileList) {
  fileList.forEach((file) => {
    if (fs.existsSync(file)) fs.unlinkSync(file);
  });
}

function createFullCode(qNum, studentCode) {
  // Function to check if student provided a function implementation
  const hasFunctionImplementation = (code, functionName) => {
    const regex = new RegExp(`\\b${functionName}\\s*\\([^)]*\\)\\s*\\{`, "i");
    return regex.test(
      code.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "")
    );
  };

  const functionNames = {
    1: "transpose",
    2: "mergeSortedArrays",
    3: "intersection",
  };

  const defaultImplementations = {
    1: `vector<vector<int>> transpose(vector<vector<int>>& matrix) {
    vector<vector<int>> result;
    return result; // Default implementation
}`,
    2: `vector<int> mergeSortedArrays(vector<int>& nums1, vector<int>& nums2) {
    vector<int> result;
    return result; // Default implementation
}`,
    3: `vector<int> intersection(vector<int>& nums1, vector<int>& nums2) {
    vector<int> result;
    return result; // Default implementation
}`,
  };

  const headers = {
    1: `#include <iostream>
#include <vector>
using namespace std;`,
    2: `#include <iostream>
#include <vector>
using namespace std;`,
    3: `#include <iostream>
#include <vector>
#include <unordered_set>
using namespace std;`,
  };

  const mainFunctions = {
    1: `int main() {
    vector<vector<int>> m1={{1,2,3},{4,5,6}}; auto r1=transpose(m1); for(int i=0;i<r1.size();i++){for(int j=0;j<r1[i].size();j++){cout<<r1[i][j];if(j<r1[i].size()-1)cout<<" ";} if(i<r1.size()-1)cout<<"\\n";} cout<<endl;
    vector<vector<int>> m2={{1,2},{3,4},{5,6}}; auto r2=transpose(m2); for(int i=0;i<r2.size();i++){for(int j=0;j<r2[i].size();j++){cout<<r2[i][j];if(j<r2[i].size()-1)cout<<" ";} if(i<r2.size()-1)cout<<"\\n";} cout<<endl;
    vector<vector<int>> m3={{1}}; auto r3=transpose(m3); for(int i=0;i<r3.size();i++){for(int j=0;j<r3[i].size();j++){cout<<r3[i][j];if(j<r3[i].size()-1)cout<<" ";} if(i<r3.size()-1)cout<<"\\n";} cout<<endl;
    vector<vector<int>> m4={{1,2,3},{4,5,6},{7,8,9}}; auto r4=transpose(m4); for(int i=0;i<r4.size();i++){for(int j=0;j<r4[i].size();j++){cout<<r4[i][j];if(j<r4[i].size()-1)cout<<" ";} if(i<r4.size()-1)cout<<"\\n";} cout<<endl;
    vector<vector<int>> m5={{1,2,3,4}}; auto r5=transpose(m5); for(int i=0;i<r5.size();i++){for(int j=0;j<r5[i].size();j++){cout<<r5[i][j];if(j<r5[i].size()-1)cout<<" ";} if(i<r5.size()-1)cout<<"\\n";} cout<<endl;
    return 0;
}`,
    2: `int main() {
    vector<int> a1={1,2,3},b1={2,5,6}; auto r1=mergeSortedArrays(a1,b1); for(int i=0;i<r1.size();i++){cout<<r1[i];if(i<r1.size()-1)cout<<" ";} cout<<endl;
    vector<int> a2={1},b2={}; auto r2=mergeSortedArrays(a2,b2); for(int i=0;i<r2.size();i++){cout<<r2[i];if(i<r2.size()-1)cout<<" ";} cout<<endl;
    vector<int> a3={},b3={1}; auto r3=mergeSortedArrays(a3,b3); for(int i=0;i<r3.size();i++){cout<<r3[i];if(i<r3.size()-1)cout<<" ";} cout<<endl;
    vector<int> a4={1,3,5},b4={2,4,6}; auto r4=mergeSortedArrays(a4,b4); for(int i=0;i<r4.size();i++){cout<<r4[i];if(i<r4.size()-1)cout<<" ";} cout<<endl;
    vector<int> a5={4,5,6},b5={1,2,3}; auto r5=mergeSortedArrays(a5,b5); for(int i=0;i<r5.size();i++){cout<<r5[i];if(i<r5.size()-1)cout<<" ";} cout<<endl;
    return 0;
}`,
    3: `int main() {
    vector<int> a1={1,2,2,1},b1={2,2}; auto r1=intersection(a1,b1); for(int i=0;i<r1.size();i++){cout<<r1[i];if(i<r1.size()-1)cout<<" ";} cout<<endl;
    vector<int> a2={4,9,5},b2={9,4,9,8,4}; auto r2=intersection(a2,b2); for(int i=0;i<r2.size();i++){cout<<r2[i];if(i<r2.size()-1)cout<<" ";} cout<<endl;
    vector<int> a3={1,2,3},b3={4,5,6}; auto r3=intersection(a3,b3); for(int i=0;i<r3.size();i++){cout<<r3[i];if(i<r3.size()-1)cout<<" ";} cout<<endl;
    vector<int> a4={1,2,3,4},b4={3,4,5,6}; auto r4=intersection(a4,b4); for(int i=0;i<r4.size();i++){cout<<r4[i];if(i<r4.size()-1)cout<<" ";} cout<<endl;
    vector<int> a5={1},b5={1,1}; auto r5=intersection(a5,b5); for(int i=0;i<r5.size();i++){cout<<r5[i];if(i<r5.size()-1)cout<<" ";} cout<<endl;
    return 0;
}`,
  };

  const functionName = functionNames[qNum];
  const hasFunction = hasFunctionImplementation(studentCode, functionName);

  // If student provided implementation, use it; otherwise use default
  const codeToUse = hasFunction ? studentCode : defaultImplementations[qNum];

  return `${headers[qNum]}

${codeToUse}

${mainFunctions[qNum]}`;
}

function evaluateOutput(qNum, stdout, tests) {
  const lines = stdout.trim().split("\n");
  let score = 0;
  let testResults = [];

  tests.forEach((test, i) => {
    const expected = test.expected.toString().trim();
    const actual = lines[i] ? lines[i].trim() : "No output";
    const passed = actual === expected;
    const points = passed ? test.points : 0;
    score += points;

    testResults.push({
      testCase: i + 1,
      expected,
      actual,
      passed,
      points,
    });
  });

  return { score, tests: testResults };
}

// --- Optimized API Endpoints ---
app.post("/api/submit", submissionLimiter, async (req, res) => {
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
    // Check for duplicate submission efficiently
    const existingSubmission = await db.checkExistingSubmission(rollNumber);
    if (existingSubmission) {
      return res.status(409).json({
        error: "Duplicate submission",
        details: "This student has already submitted",
        existing: existingSubmission
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

    // Calculate optimization bonus
    let optimizationBonus = 0;
    let avgOptimization = 0;
    if (codingResult.results) {
      const optimizationScores = Object.values(codingResult.results)
        .map(r => r.optimizationScore || 100)
        .filter(s => s > 0);
      if (optimizationScores.length > 0) {
        avgOptimization = optimizationScores.reduce((a, b) => a + b, 0) / optimizationScores.length;
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
});

// Load-balanced test code endpoint (limited test cases)
app.post("/api/test-code", rateLimit({
  windowMs: 60 * 1000,
  max: 15, // Increased limit with load balancing
  message: { error: "Too many test runs" }
}), async (req, res) => {
  const { questionNumber, code, studentName } = req.body;
  
  if (!questionNumber || !code) {
    return res.status(400).json({ error: "Missing question number or code" });
  }
  
  try {
    const result = await compilerPool.compileWithLimitedTests(questionNumber, code, studentName || "test");
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to clear results", details: error.message });
  }
});

// Admin endpoint to delete individual submission
app.delete("/api/results/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ 
        error: "Invalid ID", 
        details: "ID must be a valid number" 
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
    // Test database connection
    await db.getResults();
    console.log("✅ Database connected successfully");

    const server = app.listen(PORT, "0.0.0.0", () => {
      const workerId = cluster.worker ? cluster.worker.id : 'Master';
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
    process.on('SIGTERM', () => {
      console.log('🔄 Graceful shutdown initiated...');
      if (compilerPool) {
        compilerPool.shutdown();
      }
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error("❌ Failed to connect to database:", error.message);
    process.exit(1);
  }
}

startServer();
