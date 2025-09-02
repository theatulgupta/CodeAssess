const fs = require("fs");

function cleanupFiles(fileList) {
  fileList.forEach((file) => {
    if (fs.existsSync(file)) fs.unlinkSync(file);
  });
}

function createFullCode(qNum, studentCode) {
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
    1: `#include <iostream>\n#include <vector>\nusing namespace std;`,
    2: `#include <iostream>\n#include <vector>\nusing namespace std;`,
    3: `#include <iostream>\n#include <vector>\nusing namespace std;`,
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
  const codeToUse = hasFunction ? studentCode : defaultImplementations[qNum];

  return `${headers[qNum]}\n\n${codeToUse}\n\n${mainFunctions[qNum]}`;
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

module.exports = {
  cleanupFiles,
  createFullCode,
  evaluateOutput,
};