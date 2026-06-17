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
const STOP_JUMP_CHANCE = 0.35;
const QUICK_JUMP_DURATION = 420;
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

function getAngleForIndex(index, itemCount) {
  const segment = 360 / itemCount;
  return -90 + index * segment + segment / 2;
}

function getForwardDistanceToAngle(fromAngle, targetAngle, extraRounds = 0) {
  return normalizeDegrees(targetAngle - normalizeDegrees(fromAngle)) + extraRounds * 360;
}

function easeOutCubic(progress) {
  return 1 - Math.pow(1 - progress, 3);
}

function easeInOutCubic(progress) {
  return progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
}

function startQuickJump() {
  if (options.length < 2 || Math.random() >= STOP_JUMP_CHANCE) {
    finishSpin();
    return;
  }

  const currentIndex = getSelectedIndex(angle, options.length);
  let targetIndex = Math.floor(Math.random() * (options.length - 1));

  if (targetIndex >= currentIndex) {
    targetIndex += 1;
  }

  const targetAngle = getAngleForIndex(targetIndex, options.length);
  const forwardDistance = getForwardDistanceToAngle(angle, targetAngle);

  mode = "jumping";
  stopAnimation = {
    startTime: null,
    startAngle: angle,
    targetAngle: angle + forwardDistance,
    duration: QUICK_JUMP_DURATION,
    easing: easeInOutCubic,
    onComplete: finishSpin
  };
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
    if (!stopAnimation.startTime) {
      stopAnimation.startTime = timestamp;
    }

    const progress = Math.min((timestamp - stopAnimation.startTime) / stopAnimation.duration, 1);
    const easedProgress = stopAnimation.easing(progress);

    angle = stopAnimation.startAngle + (stopAnimation.targetAngle - stopAnimation.startAngle) * easedProgress;
    positionPointer(angle);

    if (progress >= 1) {
      angle = stopAnimation.targetAngle;
      positionPointer(angle);
      stopAnimation.onComplete();
    }
  } else if (mode === "jumping" && stopAnimation) {
    if (!stopAnimation.startTime) {
      stopAnimation.startTime = timestamp;
    }

    const progress = Math.min((timestamp - stopAnimation.startTime) / stopAnimation.duration, 1);
    const easedProgress = stopAnimation.easing(progress);

    angle = stopAnimation.startAngle + (stopAnimation.targetAngle - stopAnimation.startAngle) * easedProgress;
    positionPointer(angle);

    if (progress >= 1) {
      angle = stopAnimation.targetAngle;
      positionPointer(angle);
      stopAnimation.onComplete();
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
  const targetAngle = getAngleForIndex(targetIndex, options.length);
  const extraRounds = Math.floor(Math.random() * 3) + 4;
  const forwardDistance = getForwardDistanceToAngle(angle, targetAngle, extraRounds);

  mode = "stopping";
  spinButton.disabled = true;
  stopAnimation = {
    startTime: null,
    startAngle: angle,
    targetAngle: angle + forwardDistance,
    duration: (forwardDistance * 3) / POINTER_SPEED,
    easing: easeOutCubic,
    onComplete: startQuickJump
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
