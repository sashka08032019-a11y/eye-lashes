"use client";

import { useEffect, useRef } from "react";

/**
 * Аналог Ballpit с reactbits.dev — собственный, без three.js/rapier.
 *
 * Что воспроизведено: мягкие пастельные сферы, которые свободно дрейфуют,
 * отскакивают от границ блока, сталкиваются друг с другом и мягко следуют
 * за курсором. Псевдо-3D: у каждого шарика есть «глубина», от неё зависят
 * размер и прозрачность, а объём рисуется радиальным градиентом.
 *
 * Что отличается от оригинала: там настоящая 3D-сцена с физикой и светом,
 * здесь — 2D-canvas. Визуально близко, но без реального освещения и
 * перспективы. Если нужен точный оригинал — подключаем three + rapier.
 *
 * SEO: компонент декоративный, разметка hero остаётся серверной и читаемой.
 */

export type BallpitProps = {
  className?: string;
  /** Количество шариков. Больше — плотнее «пит» и выше нагрузка на CPU. */
  count?: number;
  colors?: string[];
  /** Радиусы в долях от меньшей стороны блока. */
  minRadius?: number;
  maxRadius?: number;
  /** Шарики тянутся к курсору, пока он внутри блока. */
  followCursor?: boolean;
  /** Доля скорости, остающаяся за кадр: ближе к 1 — длиннее инерция. */
  friction?: number;
  /** Ограничение скорости, px за кадр при 60 fps. */
  maxVelocity?: number;
  /** Упругость стен, 0..1. */
  wallBounce?: number;
  /** Сила притяжения к курсору. */
  cursorStrength?: number;
  /** Притяжение к центру блока, когда курсора нет — «пит» не расплывается. */
  idleStrength?: number;
};

type Ball = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Радиус в CSS-пикселях. */
  r: number;
  /** Доля от меньшей стороны блока — переживает ресайз без пересоздания сцены. */
  rFrac: number;
  /** Глубина 0..1: влияет на радиус, яркость и «параллакс» скорости. */
  z: number;
  driftX: number;
  driftY: number;
  sprite: HTMLCanvasElement;
  color: string;
};

const DEFAULT_COLORS = [
  "#ebb3be",
  "#de8b9b",
  "#f4d3d9",
  "#fae9ec",
  "#c96c80",
  "#efe5dc",
  "#ffffff",
];

/** Осветление/затемнение hex-цвета: amount > 0 — светлее, < 0 — темнее. */
function shade(hex: string, amount: number): string {
  const value = parseInt(hex.slice(1), 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;

  const channel = (c: number) =>
    Math.round(amount >= 0 ? c + (255 - c) * amount : c * (1 + amount));

  return `rgb(${channel(r)}, ${channel(g)}, ${channel(b)})`;
}

/** Спрайт шарика рисуется один раз: в кадре остаётся только drawImage. */
function createSprite(radius: number, color: string, dpr: number): HTMLCanvasElement {
  const size = Math.max(2, Math.ceil(radius * 2 * dpr));
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  // Блик смещён к верхнему левому краю — так шар читается как объёмный.
  const gradient = ctx.createRadialGradient(
    size * 0.34,
    size * 0.3,
    size * 0.04,
    size * 0.52,
    size * 0.52,
    size * 0.56,
  );
  gradient.addColorStop(0, shade(color, 0.62));
  gradient.addColorStop(0.5, color);
  gradient.addColorStop(1, shade(color, -0.18));

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - size * 0.02, 0, Math.PI * 2);
  ctx.fill();

  return canvas;
}

export default function Ballpit({
  className,
  count = 60,
  colors = DEFAULT_COLORS,
  minRadius = 0.035,
  maxRadius = 0.085,
  followCursor = true,
  friction = 0.982,
  maxVelocity = 3.2,
  wallBounce = 0.92,
  cursorStrength = 0.0016,
  idleStrength = 0.00035,
}: BallpitProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    let balls: Ball[] = [];
    let width = 0;
    let height = 0;
    let minSide = 0;
    let dpr = 1;
    let raf = 0;
    let inViewport = true;
    let documentVisible = !document.hidden;

    const pointer = { x: 0, y: 0, active: false };

    const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);

    /** Начальная раскладка: почти регулярная сетка со сдвигом, чтобы не было «слипания». */
    function layout(preserveMotion: boolean) {
      const previous = new Map(balls.map((ball) => [ball.color + ball.rFrac, ball]));
      const total = Math.max(1, count);
      const columns = Math.ceil(Math.sqrt((total * width) / Math.max(1, height)));
      const rows = Math.ceil(total / Math.max(1, columns));
      const cellW = width / columns;
      const cellH = height / Math.max(1, rows);

      const next: Ball[] = [];

      for (let index = 0; index < total; index += 1) {
        const column = index % columns;
        const row = Math.floor(index / columns);
        const z = Math.random();
        const rFrac = minRadius + (maxRadius - minRadius) * z;
        const r = Math.max(6, rFrac * minSide);
        const color = colors[index % colors.length];
        const existing = previous.get(color + rFrac);

        next.push({
          x: clamp(cellW * (column + 0.5) + randomBetween(-cellW * 0.28, cellW * 0.28), r, width - r),
          y: clamp(cellH * (row + 0.5) + randomBetween(-cellH * 0.28, cellH * 0.28), r, height - r),
          vx: preserveMotion && existing ? existing.vx : randomBetween(-0.4, 0.4),
          vy: preserveMotion && existing ? existing.vy : randomBetween(-0.4, 0.4),
          r,
          rFrac,
          z,
          driftX: randomBetween(-0.012, 0.012),
          driftY: randomBetween(-0.012, 0.012),
          sprite: createSprite(r, color, dpr),
          color,
        });
      }

      balls = next;
    }

    function resize() {
      const rect = host!.getBoundingClientRect();
      const nextDpr = Math.min(2, window.devicePixelRatio || 1);

      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      minSide = Math.min(width, height);

      // Ресайз не должен «сбрасывать» движение: сохраняем скорости и раскладку.
      const hadBalls = balls.length > 0;
      balls = hadBalls
        ? balls.map((ball) => {
            const r = Math.max(6, ball.rFrac * minSide);
            return { ...ball, r, sprite: createSprite(r, ball.color, nextDpr) };
          })
        : [];

      dpr = nextDpr;
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;

      if (!hadBalls) layout(false);
    }

    function step(dt: number) {
      const targetX = pointer.active ? pointer.x : width / 2;
      const targetY = pointer.active ? pointer.y : height / 2;
      const strength = pointer.active && followCursor ? cursorStrength : idleStrength;
      const damp = Math.pow(friction, dt);

      for (const ball of balls) {
        ball.vx += (targetX - ball.x) * strength * dt;
        ball.vy += (targetY - ball.y) * strength * dt;

        // Лёгкое индивидуальное блуждание — «пит» не залипает в точке равновесия.
        ball.vx += ball.driftX * dt;
        ball.vy += ball.driftY * dt;

        ball.vx *= damp;
        ball.vy *= damp;

        const speed = Math.hypot(ball.vx, ball.vy);
        // Ближние шарики (z больше) двигаются чуть быстрее — намёк на перспективу.
        const limit = maxVelocity * (0.62 + ball.z * 0.55);
        if (speed > limit) {
          ball.vx = (ball.vx / speed) * limit;
          ball.vy = (ball.vy / speed) * limit;
        }

        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;
      }

      resolveCollisions();
      bounceWalls();
    }

    function resolveCollisions() {
      for (let i = 0; i < balls.length; i += 1) {
        const a = balls[i];

        for (let j = i + 1; j < balls.length; j += 1) {
          const b = balls[j];
          let dx = b.x - a.x;
          let dy = b.y - a.y;
          const minDistance = a.r + b.r;

          if (dx === 0 && dy === 0) {
            dx = 0.01;
            dy = 0.01;
          }

          const distanceSq = dx * dx + dy * dy;
          if (distanceSq >= minDistance * minDistance) continue;

          const distance = Math.sqrt(distanceSq);
          const nx = dx / distance;
          const ny = dy / distance;

          // Разводим шарики по позиции, затем гасим сближающий импульс.
          const overlap = (minDistance - distance) * 0.5;
          a.x -= nx * overlap;
          a.y -= ny * overlap;
          b.x += nx * overlap;
          b.y += ny * overlap;

          const relative = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (relative < 0) {
            const impulse = relative * 0.5;
            a.vx += impulse * nx;
            a.vy += impulse * ny;
            b.vx -= impulse * nx;
            b.vy -= impulse * ny;
          }
        }
      }
    }

    function bounceWalls() {
      for (const ball of balls) {
        if (ball.x - ball.r < 0) {
          ball.x = ball.r;
          ball.vx = Math.abs(ball.vx) * wallBounce;
        } else if (ball.x + ball.r > width) {
          ball.x = width - ball.r;
          ball.vx = -Math.abs(ball.vx) * wallBounce;
        }

        if (ball.y - ball.r < 0) {
          ball.y = ball.r;
          ball.vy = Math.abs(ball.vy) * wallBounce;
        } else if (ball.y + ball.r > height) {
          ball.y = height - ball.r;
          ball.vy = -Math.abs(ball.vy) * wallBounce;
        }
      }
    }

    function draw() {
      // Работаем в CSS-пикселях: setTransform учитывает плотность экрана.
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.clearRect(0, 0, width, height);

      for (const ball of balls) {
        ctx!.drawImage(ball.sprite, ball.x - ball.r, ball.y - ball.r, ball.r * 2, ball.r * 2);
      }
    }

    let lastFrame = 0;

    function loop(now: number) {
      // dt в «кадрах 60 fps», с потолком — чтобы после сворачивания вкладки
      // физика не получила гигантский шаг и не разбросала шарики.
      const dt = lastFrame === 0 ? 1 : Math.min(2.5, (now - lastFrame) / (1000 / 60));
      lastFrame = now;

      step(dt);
      draw();

      raf = requestAnimationFrame(loop);
    }

    function start() {
      if (raf !== 0) return;
      if (reduceMotion.matches) {
        // При reduced-motion рисуем один статичный кадр: декор остаётся, движения нет.
        lastFrame = 0;
        draw();
        return;
      }
      lastFrame = 0;
      raf = requestAnimationFrame(loop);
    }

    function stop() {
      if (raf !== 0) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    }

    function sync() {
      if (inViewport && documentVisible) start();
      else stop();
    }

    function handlePointerMove(event: PointerEvent) {
      const rect = host!.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
        pointer.active = false;
        return;
      }

      pointer.x = x;
      pointer.y = y;
      pointer.active = true;
    }

    function handlePointerLeave() {
      pointer.active = false;
    }

    const resizeObserver = new ResizeObserver(() => {
      resize();
      // При reduced-motion статичный кадр нужно перерисовать под новый размер.
      if (reduceMotion.matches) draw();
    });
    resizeObserver.observe(host);

    const intersectionObserver = new IntersectionObserver((entries) => {
      inViewport = entries.some((entry) => entry.isIntersecting);
      sync();
    });
    intersectionObserver.observe(host);

    function handleVisibilityChange() {
      documentVisible = !document.hidden;
      sync();
    }

    function handleReduceMotionChange() {
      stop();
      sync();
    }

    resize();
    sync();

    if (followCursor) {
      window.addEventListener("pointermove", handlePointerMove, { passive: true });
      window.addEventListener("pointerleave", handlePointerLeave);
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    reduceMotion.addEventListener("change", handleReduceMotionChange);

    return () => {
      stop();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      reduceMotion.removeEventListener("change", handleReduceMotionChange);
    };
  }, [
    colors,
    count,
    cursorStrength,
    followCursor,
    friction,
    idleStrength,
    maxRadius,
    maxVelocity,
    minRadius,
    wallBounce,
  ]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      style={{ display: "block", width: "100%", height: "100%" }}
    />
  );
}

function clamp(value: number, min: number, max: number) {
  if (max < min) return (min + max) / 2;
  return Math.min(Math.max(value, min), max);
}
