const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Cargar imágenes
const carImage = new Image();
carImage.src = "car.png";

const obstacleImage = new Image();
obstacleImage.src = "obstacle.png";

const backgroundImage = new Image();
backgroundImage.src = "background.png";

// Cargar sonidos
const backgroundMusic = new Audio("backgroundMusic.mp3");
backgroundMusic.loop = true;
backgroundMusic.volume = 0.1;

const gameplaySound = new Audio("gameplaySound.mp3");
gameplaySound.loop = true;
gameplaySound.volume = 0.1;

const moveSound = new Audio("moveSound.mp3");
moveSound.volume = 0.1;

const gameOverSound = new Audio("gameOverSound.mp3");
gameOverSound.volume = 0.5;

// Configuración del auto
let car = {
    x: 50,
    width: 60,
    height: 30,
    lane: 1,
    lanePositions: [100, 200, 300]
};

// Configuración de los obstáculos (dos obstáculos)
let obstacles = [
    {
        x: canvas.width,
        width: 60,
        height: 30,
        lane: 0,
        dx: -5
    },
    {
        x: canvas.width + 300,
        width: 60,
        height: 30,
        lane: 1,
        dx: -5
    }
];

// Configuración del fondo móvil
let backgroundX = 0;
const backgroundSpeed = -5;

// Control del juego
let score = 0;
let highscore = localStorage.getItem("highscore") ? parseInt(localStorage.getItem("highscore")) : 0;
let gameOver = false;
const speedIncrease = -0.3;
const maxSpeed = -20;
const minObstacleSpacing = 200;

// Cargar la fuente personalizada
const font = new FontFace("SerifGothicStd-Heavy", "url(SerifGothicStd-Heavy.otf)");
let fontLoaded = false;

// Reproducir música de fondo al cargar el juego
window.addEventListener("load", () => {
    backgroundMusic.play().catch(err => {
        console.error("Error al reproducir música de fondo:", err);
    });
});

// Dibujar el fondo
function drawBackground() {
    if (backgroundImage.complete && backgroundImage.naturalWidth !== 0) {
        ctx.drawImage(backgroundImage, backgroundX, 0, canvas.width, canvas.height);
        ctx.drawImage(backgroundImage, backgroundX + canvas.width, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = "#ccc";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

// Actualizar el fondo
function updateBackground() {
    backgroundX += obstacles[0].dx;
    if (backgroundX <= -canvas.width) {
        backgroundX += canvas.width;
    }
}

// Dibujar el auto
function drawCar() {
    if (carImage.complete && carImage.naturalWidth !== 0) {
        ctx.drawImage(carImage, car.x, car.lanePositions[car.lane] - car.height / 2, car.width, car.height);
    } else {
        ctx.fillStyle = "blue";
        ctx.fillRect(car.x, car.lanePositions[car.lane] - car.height / 2, car.width, car.height);
    }
}

// Dibujar los obstáculos
function drawObstacles() {
    obstacles.forEach(obstacle => {
        if (obstacleImage.complete && obstacleImage.naturalWidth !== 0) {
            ctx.drawImage(obstacleImage, obstacle.x, car.lanePositions[obstacle.lane] - obstacle.height / 2, obstacle.width, obstacle.height);
        } else {
            ctx.fillStyle = "red";
            ctx.fillRect(obstacle.x, car.lanePositions[obstacle.lane] - obstacle.height / 2, obstacle.width, obstacle.height);
        }
    });
}

// Función para asignar un carril diferente al obstáculo que se reposiciona
function assignLaneForObstacle(obstacle, otherObstacle) {
    let newLane;
    do {
        newLane = Math.floor(Math.random() * 3);
    } while (newLane === otherObstacle.lane);
    obstacle.lane = newLane;
}

// Mover los obstáculos y aumentar velocidad
function updateObstacles() {
    obstacles.forEach((obstacle, index) => {
        obstacle.x += obstacle.dx;
        if (obstacle.x + obstacle.width < 0) {
            let otherObstacle = obstacles[(index + 1) % 2];
            obstacle.x = Math.max(canvas.width, otherObstacle.x + minObstacleSpacing);

            assignLaneForObstacle(obstacle, otherObstacle);
            console.log(`Obstáculo ${index} reposicionado en carril ${obstacle.lane}, otro obstáculo en carril ${otherObstacle.lane}`);

            score++;
            console.log(`Puntuación: ${score}, Velocidad (dx): ${obstacle.dx}`);
            if (score % 2 === 0) {
                if (obstacle.dx > maxSpeed) {
                    obstacles.forEach(obs => {
                        obs.dx += speedIncrease;
                        if (obs.dx < maxSpeed) {
                            obs.dx = maxSpeed;
                        }
                    });
                    console.log(`Velocidad aumentada! Nueva velocidad (dx): ${obstacle.dx}`);
                } else {
                    console.log(`Velocidad máxima alcanzada: ${obstacle.dx}`);
                }
            }
        }
    });
}

// Detectar colisión
function checkCollision() {
    for (let obstacle of obstacles) {
        if (
            car.x < obstacle.x + obstacle.width &&
            car.x + car.width > obstacle.x &&
            car.lane === obstacle.lane
        ) {
            if (!gameOver) {
                gameOver = true;
                if (score > highscore) {
                    highscore = score;
                    localStorage.setItem("highscore", highscore);
                }
                gameOverSound.play().catch(err => {
                    console.error("Error al reproducir sonido de game over:", err);
                });
                gameplaySound.pause();
            }
            break;
        }
    }
}

// Reiniciar el juego
function resetGame() {
    console.log("Reiniciando el juego...");
    score = 0;
    gameOver = false;
    car.lane = 1;
    obstacles[0].x = canvas.width;
    obstacles[0].lane = 0;
    obstacles[1].x = canvas.width + 300;
    obstacles[1].lane = 1;
    obstacles.forEach(obs => {
        obs.dx = -5;
    });
    backgroundX = 0;
    gameplaySound.play().catch(err => {
        console.error("Error al reproducir sonido ambiental:", err);
    });
    requestAnimationFrame(gameLoop);
}

// Controles
document.addEventListener("keydown", (e) => {
    if (!gameOver) {
        let moved = false;
        if (e.code === "ArrowUp" && car.lane > 0) {
            car.lane--;
            moved = true;
        } else if (e.code === "ArrowDown" && car.lane < 2) {
            car.lane++;
            moved = true;
        }
        // Reproducir sonido al moverse
        if (moved) {
            moveSound.currentTime = 0; // Reiniciar el sonido desde el principio
            moveSound.play().catch(err => {
                console.error("Error al reproducir sonido de movimiento:", err);
            });
        }
    } else {
        if (e.code === "ArrowUp" || e.code === "ArrowDown") {
            console.log(`Tecla presionada: ${e.code}. Iniciando reinicio...`);
            resetGame();
        }
    }
});

// Bucle principal
function gameLoop() {
    if (gameOver) {
        ctx.fillStyle = "red";
        ctx.font = "30px 'SerifGothicStd-Heavy'";
        ctx.fillText("¡Game Over!", 250, 180);

        ctx.fillStyle = "gray";
        ctx.font = "24px 'SerifGothicStd-Heavy'";
        ctx.fillText("Score: " + score, 250, 220);

        ctx.fillStyle = "green";
        ctx.font = "24px 'SerifGothicStd-Heavy'";
        ctx.fillText("Highscore: " + highscore, 250, 260);

        ctx.fillStyle = "blue";
        ctx.font = "24px 'SerifGothicStd-Heavy'";
        ctx.fillText("Press ↑ or ↓ to restart", 250, 300);
        return;
    }

    if (gameplaySound.paused && !gameOver) {
        gameplaySound.play().catch(err => {
            console.error("Error al reproducir sonido ambiental:", err);
        });
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    updateBackground();
    drawBackground();
    drawCar();
    updateObstacles();
    drawObstacles();
    checkCollision();

    ctx.fillStyle = "gray";
    ctx.font = "24px 'SerifGothicStd-Heavy'";
    ctx.fillText("Score: " + score, 10, 30);

    ctx.fillStyle = "green";
    ctx.font = "24px 'SerifGothicStd-Heavy'";
    ctx.fillText("Highscore: " + highscore, 10, 60);

    requestAnimationFrame(gameLoop);
}

// Manejo de carga de imágenes
let imagesLoaded = 0;
const totalImages = 3;

function checkImagesLoaded() {
    imagesLoaded++;
    console.log(`Imagen cargada. Total cargadas: ${imagesLoaded}/${totalImages}`);
    if (imagesLoaded === totalImages && fontLoaded) {
        console.log("Todas las imágenes y la fuente cargadas. Iniciando juego...");
        gameLoop();
    }
}

// Manejo de errores de carga de imágenes
function handleImageError(imageName) {
    console.error(`Error al cargar la imagen: ${imageName}`);
    imagesLoaded++;
    if (imagesLoaded === totalImages && fontLoaded) {
        console.log("Algunas imágenes fallaron, pero iniciando juego con fallbacks...");
        gameLoop();
    }
}

// Cargar la fuente y esperar a que esté lista
font.load().then(() => {
    document.fonts.add(font);
    fontLoaded = true;
    console.log("Fuente SerifGothicStd-Heavy cargada correctamente");
    if (imagesLoaded === totalImages) {
        console.log("Fuente e imágenes cargadas. Iniciando juego...");
        gameLoop();
    }
}).catch(err => {
    console.error("Error al cargar la fuente:", err);
    fontLoaded = true;
    if (imagesLoaded === totalImages) {
        console.log("La fuente falló, pero iniciando juego con fallbacks...");
        gameLoop();
    }
});

// Configurar eventos de carga y error para imágenes
carImage.onload = checkImagesLoaded;
carImage.onerror = () => handleImageError("car.png");

obstacleImage.onload = checkImagesLoaded;
obstacleImage.onerror = () => handleImageError("obstacle.png");

backgroundImage.onload = checkImagesLoaded;
backgroundImage.onerror = () => handleImageError("background.jpg");

// Iniciar el juego después de un tiempo si las imágenes o la fuente no cargan
setTimeout(() => {
    if (imagesLoaded < totalImages || !fontLoaded) {
        console.warn("No todas las imágenes o la fuente se cargaron a tiempo. Iniciando juego con fallbacks...");
        fontLoaded = true;
        gameLoop();
    }
}, 5000);