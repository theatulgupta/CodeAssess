const express = require("express");
const fs = require("fs");
const { exec } = require("child_process");
const path = require("path");
const rateLimit = require("express-rate-limit");
const cluster = require("cluster");
const os = require("os");
const db = require("./database");

const app = express();

// Cluster setup for load handling
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
  skip: (req) => req.url === '/api/submit', // Don't limit submissions
});

// Submission-specific rate limiter
const submissionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // Max 3 submissions per minute per IP
  message: { error: "Too many submission attempts" },
  standardHeaders: false,
  legacyHeaders: false,
});


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

// Admin authentication middleware
function adminAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin Area"');
    return res.status(401).send('Authentication required');
  }
  
  const credentials = Buffer.from(auth.slice(6), 'base64').toString();
  const [username, password] = credentials.split(':');
  
  if (username === 'atul@admin' && password === 'admin123') {
    next();
  } else {
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin Area"');
    res.status(401).send('Invalid credentials');
  }
}

// Serve admin.html with authentication
app.get('/admin.html', adminAuth, (req, res) => {
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
    // Q1: Count Elements Greater Than All Previous
    { input: [7, 4, 8, 2, 9], expected: "3", points: 7 },
    { input: [1, 2, 3, 4, 5], expected: "5", points: 7 },
    { input: [5, 4, 3, 2, 1], expected: "1", points: 6 },
    { input: [10, 10, 10, 10], expected: "1", points: 7 },
    { input: [3, 1, 4, 2, 5, 9, 7], expected: "4", points: 6 },
  ],
  2: [
    // Q2: Row with Maximum 1's
    { input: [[0,1,0],[1,1,0],[1,1,1]], expected: "3", points: 7 },
    { input: [[0,0,0],[0,0,0],[0,0,0]], expected: "1", points: 7 },
    { input: [[1,0],[1,1],[0,1]], expected: "2", points: 6 },
    { input: [[1,1,1],[1,0,0],[0,1,0]], expected: "1", points: 7 },
    { input: [[0,1],[0,1],[1,1]], expected: "3", points: 6 },
  ],
  3: [
    // Q3: Move Zeros to End
    { input: [4,5,0,1,9,0,5,0], expected: "4 5 1 9 5 0 0 0", points: 7 },
    { input: [0,0,0,0], expected: "0 0 0 0", points: 7 },
    { input: [1,2,3,4], expected: "1 2 3 4", points: 7 },
    { input: [0,1,0,2,0,3,0,4], expected: "1 2 3 4 0 0 0 0", points: 6 },
    { input: [5], expected: "5", points: 7 },
  ],
};

// --- Optimized Auto-Grading with Queue ---
const gradingQueue = [];
const MAX_CONCURRENT_GRADING = 5;
let activeGrading = 0;

function processGradingQueue() {
  if (gradingQueue.length === 0 || activeGrading >= MAX_CONCURRENT_GRADING) {
    return;
  }
  
  const { resolve, reject, studentName, answers } = gradingQueue.shift();
  activeGrading++;
  
  autoGradeInternal(studentName, answers)
    .then(resolve)
    .catch(reject)
    .finally(() => {
      activeGrading--;
      setImmediate(processGradingQueue);
    });
}

function autoGrade(studentName, answers) {
  return new Promise((resolve, reject) => {
    gradingQueue.push({ resolve, reject, studentName, answers });
    processGradingQueue();
  });
}

function autoGradeInternal(studentName, answers) {
  return new Promise((resolve, reject) => {
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

    let completed = 0;

    questions.forEach((qNum) => {
      const tests = testCases[qNum];
      if (!tests) {
        results[qNum] = {
          score: 0,
          error: "No test cases available for this question",
          tests: [],
        };
        completed++;
        if (completed === questions.length) {
          resolve({ totalScore, maxScore: 100, results });
        }
        return;
      }

      const questionMaxScore = tests.reduce((sum, test) => sum + test.points, 0);
      maxScore += questionMaxScore;

      try {
        const fullCode = createFullCode(qNum, answers[qNum]);
        const uniqueId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const fileName = path.join(submissionDir, `temp_${uniqueId}_q${qNum}.cpp`);
        const exeName = path.join(submissionDir, `temp_${uniqueId}_q${qNum}`);

        fs.writeFileSync(fileName, fullCode);

        const compileCmd = `g++ -std=c++17 -O2 -Wall -Wextra -o "${exeName}" "${fileName}"`;
        exec(compileCmd, { 
          timeout: 10000, // Reduced timeout
          maxBuffer: 512 * 1024, // Reduced buffer
          killSignal: 'SIGKILL'
        }, (error, stdout, stderr) => {
          if (error) {
            results[qNum] = {
              score: 0,
              error: `Compilation Error: ${stderr || error.message}`,
              tests: [],
            };
            cleanupFiles([fileName, exeName, exeName + '.exe']);
            completed++;
            if (completed === questions.length) {
              resolve({
                totalScore,
                maxScore: Math.max(maxScore, 100),
                results,
              });
            }
          } else {
            const runCmd = process.platform === 'win32' ? `"${exeName}.exe"` : `"${exeName}"`;
            exec(runCmd, { 
              timeout: 5000, // Reduced timeout
              maxBuffer: 256 * 1024, // Reduced buffer
              cwd: __dirname,
              killSignal: 'SIGKILL'
            }, (runError, stdout, stderr) => {
              if (runError) {
                results[qNum] = {
                  score: 0,
                  error: `Runtime Error: ${stderr || runError.message}`,
                  tests: [],
                };
              } else {
                const score = evaluateOutput(qNum, stdout, tests);
                results[qNum] = score;
                totalScore += score.score;
              }
              cleanupFiles([fileName, exeName, exeName + '.exe']);
              completed++;
              if (completed === questions.length) {
                resolve({
                  totalScore,
                  maxScore: Math.max(maxScore, 100),
                  results,
                });
              }
            });
          }
        });
      } catch (err) {
        results[qNum] = {
          score: 0,
          error: `Processing Error: ${err.message}`,
          tests: [],
        };

        completed++;
        if (completed === questions.length) {
          resolve({ totalScore, maxScore: Math.max(maxScore, 100), results });
        }
      }
    });
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
    1: "countGreaterThanPrior",
    2: "rowWithMaxOnes",
    3: "moveZerosToEnd",
  };

  const defaultImplementations = {
    1: `int countGreaterThanPrior(const vector<int>& arr) {
    return 0; // Default implementation
}`,
    2: `int rowWithMaxOnes(const vector<vector<int>>& matrix) {
    return 0; // Default implementation
}`,
    3: `void moveZerosToEnd(vector<int>& arr) {
    // Default implementation - do nothing
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
using namespace std;`,
  };

  const mainFunctions = {
    1: `int main() {
    vector<int> arr1 = {7,4,8,2,9};
    cout << countGreaterThanPrior(arr1) << endl;
    
    vector<int> arr2 = {1,2,3,4,5};
    cout << countGreaterThanPrior(arr2) << endl;
    
    vector<int> arr3 = {5,4,3,2,1};
    cout << countGreaterThanPrior(arr3) << endl;
    
    vector<int> arr4 = {10,10,10,10};
    cout << countGreaterThanPrior(arr4) << endl;
    
    vector<int> arr5 = {3,1,4,2,5,9,7};
    cout << countGreaterThanPrior(arr5) << endl;
    
    return 0;
}`,
    2: `int main() {
    vector<vector<int>> matrix1 = {{0,1,0},{1,1,0},{1,1,1}};
    cout << rowWithMaxOnes(matrix1) << endl;
    
    vector<vector<int>> matrix2 = {{0,0,0},{0,0,0},{0,0,0}};
    cout << rowWithMaxOnes(matrix2) << endl;
    
    vector<vector<int>> matrix3 = {{1,0},{1,1},{0,1}};
    cout << rowWithMaxOnes(matrix3) << endl;
    
    vector<vector<int>> matrix4 = {{1,1,1},{1,0,0},{0,1,0}};
    cout << rowWithMaxOnes(matrix4) << endl;
    
    vector<vector<int>> matrix5 = {{0,1},{0,1},{1,1}};
    cout << rowWithMaxOnes(matrix5) << endl;
    
    return 0;
}`,
    3: `int main() {
    vector<int> arr1 = {4,5,0,1,9,0,5,0};
    moveZerosToEnd(arr1);
    for(int i = 0; i < arr1.size(); i++) {
        cout << arr1[i];
        if(i < arr1.size()-1) cout << " ";
    }
    cout << endl;
    
    vector<int> arr2 = {0,0,0,0};
    moveZerosToEnd(arr2);
    for(int i = 0; i < arr2.size(); i++) {
        cout << arr2[i];
        if(i < arr2.size()-1) cout << " ";
    }
    cout << endl;
    
    vector<int> arr3 = {1,2,3,4};
    moveZerosToEnd(arr3);
    for(int i = 0; i < arr3.size(); i++) {
        cout << arr3[i];
        if(i < arr3.size()-1) cout << " ";
    }
    cout << endl;
    
    vector<int> arr4 = {0,1,0,2,0,3,0,4};
    moveZerosToEnd(arr4);
    for(int i = 0; i < arr4.size(); i++) {
        cout << arr4[i];
        if(i < arr4.size()-1) cout << " ";
    }
    cout << endl;
    
    vector<int> arr5 = {5};
    moveZerosToEnd(arr5);
    for(int i = 0; i < arr5.size(); i++) {
        cout << arr5[i];
        if(i < arr5.size()-1) cout << " ";
    }
    cout << endl;
    
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
    // Check for duplicate submission
    const existingResults = await db.getResults();
    const duplicate = existingResults.find(r => r.rollNumber === rollNumber);
    if (duplicate) {
      return res.status(409).json({
        error: "Duplicate submission",
        details: "This student has already submitted",
        existing: duplicate
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

    const finalResult = {
      name,
      rollNumber,
      totalScore: codingResult.totalScore,
      maxScore: codingResult.maxScore,
      codingScore: codingResult.totalScore,
      codingMaxScore: codingResult.maxScore,
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

app.get("/api/results", adminAuth, async (req, res) => {
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
  
  if (!rollNumber) {
    return res.status(400).json({ error: "Roll number is required" });
  }
  
  try {
    const results = await db.getResults();
    const existingSubmission = results.find(r => r.rollNumber === rollNumber);
    
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

// Optimized test code endpoint
app.post("/api/test-code", rateLimit({
  windowMs: 60 * 1000,
  max: 10, // Limit test runs
  message: { error: "Too many test runs" }
}), async (req, res) => {
  const { questionNumber, code, studentName } = req.body;
  
  if (!questionNumber || !code) {
    return res.status(400).json({ error: "Missing question number or code" });
  }
  
  try {
    const result = await autoGrade(studentName || "test", { [questionNumber]: code });
    const questionResult = result.results[questionNumber];
    
    if (questionResult) {
      res.json(questionResult);
    } else {
      res.json({ error: "No test results available" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin endpoint to clear all results (use with caution!)
app.delete("/api/results/clear", adminAuth, async (req, res) => {
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
app.delete("/api/results/:id", adminAuth, async (req, res) => {
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
