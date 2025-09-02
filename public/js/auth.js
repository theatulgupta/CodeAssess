// Authentication Module
function setupAuth() {
    const loginBtn = document.getElementById("loginBtn");
    const rollInput = document.getElementById("rollInput");
    const startBtn = document.getElementById("startBtn");
    const backBtn = document.getElementById("backBtn");

    loginBtn.addEventListener("click", function() {
        const rollNumber = rollInput.value.trim().toUpperCase();
        
        if (!rollNumber) {
            showToast('warning', 'Input Required', 'Please enter your roll number');
            rollInput.focus();
            return;
        }
        
        if (rollNumber.length !== 8) {
            showToast('error', 'Invalid Format', 'Roll number must be exactly 8 characters');
            rollInput.focus();
            return;
        }

        if (!STUDENT_DATABASE[rollNumber]) {
            showToast('error', 'Access Denied', 'Roll number not found. Please check and try again.');
            rollInput.focus();
            return;
        }

        // Check if student already attempted
        checkExistingSubmission(rollNumber);
    });

    startBtn.addEventListener("click", function() {
        showToast('success', 'Exam Started', 'Good luck with your assessment!');
        
        setTimeout(() => {
            document.getElementById("studentName").textContent = `${studentName} (${window.studentRollNumber})`;
            document.getElementById("authModal").style.display = "none";
            document.getElementById("mainContent").style.display = "block";
            
            // Add Richa's special decorations
            if (window.studentRollNumber === '25MCSS02') {
                addRichaDecorations();
            }
            
            startTimer();
            initializeExamSecurity();
        }, 800);
    });

    backBtn.addEventListener("click", function() {
        document.getElementById("loginForm").style.display = "block";
        document.getElementById("verificationStep").style.display = "none";
        rollInput.value = "";
        rollInput.focus();
    });

    rollInput.addEventListener("keypress", function(e) {
        if (e.key === "Enter") {
            loginBtn.click();
        }
    });
    
    rollInput.focus();
}

function checkExistingSubmission(rollNumber) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    fetch('/api/check-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNumber }),
        signal: controller.signal
    })
    .then(response => {
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error(`Server error: ${response.status}`);
        return response.json();
    })
    .then(data => {
        if (data.alreadySubmitted) {
            showToast('error', 'Already Submitted', 'You have already completed this exam.');
            setTimeout(() => showAlreadySubmittedOverlay(data.submission), 1000);
        } else {
            studentName = STUDENT_DATABASE[rollNumber];
            window.studentName = studentName;
            window.studentRollNumber = rollNumber;
            showToast('success', 'Student Found', `Welcome ${studentName}!`);
            setTimeout(() => {
                document.getElementById("studentNameDisplay").textContent = studentName;
                document.getElementById("studentRollDisplay").textContent = rollNumber;
                document.getElementById("loginForm").style.display = "none";
                document.getElementById("verificationStep").style.display = "block";
            }, 500);
        }
    })
    .catch(error => {
        clearTimeout(timeoutId);
        const message = error.name === 'AbortError' ? 'Server timeout. Please try again.' : 'Connection error. Please try again.';
        showToast('error', 'Connection Error', message);
    });
}

function showAlreadySubmittedOverlay(submission) {
    const overlay = document.createElement('div');
    overlay.className = 'success-overlay';
    overlay.style.display = 'flex';
    overlay.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.95), rgba(220, 38, 38, 0.95))';
    
    const percentage = submission.totalScore && submission.maxScore ? 
        ((submission.totalScore / submission.maxScore) * 100).toFixed(1) : '0';
    
    overlay.innerHTML = `
        <div class="success-content">
            <div class="success-icon">🚫</div>
            <h1 class="success-title">Already Submitted</h1>
            <p class="success-message">You have already completed this exam and cannot retake it.</p>
            <div class="success-details">
                <h3 style="margin-bottom: 1rem;">Your Previous Results</h3>
                <p><strong>Score:</strong> ${submission.totalScore || 0}/${submission.maxScore || 100} (${percentage}%)</p>
                <p><strong>Submitted:</strong> ${new Date(submission.timestamp).toLocaleString()}</p>
            </div>
            <p style="opacity: 0.8; margin-top: 1rem;">This window will close automatically in 5 seconds...</p>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    setTimeout(() => {
        window.close();
        window.location.href = 'about:blank';
    }, 5000);
}