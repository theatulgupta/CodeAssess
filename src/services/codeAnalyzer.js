class CodeAnalyzer {
  static analyzeComplexity(code, qNum) {
    const cleanCode = code.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Count nested loops and complexity indicators
    const nestedLoops = this.countNestedLoops(cleanCode);
    const hasHashMap = /unordered_map|unordered_set|map|set/.test(cleanCode);
    const hasSorting = /sort\s*\(/.test(cleanCode);
    const hasLinearScan = /for\s*\([^)]*\)\s*{[^}]*for\s*\([^)]*\)/.test(cleanCode);
    
    let complexity = 'O(n)';
    let optimizationScore = 100;
    
    // Question-specific analysis
    switch(qNum) {
      case '1': // Product Except Self
        if (nestedLoops >= 2 || hasLinearScan) {
          complexity = 'O(n²)';
          optimizationScore = 30;
        } else if (/division|\//.test(cleanCode)) {
          optimizationScore = 70; // Uses division (not optimal)
        }
        break;
        
      case '2': // Largest Zero Sum Subarray
        if (nestedLoops >= 2 || hasLinearScan) {
          complexity = 'O(n²)';
          optimizationScore = 20;
        } else if (!hasHashMap) {
          optimizationScore = 60; // No hash map optimization
        }
        break;
        
      case '3': // Longest Consecutive Sequence
        if (hasSorting) {
          complexity = 'O(n log n)';
          optimizationScore = 50;
        } else if (nestedLoops >= 2) {
          complexity = 'O(n²)';
          optimizationScore = 10;
        } else if (!hasHashMap) {
          optimizationScore = 40;
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
      if (token.includes('for') || token.includes('while')) {
        currentNesting++;
        maxNesting = Math.max(maxNesting, currentNesting);
      } else if (token === '{') {
        braceDepth++;
      } else if (token === '}') {
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