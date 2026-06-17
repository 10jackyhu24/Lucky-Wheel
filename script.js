const canvas = document.querySelector("#wheelCanvas");
const ctx = canvas.getContext("2d");
const pointer = document.querySelector("#pointer");
const spinButton = document.querySelector("#spinButton");
const optionsInput = document.querySelector("#optionsInput");
const resultText = document.querySelector("#resultText");

const palette = [
  "#f7c948",
  "#5cc8a7",
  "#5b8def",
  "#ff8a65",
  "#b784f0",
  "#6ed0e0",
  "#f76f8e",
  "#9ccc65"
];

const POINTER_SPEED = 0.7;
const presetOptions = {
  lunch: "大汗 小陳 五路 鐵板燒(左) 鐵板燒(右) 牛脾氣 無人拉麵 好甲 歐姆 泰國象 墨竹亭 牛肉麵 阿山哥 壹參 ㄐㄐ",
  dinner: "大汗 小陳 五路 鐵板燒(左) 鐵板燒(右) 牛脾氣 無人拉麵 好甲 歐姆 泰國象 墨竹亭 牛肉麵 ㄐㄐ"
};

let options = [];
let angle = -90;
let mode = "idle";
let lastFrame = 0;
let stopAnimation = null;

function parseOptions() {
  const parts = optionsInput.value.trim().split(/\s+/).filter(Boolean);
  return parts.length ? parts : ["請輸入選項"];
}

function normalizeDegrees(degrees) {
  return ((degrees % 360) + 360) % 360;
}

function getSelectedIndex(degrees, itemCount) {
  const normalized = normalizeDegrees(degrees + 90);
  const segment = 360 / itemCount;
  return Math.floor(normalized / segment) % itemCount;
}

function drawWheel() {
  options = parseOptions();
  const size = canvas.width;
  const center = size / 2;
  const radius = center - 20;
  const segment = (Math.PI * 2) / options.length;

  ctx.clearRect(0, 0, size, size);

  options.forEach((option, index) => {
    const start = index * segment - Math.PI / 2;
    const end = start + segment;

    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius, start, end);
    ctx.closePath();
    ctx.fillStyle = palette[index % palette.length];
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(start + segment / 2);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#162033";
    ctx.font = `700 ${Math.max(18, Math.min(32, 220 / options.length))}px "Segoe UI", "Noto Sans TC", sans-serif`;
    ctx.fillText(option, radius * 0.62, 0, radius * 0.58);
    ctx.restore();
  });

  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 12;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(center, center, 48, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.strokeStyle = "rgba(28, 36, 51, 0.14)";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function positionPointer(degrees) {
  const wheelRect = canvas.getBoundingClientRect();
  const radius = wheelRect.width * 0.42;
  pointer.style.transform = `translate(-50%, -100%) rotate(${degrees + 90}deg) translateY(-${radius}px) rotate(${-degrees - 90}deg)`;
}

function finishSpin() {
  mode = "idle";
  stopAnimation = null;
  spinButton.textContent = "開始";
  spinButton.disabled = false;
  optionsInput.disabled = false;
  resultText.textContent = options[getSelectedIndex(angle, options.length)];
}

function animate(timestamp) {
  if (!lastFrame) {
    lastFrame = timestamp;
  }

  const delta = timestamp - lastFrame;
  lastFrame = timestamp;

  if (mode === "spinning") {
    angle += delta * POINTER_SPEED;
    positionPointer(angle);
  } else if (mode === "stopping" && stopAnimation) {
    stopAnimation.remainingDistance -= delta * POINTER_SPEED;
    angle += delta * POINTER_SPEED;

    if (stopAnimation.remainingDistance <= 0) {
      angle = stopAnimation.targetAngle;
      positionPointer(angle);
      finishSpin();
    } else {
      positionPointer(angle);
    }
  }

  requestAnimationFrame(animate);
}

function startSpin() {
  options = parseOptions();
  drawWheel();
  mode = "spinning";
  resultText.textContent = "轉動中...";
  spinButton.textContent = "停止";
  optionsInput.disabled = true;
}

function stopSpin() {
  options = parseOptions();
  const targetIndex = Math.floor(Math.random() * options.length);
  const segment = 360 / options.length;
  const targetAngle = -90 + targetIndex * segment + segment / 2;
  const current = normalizeDegrees(angle);
  const extraRounds = Math.floor(Math.random() * 3) + 1;
  const forwardDistance = normalizeDegrees(targetAngle - current) + extraRounds * 360;

  mode = "stopping";
  spinButton.disabled = true;
  stopAnimation = {
    targetAngle: angle + forwardDistance,
    remainingDistance: forwardDistance
  };
}

spinButton.addEventListener("click", () => {
  if (mode === "idle") {
    startSpin();
  } else if (mode === "spinning") {
    stopSpin();
  }
});

optionsInput.addEventListener("input", () => {
  if (mode === "idle") {
    drawWheel();
    resultText.textContent = "尚未開始";
  }
});

document.querySelectorAll("[data-preset]").forEach((button) => {
  button.addEventListener("click", () => {
    if (mode !== "idle") {
      return;
    }

    optionsInput.value = presetOptions[button.dataset.preset];
    drawWheel();
    resultText.textContent = "尚未開始";
  });
});

window.addEventListener("resize", () => positionPointer(angle));

drawWheel();
positionPointer(angle);
requestAnimationFrame(animate);
