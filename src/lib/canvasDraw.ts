import { Animal, Mood, COLORS, MOOD_PALETTES } from "./constants";

type DrawCtx = {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  mood: Mood;
  animal: Animal;
  sceneDesc: string;
  reduceMotion: boolean;
  time: number;
};

function getMoodColors(mood: Mood) {
  const p = MOOD_PALETTES[mood];
  return {
    skyTop: COLORS.midnight,
    skyBottom: mood === "Sleepy" ? "#2A2560" : p.bg,
    hill1: mood === "Calm" ? "#8FA8FF" : mood === "Silly" ? "#FFD93D" : mood === "Brave" ? "#FF8FB1" : mood === "Sleepy" ? "#6C6A9A" : "#6EE7B7",
    hill2: mood === "Calm" ? "#C4B5FD" : mood === "Silly" ? "#FF8FB1" : mood === "Brave" ? "#FFD93D" : mood === "Sleepy" ? "#9A8ACB" : "#7DD3FC",
    hill3: "#2D2A6E",
    moon: COLORS.yellow,
  };
}

export function drawScene(canvas: HTMLCanvasElement, opts: { mood: Mood; animal: Animal; sceneDesc: string; reduceMotion: boolean; time: number }) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;

  if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
    canvas.width = width * dpr;
    canvas.height = height * dpr;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const drawCtx: DrawCtx = {
    ctx,
    width,
    height,
    mood: opts.mood,
    animal: opts.animal,
    sceneDesc: opts.sceneDesc.toLowerCase(),
    reduceMotion: opts.reduceMotion,
    time: opts.time,
  };

  ctx.clearRect(0, 0, width, height);
  const colors = getMoodColors(opts.mood);

  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, colors.skyTop);
  grad.addColorStop(1, colors.skyBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  drawStars(drawCtx);
  drawMoon(drawCtx);
  drawThread(drawCtx);
  drawClouds(drawCtx);
  drawHills(drawCtx, colors);

  if (drawCtx.sceneDesc.includes("pond") || drawCtx.sceneDesc.includes("water")) drawPond(drawCtx);
  if (drawCtx.sceneDesc.includes("flower") || drawCtx.sceneDesc.includes("meadow")) drawFlowers(drawCtx);
  if (drawCtx.sceneDesc.includes("forest") || drawCtx.sceneDesc.includes("tree")) drawTrees(drawCtx);

  drawAnimalOnHill(drawCtx);
}

function drawStars({ ctx, width, height, reduceMotion, time }: DrawCtx) {
  const starCount = 40;
  for (let i = 0; i < starCount; i++) {
    const x = (Math.sin(i * 123.456) * 0.5 + 0.5) * width;
    const y = (Math.cos(i * 789.123) * 0.5 + 0.5) * height * 0.65;
    const baseSize = 1 + (i % 3);
    const twinkle = reduceMotion ? 1 : 0.6 + 0.4 * Math.sin(time / 1000 + i);
    const size = baseSize * twinkle;
    const opacity = reduceMotion ? 0.9 : 0.5 + 0.5 * twinkle;
    ctx.beginPath();
    ctx.fillStyle = `rgba(255, 248, 231, ${opacity})`;
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    if (i % 7 === 0) {
      ctx.save();
      ctx.globalAlpha = opacity * 0.5;
      ctx.translate(x, y);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-size * 2, -0.5, size * 4, 1);
      ctx.fillRect(-0.5, -size * 2, 1, size * 4);
      ctx.restore();
    }
  }
}

function drawMoon({ ctx, width, height, time, reduceMotion }: DrawCtx) {
  const moonX = width * 0.78;
  const moonY = height * 0.22;
  const moonR = Math.min(width, height) * 0.11;
  ctx.save();
  const glow = ctx.createRadialGradient(moonX, moonY, moonR * 0.8, moonX, moonY, moonR * 2.5);
  glow.addColorStop(0, "rgba(255, 217, 61, 0.25)");
  glow.addColorStop(1, "rgba(255, 217, 61, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(moonX, moonY, moonR * 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#FFD93D";
  ctx.beginPath();
  ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(moonX + moonR * 0.35, moonY - moonR * 0.15, moonR * 0.85, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";
  const threadStartX = moonX + moonR * 0.45;
  const threadStartY = moonY + moonR * 0.75;
  ctx.strokeStyle = "#FFF8E7";
  ctx.lineWidth = 2.4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(threadStartX, threadStartY);
  const wiggle = reduceMotion ? 0 : Math.sin(time / 2000) * 2;
  ctx.bezierCurveTo(threadStartX + 18 + wiggle, threadStartY + 6, threadStartX + 22 + wiggle, threadStartY + 24, threadStartX + 8, threadStartY + 30);
  ctx.bezierCurveTo(threadStartX - 2, threadStartY + 33, threadStartX - 4, threadStartY + 22, threadStartX + 4, threadStartY + 20);
  ctx.stroke();
  ctx.restore();
}

function drawThread({ ctx, width, height, reduceMotion, time }: DrawCtx) {
  ctx.save();
  ctx.strokeStyle = "rgba(255, 248, 231, 0.18)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 8]);
  ctx.lineCap = "round";
  ctx.beginPath();
  const y = height * 0.38;
  ctx.moveTo(width * 0.05, y);
  const drift = reduceMotion ? 0 : Math.sin(time / 3000) * 10;
  ctx.bezierCurveTo(width * 0.3, y - 10 + drift, width * 0.6, y + 10 - drift, width * 0.95, y);
  ctx.stroke();
  ctx.restore();
}

function drawClouds({ ctx, width, height, reduceMotion, time }: DrawCtx) {
  for (let i = 0; i < 3; i++) {
    const baseX = width * (0.2 + i * 0.3) + (reduceMotion ? 0 : Math.sin(time / 4000 + i) * 10);
    const baseY = height * (0.18 + i * 0.07);
    const scale = 0.8 + i * 0.2;
    ctx.fillStyle = `rgba(255, 248, 231, ${0.12 + i * 0.04})`;
    ctx.beginPath();
    const r = 18 * scale;
    ctx.arc(baseX, baseY, r, 0, Math.PI * 2);
    ctx.arc(baseX + r * 0.9, baseY - r * 0.2, r * 0.8, 0, Math.PI * 2);
    ctx.arc(baseX + r * 1.7, baseY, r * 0.9, 0, Math.PI * 2);
    ctx.arc(baseX + r * 0.8, baseY + r * 0.3, r * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHills({ ctx, width, height }: DrawCtx, colors: ReturnType<typeof getMoodColors>) {
  ctx.fillStyle = colors.hill1;
  ctx.beginPath();
  ctx.moveTo(0, height * 0.65);
  ctx.bezierCurveTo(width * 0.3, height * 0.58, width * 0.6, height * 0.68, width, height * 0.62);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = colors.hill2;
  ctx.beginPath();
  ctx.moveTo(0, height * 0.75);
  ctx.bezierCurveTo(width * 0.25, height * 0.7, width * 0.55, height * 0.78, width, height * 0.72);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = colors.hill3;
  ctx.beginPath();
  ctx.moveTo(0, height * 0.85);
  ctx.bezierCurveTo(width * 0.35, height * 0.8, width * 0.7, height * 0.88, width, height * 0.84);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();
}

function drawPond({ ctx, width, height }: DrawCtx) {
  const pondX = width * 0.65;
  const pondY = height * 0.78;
  const pondW = width * 0.25;
  const pondH = height * 0.08;
  ctx.fillStyle = "rgba(125, 211, 252, 0.35)";
  ctx.beginPath();
  ctx.ellipse(pondX, pondY, pondW / 2, pondH / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255, 248, 231, 0.15)";
  ctx.beginPath();
  ctx.ellipse(pondX - pondW * 0.1, pondY - pondH * 0.1, pondW * 0.3, pondH * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawFlowers({ ctx, width, height }: DrawCtx) {
  for (let i = 0; i < 12; i++) {
    const x = width * (0.1 + (i / 12) * 0.8 + Math.sin(i * 2.3) * 0.05);
    const y = height * (0.82 + Math.cos(i * 1.7) * 0.05 + (i % 3) * 0.02);
    const cols = ["#FF8FB1", "#FFD93D", "#FFF8E7", "#C4B5FD", "#6EE7B7"];
    ctx.fillStyle = cols[i % cols.length];
    for (let p = 0; p < 5; p++) {
      const ang = (p / 5) * Math.PI * 2;
      const px = x + Math.cos(ang) * 3;
      const py = y + Math.sin(ang) * 3;
      ctx.beginPath();
      ctx.arc(px, py, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#FFD93D";
    ctx.beginPath();
    ctx.arc(x, y, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawTrees({ ctx, width, height }: DrawCtx) {
  const pos = [
    { x: 0.12, y: 0.68, s: 1 },
    { x: 0.88, y: 0.66, s: 0.9 },
    { x: 0.18, y: 0.74, s: 0.7 },
  ];
  pos.forEach(({ x, y, s }) => {
    const tx = width * x;
    const ty = height * y;
    ctx.fillStyle = "#5C3D2E";
    ctx.fillRect(tx - 4 * s, ty, 8 * s, 20 * s);
    ctx.fillStyle = "#2D4A3E";
    ctx.beginPath();
    ctx.arc(tx, ty - 5 * s, 18 * s, 0, Math.PI * 2);
    ctx.arc(tx - 10 * s, ty + 2 * s, 14 * s, 0, Math.PI * 2);
    ctx.arc(tx + 10 * s, ty + 2 * s, 14 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#3D6B5A";
    ctx.beginPath();
    ctx.arc(tx, ty - 12 * s, 12 * s, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawFoxImpl(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#FF7A59";
  ctx.beginPath();
  ctx.ellipse(0, 5, 30, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#FFF8E7";
  ctx.beginPath();
  ctx.ellipse(0, 12, 16, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#FF7A59";
  ctx.beginPath();
  ctx.arc(0, -18, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#FFF8E7";
  ctx.beginPath();
  ctx.arc(-8, -12, 8, 0, Math.PI * 2);
  ctx.arc(8, -12, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#FF7A59";
  ctx.beginPath();
  ctx.moveTo(-16, -30);
  ctx.lineTo(-22, -45);
  ctx.lineTo(-8, -36);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(16, -30);
  ctx.lineTo(22, -45);
  ctx.lineTo(8, -36);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#8B3A24";
  ctx.beginPath();
  ctx.moveTo(-16, -32);
  ctx.lineTo(-19, -40);
  ctx.lineTo(-10, -34);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(16, -32);
  ctx.lineTo(19, -40);
  ctx.lineTo(10, -34);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#1E1B4B";
  ctx.beginPath();
  ctx.arc(-7, -18, 3.5, 0, Math.PI * 2);
  ctx.arc(7, -18, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -12, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#FF7A59";
  ctx.beginPath();
  ctx.ellipse(32, 8, 14, 10, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#FFF8E7";
  ctx.beginPath();
  ctx.ellipse(40, 6, 7, 6, -0.3, 0, Math.PI * 2);
  ctx.fill();
}

function drawBunnyImpl(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#FFF8E7";
  ctx.beginPath();
  ctx.ellipse(0, 8, 26, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -14, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(-12, -38, 8, 18, -0.2, 0, Math.PI * 2);
  ctx.ellipse(12, -38, 8, 18, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#FF8FB1";
  ctx.beginPath();
  ctx.ellipse(-12, -38, 4, 10, -0.2, 0, Math.PI * 2);
  ctx.ellipse(12, -38, 4, 10, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1E1B4B";
  ctx.beginPath();
  ctx.arc(-6, -14, 3, 0, Math.PI * 2);
  ctx.arc(6, -14, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#FF8FB1";
  ctx.beginPath();
  ctx.arc(0, -9, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#FFF8E7";
  ctx.beginPath();
  ctx.ellipse(-10, 24, 10, 6, 0, 0, Math.PI * 2);
  ctx.ellipse(10, 24, 10, 6, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawFrogImpl(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#6EE7B7";
  ctx.beginPath();
  ctx.ellipse(0, 10, 28, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, -10, 26, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#FFF8E7";
  ctx.beginPath();
  ctx.arc(-12, -22, 9, 0, Math.PI * 2);
  ctx.arc(12, -22, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1E1B4B";
  ctx.beginPath();
  ctx.arc(-12, -22, 4, 0, Math.PI * 2);
  ctx.arc(12, -22, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#1E1B4B";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(0, -6, 10, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  ctx.fillStyle = "#C6F7E2";
  ctx.beginPath();
  ctx.ellipse(0, 16, 14, 10, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawOwlImpl(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#C4B5FD";
  ctx.beginPath();
  ctx.ellipse(0, 8, 24, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -16, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-16, -30);
  ctx.lineTo(-20, -38);
  ctx.lineTo(-10, -32);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(16, -30);
  ctx.lineTo(20, -38);
  ctx.lineTo(10, -32);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#FFF8E7";
  ctx.beginPath();
  ctx.arc(-8, -16, 10, 0, Math.PI * 2);
  ctx.arc(8, -16, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1E1B4B";
  ctx.beginPath();
  ctx.arc(-8, -16, 4, 0, Math.PI * 2);
  ctx.arc(8, -16, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#FFD93D";
  ctx.beginPath();
  ctx.moveTo(0, -14);
  ctx.lineTo(-4, -8);
  ctx.lineTo(4, -8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#9F8ED6";
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(0, 6 + i * 6, 3 - i * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBearImpl(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#E0A87A";
  ctx.beginPath();
  ctx.ellipse(0, 10, 28, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -14, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-16, -28, 7, 0, Math.PI * 2);
  ctx.arc(16, -28, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#C48A5E";
  ctx.beginPath();
  ctx.arc(-16, -28, 3.5, 0, Math.PI * 2);
  ctx.arc(16, -28, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#FFF8E7";
  ctx.beginPath();
  ctx.ellipse(0, -6, 12, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1E1B4B";
  ctx.beginPath();
  ctx.arc(-7, -18, 3, 0, Math.PI * 2);
  ctx.arc(7, -18, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -8, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawDinoImpl(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#FFD93D";
  ctx.beginPath();
  ctx.ellipse(0, 10, 26, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, -14, 22, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#FF7A59";
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 10 - 4, -22);
    ctx.lineTo(i * 10, -32);
    ctx.lineTo(i * 10 + 4, -22);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = "#FF8FB1";
  ctx.beginPath();
  ctx.arc(-10, -10, 4, 0, Math.PI * 2);
  ctx.arc(10, -10, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1E1B4B";
  ctx.beginPath();
  ctx.arc(-7, -16, 3, 0, Math.PI * 2);
  ctx.arc(7, -16, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#1E1B4B";
  ctx.lineWidth = 1.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(0, -8, 6, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();
  ctx.fillStyle = "#FFD93D";
  ctx.beginPath();
  ctx.ellipse(30, 8, 12, 8, -0.2, 0, Math.PI * 2);
  ctx.fill();
}

function drawAnimalOnHill(drawCtx: DrawCtx) {
  const { ctx, width, height, animal } = drawCtx;
  const ax = width * 0.5;
  const ay = height * 0.78;
  ctx.save();
  ctx.translate(ax, ay);
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.beginPath();
  ctx.ellipse(0, 18, 38, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  const scale = Math.min(width, height) / 340;
  const s = Math.max(0.75, Math.min(1.5, scale));
  ctx.scale(s, s);
  switch (animal) {
    case "Fox": drawFoxImpl(ctx); break;
    case "Bunny": drawBunnyImpl(ctx); break;
    case "Frog": drawFrogImpl(ctx); break;
    case "Owl": drawOwlImpl(ctx); break;
    case "Bear": drawBearImpl(ctx); break;
    case "Dino": drawDinoImpl(ctx); break;
  }
  ctx.restore();
}
