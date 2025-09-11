const { parentPort } = require("worker_threads");
const fs = require("fs");
const { exec } = require("child_process");
const path = require("path");
const CodeAnalyzer = require("./codeAnalyzer");

const submissionDir = path.join(__dirname, "../../submissions");

// Ensure submissions directory exists
if (!fs.existsSync(submissionDir)) {
  fs.mkdirSync(submissionDir, { recursive: true });
}

const testCases = {
  1: [
    { input: [1, 2, 3, 4, 5], expected: "4", points: 7 },
    { input: [10, 10, 10], expected: "-1", points: 7 },
    { input: [5, 1, 2, 2, 3], expected: "3", points: 6 },
    { input: [8], expected: "-1", points: 7 },
    { input: [20, 15, 30, 30, 25, 10], expected: "25", points: 6 },
  ],
  2: [
    { input: [1, 2, 3, 4, 5], expected: "5", points: 7 },
    { input: [5, 4, 3, 2, 1], expected: "1", points: 7 },
    { input: [2, 2, 2, 2], expected: "1", points: 6 },
    { input: [1, 3, 2, 4, 6, 3], expected: "4", points: 7 },
    { input: [10], expected: "1", points: 6 },
  ],
  3: [
    {
      input: [
        [0, 1, 1],
        [1, 1, 1],
        [0, 0, 1],
      ],
      expected: "1",
      points: 7,
    },
    {
      input: [
        [0, 0],
        [0, 0],
        [0, 0],
      ],
      expected: "-1",
      points: 7,
    },
    {
      input: [
        [1, 1, 1],
        [1, 0, 0],
        [1, 1, 0],
      ],
      expected: "0",
      points: 6,
    },
    { input: [[1], [0], [1], [1]], expected: "0", points: 7 },
    {
      input: [
        [0, 1],
        [1, 1],
        [1, 0],
      ],
      expected: "1",
      points: 6,
    },
  ],
};

const limitedTestCases = {
  1: testCases[1].slice(0, 3),
  2: testCases[2].slice(0, 3),
  3: testCases[3].slice(0, 3),
};

function createFullCode(qNum, studentCode) {
  const headers = `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;`;

  let mainFn = "";
  if (qNum === 1) {
    mainFn = `int main() {
    vector<int> t1 = {1,2,3,4,5};
    cout << secondLargest(t1) << endl;
    
    vector<int> t2 = {10,10,10};
    cout << secondLargest(t2) << endl;
    
    vector<int> t3 = {5,1,2,2,3};
    cout << secondLargest(t3) << endl;
    
    vector<int> t4 = {8};
    cout << secondLargest(t4) << endl;
    
    vector<int> t5 = {20,15,30,30,25,10};
    cout << secondLargest(t5) << endl;
    
    return 0;
}`;
  } else if (qNum === 2) {
    mainFn = `int main() {
    vector<int> t1 = {1,2,3,4,5};
    cout << countGreaterThanPrevious(t1) << endl;
    
    vector<int> t2 = {5,4,3,2,1};
    cout << countGreaterThanPrevious(t2) << endl;
    
    vector<int> t3 = {2,2,2,2};
    cout << countGreaterThanPrevious(t3) << endl;
    
    vector<int> t4 = {1,3,2,4,6,3};
    cout << countGreaterThanPrevious(t4) << endl;
    
    vector<int> t5 = {10};
    cout << countGreaterThanPrevious(t5) << endl;
    
    return 0;
}`;
  } else if (qNum === 3) {
    mainFn = `int main() {
    vector<vector<int>> t1 = {{0,1,1},{1,1,1},{0,0,1}};
    cout << rowWithMaxOnes(t1) << endl;
    
    vector<vector<int>> t2 = {{0,0},{0,0},{0,0}};
    cout << rowWithMaxOnes(t2) << endl;
    
    vector<vector<int>> t3 = {{1,1,1},{1,0,0},{1,1,0}};
    cout << rowWithMaxOnes(t3) << endl;
    
    vector<vector<int>> t4 = {{1},{0},{1},{1}};
    cout << rowWithMaxOnes(t4) << endl;
    
    vector<vector<int>> t5 = {{0,1},{1,1},{1,0}};
    cout << rowWithMaxOnes(t5) << endl;
    
    return 0;
}`;
  }

  return `${headers}\n\n${studentCode}\n\n${mainFn}`;
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
      input: JSON.stringify(test.input),
      expected,
      actual,
      passed,
      points,
    });
  });

  return { score, tests: testResults };
}

function cleanupFiles(fileList) {
  fileList.forEach((file) => {
    try {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    } catch (err) {
      // Ignore cleanup errors
    }
  });
}

parentPort.on(
  "message",
  async ({ jobId, qNum, code, studentName, fullTests }) => {
    const startTime = Date.now();

    try {
      const tests = fullTests ? testCases[qNum] : limitedTestCases[qNum];
      if (!tests) {
        throw new Error(`No test cases available for question ${qNum}`);
      }

      const fullCode = createFullCode(qNum, code);
      const uniqueId = `${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const fileName = path.join(
        submissionDir,
        `temp_${uniqueId}_q${qNum}.cpp`
      );
      const exeName = path.join(submissionDir, `temp_${uniqueId}_q${qNum}`);

      fs.writeFileSync(fileName, fullCode);

      const compileCmd = `g++ -std=c++17 -O2 -Wall -Wextra -o "${exeName}" "${fileName}"`;

      exec(
        compileCmd,
        {
          timeout: 10000,
          maxBuffer: 512 * 1024,
          killSignal: "SIGKILL",
        },
        (error, stdout, stderr) => {
          if (error) {
            cleanupFiles([fileName, exeName, exeName + ".exe"]);
            parentPort.postMessage({
              jobId,
              success: false,
              error: `Compilation Error: ${stderr || error.message}`,
              processingTime: Date.now() - startTime,
            });
            return;
          }

          const runCmd =
            process.platform === "win32" ? `"${exeName}.exe"` : `"${exeName}"`;
          exec(
            runCmd,
            {
              timeout: 5000,
              maxBuffer: 1024 * 1024,
              killSignal: "SIGKILL",
            },
            (runError, runStdout, runStderr) => {
              cleanupFiles([fileName, exeName, exeName + ".exe"]);

              if (runError) {
                let errorMsg = runError.message;
                if (runError.killed && runError.signal === "SIGKILL") {
                  errorMsg =
                    "Time Limit Exceeded (TLE): Your solution is too slow. Consider optimizing your algorithm.";
                } else if (runStderr) {
                  errorMsg = `Runtime Error: ${runStderr}`;
                }
                parentPort.postMessage({
                  jobId,
                  success: false,
                  error: errorMsg,
                  processingTime: Date.now() - startTime,
                });
              } else {
                const result = evaluateOutput(qNum, runStdout, tests);
                const analysis = CodeAnalyzer.analyzeComplexity(code, qNum);

                parentPort.postMessage({
                  jobId,
                  success: true,
                  data: {
                    ...result,
                    complexity: analysis.complexity,
                    optimizationScore: analysis.optimizationScore,
                  },
                  processingTime: Date.now() - startTime,
                });
              }
            }
          );
        }
      );
    } catch (err) {
      parentPort.postMessage({
        jobId,
        success: false,
        error: `Processing Error: ${err.message}`,
        processingTime: Date.now() - startTime,
      });
    }
  }
);
