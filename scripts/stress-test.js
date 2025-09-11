const http = require("http");

// Test solutions for the new questions
const testCode = {
  1: `void transposeMatrix(vector<vector<int>>& matrix) {
    int n = matrix.size();
    for (int i = 0; i < n; i++) {
        for (int j = i + 1; j < n; j++) {
            swap(matrix[i][j], matrix[j][i]);
        }
    }
}`,
  2: `vector<int> mergeSortedArrays(const vector<int>& arr1, const vector<int>& arr2) {
    vector<int> result;
    int i = 0, j = 0;
    while (i < arr1.size() && j < arr2.size()) {
        if (arr1[i] <= arr2[j]) {
            result.push_back(arr1[i++]);
        } else {
            result.push_back(arr2[j++]);
        }
    }
    while (i < arr1.size()) result.push_back(arr1[i++]);
    while (j < arr2.size()) result.push_back(arr2[j++]);
    return result;
}`,
  3: `vector<int> arrayIntersection(const vector<int>& arr1, const vector<int>& arr2) {
    unordered_set<int> set1(arr1.begin(), arr1.end());
    unordered_set<int> result_set;
    for (int num : arr2) {
        if (set1.count(num)) {
            result_set.insert(num);
        }
    }
    return vector<int>(result_set.begin(), result_set.end());
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
