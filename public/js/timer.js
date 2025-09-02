// Timer Module
let timeLeft = 60 * 60;
let timer;

function startTimer() {
    timer = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        updateProgress();

        // Special encouragement for Richa
        if (window.studentRollNumber === '25MCSS02') {
            richaEncouragement();
        }

        // Warning toasts
        if (timeLeft === 300) { // 5 minutes
            showToast('warning', 'Time Warning', '5 minutes remaining! Please review your answers.');
        } else if (timeLeft === 60) { // 1 minute
            showToast('error', 'Final Warning', '1 minute left! Prepare to submit.');
        }

        if (timeLeft <= 0) {
            clearInterval(timer);
            showToast('error', 'Time Up!', 'Auto-submitting your exam now...');
            setTimeout(() => submitTest(), 2000);
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    document.getElementById("timer").textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function updateProgress() {
    const totalTime = 60 * 60;
    const elapsed = totalTime - timeLeft;
    const percentage = (elapsed / totalTime) * 100;
    document.getElementById("progress").style.width = percentage + "%";
}