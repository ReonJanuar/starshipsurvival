const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 1425;
canvas.height = 760;

const startBtn = document.getElementById('startBtn');
const instructionsBtn = document.getElementById('instructionsBtn');
const closeInstructionsBtn = document.getElementById('closeInstructionsBtn');
const menu = document.getElementById('menu');
const instructions = document.getElementById('instructions');
const skinSelection = document.getElementById('skinSelection');
const skins = document.querySelectorAll('.skin');
const confirmSkinBtn = document.getElementById('confirmSkinBtn');

const timerElement = document.getElementById('timer'); // Ambil elemen timer
const survivalTimeDisplay = document.getElementById('survivalTimeDisplay'); // Ambil elemen untuk hasil survival time

// Load images
const playerImage = new Image();
playerImage.src = 'assets/skin/default-skin.png'; // Default skin

const enemyImage = new Image();
enemyImage.src = 'assets/enemy.png';

const backgroundImage = new Image();
backgroundImage.src = 'assets/background/milkyway.PNG';

const heartImage = new Image();
heartImage.src = 'assets/lives'; // Default heart

// Load sound effects
const shootSound = new Audio('assets/audio/shot.mp3');
const explosionSound = new Audio('assets/audio/explode.mp3');
const impactSound = new Audio('assets/audio/impact.mp3');

// Load BGM
const bgmMainMenu = new Audio('assets/audio/main-menu.mp3');
const bgmSkinSelection = new Audio('assets/audio/select-skin.mp3');
const bgmGameOver = new Audio('assets/audio/gameover.mp3');

bgmMainMenu.volume = 0.75;  // Sesuaikan volume sesuai kebutuhan
bgmSkinSelection.volume = 0.75;
bgmGameOver.volume = 0.75;

// Game variables
let player, bullets = [], enemies = [];
let isRunning = false;
let score = 0;
let lives = 3;
let survivalTime = 0; // Waktu bertahan dalam detik
let survivalTimer; // Untuk menyimpan interval timer
const keys = {};

// Variabel untuk menyimpan skin yang dipilih
let selectedSkin = 'assets/skin/default-skin.png';

// Fungsi untuk memulai BGM sesuai dengan bagian
function playBGM(bgm) {
  console.log('Mulai BGM: ', bgm.src);
  // Stop semua BGM yang sedang diputar
  bgmMainMenu.pause();
  bgmSkinSelection.pause();
  bgmGameOver.pause();

  // Reset posisi BGM
  bgmMainMenu.currentTime = 0;
  bgmSkinSelection.currentTime = 0;
  bgmGameOver.currentTime = 0;

  // Mainkan BGM yang sesuai
  bgm.play();
  bgm.loop = bgm !== bgmGameOver; // Jangan loop untuk BGM Game Over
}

// Fungsi untuk menghentikan semua BGM
function stopAllBGM() {
  bgmMainMenu.pause();
  bgmSkinSelection.pause();
  bgmGameOver.pause();
}

// Fungsi untuk memulai timer
function startTimer() {
  survivalTime = 0; // Reset waktu
  timerElement.textContent = `Time: ${survivalTime} sec`; // Set awal
  timerElement.style.display = 'block'; // Tampilkan timer
  survivalTimer = setInterval(() => {
    survivalTime++;
    timerElement.textContent = `Time: ${survivalTime} sec`;
  }, 1000); // Update setiap 1 detik
}

// Fungsi untuk menghentikan timer
function stopTimer() {
  clearInterval(survivalTimer); // Hentikan interval
  timerElement.style.display = 'none'; // Sembunyikan timer
}

// Tambahkan event listener untuk memilih skin
skins.forEach(skin => {
  skin.addEventListener('click', () => {
    skins.forEach(s => s.classList.remove('selected')); // Hapus seleksi sebelumnya
    skin.classList.add('selected'); // Tambahkan seleksi pada skin yang dipilih
    selectedSkin = skin.getAttribute('data-skin'); // Simpan path skin yang dipilih
  });
});

// Main menu BGM saat halaman pertama kali dimuat
window.addEventListener('load', () => {
  // Tunggu interaksi pengguna sebelum memainkan audio
  document.body.addEventListener('click', () => {
    playBGM(bgmMainMenu); // Mainkan BGM Main Menu setelah klik pertama
  }, { once: true }); // Pastikan event listener hanya dipanggil sekali
});

// Tampilkan menu pemilihan skin sebelum memulai game
startBtn.addEventListener('click', () => {
  menu.style.display = 'none';
  skinSelection.style.display = 'block';

  // Tambahkan sedikit delay untuk memastikan pemutaran bisa berjalan
  setTimeout(() => {
    playBGM(bgmSkinSelection); // Mainkan BGM untuk Skin Selection
  }, 100);
});

// Konfirmasi skin yang dipilih
confirmSkinBtn.addEventListener('click', () => {
  playerImage.src = selectedSkin; // Terapkan skin ke pemain
  heartImage.src = selectedSkin; // Terapkan skin ke hati
  skinSelection.style.display = 'none';
  canvas.style.display = 'block';
  isRunning = true;
  startTimer(); // Mulai timer
  initializeGame();
  gameLoop();
  stopAllBGM();
});

// Tombol Instruksi
instructionsBtn.addEventListener('click', () => {
  instructions.style.display = 'block';
});

closeInstructionsBtn.addEventListener('click', () => {
  instructions.style.display = 'none';
});

// Initialize game
function initializeGame() {
  player = { x: canvas.width / 2 - 50, y: canvas.height - 130, width: 120, height: 120, speed: 13};
  bullets = [];
  enemies = [];
  score = 0;
  lives = 3;
}

// Handle player movement and shooting
document.addEventListener('keydown', (e) => {
  keys[e.key] = true;
  
  // Memeriksa jika tombol ' ', 'f', atau 'Enter' ditekan
  if ((e.key === ' ' || e.key === 'f' || e.key === 'Enter') && !keys.shooting) {
    keys.shooting = true;

    // Tambahkan peluru
    bullets.push(
      {
        x: player.x + player.width / 9.6,
        y: player.y + 30,
        width: 4,
        height: 10,
        speed: 20
      },
      {
        x: player.x + player.width / 2 - 2,
        y: player.y,
        width: 4,
        height: 10,
        speed: 20
      },
      {
        x: player.x + player.width / 1.16,
        y: player.y + 30,
        width: 4,
        height: 10,
        speed: 20
      }
    );

    shootSound.currentTime = 0;
    shootSound.play();

    // Atur agar tidak bisa menembak lagi dalam waktu 100ms
    setTimeout(() => keys.shooting = false, 100);
  }
});

document.addEventListener('keyup', (e) => {
  keys[e.key] = false;
});

// Efek Ledakan
function createExplosion(x, y) {
  const explosion = document.createElement('div');
  explosion.classList.add('explosion');
  explosion.style.left = `${x - 25}px`;
  explosion.style.top = `${y - 25}px`;
  explosion.style.width = '50px';
  explosion.style.height = '50px';

  document.body.appendChild(explosion);

  setTimeout(() => {
    explosion.remove();
  }, 700);
}

function createSparkEffect(x, y) {
  const sparkContainer = document.createElement('div');
  sparkContainer.classList.add('spark-container');
  sparkContainer.style.left = `${x}px`;
  sparkContainer.style.top = `${y}px`;

  // Tambahkan percikan api
  for (let i = 0; i < 30; i++) {
    const spark = document.createElement('div');
    spark.classList.add('spark');
    spark.style.setProperty('--random-x', Math.random());
    spark.style.setProperty('--random-y', Math.random());
    sparkContainer.appendChild(spark);
  }

  document.body.appendChild(sparkContainer);

  setTimeout(() => {
    sparkContainer.remove();
  }, 1000); // Hapus efek setelah 1 detik
}

// Update game state
function updateGame() {
  if (keys['ArrowLeft'] && player.x > 0) {
    player.x -= player.speed;
  }
  if (keys['ArrowRight'] && player.x + player.width < canvas.width) {
    player.x += player.speed;
  }
  // if (keys['ArrowUp'] && player.y > 0) {
  //   player.y -= player.speed;
  // }
  // if (keys['ArrowDown'] && player.y + player.height < canvas.height) {
  //   player.y += player.speed;
  // }

  bullets = bullets.filter(b => b.y > 0);
  bullets.forEach(b => b.y -= b.speed);

  enemies.forEach(e => e.y += e.speed);
  enemies = enemies.filter(e => e.y < canvas.height);

  bullets.forEach((b, bi) => {
    enemies.forEach((e, ei) => {
      if (
        b.x < e.x + e.width &&
        b.x + b.width > e.x &&
        b.y < e.y + e.height &&
        b.y + b.height > e.y
      ) {
        bullets.splice(bi, 1);
        enemies.splice(ei, 1);
        score += 10;
        
        // Menambahkan efek ledakan ketika asteroid tertembak
        createExplosion(e.x + e.width / 2 + 55, e.y + e.height / 2);

        explosionSound.currentTime = 0;
        explosionSound.play();
      }
    });
  });

  enemies.forEach((e, ei) => {
    if (
      player.x < e.x + e.width &&
      player.x + player.width > e.x &&
      player.y < e.y + e.height &&
      player.y + player.height > e.y
    ) {
      enemies.splice(ei, 1);
      lives -= 1;
      impactSound.currentTime = 0;
      impactSound.play();

      // Menambahkan efek percikan api pada tabrakan
      createSparkEffect(e.x + e.width / 2 * 3.4, e.y + e.height / 2 + 30);

      if (lives === 0) {
        isRunning = false;
      }
    }
  });
}

// Spawn enemies
function spawnEnemies() {
  // Tingkatkan peluang spawn musuh berdasarkan waktu bertahan
  let spawnProbability = 0.02 + survivalTime * 0.0009; // Naikkan probabilitas setiap detik
  if (Math.random() < spawnProbability) {
    enemies.push({ 
      x: Math.random() * (canvas.width - 30), 
      y: 0, 
      width: 40, 
      height: 40, 
      speed: 5 + survivalTime * 0.05 // Tingkatkan kecepatan musuh seiring waktu
    });
  }
}

// Draw game objects
function drawGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
  
  ctx.fillStyle = 'red';
  bullets.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));

  ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);

  enemies.forEach(e => {
    ctx.drawImage(enemyImage, e.x, e.y, e.width, e.height);
  });

  // Perbarui nyawa di livesContainer
  const livesContainer = document.getElementById('livesContainer');
  livesContainer.innerHTML = ''; // Hapus semua nyawa lama
  for (let i = 0; i < lives; i++) {
    const lifeIcon = document.createElement('img');
    lifeIcon.src = heartImage.src; // Gunakan gambar heart
    livesContainer.appendChild(lifeIcon);
  }

  ctx.fillStyle = 'white';
  ctx.font = '3rem MyCustomFont';
  ctx.fillText(`Score: ${score}`, 10, 50);
}

// Game loop
function gameLoop() {
  if (!isRunning) {
    stopTimer(); // Hentikan timer
    survivalTimeDisplay.textContent = `${survivalTime} sec`; // Tampilkan hasil waktu bertahan
    document.getElementById('finalScoreDisplay').textContent = score;
    canvas.style.display = 'none';
    document.getElementById('gameOver').style.display = 'block';

    // Memainkan BGM Game Over saat permainan selesai
    stopAllBGM(); // Hentikan semua BGM sebelumnya
    playBGM(bgmGameOver); // Mainkan BGM untuk Game Over
    
    return;
  }

  updateGame();
  drawGame();
  spawnEnemies();

  requestAnimationFrame(gameLoop);
}

// Handle Main Menu button click after game over
// Tombol untuk kembali ke Main Menu setelah game over
document.getElementById('mainMenuBtn').addEventListener('click', () => {
  stopAllBGM(); // Hentikan semua BGM
  playBGM(bgmMainMenu); // Mainkan BGM untuk Main Menu
  document.getElementById('gameOver').style.display = 'none';
  document.getElementById('menu').style.display = 'block';
  canvas.style.display = 'none';
});