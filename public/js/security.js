// Exam Security Module
let tabSwitchCount = 0;
let examSecurityActive = false;

function initializeExamSecurity() {
    examSecurityActive = true;
    
    // Disable right-click
    document.addEventListener('contextmenu', e => e.preventDefault());
    
    // Disable F12, Ctrl+Shift+I, Ctrl+U
    document.addEventListener('keydown', function(e) {
        if (e.key === 'F12' || 
            (e.ctrlKey && e.shiftKey && e.key === 'I') ||
            (e.ctrlKey && e.key === 'u')) {
            e.preventDefault();
            showToast('warning', 'Action Blocked', 'Developer tools are disabled during exam.');
        }
    });
    
    // Tab switch detection
    document.addEventListener('visibilitychange', function() {
        if (examSecurityActive && document.hidden) {
            tabSwitchCount++;
            showToast('warning', 'Tab Switch Detected', `Warning ${tabSwitchCount}/3: Stay on exam tab`);
            
            if (tabSwitchCount >= 3) {
                showToast('error', 'Exam Terminated', 'Too many tab switches. Exam will be auto-submitted.');
                setTimeout(() => {
                    submitTest();
                }, 2000);
            }
        }
    });
    
    // Disable copy-paste from external sources
    document.addEventListener('paste', function(e) {
        const target = e.target;
        if (target.classList.contains('code-textarea')) {
            // Allow paste within code editors
            return;
        }
        e.preventDefault();
        showToast('warning', 'Paste Blocked', 'External paste is not allowed during exam.');
    });
    
    // Full screen request
    if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {
            showToast('warning', 'Fullscreen Recommended', 'Please enable fullscreen for better exam experience.');
        });
    }
}