const canvas = document.getElementById("canvas");
const gameOverMenu = document.getElementById("game-over");
const bestScoreP = document.getElementById("best");
const scoreP = document.getElementById("score");
let scores = JSON.parse(localStorage.getItem("scores") || "[]");
const audioDeath = new Audio("assets/Sound Efects/die.ogg");
const audioHit = new Audio("assets/Sound Efects/hit.ogg");
const audioPoint = new Audio("assets/Sound Efects/point.ogg");
const audioWing = new Audio("assets/Sound Efects/wing.ogg");
const audioSwoosh = new Audio("assets/Sound Efects/swoosh.ogg");

canvas.width = 288;
canvas.height = 512;
const pipeSeparation = 120;
let gameSpeed = 1;

const ctx = canvas.getContext("2d");

class Sprite {
  constructor(src, position = { x: 0, y: 0 }) {
    this.position = position;
    this.image = new Image();
    this.image.src = src;
  }
  draw() {
    if (this.image.complete)
      ctx.drawImage(this.image, this.position.x, this.position.y);
  }
}

class Pipes {
  width = 52;
  constructor(position) {
    this.completed = false;
    this.separationTop = Math.floor(Math.random() * 212) + 100;
    this.topPipe = new Sprite("assets/Flappy Bird/pipe-green.png", {
      x: position,
      y: this.separationTop + pipeSeparation,
    });
    this.bottomPipe = new Sprite("assets/Flappy Bird/pipe-green-down.png", {
      x: position,
      y: this.separationTop - 320,
    });
    this.positionX = position;
  }
  draw() {
    this.topPipe.position.x = this.positionX;
    this.bottomPipe.position.x = this.positionX;
    this.topPipe.draw();
    this.bottomPipe.draw();
  }
}

class Bird {
  width = 34;
  height = 24;
  constructor() {
    this.position = { x: 127, y: 244 };
    this.images = { up: new Image(), mid: new Image(), down: new Image() };
    this.images.up.src = "assets/Flappy Bird/yellowbird-downflap.png";
    this.images.mid.src = "assets/Flappy Bird/yellowbird-midflap.png";
    this.images.down.src = "assets/Flappy Bird/yellowbird-upflap.png";
    this.velocity = 0;
    this.alive = true;
  }
  draw() {
    let currentImage = this.images.mid;

    if (this.velocity > 0) currentImage = this.images.down;
    else if (this.velocity < 0) currentImage = this.images.up;

    if (currentImage.complete) {
      const middleX = this.position.x + currentImage.width / 2;
      const middleY = this.position.y + currentImage.height / 2;
      ctx.save();

      ctx.translate(middleX, middleY);

      if (this.velocity > 0)
        ctx.rotate(
          (Math.min(this.alive ? 30 : 90, this.velocity / 5) * Math.PI) / 180,
        );
      else {
        ctx.rotate((Math.max(-30, this.velocity / 5) * Math.PI) / 180);
      }

      ctx.drawImage(
        currentImage,
        -currentImage.width / 2,
        -currentImage.height / 2,
        currentImage.width,
        currentImage.height,
      );

      ctx.restore();
    }
  }
}

const numberSprites = [
  new Sprite("assets/UI/Numbers/0.png"),
  new Sprite("assets/UI/Numbers/1.png"),
  new Sprite("assets/UI/Numbers/2.png"),
  new Sprite("assets/UI/Numbers/3.png"),
  new Sprite("assets/UI/Numbers/4.png"),
  new Sprite("assets/UI/Numbers/5.png"),
  new Sprite("assets/UI/Numbers/6.png"),
  new Sprite("assets/UI/Numbers/7.png"),
  new Sprite("assets/UI/Numbers/8.png"),
  new Sprite("assets/UI/Numbers/9.png"),
];

class Score {
  constructor() {
    this.score = 0;
    this.position = { x: canvas.width - 30, y: 20 };
  }
  draw() {
    let n = this.score;
    let i = 0;
    do {
      let digit = n % 10;
      n = Math.floor(n / 10);
      numberSprites[digit].position.x =
        this.position.x - i++ * numberSprites[digit].image.width - 2;
      numberSprites[digit].position.y = 5;
      numberSprites[digit].draw();
    } while (n > 0);
  }
}

const background = new Sprite("assets/Flappy Bird/background-day.png");
const ground1 = new Sprite("assets/Flappy Bird/base.png", { x: 0, y: 480 });
const ground2 = new Sprite("assets/Flappy Bird/base.png", { x: 288, y: 480 });
const gameOver = new Sprite("assets/UI/gameover.png");
gameOver.image.onload = () => {
  gameOver.position = {
    x: canvas.width / 2 - gameOver.image.width / 2,
    y: canvas.height / 2 - gameOver.image.height / 2 - 150,
  };
};

const message = new Sprite("assets/UI/message.png");
message.image.onload = () => {
  message.position = {
    x: canvas.width / 2 - message.image.width / 2,
    y: canvas.height / 2 - message.image.height / 2,
  };
};

let bird = new Bird();
let score = new Score();
const pipes = new Set();

let previousTime = 0;
function update(time) {
  if (!begin) {
    background.draw();
    message.draw();
    previousTime = time;
    window.requestAnimationFrame(update);
    return;
  }

  const delta = Math.min((time - previousTime) / 1000, 0.1);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  background.draw();

  for (const pipe of pipes) {
    pipe.draw();
    pipe.positionX -= 100 * delta * gameSpeed;

    if (
      pipe.positionX + pipe.width > bird.position.x &&
      pipe.positionX < bird.position.x + bird.width &&
      (bird.position.y < pipe.separationTop ||
        bird.position.y + bird.height > pipe.separationTop + pipeSeparation) &&
      bird.alive
    ) {
      bird.alive = false;
      audioDeath.currenTime = 0;
      audioDeath.play();
    }

    if (
      pipe.positionX + pipe.width < bird.position.x &&
      bird.alive &&
      !pipe.complete
    ) {
      score.score++;
      pipe.complete = true;
    }

    if (pipe.positionX < 90 && pipes.size < 2)
      addPipes(350 - 60 * Math.random());

    if (pipe.positionX < -60) pipes.delete(pipe);
  }
  ground1.position.x -= 100 * delta * gameSpeed;
  ground2.position.x -= 100 * delta * gameSpeed;
  if (ground1.position.x < -ground1.image.width)
    ground1.position.x = ground2.position.x + ground2.image.width;

  if (ground2.position.x < -ground2.image.width)
    ground2.position.x = ground1.position.x + ground1.image.width;

  ground1.draw();
  ground2.draw();

  bird.draw();
  bird.velocity += 800 * delta * gameSpeed;
  bird.position.y += bird.velocity * delta * gameSpeed;

  score.draw();

  if (bird.position.y > 458) {
    gameOver.draw();
    if (gameSpeed != 0) {
      gameSpeed = 0;
      audioHit.currentTime = 0;
      audioHit.play();

      gameOverMenu.style.visibility = "visible";
      scoreP.innerHTML = `${score.score}`;
      scores.push(score.score);
      scores.sort((a, b) => b - a);
      if (scores.length > 5) scores.pop();
      bestScoreP.innerHTML = `${scores[0]}`;
      localStorage.setItem("scores", JSON.stringify(scores));
      bird.alive = false;
    }
  }
  previousTime = time;
  window.requestAnimationFrame(update);
}

function addPipes(distance) {
  pipes.add(new Pipes(distance));
}

let begin = false;
let wing = 0;
function handleKeyDown(event) {
  if (event.code === "Space") {
    event.preventDefault();
    action();
  }
}

function action() {
  if (bird != undefined && bird.alive) {
    bird.velocity = -300;
    wing = 1 - wing;
    if (wing) {
      audioWing.currentTime = 0;
      audioWing.play();
    } else {
      audioSwoosh.currentTime = 0;
      audioSwoosh.play();
    }
  }
  if (!begin) begin = true;
}
window.requestAnimationFrame(update);
document.addEventListener("keydown", handleKeyDown);
document.addEventListener("pointerdown", action);

addPipes(300);

document.getElementById("reset").addEventListener("click", () => {
  window.location.reload();
});
