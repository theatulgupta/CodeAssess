const express = require("express");
const fs = require("fs");
const { exec } = require("child_process");
const path = require("path");
const rateLimit = require("express-rate-limit");
const db = require("./database"); // Using our new SQLite database module

const app = express();

// --- Security Middleware ---
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Increased limit for a class of 40
  message: "Too many requests from this IP, please try again after 15 minutes",
});

app.use(limiter);
app.use(express.static("."));
app.use(express.json({ limit: "10mb" }));

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

// CORS for local development
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
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
    // Q1: avgSecondMinMax - Second Minimum + Second Maximum Average
    { input: [1, 2, 3, 4, 5], expected: "3", points: 10 }, // 2nd min=2, 2nd max=4, avg=3
    { input: [10, 5, 20, 15, 25], expected: "15", points: 15 }, // 2nd min=10, 2nd max=20, avg=15
  ],
  2: [
    // Q2: countEvenOdd - Count Even and Odd numbers
    { input: [1, 2, 3, 4, 5], expected: "2 3", points: 10 }, // Even=2, Odd=3
    { input: [2, 4, 6, 8], expected: "4 0", points: 15 }, // Even=4, Odd=0
  ],
  3: [
    // Q3: reverseArray - Reverse all elements
    { input: [1, 2, 3, 4, 5], expected: "5 4 3 2 1", points: 10 },
    { input: [10, 20, 30], expected: "30 20 10", points: 15 },
  ],
  4: [
    // Q4: calculator - Mini Calculator
    { input: { a: 10, b: 5, op: "+" }, expected: "15", points: 10 },
    { input: { a: 20, b: 4, op: "*" }, expected: "80", points: 15 },
  ],
};

// --- Auto-Grading Logic ---
function autoGrade(studentName, answers) {
  return new Promise((resolve, reject) => {
    let totalScore = 0;
    let maxScore = 0;
    let results = {};

    const questions = Object.keys(answers).filter(
      (q) => answers[q] && answers[q].trim()
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
        completed++;
        if (completed === questions.length) {
          resolve({ totalScore, maxScore: 100, results });
        }
        return;
      }

      maxScore += tests.reduce((sum, test) => sum + test.points, 0);

      try {
        const fullCode = createFullCode(qNum, answers[qNum]);
        const fileName = `temp_${studentName.replace(
          /[^a-zA-Z0-9]/g,
          "_"
        )}_${Date.now()}_q${qNum}.cpp`;
        const exeName = path.join(
          submissionDir,
          `temp_${studentName.replace(
            /[^a-zA-Z0-9]/g,
            "_"
          )}_${Date.now()}_q${qNum}`
        );

        fs.writeFileSync(fileName, fullCode);

        const compileCmd = `g++ -std=c++11 -o ${exeName} ${fileName}`;
        exec(compileCmd, { timeout: 10000 }, (error, stdout, stderr) => {
          if (error) {
            results[qNum] = {
              score: 0,
              error: `Compilation Error: ${stderr || error.message}`,
              tests: [],
            };
            cleanupFiles([fileName, exeName]);
            completed++;
            if (completed === questions.length) {
              resolve({
                totalScore,
                maxScore: Math.max(maxScore, 100),
                results,
              });
            }
          } else {
            const runCmd = `./${exeName}`;
            exec(runCmd, { timeout: 5000 }, (runError, stdout, stderr) => {
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
              cleanupFiles([fileName, exeName]);
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
    1: "avgSecondMinMax",
    2: "countEvenOdd",
    3: "reverseArray",
    4: "calculator",
  };

  const defaultImplementations = {
    1: `int avgSecondMinMax(int arr[], int n) {
    return 0; // Default implementation
}`,
    2: `pair<int,int> countEvenOdd(int arr[], int n) {
    return make_pair(0, 0); // Default implementation
}`,
    3: `void reverseArray(int arr[], int n) {
    // Default implementation - do nothing
}`,
    4: `int calculator(int a, int b, char op) {
    return -1; // Default implementation
}`,
  };

  const headers = {
    1: `#include <iostream>
#include <algorithm>
using namespace std;`,
    2: `#include <iostream>
#include <utility>
using namespace std;`,
    3: `#include <iostream>
using namespace std;`,
    4: `#include <iostream>
using namespace std;`,
  };

  const mainFunctions = {
    1: `int main() {
    int arr1[] = {1,2,3,4,5};
    cout << avgSecondMinMax(arr1, 5) << endl;
    
    int arr2[] = {10,5,20,15,25};
    cout << avgSecondMinMax(arr2, 5) << endl;
    return 0;
}`,
    2: `int main() {
    int arr1[] = {1,2,3,4,5};
    auto ans1 = countEvenOdd(arr1, 5);
    cout << ans1.first << " " << ans1.second << endl;
    
    int arr2[] = {2,4,6,8};
    auto ans2 = countEvenOdd(arr2, 4);
    cout << ans2.first << " " << ans2.second << endl;
    return 0;
}`,
    3: `int main() {
    int arr1[] = {1,2,3,4,5};
    reverseArray(arr1, 5);
    for(int i = 0; i < 5; i++) cout << arr1[i] << " ";
    cout << endl;
    
    int arr2[] = {10,20,30};
    reverseArray(arr2, 3);
    for(int i = 0; i < 3; i++) cout << arr2[i] << " ";
    cout << endl;
    return 0;
}`,
    4: `int main() {
    cout << calculator(10, 5, '+') << endl;
    cout << calculator(20, 4, '*') << endl;
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

// --- API Endpoints ---
app.post("/api/submit", async (req, res) => {
  const { name, rollNumber, answers, mcqAnswers: studentMCQAnswers } = req.body;

  // Detailed validation
  if (!name || name.trim() === "") {
    return res.status(400).json({
      error: "Missing student name",
      details: "Student name is required for submission",
      received: { name, rollNumber },
    });
  }

  if (!answers && !studentMCQAnswers) {
    return res.status(400).json({
      error: "No answers provided",
      details: "Either coding answers or MCQ answers must be provided",
      received: { hasAnswers: !!answers, hasMCQAnswers: !!studentMCQAnswers },
    });
  }

  // Validate rollNumber format if provided
  if (rollNumber && !rollNumber.match(/^25MCS[AS]\d{2}$/)) {
    return res.status(400).json({
      error: "Invalid roll number format",
      details: "Roll number must be in format 25MCSXXX",
      received: { rollNumber },
    });
  }

  try {
    // Grade coding questions
    const codingResult = answers
      ? await autoGrade(name, answers)
      : {
          totalScore: 0,
          maxScore: 0,
          results: {},
        };

    // Grade MCQ questions
    const mcqResult = gradeMCQ(studentMCQAnswers);

    // Combine results
    const finalResult = {
      name,
      rollNumber,
      totalScore: codingResult.totalScore + mcqResult.mcqScore,
      maxScore: Math.max(codingResult.maxScore, 75) + mcqResult.mcqMaxScore, // 75 for coding + 25 for MCQ
      codingScore: codingResult.totalScore,
      codingMaxScore: Math.max(codingResult.maxScore, 75),
      mcqScore: mcqResult.mcqScore,
      mcqMaxScore: mcqResult.mcqMaxScore,
      results: codingResult.results,
      mcqResults: mcqResult.mcqResults,
      timestamp: new Date().toISOString(),
    };

    const savedResult = await db.saveResult(finalResult);
    res.status(201).json(savedResult);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to process submission", details: error.message });
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

// --- Server Start ---
const PORT = process.env.PORT || 3000;

// Verify database connection and start server
async function startServer() {
  try {
    // Test database connection
    await db.getResults();
    console.log("✅ Database connected successfully");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Auto-Grading Server running on:`);
      console.log(`   Local:    http://localhost:${PORT}`);
      console.log(`   Network:  http://0.0.0.0:${PORT}`);
      console.log(`   Status:   Ready for submissions`);
    });
  } catch (error) {
    console.error("❌ Failed to connect to database:", error.message);
    process.exit(1);
  }
}

startServer();
