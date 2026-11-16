let difficulty = '';
let operation = '';
let num1, num2, correctAnswer;
let scoreCorrect = 0;
let scoreWrong = 0;
let lives = 3;
let streak = 0;
let attempts = 0;
let currentQuestion = 0;
let totalQuestions = 10;
let selectedAvatar = '🦊';
let playerName = '';
let gameActive = false;
let timerInterval = null;
let timeLeft = 30;

const timerByDifficulty = { easy: 30, medium: 20, hard: 15 };

const encourageCorrect = ['🎉 Awesome!', '🌟 Great Job!', '😄 Excellent!', '👍 Keep it up!'];
const encourageWrong   = ['😊 Try Again!', '💪 You Can Do It!', '📚 Keep Practicing!'];

// ===== AUDIO =====

let bgMusic, celebrationSound, gameOverSound;

document.addEventListener('DOMContentLoaded', () => {
    bgMusic          = document.getElementById('bgMusic');
    celebrationSound = document.getElementById('celebrationSound');
    gameOverSound    = document.getElementById('gameOverSound');

    document.getElementById('nameInput').addEventListener('keydown', e => {
        if (e.key === 'Enter') submitName();
    });
});

function playBgMusic() {
    bgMusic.volume = 0.2;
    bgMusic.currentTime = 0;
    bgMusic.play().catch(() => {});
}

function stopBgMusic() {
    bgMusic.pause();
    bgMusic.currentTime = 0;
}

function playCelebration() {
    stopBgMusic();
    celebrationSound.volume = 0.8;
    celebrationSound.currentTime = 0;
    celebrationSound.play().catch(() => {});
}

// ===== NAVIGATION =====

function goHome() {
    hideAllScreens();
    document.getElementById('homeScreen').classList.remove('hidden');
}

function showAvatar() {
    hideAllScreens();
    document.getElementById('avatarScreen').classList.remove('hidden');
}

function showDifficulty() {
    hideAllScreens();
    document.getElementById('difficultyScreen').classList.remove('hidden');
    document.getElementById('diffMascot').textContent = selectedAvatar;
}

function hideAllScreens() {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
}

function selectAvatar(emoji, name) {
    selectedAvatar = emoji;
    document.querySelectorAll('.avatar-card').forEach(c => c.classList.remove('selected'));
    document.getElementById('av-' + name.toLowerCase()).classList.add('selected');
    document.getElementById('homeMascot').textContent = emoji;
    setTimeout(showNameScreen, 300);
}

function showNameScreen() {
    hideAllScreens();
    document.getElementById('nameScreen').classList.remove('hidden');
    document.getElementById('nameMascot').textContent = selectedAvatar;
    document.getElementById('nameInput').value = '';
    document.getElementById('nameError').classList.add('hidden');
    document.getElementById('nameInput').focus();
}

function submitName() {
    const val = document.getElementById('nameInput').value.trim();
    if (!val) {
        document.getElementById('nameError').classList.remove('hidden');
        document.getElementById('nameInput').focus();
        return;
    }
    playerName = val;
    showDifficulty();
}

function selectDifficulty(level) {
    difficulty = level;
    totalQuestions = level === 'easy' ? 10 : level === 'medium' ? 15 : 20;
    document.getElementById('difficultyScreen').classList.add('hidden');
    document.getElementById('operationScreen').classList.remove('hidden');
    document.getElementById('opMascot').textContent = selectedAvatar;
}

function selectOperation(op) {
    operation = op;
    const activeOp = op === 'random' ? '+' : op;
    const opSymbol = activeOp === '*' ? '×' : activeOp === '/' ? '÷' : activeOp;
    document.getElementById('op').textContent = opSymbol;
    document.getElementById('quizAvatar').textContent = selectedAvatar;
    document.getElementById('quizName').textContent = playerName;

    resetStats();
    hideAllScreens();
    document.getElementById('quizScreen').classList.remove('hidden');
    generateQuestion();
    playBgMusic();
    document.getElementById('boxAnswer').focus();
}

function restartGame() {
    stopTimer();
    stopBgMusic();
    hideAllScreens();
    document.getElementById('homeScreen').classList.remove('hidden');
}

function resetGame() {
    resetStats();
    hideAllScreens();
    document.getElementById('quizScreen').classList.remove('hidden');
    const opSymbol = operation === '*' ? '×' : operation === '/' ? '÷' : operation;
    document.getElementById('op').textContent = opSymbol;
    generateQuestion();
    playBgMusic();
    document.getElementById('boxAnswer').focus();
}

function resetStats() {
    scoreCorrect = 0;
    scoreWrong = 0;
    lives = 3;
    streak = 0;
    attempts = 0;
    currentQuestion = 0;
    gameActive = true;
    stopTimer();
    updateHUD();
}

// ===== TIMER =====

function getTimerDuration() {
    return timerByDifficulty[difficulty] || 30;
}

function startTimer() {
    stopTimer();
    timeLeft = getTimerDuration();
    updateTimerUI();
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerUI();
        if (timeLeft <= 0) {
            stopTimer();
            onTimerExpired();
        }
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
}

function updateTimerUI() {
    const total = getTimerDuration();
    const pct   = (timeLeft / total) * 100;
    const bar   = document.getElementById('timerBar');
    const label = document.getElementById('timerLabel');
    bar.style.width = pct + '%';
    bar.style.background = timeLeft > total * 0.5
        ? 'linear-gradient(90deg, #43e97b, #38f9d7)'
        : timeLeft > total * 0.25
        ? 'linear-gradient(90deg, #f7971e, #ffd200)'
        : 'linear-gradient(90deg, #ff416c, #ff4b2b)';
    label.textContent = '⏱ ' + timeLeft + 's';
    label.style.color = timeLeft <= total * 0.25 ? '#ff416c' : '#aaa';
}

function onTimerExpired() {
    if (!gameActive) return;
    const result    = document.getElementById('result');
    const answerBox = document.getElementById('boxAnswer');
    scoreWrong++;
    streak = 0;
    lives--;
    currentQuestion++;
    result.textContent = `⏰ Time's up! (Answer: ${correctAnswer})`;
    result.className = 'wrong';
    answerBox.textContent = correctAnswer;
    answerBox.style.backgroundColor = '#ffcdd2';
    answerBox.contentEditable = 'false';
    document.getElementById('checkBtn').disabled = true;
    updateHUD();
    setTimeout(() => {
        answerBox.contentEditable = 'true';
        document.getElementById('checkBtn').disabled = false;
        if (lives <= 0) {
            showGameOver();
        } else if (currentQuestion >= totalQuestions) {
            showCertificate();
        } else {
            generateQuestion();
        }
    }, 1500);
}

// ===== QUESTION GENERATION =====

function getRange() {
    if (difficulty === 'easy') return 10;
    if (difficulty === 'medium') return 50;
    return 100;
}

function rand(max) {
    return Math.floor(Math.random() * (max + 1));
}

function generateQuestion() {
    if (!gameActive) return;

    let op = operation;
    if (op === 'random') {
        const ops = ['+', '-', '*', '/'];
        op = ops[Math.floor(Math.random() * ops.length)];
    }

    if (op === '+') {
        num1 = rand(9) + 1;
        num2 = rand(10);
        correctAnswer = num1 + num2;
    } else if (op === '-') {
        num1 = rand(9) + 1;
        num2 = rand(10);
        if (num2 > num1) [num1, num2] = [num2, num1];
        correctAnswer = num1 - num2;
    } else if (op === '*') {
        num1 = rand(9) + 1;
        num2 = rand(10);
        correctAnswer = num1 * num2;
    } else if (op === '/') {
        num2 = rand(9) + 1;
        correctAnswer = rand(9) + 1;
        num1 = num2 * correctAnswer;
    }

    const opSymbol = op === '*' ? '×' : op === '/' ? '÷' : op;
    document.getElementById('op').textContent = opSymbol;
    document.getElementById('box1').textContent = num1;
    document.getElementById('box2').textContent = num2;
    document.getElementById('boxAnswer').textContent = '';
    document.getElementById('boxAnswer').style.backgroundColor = '';
    document.getElementById('result').textContent = '';
    document.getElementById('result').className = '';
    document.getElementById('boxAnswer').focus();
    startTimer();
}

// ===== ANSWER CHECKING =====

function checkAnswer() {
    if (!gameActive) return;

    const answerBox = document.getElementById('boxAnswer');
    const result    = document.getElementById('result');
    const userAnswer = answerBox.textContent.trim();

    if (userAnswer === '') {
        result.textContent = '⚠️ Please type an answer!';
        result.className = 'wrong';
        answerBox.focus();
        return;
    }

    const userNum = Number(userAnswer);
    if (isNaN(userNum)) {
        result.textContent = '⚠️ Please enter a valid number!';
        result.className = 'wrong';
        answerBox.focus();
        return;
    }

    attempts++;
    stopTimer();

    if (userNum === correctAnswer) {
        scoreCorrect++;
        streak++;
        currentQuestion++;
        const msg = encourageCorrect[Math.floor(Math.random() * encourageCorrect.length)];
        result.textContent = msg;
        result.className = 'correct';
        answerBox.textContent = correctAnswer;
        answerBox.style.backgroundColor = '#c8e6c9';
        result.classList.add('pop-animation');
    } else {
        scoreWrong++;
        streak = 0;
        lives--;
        currentQuestion++;
        const msg = encourageWrong[Math.floor(Math.random() * encourageWrong.length)];
        result.textContent = msg + ` (Answer: ${correctAnswer})`;
        result.className = 'wrong';
        answerBox.textContent = correctAnswer;
        answerBox.style.backgroundColor = '#ffcdd2';
        result.classList.add('shake-animation');
    }

    updateHUD();
    answerBox.contentEditable = 'false';
    document.getElementById('checkBtn').disabled = true;

    setTimeout(() => {
        answerBox.contentEditable = 'true';
        document.getElementById('checkBtn').disabled = false;

        if (lives <= 0) {
            showGameOver();
        } else if (currentQuestion >= totalQuestions) {
            showCertificate();
        } else {
            generateQuestion();
        }
    }, 1500);
}

// ===== HUD =====

function updateHUD() {
    document.getElementById('scoreCorrect').textContent = scoreCorrect;
    document.getElementById('scoreWrong').textContent   = scoreWrong;
    document.getElementById('scoreAttempts').textContent = attempts;
    document.getElementById('streakDisplay').textContent = '🔥 ' + streak;
    document.getElementById('livesDisplay').textContent  = '❤️'.repeat(lives) + '🖤'.repeat(3 - lives);
    const pct = Math.min((currentQuestion / totalQuestions) * 100, 100);
    document.getElementById('progressBar').style.width = pct + '%';
    document.getElementById('progressLabel').textContent =
        'Question ' + Math.min(currentQuestion + 1, totalQuestions) + ' / ' + totalQuestions;
}

// ===== CERTIFICATE =====

function showCertificate() {
    gameActive = false;
    stopTimer();
    playCelebration();
    hideAllScreens();
    document.getElementById('certAvatar').textContent = selectedAvatar;
    document.getElementById('certName').textContent = playerName + ' is a Math Hero! 🌟';
    document.getElementById('certStats').innerHTML =
        `✅ Correct: ${scoreCorrect} &nbsp;|&nbsp; ❌ Wrong: ${scoreWrong}<br>
         🔥 Best Streak: ${streak} &nbsp;|&nbsp; 🎯 Attempts: ${attempts}`;
    document.getElementById('certificateScreen').classList.remove('hidden');
}

function showGameOver() {
    gameActive = false;
    stopTimer();
    stopBgMusic();
    gameOverSound.volume = 0.8;
    gameOverSound.currentTime = 0;
    gameOverSound.play().catch(() => {});
    hideAllScreens();
    document.getElementById('gameOverStats').innerHTML =
        `✅ Correct: ${scoreCorrect} &nbsp;|&nbsp; ❌ Wrong: ${scoreWrong}<br>
         🎯 Attempts: ${attempts}`;
    document.getElementById('gameOverScreen').classList.remove('hidden');
}

// ===== KEYBOARD SUPPORT =====

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('boxAnswer').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            checkAnswer();
        }
        if (!/^[0-9]$/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
        }
        if (/^[0-9]$/.test(e.key) && e.target.textContent.length >= 4) {
            e.preventDefault();
        }
    });
});
