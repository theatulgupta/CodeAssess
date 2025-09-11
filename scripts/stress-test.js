const http = require("http");

// Test solutions for the new questions
const testCode = {
  1: `int secondLargest(vector<int>& arr) {
    if (arr.size() < 2) return -1;
    sort(arr.begin(), arr.end(), greater<int>());
    for (int i = 1; i < arr.size(); i++) {
        if (arr[i] != arr[0]) return arr[i];
    }
    return -1;
}`,
  2: `int countGreaterThanPrevious(vector<int>& arr) {
    if (arr.empty()) return 0;
    int cnt = 1;  
    int max_so_far = arr[0];
    for (int i = 1; i < arr.size(); i++) {
        if (arr[i] > max_so_far) {
            cnt++;
            max_so_far = arr[i];
        }
    }
    return cnt;
}`,
  3: `int rowWithMaxOnes(vector<vector<int>>& mat) {
    int maxOnes = -1, rowIndex = -1;
    for (int i = 0; i < mat.size(); i++) {
        int ones = count(mat[i].begin(), mat[i].end(), 1);
        if (ones > maxOnes) {
            maxOnes = ones;
            rowIndex = i;
        }
    }
    return rowIndex;
}`,
};

function makeRequest(questionNumber) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      questionNumber: questionNumber,
      code: testCode[questionNumber],
      studentName: `stress_test_${questionNumber}`,
    });

    const options = {
      hostname: "localhost",
      port: 3000,
      path: "/api/test-code",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
      },
    };

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const result = JSON.parse(body);
          resolve({
            status: res.statusCode,
            body: result,
            question: questionNumber,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            body: body,
            question: questionNumber,
            error: "Parse error: " + e.message,
          });
        }
      });
    });

    req.on("error", (err) => {
      reject({
        question: questionNumber,
        error: err.message,
      });
    });

    req.setTimeout(30000, () => {
      req.destroy();
      reject({
        question: questionNumber,
        error: "Request timeout",
      });
    });

    req.write(data);
    req.end();
  });
}

async function runStressTest() {
  console.log("🚀 Starting stress test with 20 concurrent requests...\n");

  const requests = [];

  // Create 20 requests across all 3 questions
  for (let i = 0; i < 20; i++) {
    const questionNumber = (i % 3) + 1; // Distribute across questions 1, 2, 3
    requests.push(makeRequest(questionNumber));
  }

  try {
    const results = await Promise.allSettled(requests);

    console.log("--- Stress Test Results ---");
    let successCount = 0;
    let failureCount = 0;

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        const response = result.value;
        if (response.status === 200 && response.body.score !== undefined) {
          console.log(
            `✅ Request ${index + 1}: Success (Q${response.question}, Score: ${
              response.body.score
            })`
          );
          successCount++;
        } else {
          console.log(
            `❌ Request ${index + 1}: Failed (Q${response.question}, Status: ${
              response.status
            }, Body: ${JSON.stringify(response.body).substring(0, 100)}...)`
          );
          failureCount++;
        }
      } else {
        console.log(`❌ Request ${index + 1}: Failed (${result.reason.error})`);
        failureCount++;
      }
    });

    console.log("\n--- Summary ---");
    console.log(`Total Requests: ${requests.length}`);
    console.log(`✅ Successes: ${successCount}`);
    console.log(`❌ Failures: ${failureCount}`);

    if (failureCount === 0) {
      console.log(
        "\n🎉 Stress test passed! System is robust and handles concurrent requests well."
      );
      process.exit(0);
    } else {
      console.log("\n⚠️  Stress test failed. Some requests did not succeed.");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Stress test encountered an error:", error.message);
    process.exit(1);
  }
}

runStressTest();
