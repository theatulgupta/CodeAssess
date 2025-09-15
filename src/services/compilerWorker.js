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
    {
      input: [[1, 3, 5, 7, 9, 12], 9],
      expected: "4",
      points: 5,
    },
    {
      input: [[2, 4, 6, 8, 10], 5],
      expected: "-1",
      points: 5,
    },
    {
      input: [[0, 1, 2, 3, 4, 5], 0],
      expected: "0",
      points: 5,
    },
    {
      input: [[-5, -3, -1, 0, 2], -1],
      expected: "2",
      points: 5,
    },
    {
      input: [[100], 100],
      expected: "0",
      points: 5,
    },
  ],
  2: [
    {
      input: [[1, 2, 3, 4]],
      expected: "10",
      points: 5,
    },
    {
      input: [[]],
      expected: "0",
      points: 5,
    },
    {
      input: [[100, 200, 300]],
      expected: "600",
      points: 5,
    },
    {
      input: [[-5, 5]],
      expected: "0",
      points: 5,
    },
    {
      input: [[1]],
      expected: "1",
      points: 5,
    },
  ],
  3: [
    {
      input: [[1, 2, 4, 7, 11], 13],
      expected: "[1,4]",
      points: 5,
    },
    {
      input: [[1, 2, 3, 4], 8],
      expected: "[]",
      points: 5,
    },
    {
      input: [[-2, 0, 1, 3, 5], 3],
      expected: "[0,4]",
      points: 5,
    },
    {
      input: [[0, 1, 2, 3, 4, 5], 6],
      expected: "[1,5]",
      points: 5,
    },
    {
      input: [[10, 12, 14, 16, 18], 22],
      expected: "[0,1]",
      points: 5,
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
#include <cassert>
#include <set>
#include <map>
#include <unordered_map>
#include <unordered_set>
using namespace std;

void printArray(const vector<int>& arr) {
    cout << "[";
    for (int i = 0; i < arr.size(); i++) {
        cout << arr[i];
        if (i < arr.size() - 1) cout << ",";
    }
    cout << "]";
}`;

  let mainFn = "";
  if (qNum === 1) {
    mainFn = `int main() {
    // Test Case 1: Binary Search
    vector<int> nums1 = {1,3,5,7,9,12};
    cout << binarySearch(nums1, 9) << endl;
    
    // Test Case 2: Binary Search
    vector<int> nums2 = {2,4,6,8,10};
    cout << binarySearch(nums2, 5) << endl;
    
    // Test Case 3: Binary Search
    vector<int> nums3 = {0,1,2,3,4,5};
    cout << binarySearch(nums3, 0) << endl;
    
    // Test Case 4: Binary Search
    vector<int> nums4 = {-5,-3,-1,0,2};
    cout << binarySearch(nums4, -1) << endl;
    
    // Test Case 5: Binary Search
    vector<int> nums5 = {100};
    cout << binarySearch(nums5, 100) << endl;
    
    return 0;
}`;
  } else if (qNum === 2) {
    mainFn = `int main() {
    // Test Case 1: Recursive Array Sum
    vector<int> nums1 = {1,2,3,4};
    cout << recursiveArraySum(nums1) << endl;
    
    // Test Case 2: Recursive Array Sum
    vector<int> nums2 = {};
    cout << recursiveArraySum(nums2) << endl;
    
    // Test Case 3: Recursive Array Sum
    vector<int> nums3 = {100,200,300};
    cout << recursiveArraySum(nums3) << endl;
    
    // Test Case 4: Recursive Array Sum
    vector<int> nums4 = {-5,5};
    cout << recursiveArraySum(nums4) << endl;
    
    // Test Case 5: Recursive Array Sum
    vector<int> nums5 = {1};
    cout << recursiveArraySum(nums5) << endl;
    
    return 0;
}`;
  } else if (qNum === 3) {
    mainFn = `int main() {
    // Test Case 1: Two Sum Indices
    vector<int> nums1 = {1,2,4,7,11};
    vector<int> result1 = twoSumIndices(nums1, 13);
    printArray(result1);
    cout << endl;
    
    // Test Case 2: Two Sum Indices
    vector<int> nums2 = {1,2,3,4};
    vector<int> result2 = twoSumIndices(nums2, 8);
    printArray(result2);
    cout << endl;
    
    // Test Case 3: Two Sum Indices
    vector<int> nums3 = {-2,0,1,3,5};
    vector<int> result3 = twoSumIndices(nums3, 3);
    printArray(result3);
    cout << endl;
    
    // Test Case 4: Two Sum Indices
    vector<int> nums4 = {0,1,2,3,4,5};
    vector<int> result4 = twoSumIndices(nums4, 6);
    printArray(result4);
    cout << endl;
    
    // Test Case 5: Two Sum Indices
    vector<int> nums5 = {10,12,14,16,18};
    vector<int> result5 = twoSumIndices(nums5, 22);
    printArray(result5);
    cout << endl;
    
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

  return { score, maxScore: 25, tests: testResults };
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
          timeout: parseInt(process.env.COMPILE_TIMEOUT_MS || "10000", 10),
          maxBuffer: parseInt(
            process.env.COMPILE_MAX_BUFFER || `${512 * 1024}`,
            10
          ),
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
              timeout: parseInt(process.env.RUN_TIMEOUT_MS || "5000", 10),
              maxBuffer: parseInt(
                process.env.RUN_MAX_BUFFER || `${1024 * 1024}`,
                10
              ),
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
