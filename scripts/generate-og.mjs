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
 * Запуск:  node scripts/generate-og.mjs
 *
 * Шрифты — системные (Segoe UI / Arial), поэтому текст рисуется через SVG
 * средствами sharp. Если на машине нет этих шрифтов, подставится sans-serif
 * из fontconfig; для пересборки картинок это допустимо.
 */

import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const OUT_DIR = path.join(process.cwd(), "public");

// Палитра бренда (совпадает с globals.css).
const FOREST = "#162925";
const FOREST_DARK = "#101a17";
const SAND = "#f7ddd0";
const CLAY = "#d39c87";
const CLAY_LIGHT = "#e6c0ac";

const FONT = "'Segoe UI', Arial, Helvetica, sans-serif";

/** Основная карточка предпросмотра ссылки: 1200×630 (стандарт Open Graph). */
const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${FOREST}"/>
      <stop offset="1" stop-color="${FOREST_DARK}"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Декор: вторичный акцент (clay) — только заливка, не текст -->
  <circle cx="1060" cy="150" r="210" fill="${CLAY}" opacity="0.16"/>
  <circle cx="1140" cy="520" r="150" fill="${CLAY}" opacity="0.12"/>
  <rect x="80" y="96" width="64" height="8" rx="4" fill="${CLAY}"/>

  <text x="80" y="150" font-family="${FONT}" font-size="26" font-weight="600"
        letter-spacing="6" fill="${CLAY_LIGHT}">ЕСИК · АЛМАТИНСКАЯ ОБЛАСТЬ</text>

  <text x="76" y="330" font-family="${FONT}" font-size="126" font-weight="700"
        fill="${SAND}">Julia shik</text>

  <text x="80" y="410" font-family="${FONT}" font-size="54" font-weight="500"
        fill="${SAND}" opacity="0.92">Наращивание ресниц</text>

  <text x="80" y="472" font-family="${FONT}" font-size="32" font-weight="400"
        fill="${SAND}" opacity="0.7">Классика · объём · мега-объём · ламинирование</text>

  <text x="80" y="560" font-family="${FONT}" font-size="34" font-weight="600"
        fill="${CLAY_LIGHT}">+7 747 237 5202 · WhatsApp</text>
</svg>`;

/** Иконка Apple Touch (180×180): монограмма бренда на тёмном фоне. */
const iconSvg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="${FOREST}"/>
  <circle cx="${size * 0.78}" cy="${size * 0.22}" r="${size * 0.3}" fill="${CLAY}" opacity="0.18"/>
  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central"
        font-family="${FONT}" font-size="${Math.round(size * 0.46)}" font-weight="700"
        fill="${SAND}">JS</text>
</svg>`;

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const og = await sharp(Buffer.from(ogSvg)).png({ compressionLevel: 9 }).toBuffer();
  await sharp(og).toFile(path.join(OUT_DIR, "og-cover.png"));
  console.log(`og-cover.png      1200x630  ${(og.length / 1024).toFixed(1)} KB`);

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
