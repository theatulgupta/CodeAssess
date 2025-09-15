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
    switch (parseInt(qNum)) {
      case 1: // Binary Search
        if (
          nestedLoops >= 1 ||
          /for\s*\(|while\s*\(/.test(cleanCode.replace(/\/\/.*$/gm, ""))
        ) {
          complexity = "O(n)";
          optimizationScore = 30; // Linear search instead of binary search
        } else if (/\/\s*2|>>/.test(cleanCode)) {
          complexity = "O(log n)";
          optimizationScore = 100; // Optimal binary search implementation
        } else {
          complexity = "O(log n)";
          optimizationScore = 85; // Likely binary search but unclear division
        }
        break;

      case 2: // Recursive Array Sum
        if (/for\s*\(|while\s*\(/.test(cleanCode)) {
          complexity = "O(n)";
          optimizationScore = 60; // Iterative solution (not recursive as required)
        } else if (
          cleanCode.includes("recursiveArraySum") &&
          cleanCode.includes("return")
        ) {
          complexity = "O(n)";
          optimizationScore = 100; // Proper recursive implementation
        } else {
          complexity = "O(n)";
          optimizationScore = 75; // Likely recursive but hard to verify
        }
        break;

      case 3: // Two Sum with Two Pointers
        if (nestedLoops >= 2 || hasLinearScan) {
          complexity = "O(n²)";
          optimizationScore = 20; // Brute force approach
        } else if (hasHashMap) {
          complexity = "O(n)";
          optimizationScore = 85; // Hash map approach (good but not two pointers)
        } else if (hasSorting) {
          complexity = "O(n log n)";
          optimizationScore = 60; // Sorting then two pointers (but array already sorted)
        } else if (/left|right|start|end|\+\+|\-\-/.test(cleanCode)) {
          complexity = "O(n)";
          optimizationScore = 100; // Optimal two pointers approach
        } else {
          complexity = "O(n)";
          optimizationScore = 70; // Unclear implementation
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
