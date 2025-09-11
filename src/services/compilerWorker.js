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
      input: [
        [1, 2],
        [3, 4],
      ],
      expected: "[[1,3],[2,4]]",
      points: 5,
    },
    { input: [[2]], expected: "[[2]]", points: 5 },
    {
      input: [
        [5, 1, 8],
        [4, 7, 2],
        [9, 3, 6],
      ],
      expected: "[[5,4,9],[1,7,3],[8,2,6]]",
      points: 5,
    },
    {
      input: [
        [0, 0, 0],
        [1, 1, 1],
        [2, 2, 2],
      ],
      expected: "[[0,1,2],[0,1,2],[0,1,2]]",
      points: 5,
    },
    {
      input: [
        [-2, 3],
        [7, -1],
      ],
      expected: "[[-2,7],[3,-1]]",
      points: 5,
    },
  ],
  2: [
    {
      input: [
        [1, 2, 3],
        [4, 5, 6],
      ],
      expected: "[1,2,3,4,5,6]",
      points: 5,
    },
    { input: [[2, 4, 6], []], expected: "[2,4,6]", points: 5 },
    { input: [[], [1, 1, 2]], expected: "[1,1,2]", points: 5 },
    {
      input: [
        [1, 2, 3],
        [1, 2, 3],
      ],
      expected: "[1,1,2,2,3,3]",
      points: 5,
    },
    {
      input: [
        [0, 5, 7],
        [3, 8, 10],
      ],
      expected: "[0,3,5,7,8,10]",
      points: 5,
    },
  ],
  3: [
    {
      input: [
        [1, 2, 3],
        [3, 2, 1],
      ],
      expected: "[1,2,3]",
      points: 5,
    },
    { input: [[1, 1, 1, 1], [1]], expected: "[1]", points: 5 },
    {
      input: [
        [2, 3, 4],
        [5, 6, 7],
      ],
      expected: "[]",
      points: 5,
    },
    {
      input: [
        [0, 5, 7, 5],
        [5, 10, 0],
      ],
      expected: "[0,5]",
      points: 5,
    },
    {
      input: [
        [1, 2, 3, 4],
        [2, 4, 6, 4],
      ],
      expected: "[2,4]",
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
#include <unordered_set>
using namespace std;

void printMatrix(const vector<vector<int>>& matrix) {
    cout << "[";
    for (int i = 0; i < matrix.size(); i++) {
        cout << "[";
        for (int j = 0; j < matrix[i].size(); j++) {
            cout << matrix[i][j];
            if (j < matrix[i].size() - 1) cout << ",";
        }
        cout << "]";
        if (i < matrix.size() - 1) cout << ",";
    }
    cout << "]";
}

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
    vector<vector<int>> t1 = {{1,2},{3,4}};
    transposeMatrix(t1);
    printMatrix(t1);
    cout << endl;
    
    vector<vector<int>> t2 = {{2}};
    transposeMatrix(t2);
    printMatrix(t2);
    cout << endl;
    
    vector<vector<int>> t3 = {{5,1,8},{4,7,2},{9,3,6}};
    transposeMatrix(t3);
    printMatrix(t3);
    cout << endl;
    
    vector<vector<int>> t4 = {{0,0,0},{1,1,1},{2,2,2}};
    transposeMatrix(t4);
    printMatrix(t4);
    cout << endl;
    
    vector<vector<int>> t5 = {{-2,3},{7,-1}};
    transposeMatrix(t5);
    printMatrix(t5);
    cout << endl;
    
    return 0;
}`;
  } else if (qNum === 2) {
    mainFn = `int main() {
    vector<int> arr1_1 = {1,2,3};
    vector<int> arr2_1 = {4,5,6};
    printArray(mergeSortedArrays(arr1_1, arr2_1));
    cout << endl;
    
    vector<int> arr1_2 = {2,4,6};
    vector<int> arr2_2 = {};
    printArray(mergeSortedArrays(arr1_2, arr2_2));
    cout << endl;
    
    vector<int> arr1_3 = {};
    vector<int> arr2_3 = {1,1,2};
    printArray(mergeSortedArrays(arr1_3, arr2_3));
    cout << endl;
    
    vector<int> arr1_4 = {1,2,3};
    vector<int> arr2_4 = {1,2,3};
    printArray(mergeSortedArrays(arr1_4, arr2_4));
    cout << endl;
    
    vector<int> arr1_5 = {0,5,7};
    vector<int> arr2_5 = {3,8,10};
    printArray(mergeSortedArrays(arr1_5, arr2_5));
    cout << endl;
    
    return 0;
}`;
  } else if (qNum === 3) {
    mainFn = `int main() {
    vector<int> arr1_1 = {1,2,3};
    vector<int> arr2_1 = {3,2,1};
    vector<int> result1 = arrayIntersection(arr1_1, arr2_1);
    sort(result1.begin(), result1.end());
    printArray(result1);
    cout << endl;
    
    vector<int> arr1_2 = {1,1,1,1};
    vector<int> arr2_2 = {1};
    vector<int> result2 = arrayIntersection(arr1_2, arr2_2);
    sort(result2.begin(), result2.end());
    printArray(result2);
    cout << endl;
    
    vector<int> arr1_3 = {2,3,4};
    vector<int> arr2_3 = {5,6,7};
    vector<int> result3 = arrayIntersection(arr1_3, arr2_3);
    sort(result3.begin(), result3.end());
    printArray(result3);
    cout << endl;
    
    vector<int> arr1_4 = {0,5,7,5};
    vector<int> arr2_4 = {5,10,0};
    vector<int> result4 = arrayIntersection(arr1_4, arr2_4);
    sort(result4.begin(), result4.end());
    printArray(result4);
    cout << endl;
    
    vector<int> arr1_5 = {1,2,3,4};
    vector<int> arr2_5 = {2,4,6,4};
    vector<int> result5 = arrayIntersection(arr1_5, arr2_5);
    sort(result5.begin(), result5.end());
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
