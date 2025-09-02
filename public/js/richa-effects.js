// Richa's Special Effects Module
let richaEncouragementCount = 0;

function richaEncouragement() {
    // Every minute - heart pulse
    if (timeLeft % 60 === 0 && timeLeft > 0) {
        createMinuteHeart();
    }
    
    // Every 2 minutes - waving hand
    if (timeLeft % 120 === 0 && timeLeft > 0) {
        createWavingHand();
    }
    
    // Every 3 minutes - butterfly
    if (timeLeft % 180 === 0 && timeLeft > 0) {
        createButterfly();
    }
    
    // Every 5 minutes - full encouragement
    if (timeLeft % 300 === 0 && timeLeft > 0) {
        createFloatingEmojis(['🎆', '✨', '💫', '🌈', '🚀']);
        
        if (richaEncouragementCount < richaMessages.length) {
            setTimeout(() => {
                showRichaMessage(richaMessages[richaEncouragementCount]);
                richaEncouragementCount++;
            }, 1000);
        }
    }
}

function richaSuccessCelebration(passed, total) {
    if (passed === total) {
        // All tests passed - big celebration
        createFloatingEmojis(['🎉', '🎆', '✨', '💫', '🌈', '👑', '💎', '⭐']);
        createSparkles(20);
        const perfectQuotes = [
            "PERFECT SCORE! Richa, you're absolutely phenomenal! 👑🎆",
            "FLAWLESS VICTORY! Your coding mastery is unmatched! 💎✨",
            "100% SUCCESS! You're rewriting the definition of excellence! ⭐🚀",
            "ABSOLUTE PERFECTION! Your brilliance knows no limits! 🌟💖",
            "LEGENDARY PERFORMANCE! You're coding royalty! 👑🎉"
        ];
        showRichaMessage(perfectQuotes[Math.floor(Math.random() * perfectQuotes.length)]);
        createWavingHand();
        createMinuteHeart();
    } else if (passed > 0) {
        // Some tests passed - encouragement
        createFloatingEmojis(['✨', '💫', '🚀', '🌟']);
        createSparkles(12);
        const partialQuotes = [
            `Excellent progress! ${passed}/${total} tests conquered! 🌟💪`,
            `Amazing work! ${passed}/${total} victories and counting! 🚀✨`,
            `Brilliant effort! ${passed}/${total} tests bow to your skill! 💫🎯`,
            `Outstanding! ${passed}/${total} successes show your talent! 🎆💖`,
            `Incredible! ${passed}/${total} tests prove your genius! ⭐🦋`
        ];
        showRichaMessage(partialQuotes[Math.floor(Math.random() * partialQuotes.length)]);
    }
}

function createFloatingEmojis(emojis) {
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            const emoji = document.createElement('div');
            emoji.className = 'floating-emoji';
            emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            emoji.style.left = Math.random() * window.innerWidth + 'px';
            emoji.style.top = window.innerHeight + 'px';
            document.body.appendChild(emoji);
            
            setTimeout(() => {
                if (document.body.contains(emoji)) {
                    document.body.removeChild(emoji);
                }
            }, 4000);
        }, i * 200);
    }
}

function createSparkles(count) {
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle';
            sparkle.style.left = Math.random() * window.innerWidth + 'px';
            sparkle.style.top = Math.random() * window.innerHeight + 'px';
            document.body.appendChild(sparkle);
            
            setTimeout(() => {
                if (document.body.contains(sparkle)) {
                    document.body.removeChild(sparkle);
                }
            }, 2000);
        }, i * 100);
    }
}

function showRichaMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'richa-message';
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        if (document.body.contains(messageDiv)) {
            document.body.removeChild(messageDiv);
        }
    }, 3000);
}

function addRichaDecorations() {
    // Add rainbow header decoration
    const headerDecoration = document.createElement('div');
    headerDecoration.className = 'richa-header-decoration';
    document.querySelector('.header').appendChild(headerDecoration);
    
    // Add floating hearts background
    const heartsContainer = document.createElement('div');
    heartsContainer.className = 'richa-bg-hearts';
    for (let i = 0; i < 8; i++) {
        const heart = document.createElement('div');
        heart.className = 'floating-heart';
        heart.textContent = '💖';
        heart.style.left = Math.random() * 100 + '%';
        heart.style.top = Math.random() * 100 + '%';
        heart.style.animationDelay = Math.random() * 8 + 's';
        heartsContainer.appendChild(heart);
    }
    document.body.appendChild(heartsContainer);
    
    // Add corner stars
    const corners = [
        { top: '20px', left: '20px' },
        { top: '20px', right: '20px' },
        { bottom: '20px', left: '20px' },
        { bottom: '20px', right: '20px' }
    ];
    
    corners.forEach((pos, i) => {
        const star = document.createElement('div');
        star.className = 'richa-corner-stars';
        star.textContent = '⭐';
        Object.assign(star.style, pos);
        star.style.animationDelay = i * 0.5 + 's';
        document.body.appendChild(star);
    });
    
    // Add hearts to progress bar
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
        const progressHearts = document.createElement('div');
        progressHearts.className = 'richa-progress-hearts';
        progressHearts.textContent = '💖💖';
        progressBar.style.position = 'relative';
        progressBar.appendChild(progressHearts);
    }
    
    // Welcome message for Richa
    setTimeout(() => {
        showRichaMessage('Welcome to your special exam, Richa! ✨💖');
        createWavingHand();
        createFloatingEmojis(['🎉', '✨', '💖']);
    }, 1000);
    
    // Periodic motivation for Richa
    setInterval(() => {
        if (window.studentRollNumber === '25MCSS02' && examSecurityActive) {
            const motivations = [
                "You're doing fantastic! 🌟💖",
                "Keep up the amazing work! 🚀✨",
                "Your skills are impressive! 💪🎆",
                "Stay focused, you're brilliant! 🌈💫"
            ];
            if (Math.random() < 0.3) { // 30% chance every interval
                createFloatingEmojis(['💖', '✨']);
                setTimeout(() => {
                    showRichaMessage(motivations[Math.floor(Math.random() * motivations.length)]);
                }, 1000);
            }
        }
    }, 120000); // Every 2 minutes
}

function createMinuteHeart() {
    const heart = document.createElement('div');
    heart.className = 'richa-minute-heart';
    heart.textContent = '💖';
    heart.style.left = Math.random() * (window.innerWidth - 100) + 'px';
    heart.style.top = Math.random() * (window.innerHeight - 100) + 'px';
    document.body.appendChild(heart);
    
    setTimeout(() => {
        if (document.body.contains(heart)) {
            document.body.removeChild(heart);
        }
    }, 3000);
}

function createWavingHand() {
    const hand = document.createElement('div');
    hand.className = 'richa-waving-hand';
    hand.textContent = '👋';
    document.body.appendChild(hand);
    
    setTimeout(() => {
        if (document.body.contains(hand)) {
            document.body.removeChild(hand);
        }
    }, 2000);
}

function createButterfly() {
    const butterfly = document.createElement('div');
    butterfly.className = 'richa-butterfly';
    butterfly.textContent = '🦋';
    butterfly.style.top = Math.random() * (window.innerHeight - 200) + 100 + 'px';
    document.body.appendChild(butterfly);
    
    setTimeout(() => {
        if (document.body.contains(butterfly)) {
            document.body.removeChild(butterfly);
        }
    }, 8000);
}