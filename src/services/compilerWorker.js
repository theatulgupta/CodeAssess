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
    { input: [[1,2,3],[4,5,6]], expected: "1 4\n2 5\n3 6", points: 7 },
    { input: [[1,2],[3,4],[5,6]], expected: "1 3 5\n2 4 6", points: 7 },
    { input: [[1]], expected: "1", points: 6 },
    { input: [[1,2,3],[4,5,6],[7,8,9]], expected: "1 4 7\n2 5 8\n3 6 9", points: 7 },
    { input: [[1,2,3,4]], expected: "1\n2\n3\n4", points: 6 },
  ],
  2: [
    { input: {nums1: [1,2,3], nums2: [2,5,6]}, expected: "1 2 2 3 5 6", points: 7 },
    { input: {nums1: [1], nums2: []}, expected: "1", points: 7 },
    { input: {nums1: [], nums2: [1]}, expected: "1", points: 6 },
    { input: {nums1: [1,3,5], nums2: [2,4,6]}, expected: "1 2 3 4 5 6", points: 7 },
    { input: {nums1: [4,5,6], nums2: [1,2,3]}, expected: "1 2 3 4 5 6", points: 6 },
  ],
  3: [
    { input: {nums1: [1,2,2,1], nums2: [2,2]}, expected: "2", points: 7 },
    { input: {nums1: [4,9,5], nums2: [9,4,9,8,4]}, expected: "4 9", points: 7 },
    { input: {nums1: [1,2,3], nums2: [4,5,6]}, expected: "", points: 6 },
    { input: {nums1: [1,2,3,4], nums2: [3,4,5,6]}, expected: "3 4", points: 7 },
    { input: {nums1: [1], nums2: [1,1]}, expected: "1", points: 6 },
  ],
};

const limitedTestCases = {
  1: testCases[1].slice(0, 3),
  2: testCases[2].slice(0, 3),
  3: testCases[3].slice(0, 3),
};

function createFullCode(qNum, studentCode) {
  const functionNames = {
    1: "transpose",
    2: "mergeSortedArrays",
    3: "intersection",
  };

  const headers = {
    1: `#include <iostream>\n#include <vector>\nusing namespace std;`,
    2: `#include <iostream>\n#include <vector>\nusing namespace std;`,
    3: `#include <iostream>\n#include <vector>\n#include <unordered_set>\nusing namespace std;`,
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