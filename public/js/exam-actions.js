// Exam Actions Module
let studentName = "";
let answers = {};

function saveAnswer(qNum) {
    const textarea = document.getElementById("q" + qNum);
    let answer = textarea.value.trim();
    
    if (!answer || answer === defaultTemplates[qNum].trim()) {
        showToast('warning', 'Nothing to Save', 'Please write some code before saving');
        return;
    }
    
    // Auto-format the code
    answer = formatCppCode(answer);
    textarea.value = answer;
    
    answers[qNum] = answer;
    
    const statusDot = document.getElementById("status" + qNum);
    statusDot.className = "status-dot status-saved";
    
    localStorage.setItem(`${studentName}_answers`, JSON.stringify(answers));
    showToast('success', 'Answer Saved', `Question ${qNum} saved successfully`);
    
    // Special encouragement for Richa after saving
    if (window.studentRollNumber === '25MCSS02') {
        createFloatingEmojis(['✨', '💫', '🌟', '💖', '🎆']);
        createSparkles(8);
        setTimeout(() => {
            const randomQuote = richaSaveQuotes[Math.floor(Math.random() * richaSaveQuotes.length)];
            showRichaMessage(randomQuote);
            createMinuteHeart();
        }, 500);
    }
}

function clearAnswer(qNum) {
    const textarea = document.getElementById("q" + qNum);
    if (textarea.value.trim() === defaultTemplates[qNum].trim()) {
        showToast('warning', 'Already Empty', 'This question is already cleared');
        return;
    }
    
    textarea.value = defaultTemplates[qNum];
    updateQuestionStatus(qNum);
    updateCompletedCount();
    showToast('success', 'Answer Cleared', `Question ${qNum} has been reset`);
    
    // Gentle encouragement for Richa when clearing
    if (window.studentRollNumber === '25MCSS02') {
        setTimeout(() => {
            showRichaMessage("Fresh start! You've got this! 💪✨");
            createWavingHand();
        }, 300);
    }
}

function runCode(qNum) {
    const code = document.getElementById("q" + qNum).value.trim();
    const outputDiv = document.getElementById("output" + qNum);
    
    if (!code || code === defaultTemplates[qNum].trim()) {
        showToast('warning', 'No Code to Run', 'Please write some code before testing');
        return;
    }
    
    showToast('info', 'Running Tests', 'Compiling and testing your code...');
    outputDiv.innerHTML = '<div style="color: #3b82f6;">🔄 Compiling and testing...</div>';
    outputDiv.style.display = 'block';
    
    fetch('/api/test-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            questionNumber: qNum,
            code: code,
            studentName: window.studentName || studentName
        })
    })
    .then(response => response.json())
    .then(data => {
        displayTestResults(qNum, data);
        if (data.error) {
            showToast('error', 'Compilation Error', 'Check the output panel for details');
        } else {
            const passedTests = data.tests ? data.tests.filter(t => t.passed).length : 0;
            const totalTests = data.tests ? data.tests.length : 0;
            showToast('success', 'Tests Complete', `${passedTests}/${totalTests} test cases passed`);
        }
    })
    .catch(error => {
        outputDiv.innerHTML = `<div style="color: #ef4444;">❌ Error: ${error.message}</div>`;
        showToast('error', 'Connection Error', 'Failed to run tests. Please try again.');
    });
}

function displayTestResults(qNum, results) {
    const outputDiv = document.getElementById("output" + qNum);
    
    if (results.error) {
        outputDiv.innerHTML = `
            <div class="output-header">
                <span style="color: #ef4444;">❌</span>
                <span>Compilation Error</span>
            </div>
            <pre style="color: #ef4444; white-space: pre-wrap;">${results.error}</pre>
        `;
        return;
    }
    
    let html = '';
    let allPassed = true;
    let passedCount = 0;
    
    if (results.tests && results.tests.length > 0) {
        results.tests.forEach((test, index) => {
            const passed = test.passed;
            if (passed) passedCount++;
            allPassed = allPassed && passed;
            
            html += `
                <div class="test-result ${passed ? 'test-pass' : 'test-fail'}">
                    <div style="display: flex; justify-content: space-between; font-weight: 600; margin-bottom: 0.5rem;">
                        <span>${passed ? '✅' : '❌'} Test Case ${index + 1}</span>
                        <span>${test.points}/${test.points || 10} pts</span>
                    </div>
                    <div style="font-size: 0.8rem; opacity: 0.9;">
                        Expected: <code>${test.expected}</code><br>
                        Your Output: <code>${test.actual}</code>
                    </div>
                </div>
            `;
        });
        
        const totalScore = results.tests.reduce((sum, test) => sum + (test.passed ? test.points : 0), 0);
        const maxScore = results.tests.reduce((sum, test) => sum + test.points, 0);
        
        const summaryIcon = allPassed ? '🎉' : (passedCount > 0 ? '⚡' : '❌');
        const summaryText = allPassed ? 'All tests passed!' : 
                           passedCount > 0 ? `${passedCount}/${results.tests.length} tests passed` : 
                           'All tests failed';
        
        html = `
            <div class="output-header">
                <span>${summaryIcon}</span>
                <span>${summaryText}</span>
            </div>
            <div class="test-summary">
                <div style="font-weight: 600; margin-bottom: 0.5rem;">Score: ${totalScore}/${maxScore} points</div>
                <div style="font-size: 0.875rem; opacity: 0.8;">Accuracy: ${Math.round((totalScore/maxScore)*100)}%</div>
            </div>
        ` + html;
    }
    
    outputDiv.innerHTML = html;
    
    // Special celebration for Richa on successful runs
    if (window.studentRollNumber === '25MCSS02' && passedCount > 0) {
        richaSuccessCelebration(passedCount, results.tests.length);
        
        // Extra random quote for successful test runs
        setTimeout(() => {
            const randomQuote = richaTestQuotes[Math.floor(Math.random() * richaTestQuotes.length)];
            showRichaMessage(randomQuote);
            createButterfly();
        }, 1500);
    }
}

function submitTest() {
    const submitBtn = document.querySelector('.btn-submit');
    const originalText = submitBtn.innerHTML;
    
    examSecurityActive = false;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading-spinner"></span>Submitting...';
    
    for (let i = 1; i <= 3; i++) {
        answers[i] = document.getElementById("q" + i).value.trim();
    }

    const submissionData = {
        name: window.studentName || studentName,
        rollNumber: window.studentRollNumber,
        answers: answers,
        mcqAnswers: {},
        timestamp: new Date().toISOString(),
        tabSwitchCount: tabSwitchCount
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    fetch("/api/submit", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Cache-Control": "no-cache"
        },
        body: JSON.stringify(submissionData),
        signal: controller.signal
    })
    .then(response => {
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error(`Server error: ${response.status}`);
        return response.json();
    })
    .then(data => {
        clearInterval(timer);
        if (data.error) throw new Error(data.details || data.error);
        showSuccessOverlay(data);
    })
    .catch(error => {
        clearTimeout(timeoutId);
        examSecurityActive = true;
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        
        let message = 'Please try again';
        let retryDelay = 2000;
        
        if (error.name === 'AbortError') {
            message = 'Server timeout. Retrying automatically...';
            retryDelay = 5000;
        } else if (error.message && error.message.includes('503')) {
            message = 'Server busy. Retrying in 10 seconds...';
            retryDelay = 10000;
        } else if (error.message && error.message.includes('409')) {
            message = 'Already submitted. Cannot resubmit.';
            submitBtn.disabled = true;
            return;
        }
        
        showToast('error', 'Submission Failed', message);
        
        // Auto-retry for server errors
        if (error.name === 'AbortError' || (error.message && error.message.includes('503'))) {
            setTimeout(() => {
                showToast('info', 'Retrying...', 'Attempting to submit again');
                submitTest();
            }, retryDelay);
        }
    });
}

function showSuccessOverlay(data) {
    const overlay = document.createElement('div');
    overlay.className = 'success-overlay';
    overlay.style.display = 'flex';
    
    const percentage = data.totalScore && data.maxScore ? 
        ((data.totalScore / data.maxScore) * 100).toFixed(1) : '0';
    
    // Special celebration for Richa
    if (window.studentRollNumber === '25MCSS02') {
        overlay.style.background = 'linear-gradient(135deg, rgba(255, 105, 180, 0.95), rgba(255, 20, 147, 0.95))';
        
        overlay.innerHTML = `
            <div class="success-content">
                <div class="success-icon">🎉💖✨</div>
                <h1 class="success-title">Outstanding Work, Richa!</h1>
                <p class="success-message">You've completed your special exam with flying colors! 🌟🦋</p>
                <div class="success-details">
                    <h3 style="margin-bottom: 1rem;">🎆 Your Amazing Results 🎆</h3>
                    <p><strong>Score:</strong> ${data.totalScore || 0}/${data.maxScore || 100} (${percentage}%) 💫</p>
                    <p><strong>Submitted:</strong> ${new Date().toLocaleString()} ✨</p>
                    <p style="margin-top: 1rem; font-style: italic; color: #fff;">"Excellence is not a skill, it's an attitude" - You've shown both! 💖</p>
                </div>
                <p style="opacity: 0.9; margin-top: 1rem;">This magical window will close in 8 seconds... 🌈</p>
            </div>
            ${Array.from({length: 15}, (_, i) => '<div class="confetti"></div>').join('')}
        `;
        
        // Extra celebration effects for Richa
        createFloatingEmojis(['🎉', '🎆', '✨', '💖', '🌟', '🦋', '🌈', '💫']);
        createSparkles(25);
        
        setTimeout(() => {
            window.close();
            window.location.href = 'about:blank';
        }, 8000);
    } else {
        overlay.innerHTML = `
            <div class="success-content">
                <div class="success-icon">🎉</div>
                <h1 class="success-title">Exam Submitted!</h1>
                <p class="success-message">Congratulations! Your assessment has been submitted successfully.</p>
                <div class="success-details">
                    <h3 style="margin-bottom: 1rem;">Your Results</h3>
                    <p><strong>Score:</strong> ${data.totalScore || 0}/${data.maxScore || 100} (${percentage}%)</p>
                    <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
                </div>
                <p style="opacity: 0.8; margin-top: 1rem;">This window will close automatically in 5 seconds...</p>
            </div>
            ${Array.from({length: 9}, (_, i) => '<div class="confetti"></div>').join('')}
        `;
        
        setTimeout(() => {
            window.close();
            window.location.href = 'about:blank';
        }, 5000);
    }
    
    document.body.appendChild(overlay);
}