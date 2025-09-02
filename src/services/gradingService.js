const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const { TEST_CASES, MCQ_ANSWERS } = require("../config/constants");
const { createFullCode, cleanupFiles, evaluateOutput } = require("../utils/codeUtils");

// Grading queue for load management
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
      const tests = TEST_CASES[qNum];
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
        const fileName = path.join("submissions", `temp_${uniqueId}_q${qNum}.cpp`);
        const exeName = path.join("submissions", `temp_${uniqueId}_q${qNum}`);

        fs.writeFileSync(fileName, fullCode);

        const compileCmd = `g++ -std=c++17 -O2 -Wall -Wextra -o "${exeName}" "${fileName}"`;
        exec(compileCmd, { 
          timeout: 10000,
          maxBuffer: 512 * 1024,
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
              timeout: 5000,
              maxBuffer: 256 * 1024,
              cwd: process.cwd(),
              killSignal: 'SIGKILL'
            }, (runError, runStdout, runStderr) => {
              if (runError) {
                results[qNum] = {
                  score: 0,
                  error: `Runtime Error: ${runStderr || runError.message}`,
                  tests: [],
                };
              } else {
                const score = evaluateOutput(qNum, runStdout, tests);
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

function gradeMCQ(studentMCQAnswers) {
  let mcqScore = 0;
  let mcqMaxScore = 25;
  let mcqResults = {};

  for (let i = 1; i <= 5; i++) {
    const questionKey = `mcq${i}`;
    const studentAnswer = studentMCQAnswers ? studentMCQAnswers[questionKey] : null;
    const correctAnswer = MCQ_ANSWERS[questionKey];

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

  return { mcqScore, mcqMaxScore, mcqResults };
}

module.exports = {
  autoGrade,
  gradeMCQ,
};