const keyboardDeck = document.querySelector("#keyboardDeck");
const keyButtons = document.querySelectorAll(".key-button");
const countValue = document.querySelector("#countValue");
const scoreValue = document.querySelector("#scoreValue");
const powerValue = document.querySelector("#powerValue");
const autoValue = document.querySelector("#autoValue");
const comboValue = document.querySelector("#comboValue");
const feelValue = document.querySelector("#feelValue");
const switchLabel = document.querySelector("#switchLabel");
const meterFill = document.querySelector("#meterFill");
const rankValue = document.querySelector("#rankValue");
const levelCard = document.querySelector("#levelCard");
const levelValue = document.querySelector("#levelValue");
const levelTitle = document.querySelector("#levelTitle");
const xpValue = document.querySelector("#xpValue");
const levelFill = document.querySelector("#levelFill");
const modeAura = document.querySelector("#modeAura");
const burstLayer = document.querySelector("#burstLayer");
const floatingScore = document.querySelector("#floatingScore");
const keycapShells = document.querySelectorAll("[data-keycap]");
const keycapSubLabels = document.querySelectorAll(".keycap-sub");
const modeTabs = document.querySelectorAll(".mode-tab");
const upgradeButtons = document.querySelectorAll(".upgrade-button");

const modeConfig = {
  blue: {
    label: "\uCCAD\uCD95 \uBAA8\uB4DC",
    feel: "\uAC00\uBCBC\uACE0 \uACBD\uCF8C\uD568",
    keycap: "\uB538\uAE4D",
    sub: "ABS",
    frequencies: [1750, 2450],
    duration: 0.038,
    noise: 0.02,
    rewardMultiplier: 1,
    comboBoost: 0.18,
    comboDecayScale: 1,
    particleCount: 10,
    particleClass: "",
    floatingClass: "",
    pressClass: "",
  },
  brown: {
    label: "\uAC08\uCD95 \uBAA8\uB4DC",
    feel: "\uB3C4\uD1B0\uD558\uACE0 \uCC28\uBD84\uD568",
    keycap: "\uB3C4\uAC01",
    sub: "TCT",
    frequencies: [1180, 1760],
    duration: 0.052,
    noise: 0.015,
    rewardMultiplier: 1.08,
    comboBoost: 0.18,
    comboDecayScale: 1.05,
    particleCount: 8,
    particleClass: "",
    floatingClass: "",
    pressClass: "",
  },
  red: {
    label: "\uC801\uCD95 \uBAA8\uB4DC",
    feel: "\uBD80\uB4DC\uB7FD\uACE0 \uBE60\uB978 \uC5F0\uD0C0",
    keycap: "\uC2A4\uB975",
    sub: "LIN",
    frequencies: [920, 1320],
    duration: 0.03,
    noise: 0.008,
    rewardMultiplier: 0.96,
    comboBoost: 0.24,
    comboDecayScale: 1.1,
    particleCount: 14,
    particleClass: "",
    floatingClass: "",
    pressClass: "is-red-rush",
  },
  black: {
    label: "\uD751\uCD95 \uBAA8\uB4DC",
    feel: "\uBB34\uAC81\uACE0 \uBB35\uC9C1\uD55C \uD55C \uBC29",
    keycap: "\uCFE1",
    sub: "HVY",
    frequencies: [760, 1040],
    duration: 0.06,
    noise: 0.016,
    rewardMultiplier: 1.32,
    comboBoost: 0.14,
    comboDecayScale: 0.95,
    particleCount: 7,
    particleClass: "is-ring",
    floatingClass: "is-black",
    pressClass: "is-heavy-hit",
  },
  silent: {
    label: "\uC800\uC18C\uC74C\uCD95 \uBAA8\uB4DC",
    feel: "\uC870\uC6A9\uD558\uACE0 \uBD80\uB4DC\uB7EC\uC6C0",
    keycap: "\uC0AC\uAC01",
    sub: "SLT",
    frequencies: [600, 880],
    duration: 0.045,
    noise: 0.004,
    rewardMultiplier: 0.92,
    comboBoost: 0.17,
    comboDecayScale: 1.45,
    particleCount: 4,
    particleClass: "is-silent",
    floatingClass: "",
    pressClass: "is-silent-press",
  },
  magnetic: {
    label: "\uC790\uC11D\uCD95 \uBAA8\uB4DC",
    feel: "\uBBFC\uAC10\uD558\uACE0 \uBBF8\uB798\uC801",
    keycap: "\uC704\uC789",
    sub: "HE",
    frequencies: [1480, 2280],
    duration: 0.032,
    noise: 0.012,
    rewardMultiplier: 1.12,
    comboBoost: 0.2,
    comboDecayScale: 1.2,
    particleCount: 12,
    particleClass: "is-ring",
    floatingClass: "is-magnetic",
    pressClass: "is-magnetic-glow",
  },
};

const upgradeState = {
  spring: { level: 0, cost: 25, growth: 1.65 },
  keycap: { level: 0, cost: 60, growth: 1.85 },
  lube: { level: 0, cost: 90, growth: 1.9 },
  forge: { level: 0, cost: 140, growth: 2.1 },
};

let clickCount = 0;
let score = 0;
let combo = 1;
let comboTimer = 0;
let comboWindow = 1150;
let clickPower = 1;
let autoRate = 0;
let forgeBonus = 1;
let playerLevel = 1;
let currentXp = 0;
let totalXp = 0;
let currentMode = "blue";
let audioContext;
const pressTimeouts = new WeakMap();
let levelFlashTimeout;
let autoAccumulator = 0;
let lastFrameTime = performance.now();

function formatNumber(value) {
  if (value < 1000) {
    return value.toFixed(value % 1 === 0 ? 0 : 1);
  }

  if (value < 1000000) {
    return `${(value / 1000).toFixed(1)}k`;
  }

  return `${(value / 1000000).toFixed(1)}m`;
}

function ensureAudioContext() {
  if (!audioContext) {
    audioContext = new window.AudioContext();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
}

function playClickSound() {
  ensureAudioContext();

  const config = modeConfig[currentMode];
  const now = audioContext.currentTime;
  const master = audioContext.createGain();

  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.18, now + 0.005);
  master.gain.exponentialRampToValueAtTime(0.0001, now + config.duration);
  master.connect(audioContext.destination);

  config.frequencies.forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = index === 0 ? "square" : "triangle";
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.92, now + config.duration);

    gain.gain.setValueAtTime(index === 0 ? 0.16 : 0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + config.duration);

    oscillator.connect(gain);
    gain.connect(master);

    oscillator.start(now);
    oscillator.stop(now + config.duration);
  });

  const bufferSize = audioContext.sampleRate * config.noise;
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }

  const noise = audioContext.createBufferSource();
  const noiseGain = audioContext.createGain();
  noise.buffer = buffer;
  noiseGain.gain.setValueAtTime(0.05, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + config.duration);
  noise.connect(noiseGain);
  noiseGain.connect(master);
  noise.start(now);
}

function getPrimaryKeyButton() {
  return keyButtons[0];
}

function animatePress(targetButton = getPrimaryKeyButton()) {
  const config = modeConfig[currentMode];
  targetButton.classList.remove("is-heavy-hit", "is-red-rush", "is-silent-press", "is-magnetic-glow");
  targetButton.classList.add("is-pressed");
  if (config.pressClass) {
    targetButton.classList.add(config.pressClass);
  }
  window.clearTimeout(pressTimeouts.get(targetButton));
  pressTimeouts.set(targetButton, window.setTimeout(() => {
    targetButton.classList.remove("is-pressed");
    if (config.pressClass) {
      targetButton.classList.remove(config.pressClass);
    }
  }, 90));
}

function burstParticles() {
  const config = modeConfig[currentMode];
  const particleCount = config.particleCount;

  for (let i = 0; i < particleCount; i += 1) {
    const particle = document.createElement("span");
    const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.3;
    const distance = 42 + Math.random() * 48;
    particle.className = "particle";
    if (config.particleClass) {
      particle.classList.add(config.particleClass);
    }
    particle.style.setProperty("--x", `${Math.cos(angle) * distance}px`);
    particle.style.setProperty("--y", `${Math.sin(angle) * distance}px`);
    burstLayer.appendChild(particle);
    window.setTimeout(() => particle.remove(), 520);
  }
}

function showFloatingScore(amount) {
  const config = modeConfig[currentMode];
  floatingScore.textContent = `+${formatNumber(amount)}`;
  floatingScore.classList.remove("is-visible", "is-magnetic", "is-black");
  if (config.floatingClass) {
    floatingScore.classList.add(config.floatingClass);
  }
  void floatingScore.offsetWidth;
  floatingScore.classList.add("is-visible");
}

function getRankLabel() {
  if (score >= 1200) {
    return "\uC5D4\uB4DC\uAC8C\uC784 \uCEE4\uC2A4\uD140";
  }
  if (score >= 600) {
    return "\uB370\uC2A4\uD06C \uC14B\uC5C5 \uC804\uC124";
  }
  if (score >= 250) {
    return "\uD29C\uB2DD \uC560\uD638\uAC00";
  }
  if (score >= 90) {
    return "\uD56B\uC2A4\uC651 \uB8E8\uD0A4";
  }
  return "\uC785\uBB38 \uBCF4\uB4DC";
}

function getXpForNextLevel(level) {
  return Math.round(34 + level * 18 + level * level * 6);
}

function getLevelTitle(level) {
  if (level >= 25) {
    return "\uD0A4\uBCF4\uB4DC \uC2E0\uD654";
  }
  if (level >= 16) {
    return "\uC2A4\uC704\uCE58 \uB9C8\uC2A4\uD130";
  }
  if (level >= 10) {
    return "\uD29C\uB2DD \uC7A5\uC778";
  }
  if (level >= 5) {
    return "\uD56B\uC2A4\uC651 \uC218\uB828\uC0DD";
  }
  return "\uC785\uBB38 \uD0C0\uAC74\uB7EC";
}

function getXpReward(scoreReward) {
  return Math.max(1, Math.ceil(scoreReward * 0.72 + combo * 0.45));
}

function triggerLevelUpEffect() {
  keyboardDeck.classList.add("is-level-up");
  keyButtons.forEach((button) => button.classList.add("is-level-up"));
  levelCard.classList.add("is-level-up");
  floatingScore.textContent = "LEVEL UP";
  floatingScore.classList.remove("is-visible", "is-magnetic", "is-black");
  void floatingScore.offsetWidth;
  floatingScore.classList.add("is-visible");

  window.clearTimeout(levelFlashTimeout);
  levelFlashTimeout = window.setTimeout(() => {
    keyboardDeck.classList.remove("is-level-up");
    keyButtons.forEach((button) => button.classList.remove("is-level-up"));
    levelCard.classList.remove("is-level-up");
  }, 760);
}

function applyLevelReward() {
  forgeBonus = Number((forgeBonus + 0.03).toFixed(2));

  if (playerLevel % 3 === 0) {
    comboWindow += 45;
  }

  if (playerLevel % 5 === 0) {
    clickPower += 1;
  }
}

function awardExperience(amount) {
  currentXp += amount;
  totalXp += amount;

  let leveledUp = false;
  let xpForNextLevel = getXpForNextLevel(playerLevel);

  while (currentXp >= xpForNextLevel) {
    currentXp -= xpForNextLevel;
    playerLevel += 1;
    leveledUp = true;
    applyLevelReward();
    xpForNextLevel = getXpForNextLevel(playerLevel);
  }

  if (leveledUp) {
    triggerLevelUpEffect();
  }
}

function updateUpgradeButtons() {
  upgradeButtons.forEach((button) => {
    const key = button.dataset.upgrade;
    const upgrade = upgradeState[key];
    const costNode = document.querySelector(`#cost-${key}`);
    costNode.textContent = formatNumber(upgrade.cost);
    button.classList.toggle("is-disabled", score < upgrade.cost);
  });
}

function renderLevel() {
  const xpForNextLevel = getXpForNextLevel(playerLevel);
  const levelProgress = Math.max(0, Math.min(100, (currentXp / xpForNextLevel) * 100));

  levelValue.textContent = playerLevel;
  levelTitle.textContent = getLevelTitle(playerLevel);
  xpValue.textContent = `${formatNumber(currentXp)} / ${formatNumber(xpForNextLevel)} XP`;
  levelFill.style.width = `${levelProgress}%`;
}

function updateKeycapEvolution() {
  keycapShells.forEach((keycapShell) => {
    keycapShell.classList.remove(
      "is-cat-soft",
      "is-cat-mid",
      "is-cat-full",
      "is-cat-artisan"
    );
  });

  if (score >= 1200) {
    keycapShells.forEach((keycapShell) => keycapShell.classList.add("is-cat-artisan"));
    keycapSubLabels.forEach((label) => {
      label.textContent = "\uACE0\uC591\uC774 \uC544\uD2F0\uC794";
    });
  } else if (score >= 600) {
    keycapShells.forEach((keycapShell) => keycapShell.classList.add("is-cat-full"));
    keycapSubLabels.forEach((label) => {
      label.textContent = "\uACE0\uC591\uC774 \uCEE4\uC2A4\uD140";
    });
  } else if (score >= 250) {
    keycapShells.forEach((keycapShell) => keycapShell.classList.add("is-cat-mid"));
    keycapSubLabels.forEach((label) => {
      label.textContent = "\uACE0\uC591\uC774 \uBAA8\uB4DC";
    });
  } else if (score >= 90) {
    keycapShells.forEach((keycapShell) => keycapShell.classList.add("is-cat-soft"));
    keycapSubLabels.forEach((label) => {
      label.textContent = "\uACE0\uC591\uC774 \uAC01\uC778";
    });
  } else {
    keycapSubLabels.forEach((label) => {
      label.textContent = modeConfig[currentMode].sub;
    });
  }
}

function render() {
  countValue.textContent = formatNumber(clickCount);
  scoreValue.textContent = formatNumber(score);
  powerValue.textContent = formatNumber(clickPower * forgeBonus);
  autoValue.textContent = autoRate.toFixed(1);
  comboValue.textContent = combo.toFixed(1);
  rankValue.textContent = getRankLabel();

  const comboProgress = Math.max(0, Math.min(100, (comboTimer / comboWindow) * 100));
  meterFill.style.width = `${comboProgress}%`;

  if (combo >= 4.5) {
    feelValue.textContent = "\uD0C0\uAC74\uAC10 \uD3ED\uC8FC";
  } else if (combo >= 3) {
    feelValue.textContent = "\uB9AC\uB4EC \uC644\uC804 \uC801\uC911";
  } else if (combo >= 2) {
    feelValue.textContent = "\uC190\uB9DB \uC0C1\uC2B9 \uC911";
  } else {
    feelValue.textContent = modeConfig[currentMode].feel;
  }

  updateUpgradeButtons();
  updateKeycapEvolution();
  renderLevel();
}

function updateMode(mode) {
  currentMode = mode;
  const config = modeConfig[mode];

  document.body.classList.remove(
    "theme-blue",
    "theme-brown",
    "theme-red",
    "theme-black",
    "theme-silent",
    "theme-magnetic"
  );
  document.body.classList.add(`theme-${mode}`);

  keyboardDeck.classList.remove("blue", "brown", "red", "black", "silent", "magnetic");
  keyboardDeck.classList.add(mode);
  keyButtons.forEach((button) => {
    button.classList.remove("blue", "brown", "red", "black", "silent", "magnetic");
    button.classList.add(mode);
  });
  switchLabel.textContent = config.label;
  modeAura.setAttribute("data-mode", mode);

  modeTabs.forEach((tab) => {
    const isActive = tab.dataset.mode === mode;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-pressed", String(isActive));
  });

  render();
}

function getClickReward() {
  const config = modeConfig[currentMode];
  let reward = clickPower * forgeBonus * combo * config.rewardMultiplier;

  if (currentMode === "black") {
    reward += 1;
  }

  if (currentMode === "magnetic") {
    reward += Math.max(0, Math.floor(combo));
  }

  return Math.max(1, Math.round(reward));
}

function boostCombo() {
  const config = modeConfig[currentMode];
  combo = Math.min(5, Number((combo + config.comboBoost).toFixed(2)));
  comboTimer = Math.round(comboWindow * config.comboDecayScale);
}

function awardScore(amount) {
  score += amount;
  render();
}

function buyUpgrade(key) {
  const upgrade = upgradeState[key];
  if (score < upgrade.cost) {
    return;
  }

  score -= upgrade.cost;
  upgrade.level += 1;

  if (key === "spring") {
    clickPower += 1;
  }

  if (key === "keycap") {
    comboWindow += 180;
    combo = Math.min(5, combo + 0.3);
  }

  if (key === "lube") {
    autoRate = Number((autoRate + 0.6).toFixed(1));
  }

  if (key === "forge") {
    forgeBonus = Number((forgeBonus + 0.35).toFixed(2));
  }

  upgrade.cost = Math.round(upgrade.cost * upgrade.growth);
  render();
}

function triggerPress(targetButton = getPrimaryKeyButton()) {
  clickCount += 1;
  boostCombo();
  const reward = getClickReward();
  awardScore(reward);
  animatePress(targetButton);
  burstParticles();
  showFloatingScore(reward);
  playClickSound();
  awardExperience(getXpReward(reward));
}

keyButtons.forEach((button) => {
  button.addEventListener("click", () => {
    triggerPress(button);
  });
});

modeTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    updateMode(tab.dataset.mode);
  });
});

upgradeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    buyUpgrade(button.dataset.upgrade);
  });
});

window.addEventListener("keydown", (event) => {
  if (event.repeat) {
    return;
  }

  if (event.code === "Space" || event.code === "Enter") {
    event.preventDefault();
    triggerPress();
  }

  const targetButton = document.querySelector(`.key-button[data-key="${event.key.toLowerCase()}"]`);
  if (targetButton) {
    event.preventDefault();
    triggerPress(targetButton);
  }

  if (event.key === "1") {
    updateMode("blue");
  }

  if (event.key === "2") {
    updateMode("brown");
  }

  if (event.key === "3") {
    updateMode("red");
  }

  if (event.key === "4") {
    updateMode("black");
  }

  if (event.key === "5") {
    updateMode("silent");
  }

  if (event.key === "6") {
    updateMode("magnetic");
  }
});

function gameLoop(now) {
  const delta = Math.min(64, now - lastFrameTime);
  lastFrameTime = now;

  if (comboTimer > 0) {
    comboTimer = Math.max(0, comboTimer - delta);
    if (comboTimer === 0) {
      combo = 1;
    }
  }

  if (autoRate > 0) {
    autoAccumulator += (delta / 1000) * autoRate;
    while (autoAccumulator >= 1) {
      autoAccumulator -= 1;
      const passiveGain = Math.max(1, Math.round((clickPower * forgeBonus) / 2));
      score += passiveGain;
      awardExperience(Math.max(1, Math.floor(passiveGain * 0.35)));
    }
  }

  render();
  window.requestAnimationFrame(gameLoop);
}

updateMode(currentMode);
render();
window.requestAnimationFrame(gameLoop);
