const canvas = document.querySelector('#star-canvas');
const context = canvas.getContext('2d');
const turtle = document.querySelector('#turtle');
const startButton = document.querySelector('#start-button');
const resetButton = document.querySelector('#reset-button');
const speedRange = document.querySelector('#speed-range');

const center = { x: canvas.width / 2, y: canvas.height / 2 };
const starRadius = 190;
const starPoints = 5;
const starStep = 2;
const drawingColor = '#f0a202';
let animationFrame = 0;
let isDrawing = false;
let progress = 0;
let lastTimestamp = 0;

function buildStarPath() {
  const points = [];
  const startAngle = -Math.PI / 2;

  for (let index = 0; index < starPoints; index += 1) {
    const pointIndex = (index * starStep) % starPoints;
    const angle = startAngle + (pointIndex * 2 * Math.PI) / starPoints;

    points.push({
      x: center.x + Math.cos(angle) * starRadius,
      y: center.y + Math.sin(angle) * starRadius,
    });
  }

  return [...points, points[0]];
}

const starPath = buildStarPath();
const segmentLengths = starPath.slice(0, -1).map((point, index) => {
  const nextPoint = starPath[index + 1];
  return Math.hypot(nextPoint.x - point.x, nextPoint.y - point.y);
});
const totalLength = segmentLengths.reduce((sum, length) => sum + length, 0);

function clearStage() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.lineWidth = 10;
  context.strokeStyle = drawingColor;
  context.shadowColor = 'rgba(240, 162, 2, 0.35)';
  context.shadowBlur = 12;
}

function getPositionAt(distance) {
  let remainingDistance = distance;

  for (let index = 0; index < segmentLengths.length; index += 1) {
    const segmentLength = segmentLengths[index];
    const point = starPath[index];
    const nextPoint = starPath[index + 1];

    if (remainingDistance <= segmentLength) {
      const ratio = remainingDistance / segmentLength;
      return {
        x: point.x + (nextPoint.x - point.x) * ratio,
        y: point.y + (nextPoint.y - point.y) * ratio,
        angle: Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x),
      };
    }

    remainingDistance -= segmentLength;
  }

  const lastPoint = starPath.at(-1);
  const beforeLastPoint = starPath.at(-2);
  return {
    x: lastPoint.x,
    y: lastPoint.y,
    angle: Math.atan2(lastPoint.y - beforeLastPoint.y, lastPoint.x - beforeLastPoint.x),
  };
}

function drawPath(distance) {
  clearStage();
  context.beginPath();
  context.moveTo(starPath[0].x, starPath[0].y);

  let remainingDistance = distance;
  for (let index = 0; index < segmentLengths.length; index += 1) {
    const segmentLength = segmentLengths[index];
    const nextPoint = starPath[index + 1];

    if (remainingDistance >= segmentLength) {
      context.lineTo(nextPoint.x, nextPoint.y);
      remainingDistance -= segmentLength;
      continue;
    }

    const point = starPath[index];
    const ratio = Math.max(0, remainingDistance / segmentLength);
    context.lineTo(
      point.x + (nextPoint.x - point.x) * ratio,
      point.y + (nextPoint.y - point.y) * ratio,
    );
    break;
  }

  context.stroke();
}

function moveTurtle(distance) {
  const position = getPositionAt(distance);
  const stageBounds = canvas.getBoundingClientRect();
  const canvasScaleX = stageBounds.width / canvas.width;
  const canvasScaleY = stageBounds.height / canvas.height;
  const left = stageBounds.left + position.x * canvasScaleX;
  const top = stageBounds.top + position.y * canvasScaleY;
  const parentBounds = canvas.parentElement.getBoundingClientRect();

  turtle.style.left = `${left - parentBounds.left}px`;
  turtle.style.top = `${top - parentBounds.top}px`;
  turtle.style.transform = `translate(-50%, -50%) rotate(${position.angle}rad)`;
}

function resetGame() {
  cancelAnimationFrame(animationFrame);
  isDrawing = false;
  progress = 0;
  lastTimestamp = 0;
  startButton.disabled = false;
  startButton.textContent = 'Iniciar';
  drawPath(0);
  moveTurtle(0);
}

function animate(timestamp) {
  if (!lastTimestamp) {
    lastTimestamp = timestamp;
  }

  const elapsed = timestamp - lastTimestamp;
  const speed = Number(speedRange.value);
  lastTimestamp = timestamp;
  progress = Math.min(totalLength, progress + elapsed * 0.13 * speed);

  drawPath(progress);
  moveTurtle(progress);

  if (progress < totalLength) {
    animationFrame = requestAnimationFrame(animate);
    return;
  }

  isDrawing = false;
  startButton.disabled = false;
  startButton.textContent = 'Dibujar otra vez';
}

function startGame() {
  if (isDrawing) {
    return;
  }

  if (progress >= totalLength) {
    progress = 0;
  }

  isDrawing = true;
  lastTimestamp = 0;
  startButton.disabled = true;
  startButton.textContent = 'Dibujando...';
  animationFrame = requestAnimationFrame(animate);
}

startButton.addEventListener('click', startGame);
resetButton.addEventListener('click', resetGame);
window.addEventListener('resize', () => moveTurtle(progress));

resetGame();
