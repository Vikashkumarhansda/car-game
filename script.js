const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// On-Screen Touch Buttons (Mobile)
const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");

// Sound Effects (Web Audio API)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playEngineSound() {
  if (audioCtx.state === "suspended") audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "sawtooth";
  osc.frequency.value = 60 + Math.min(score, 200);
  gain.gain.value = 0.02;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.1);
}

function playCrashSound() {
  if (audioCtx.state === "suspended") audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(150, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.5);
  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.5);
}

// Player Car Setup
const car = {
  x: 180,
  y: 480,
  width: 40,
  height: 70,
  speed: 5
};

// Game State & High Score
let score = 0;
let highScore = localStorage.getItem("carGameHighScore") || 0;
let gameOver = false;
let enemies = [];
let baseEnemySpeed = 4;

// Control Listeners (Keyboard)
const keys = {};
window.addEventListener("keydown", (e) => {
  keys[e.key] = true;
  if (e.code === "Space" && gameOver) resetGame();
});

window.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

// Control Listeners (Mobile Touch Buttons)
if (leftBtn && rightBtn) {
  leftBtn.addEventListener("touchstart", (e) => { e.preventDefault(); keys["ArrowLeft"] = true; });
  leftBtn.addEventListener("touchend", (e) => { e.preventDefault(); keys["ArrowLeft"] = false; });
  rightBtn.addEventListener("touchstart", (e) => { e.preventDefault(); keys["ArrowRight"] = true; });
  rightBtn.addEventListener("touchend", (e) => { e.preventDefault(); keys["ArrowRight"] = false; });
}

// Tap Canvas to Restart on Mobile
canvas.addEventListener("touchstart", () => {
  if (gameOver) resetGame();
});

// Reset Function
function resetGame() {
  score = 0;
  gameOver = false;
  enemies = [];
  baseEnemySpeed = 4;
  car.x = 180;
  car.y = 480;
}

// Spawn Enemy Cars
function spawnEnemy() {
  const randomX = Math.floor(Math.random() * (canvas.width - 40));
  enemies.push({ x: randomX, y: -70, width: 40, height: 70 });
}

setInterval(() => {
  if (!gameOver) spawnEnemy();
}, 1300);

// Collision Detection
function checkCollision(rect1, rect2) {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
}

// Game Logic
function update() {
  if (gameOver) return;

  if (keys["ArrowLeft"] && car.x > 0) {
    car.x -= car.speed;
    playEngineSound();
  }
  if (keys["ArrowRight"] && car.x < canvas.width - car.width) {
    car.x += car.speed;
    playEngineSound();
  }

  const currentSpeed = baseEnemySpeed + Math.floor(score / 50);

  for (let i = 0; i < enemies.length; i++) {
    enemies[i].y += currentSpeed;

    if (checkCollision(car, enemies[i])) {
      gameOver = true;
      playCrashSound();

      if (score > highScore) {
        highScore = score;
        localStorage.setItem("carGameHighScore", highScore);
      }
    }

    if (enemies[i].y > canvas.height) {
      enemies.splice(i, 1);
      score += 10;
      i--;
    }
  }
}

// Helper Function to Draw Cars
function drawCar(x, y, width, height, bodyColor, windshieldColor) {
  ctx.fillStyle = bodyColor;
  ctx.fillRect(x, y, width, height);

  ctx.fillStyle = "#000000";
  ctx.fillRect(x - 4, y + 10, 4, 15);
  ctx.fillRect(x + width, y + 10, 4, 15);
  ctx.fillRect(x - 4, y + 45, 4, 15);
  ctx.fillRect(x + width, y + 45, 4, 15);

  ctx.fillStyle = windshieldColor;
  ctx.fillRect(x + 5, y + 20, width - 10, 15);
}

// Graphics Rendering
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Road Markings
  ctx.strokeStyle = "#ffffff";
  ctx.setLineDash([20, 20]);
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(200, 0);
  ctx.lineTo(200, 600);
  ctx.stroke();

  // Draw Cars
  drawCar(car.x, car.y, car.width, car.height, "#ff3333", "#87ceeb");
  enemies.forEach((enemy) => {
    drawCar(enemy.x, enemy.y, enemy.width, enemy.height, "#3399ff", "#111111");
  });

  // Display Scores
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 18px Arial";
  ctx.textAlign = "left";
  ctx.fillText(`Score: ${score}`, 15, 30);
  ctx.fillText(`High Score: ${highScore}`, 15, 55);

  // Game Over Screen
  if (gameOver) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#ff3333";
    ctx.font = "bold 36px Arial";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, 240);

    ctx.fillStyle = "#ffffff";
    ctx.font = "20px Arial";
    ctx.fillText(`Final Score: ${score}`, canvas.width / 2, 285);
    ctx.fillText(`Best Score: ${highScore}`, canvas.width / 2, 315);

    ctx.fillStyle = "#00ffcc";
    ctx.font = "16px Arial";
    ctx.fillText("Press Spacebar or Tap Screen to Play Again", canvas.width / 2, 360);
  }
}

// Main Game Loop
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();