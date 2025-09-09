const { parentPort } = require('worker_threads');
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');
const CodeAnalyzer = require('./codeAnalyzer');

const submissionDir = path.join(__dirname, '../../submissions');

// Ensure submissions directory exists
if (!fs.existsSync(submissionDir)) {
  fs.mkdirSync(submissionDir, { recursive: true });
}

const testCases = {
  1: [
    { input: [1,2,3,4], expected: "24 12 8 6", points: 10 },
    { input: [2,0,4], expected: "0 8 0", points: 10 },
    { input: [1,1,1,1], expected: "1 1 1 1", points: 10 },
    { input: [0,0,0,0], expected: "0 0 0 0", points: 10 },
    { input: [-1,1,0,-3,3], expected: "0 0 9 0 0", points: 10 },
    { input: [-2,-3,-4], expected: "12 8 6", points: 10 },
    { input: [5,0], expected: "0 5", points: 10 },
    { input: [30,-30], expected: "-30 30", points: 10 },
    { input: Array(1000).fill(1), expected: Array(1000).fill(1).join(' '), points: 10 },
    { input: Array(2000).fill(2), expected: Array(2000).fill(2).join(' '), points: 10 },
  ],
  2: [
    { input: [15,-2,2,-8,1,7,10,23], expected: "5", points: 10 },
    { input: [1,2,3,4,5], expected: "0", points: 10 },
    { input: [1,2,-3,3], expected: "3", points: 10 },
    { input: [1,-1], expected: "2", points: 10 },
    { input: [0,0,0,0], expected: "4", points: 10 },
    { input: [1,0,-1,0,1], expected: "4", points: 10 },
    { input: [-1,2,-3,4,-5,6], expected: "4", points: 10 },
    { input: Array(1000).fill(0), expected: "1000", points: 10 },
    { input: Array.from({length: 5000}, (_, i) => i % 2 === 0 ? 1 : -1), expected: "5000", points: 10 },
    { input: Array.from({length: 10000}, (_, i) => Math.random() > 0.5 ? 1000000000 : -1000000000), expected: "10000", points: 10 },
  ],
  3: [
    { input: [100,4,200,1,3,2], expected: "4", points: 10 },
    { input: [9,1,4,7,3,-1,0,5,8,-1,6], expected: "7", points: 10 },
    { input: [1,2,0,1], expected: "3", points: 10 },
    { input: [5,6,7,8,9], expected: "5", points: 10 },
    { input: [], expected: "0", points: 10 },
    { input: [0,0,0,0], expected: "1", points: 10 },
    { input: [-1000000000,1000000000], expected: "1", points: 10 },
    { input: Array.from({length: 1000}, (_, i) => i), expected: "1000", points: 10 },
    { input: Array.from({length: 5000}, (_, i) => i * 2), expected: "1", points: 10 },
    { input: Array.from({length: 10000}, (_, i) => Math.floor(Math.random() * 2000000000) - 1000000000), expected: "1", points: 10 },
  ],
};

const limitedTestCases = {
  1: testCases[1].slice(0, 3),
  2: testCases[2].slice(0, 3),
  3: testCases[3].slice(0, 3),
};

function createFullCode(qNum, studentCode) {
  const functionNames = {
    1: "productExceptSelf",
    2: "largestZeroSumSubarray",
    3: "longestConsecutive",
  };

  const headers = {
    1: `#include <iostream>\n#include <vector>\n#include <ios>\nusing namespace std;`,
    2: `#include <iostream>\n#include <vector>\n#include <unordered_map>\n#include <ios>\nusing namespace std;`,
    3: `#include <iostream>\n#include <vector>\n#include <unordered_set>\n#include <algorithm>\n#include <cstdlib>\n#include <ios>\nusing namespace std;`,
  };

  const mainFunctions = {
    1: `int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    vector<vector<int>> testCases = {
        {1,2,3,4},
        {2,0,4},
        {1,1,1,1},
        {0,0,0,0},
        {-1,1,0,-3,3},
        {-2,-3,-4},
        {5,0},
        {30,-30},
        vector<int>(1000, 1),
        vector<int>(2000, 2)
    };
    
    for(auto& arr : testCases) {
        vector<int> result = productExceptSelf(arr);
        for(int i = 0; i < result.size(); i++) {
            cout << result[i];
            if(i < result.size()-1) cout << " ";
        }
        cout << endl;
    }
    
    return 0;
}`,
    2: `int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    vector<vector<int>> testCases = {
        {15,-2,2,-8,1,7,10,23},
        {1,2,3,4,5},
        {1,2,-3,3},
        {1,-1},
        {0,0,0,0},
        {1,0,-1,0,1},
        {-1,2,-3,4,-5,6},
        vector<int>(1000, 0),
        vector<int>(5000),
        vector<int>(10000)
    };
    
    // Fill alternating pattern for test case 9
    for(int i = 0; i < 5000; i++) {
        testCases[8][i] = (i % 2 == 0) ? 1 : -1;
    }
    
    // Fill random large values for test case 10
    for(int i = 0; i < 10000; i++) {
        testCases[9][i] = (i % 2 == 0) ? 1000000000 : -1000000000;
    }
    
    for(auto& arr : testCases) {
        cout << largestZeroSumSubarray(arr) << endl;
    }
    
    return 0;
}`,
    3: `int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    vector<vector<int>> testCases = {
        {100,4,200,1,3,2},
        {9,1,4,7,3,-1,0,5,8,-1,6},
        {1,2,0,1},
        {5,6,7,8,9},
        {},
        {0,0,0,0},
        {-1000000000,1000000000},
        vector<int>(1000),
        vector<int>(5000),
        vector<int>(10000)
    };
    
    // Fill consecutive sequence for test case 8
    for(int i = 0; i < 1000; i++) {
        testCases[7][i] = i;
    }
    
    // Fill non-consecutive for test case 9
    for(int i = 0; i < 5000; i++) {
        testCases[8][i] = i * 2;
    }
    
    // Fill random for test case 10
    for(int i = 0; i < 10000; i++) {
        testCases[9][i] = rand() % 2000000000 - 1000000000;
    }
    
    for(auto& arr : testCases) {
        cout << longestConsecutive(arr) << endl;
    }
    
    return 0;
}`,
  };

  return `${headers[qNum]}\n\n${studentCode}\n\n${mainFunctions[qNum]}`;
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

parentPort.on('message', async ({ jobId, qNum, code, studentName, fullTests }) => {
  const startTime = Date.now();
  
  try {
    const tests = fullTests ? testCases[qNum] : limitedTestCases[qNum];
    if (!tests) {
      throw new Error(`No test cases available for question ${qNum}`);
    }

    const fullCode = createFullCode(qNum, code);
    const uniqueId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fileName = path.join(submissionDir, `temp_${uniqueId}_q${qNum}.cpp`);
    const exeName = path.join(submissionDir, `temp_${uniqueId}_q${qNum}`);

    fs.writeFileSync(fileName, fullCode);

    const compileCmd = `g++ -std=c++17 -O2 -Wall -Wextra -o "${exeName}" "${fileName}"`;
    
    exec(compileCmd, { 
      timeout: 10000,
      maxBuffer: 512 * 1024,
      killSignal: 'SIGKILL'
    }, (error, stdout, stderr) => {
      if (error) {
        cleanupFiles([fileName, exeName, exeName + '.exe']);
        parentPort.postMessage({
          jobId,
          success: false,
          error: `Compilation Error: ${stderr || error.message}`,
          processingTime: Date.now() - startTime
        });
        return;
      }

      const runCmd = process.platform === 'win32' ? `"${exeName}.exe"` : `"${exeName}"`;
      exec(runCmd, { 
        timeout: 5000,
        maxBuffer: 1024 * 1024,
        killSignal: 'SIGKILL'
      }, (runError, runStdout, runStderr) => {
        cleanupFiles([fileName, exeName, exeName + '.exe']);
        
        if (runError) {
          let errorMsg = runError.message;
          if (runError.killed && runError.signal === 'SIGKILL') {
            errorMsg = 'Time Limit Exceeded (TLE): Your solution is too slow. Consider optimizing your algorithm.';
          } else if (runStderr) {
            errorMsg = `Runtime Error: ${runStderr}`;
          }
          parentPort.postMessage({
            jobId,
            success: false,
            error: errorMsg,
            processingTime: Date.now() - startTime
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
              optimizationScore: analysis.optimizationScore
            },
            processingTime: Date.now() - startTime
          });
        }
      });
    });

  } catch (err) {
    parentPort.postMessage({
      jobId,
      success: false,
      error: `Processing Error: ${err.message}`,
      processingTime: Date.now() - startTime
    });
  }
});