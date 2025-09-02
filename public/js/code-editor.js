// Code Editor Module
function setupCodeEditors() {
    for (let i = 1; i <= 3; i++) {
        const textarea = document.getElementById("q" + i);
        
        textarea.addEventListener("input", function() {
            updateQuestionStatus(i);
            updateCompletedCount();
        });

        textarea.addEventListener("keydown", function(e) {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = this.selectionStart;
                const end = this.selectionEnd;
                this.value = this.value.substring(0, start) + "    " + this.value.substring(end);
                this.selectionStart = this.selectionEnd = start + 4;
            }
            
            // Auto-indent on Enter
            if (e.key === 'Enter') {
                e.preventDefault();
                const start = this.selectionStart;
                const lines = this.value.substring(0, start).split('\n');
                const currentLine = lines[lines.length - 1];
                const indent = currentLine.match(/^\s*/)[0];
                
                // Add extra indent if line ends with {
                const extraIndent = currentLine.trim().endsWith('{') ? '    ' : '';
                
                const newText = '\n' + indent + extraIndent;
                this.value = this.value.substring(0, start) + newText + this.value.substring(start);
                this.selectionStart = this.selectionEnd = start + newText.length;
            }
            
            // Auto-close braces
            if (e.key === '{') {
                setTimeout(() => {
                    const start = this.selectionStart;
                    if (this.value[start] !== '}') {
                        this.value = this.value.substring(0, start) + '\n}' + this.value.substring(start);
                        this.selectionStart = this.selectionEnd = start;
                    }
                }, 0);
            }
        });
    }
}

function formatCppCode(code) {
    if (!code || code.trim() === '') return code;
    
    let lines = code.split('\n');
    let formatted = [];
    let indentLevel = 0;
    const indentSize = 4;
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (line === '') {
            formatted.push('');
            continue;
        }
        
        // Decrease indent for closing braces
        if (line.startsWith('}')) {
            indentLevel = Math.max(0, indentLevel - 1);
        }
        
        // Add proper indentation
        let indent = ' '.repeat(indentLevel * indentSize);
        
        // Format specific C++ constructs
        line = formatCppLine(line);
        
        formatted.push(indent + line);
        
        // Increase indent after opening braces
        if (line.endsWith('{')) {
            indentLevel++;
        }
    }
    
    return formatted.join('\n');
}

function formatCppLine(line) {
    // Add space after keywords
    line = line.replace(/\b(if|for|while|switch)\s*\(/g, '$1 (');
    
    // Add spaces around operators
    line = line.replace(/([^=!<>])=([^=])/g, '$1 = $2');
    line = line.replace(/([^=!<>])==([^=])/g, '$1 == $2');
    line = line.replace(/([^=!<>])!=([^=])/g, '$1 != $2');
    line = line.replace(/([^<])<=([^=])/g, '$1 <= $2');
    line = line.replace(/([^>])>=([^=])/g, '$1 >= $2');
    line = line.replace(/([^<>])<([^<=])/g, '$1 < $2');
    line = line.replace(/([^<>])>([^>=])/g, '$1 > $2');
    line = line.replace(/([^+])\+([^+=])/g, '$1 + $2');
    line = line.replace(/([^-])-([^-=])/g, '$1 - $2');
    line = line.replace(/([^*])\*([^*=])/g, '$1 * $2');
    line = line.replace(/([^/])\/([^/=])/g, '$1 / $2');
    
    // Add space after commas
    line = line.replace(/,([^\s])/g, ', $1');
    
    // Add space after semicolons in for loops
    line = line.replace(/;([^\s])/g, '; $1');
    
    // Format function declarations
    line = line.replace(/\)\s*\{/g, ') {');
    
    // Clean up multiple spaces
    line = line.replace(/\s+/g, ' ');
    
    return line;
}

function updateQuestionStatus(qNum) {
    const textarea = document.getElementById("q" + qNum);
    const statusDot = document.getElementById("status" + qNum);
    const currentContent = textarea.value.trim();
    const defaultContent = defaultTemplates[qNum].trim();

    if (currentContent === defaultContent || currentContent === "") {
        statusDot.className = "status-dot status-empty";
    } else {
        statusDot.className = "status-dot status-modified";
    }
}

function updateCompletedCount() {
    let completed = 0;
    for (let i = 1; i <= 3; i++) {
        const textarea = document.getElementById("q" + i);
        const currentContent = textarea.value.trim();
        const defaultContent = defaultTemplates[i].trim();
        if (currentContent !== defaultContent && currentContent !== "") {
            completed++;
        }
    }
    document.getElementById("completedCount").textContent = completed;
}