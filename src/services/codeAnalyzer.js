class CodeAnalyzer {
  static analyzeComplexity(code, qNum) {
    const cleanCode = code
      .replace(/\/\/.*$/gm, "")
      .replace(/\/\*[\s\S]*?\*\//g, "");

    // Count nested loops and complexity indicators
    const nestedLoops = this.countNestedLoops(cleanCode);
    const hasHashMap = /unordered_map|unordered_set|map|set/.test(cleanCode);
    const hasSorting = /sort\s*\(/.test(cleanCode);
    const hasLinearScan = /for\s*\([^)]*\)\s*{[^}]*for\s*\([^)]*\)/.test(
      cleanCode
    );

    let complexity = "O(n)";
    let optimizationScore = 100;

    // Question-specific analysis
    switch (qNum) {
      case "1": // Matrix Transpose
        if (nestedLoops >= 2) {
          complexity = "O(n²)";
          optimizationScore = 100; // Expected for in-place transpose
        } else {
          optimizationScore = 50; // May not be optimal implementation
        }
        break;

      case "2": // Merge Sorted Arrays
        if (nestedLoops >= 2 || hasLinearScan) {
          complexity = "O(n²)";
          optimizationScore = 30;
        } else if (hasSorting) {
          complexity = "O(n log n)";
          optimizationScore = 60; // Sorting not needed for sorted arrays
        } else {
          complexity = "O(n + m)";
          optimizationScore = 100; // Optimal two-pointer approach
        }
        break;

      case "3": // Array Intersection
        if (nestedLoops >= 2 || hasLinearScan) {
          complexity = "O(n²)";
          optimizationScore = 20;
        } else if (hasSorting) {
          complexity = "O(n log n)";
          optimizationScore = 70;
        } else if (hasHashMap) {
          complexity = "O(n + m)";
          optimizationScore = 100; // Optimal hash set approach
        } else {
          optimizationScore = 50;
        }
        break;
    }

    return { complexity, optimizationScore };
  }

  static countNestedLoops(code) {
    let maxNesting = 0;
    let currentNesting = 0;

    const tokens = code.match(/for\s*\(|while\s*\(|{|}/g) || [];
    let braceDepth = 0;

    for (const token of tokens) {
      if (token.includes("for") || token.includes("while")) {
        currentNesting++;
        maxNesting = Math.max(maxNesting, currentNesting);
      } else if (token === "{") {
        braceDepth++;
      } else if (token === "}") {
        braceDepth--;
        if (braceDepth === 0) {
          currentNesting = 0;
        }
      }
    }

    return maxNesting;
  }
}

module.exports = CodeAnalyzer;
