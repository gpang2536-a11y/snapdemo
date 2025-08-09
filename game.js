// README: 主要常數可於檔案開頭調整。直接開啟 index.html 遊玩。
// 主要控制：方向鍵/WASD/觸控/滑動，P鍵或按鈕暫停/恢復。

// ===== 常數區 =====
const CELL_SIZE = 24; // 格子大小 (px)
const COLS = 20;      // 橫向格數
const ROWS = 20;      // 縱向格數
const SPEEDS = { easy: 160, normal: 110, hard: 70 }; // ms/格
const SPEED_UP_EVERY = 5; // 每吃 N 個食物加速
const SPEED_UP_AMOUNT = 12; // 每次加速減少 ms
const LEVEL_UP_EVERY = 5; // 每 N 食物升一級
const SNAKE_COLOR = getCSSVar('--snake');
const FOOD_COLOR = getCSSVar('--food');
const BG_COLOR = getCSSVar('--bg');
const ACCENT_COLOR = getCSSVar('--accent');

// ===== 狀態變數 =====
let snake, direction, nextDirection, food, score, highscore, level, speed, moveTimer, running, paused, gameOverFlag, eatCount;
let lastFrame = 0;
let overlay, scoreEl, highscoreEl, levelEl, canvas, ctx;
let touchStart = null;
let audioEat, audioOver;

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('game');
    ctx = canvas.getContext('2d');
    overlay = document.getElementById('overlay');
    scoreEl = document.getElementById('score');
    highscoreEl = document.getElementById('highscore');
    levelEl = document.getElementById('level');
    setupAudio();
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    document.getElementById('btn-start').onclick = startGame;
    document.getElementById('btn-pause').onclick = pauseGame;
    document.getElementById('btn-restart').onclick = restartGame;
    document.getElementById('btn-resume').onclick = resumeGame;
    document.getElementById('btn-share').onclick = shareScore;
    document.getElementById('difficulty-select').onchange = restartGame;
    setupSwipe();
    window.addEventListener('keydown', handleInput, { passive: false });
    canvas.setAttribute('tabindex', '0');
    canvas.focus();
    showOverlay('歡迎來到貪食蛇！', false, false);
    loadHighscore();
});

// ===== 遊戲主流程 =====
function startGame() {
    if (running) return;
    initGame();
    running = true;
    paused = false;
    gameOverFlag = false;
    hideOverlay();
    requestAnimationFrame(gameLoop);
}
function restartGame() {
    running = false;
    startGame();
}
function pauseGame() {
    if (!running || paused) return;
    paused = true;
    showOverlay('已暫停', true, false);
}
function resumeGame() {
    if (!paused) return;
    paused = false;
    hideOverlay();
    requestAnimationFrame(gameLoop);
}
function gameOver() {
    running = false;
    gameOverFlag = true;
    playAudio(audioOver);
    showOverlay(`遊戲結束！<br>分數：${score}`, false, true);
    updateHighscore();
}
function showOverlay(msg, showResume, showRestart) {
    overlay.hidden = false;
    document.getElementById('overlay-content').innerHTML = msg;
    document.getElementById('btn-resume').hidden = !showResume;
    document.getElementById('btn-restart').hidden = !showRestart;
}
function hideOverlay() {
    overlay.hidden = true;
}

// ===== 初始化遊戲狀態 =====
function initGame() {
    let diff = document.getElementById('difficulty-select').value;
    speed = SPEEDS[diff] || SPEEDS.normal;
    snake = [{ x: Math.floor(COLS / 2), y: Math.floor(ROWS / 2) }];
    direction = { x: 0, y: -1 };
    nextDirection = { x: 0, y: -1 };
    score = 0;
    level = 1;
    eatCount = 0;
    spawnFood();
    updateScore();
    updateLevel();
}

// ===== 遊戲迴圈 =====
function gameLoop(ts) {
    if (!running) return;
    if (paused) return;
    if (!lastFrame) lastFrame = ts;
    let elapsed = ts - lastFrame;
    if (elapsed > speed) {
        moveSnake();
        lastFrame = ts;
    }
    draw();
    requestAnimationFrame(gameLoop);
}

// ===== 移動蛇 =====
function moveSnake() {
    direction = nextDirection;
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
    // 撞牆
    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
        gameOver();
        return;
    }
    // 撞自己
    if (snake.some(seg => seg.x === head.x && seg.y === head.y)) {
        gameOver();
        return;
    }
    snake.unshift(head);
    // 吃到食物
    if (head.x === food.x && head.y === food.y) {
        score++;
        eatCount++;
        playAudio(audioEat);
        spawnFood();
        updateScore();
        animateEat();
        if (eatCount % SPEED_UP_EVERY === 0) {
            speed = Math.max(40, speed - SPEED_UP_AMOUNT);
        }
        if (eatCount % LEVEL_UP_EVERY === 0) {
            level++;
            updateLevel();
        }
    } else {
        snake.pop();
    }
}

// ===== 生成食物 =====
function spawnFood() {
    let pos;
    do {
        pos = {
            x: Math.floor(Math.random() * COLS),
            y: Math.floor(Math.random() * ROWS)
        };
    } while (snake.some(seg => seg.x === pos.x && seg.y === pos.y));
    food = pos;
}

// ===== 繪製畫面 =====
function draw() {
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    drawSnake();
    drawFood();
}
function drawGrid() {
    ctx.strokeStyle = ACCENT_COLOR;
    ctx.lineWidth = 1;
    for (let i = 0; i <= COLS; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, ROWS * CELL_SIZE);
        ctx.stroke();
    }
    for (let j = 0; j <= ROWS; j++) {
        ctx.beginPath();
        ctx.moveTo(0, j * CELL_SIZE);
        ctx.lineTo(COLS * CELL_SIZE, j * CELL_SIZE);
        ctx.stroke();
    }
}
function drawSnake() {
    ctx.fillStyle = SNAKE_COLOR;
    snake.forEach((seg, i) => {
        ctx.save();
        if (i === 0) ctx.shadowColor = ACCENT_COLOR, ctx.shadowBlur = 8;
        ctx.fillRect(seg.x * CELL_SIZE, seg.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        ctx.restore();
    });
}
function drawFood() {
    ctx.save();
    ctx.fillStyle = FOOD_COLOR;
    ctx.beginPath();
    ctx.arc(
        food.x * CELL_SIZE + CELL_SIZE / 2,
        food.y * CELL_SIZE + CELL_SIZE / 2,
        CELL_SIZE / 2.2, 0, Math.PI * 2
    );
    ctx.shadowColor = FOOD_COLOR;
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.restore();
}

// ===== 處理輸入 =====
function handleInput(e) {
    if (gameOverFlag) return;
    let key = e.key.toLowerCase();
    let dir = null;
    if (key === 'arrowup' || key === 'w') dir = { x: 0, y: -1 };
    if (key === 'arrowdown' || key === 's') dir = { x: 0, y: 1 };
    if (key === 'arrowleft' || key === 'a') dir = { x: -1, y: 0 };
    if (key === 'arrowright' || key === 'd') dir = { x: 1, y: 0 };
    if (key === 'p') {
        paused ? resumeGame() : pauseGame();
        e.preventDefault();
        return;
    }
    if (dir && !isOpposite(dir, direction)) {
        nextDirection = dir;
        e.preventDefault();
    }
}
function isOpposite(dir1, dir2) {
    return dir1.x === -dir2.x && dir1.y === -dir2.y;
}
function setupSwipe() {
    canvas.addEventListener('touchstart', e => {
        if (e.touches.length === 1) {
            touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
    });
    canvas.addEventListener('touchend', e => {
        if (!touchStart) return;
        let dx = e.changedTouches[0].clientX - touchStart.x;
        let dy = e.changedTouches[0].clientY - touchStart.y;
        if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 30 && !isOpposite({ x: 1, y: 0 }, direction)) nextDirection = { x: 1, y: 0 };
            if (dx < -30 && !isOpposite({ x: -1, y: 0 }, direction)) nextDirection = { x: -1, y: 0 };
        } else {
            if (dy > 30 && !isOpposite({ x: 0, y: 1 }, direction)) nextDirection = { x: 0, y: 1 };
            if (dy < -30 && !isOpposite({ x: 0, y: -1 }, direction)) nextDirection = { x: 0, y: -1 };
        }
        touchStart = null;
    });
}

// ===== 分數與等級 =====
function updateScore() {
    scoreEl.textContent = `分數：${score}`;
}
function updateLevel() {
    levelEl.textContent = `等級：${level}`;
}
function loadHighscore() {
    highscore = parseInt(localStorage.getItem('snake-highscore')) || 0;
    highscoreEl.textContent = `最高分：${highscore}`;
}
function updateHighscore() {
    if (score > highscore) {
        highscore = score;
        localStorage.setItem('snake-highscore', highscore);
        highscoreEl.textContent = `最高分：${highscore}`;
    }
}
function shareScore() {
    const msg = `我在貪食蛇得到 ${score} 分！`;
    navigator.clipboard.writeText(msg).then(() => {
        showOverlay('分數已複製，可分享！', false, true);
    });
}

// ===== 音效 =====
function setupAudio() {
    audioEat = createAudio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=');
    audioOver = createAudio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=');
}
function createAudio(src) {
    const audio = new Audio(src);
    audio.preload = 'auto';
    return audio;
}
function playAudio(audio) {
    if (!audio) return;
    audio.currentTime = 0;
    audio.play();
}

// ===== 小動畫 =====
function animateEat() {
    canvas.classList.add('eat-anim');
    setTimeout(() => canvas.classList.remove('eat-anim'), 120);
}

// ===== 響應式 Canvas =====
function resizeCanvas() {
    let size = Math.min(canvas.parentElement.offsetWidth, window.innerHeight * 0.7);
    canvas.width = COLS * CELL_SIZE;
    canvas.height = ROWS * CELL_SIZE;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
}

// ===== 工具函式 =====
function getCSSVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#fff';
}
