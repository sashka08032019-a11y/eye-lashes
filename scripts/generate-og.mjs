/**
 * Генерация картинок для соцсетей и иконок.
 *
 * Зачем это отдельным скриптом, а не next/og: WhatsApp показывает превью
 * только если og:image доступен, не больше ~300 КБ и реально соответствует
 * заявленным размерам. Здесь мы один раз собираем статичный PNG 1200×630 в
 * public/ — он отдаётся как обычный файл (Content-Type: image/png, без
 * авторизации и редиректов), поэтому его гарантированно заберут боты
 * мессенджеров, которые не выполняют JavaScript.
 *
 * На карточку ставится сам логотип сайта (public/Logo.png). Логотип чёрный,
 * поэтому фон карточки светлый — иначе на тёмном фоне его не видно.
 *
 * Запуск:  node scripts/generate-og.mjs
 */

import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const OUT_DIR = path.join(process.cwd(), "public");
const LOGO_SRC = path.join(OUT_DIR, "Logo.png");

// Палитра бренда (совпадает с globals.css).
const SAND = "#f7ddd0";
const SAND_LIGHT = "#fcf3ee";
const INK = "#14171e";
const BRAND = "#386352";
const BRAND_DARK = "#2b4c3f";
const CLAY = "#d39c87"; // только декор — не текст на светлом фоне

const FONT = "'Segoe UI', Arial, Helvetica, sans-serif";

const WIDTH = 1200;
const HEIGHT = 630;

/** Логотип без прозрачных полей, вписанный в рамку, и его фактические размеры. */
async function prepareLogo() {
  const trimmed = await sharp(LOGO_SRC)
    .ensureAlpha()
    .trim({ threshold: 10 })
    .toBuffer({ resolveWithObject: true });

  const box = { width: 420, height: 300 };
  const resized = await sharp(trimmed.data)
    .resize({ ...box, fit: "inside", withoutEnlargement: false })
    .png()
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: resized.data,
    width: resized.info.width,
    height: resized.info.height,
  };
}

async function renderMaster() {
  const logo = await prepareLogo();

  const padLeft = 80;
  const logoY = Math.round((HEIGHT - logo.height) / 2);
  const textX = padLeft + logo.width + 72;

  const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${SAND}"/>
      <stop offset="1" stop-color="${SAND_LIGHT}"/>
    </linearGradient>
  </defs>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
  <rect x="0" y="0" width="14" height="${HEIGHT}" fill="${BRAND}"/>
  <rect x="${padLeft}" y="70" width="72" height="8" rx="4" fill="${CLAY}"/>

  <text x="${textX}" y="300" font-family="${FONT}" font-size="86" font-weight="700"
        fill="${INK}">Julia shik</text>
  <text x="${textX}" y="360" font-family="${FONT}" font-size="38" font-weight="500"
        fill="${BRAND}">Салон красоты в Есике</text>
  <text x="${textX}" y="430" font-family="${FONT}" font-size="32" font-weight="400"
        fill="${INK}" opacity="0.75">Наращивание ресниц · косметология · уход</text>
  <text x="${textX}" y="510" font-family="${FONT}" font-size="34" font-weight="600"
        fill="${BRAND_DARK}">+7 747 237 5202 · WhatsApp</text>
</svg>`;

  const base = await sharp(Buffer.from(ogSvg)).png().toBuffer();

  return sharp(base)
    .composite([{ input: logo.buffer, left: padLeft, top: logoY }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/** Иконка-монограмма бренда на тёмном фоне. */
const iconSvg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="${BRAND_DARK}"/>
  <circle cx="${size * 0.78}" cy="${size * 0.22}" r="${size * 0.3}" fill="${CLAY}" opacity="0.18"/>
  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central"
        font-family="${FONT}" font-size="${Math.round(size * 0.46)}" font-weight="700"
        fill="${SAND}">JS</text>
</svg>`;

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const og = await renderMaster();
  await sharp(og).toFile(path.join(OUT_DIR, "og-preview.png"));
  console.log(`og-preview.png    1200x630  ${(og.length / 1024).toFixed(1)} KB`);

  const apple = await sharp(Buffer.from(iconSvg(180))).png({ compressionLevel: 9 }).toBuffer();
  await sharp(apple).toFile(path.join(OUT_DIR, "apple-touch-icon.png"));
  console.log(`apple-touch-icon  180x180   ${(apple.length / 1024).toFixed(1)} KB`);

  const favicon = await sharp(Buffer.from(iconSvg(32))).png({ compressionLevel: 9 }).toBuffer();
  await sharp(favicon).toFile(path.join(OUT_DIR, "favicon-32.png"));
  console.log(`favicon-32.png    32x32     ${(favicon.length / 1024).toFixed(1)} KB`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
