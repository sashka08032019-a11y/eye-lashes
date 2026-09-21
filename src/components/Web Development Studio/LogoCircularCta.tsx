// LogoCircularCta.tsx
//
// Лого по центру (со своей анимацией: рост → несколько оборотов → возврат),
// вокруг него — статичный (без вращения) текст дугой: сверху topText,
// снизу bottomText. Весь компонент — кликабельная ссылка (по умолчанию на
// https://web-developer-s.netlify.app, открывается в новой вкладке).
//
// Зависимости: только React. Стили — в соседнем файле LogoCircularCta.css.
//
// Про само лого: в исходном Logo.svg буква "S" нарисована через встроенный
// SVG-шрифт "Algerian" (<font>/<glyph> + @font-face src:url(#...)) — эта
// технология deprecated и не поддерживается современными Chrome/Firefox/Edge
// (работает только в старом Safari). Поэтому контур буквы "S" здесь встроен
// как обычный <path> (координаты взяты из <glyph unicode="S"> исходного
// файла) — так лого выглядит одинаково везде.
//
// Использование:
//   <LogoCircularCta />                                  {/* ведёт на дефолтную ссылку */}
//   <LogoCircularCta href="https://example.com" />        {/* другая ссылка */}
//   <LogoCircularCta href="" onClick={() => doStuff()} /> {/* без ссылки, просто кнопка */}

"use client"; // если проект не на Next.js App Router — эту строку можно удалить

import { useId, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import "./LogoCircularCta.css";

export interface LogoCircularCtaProps {
  /** Текст дугой сверху */
  topText?: string;
  /** Текст дугой снизу */
  bottomText?: string;
  /** Диаметр всего компонента, px */
  size?: number;
  /**
   * Размер текста дуги в единицах viewBox (200×200). Реальный размер на
   * экране = fontSize * size / 200, поэтому при маленьком size текст нужно
   * увеличивать — иначе он становится нечитаемым.
   */
  fontSize?: number;
  /** Доля диаметра, которую занимает лого, 0..1 */
  logoScale?: number;
  /** Длительность цикла лого (рост → несколько оборотов → возврат), сек */
  logoCycleDuration?: number;
  /** Куда ведёт клик по всему компоненту. Пустая строка/undefined — рендерится как div без ссылки */
  href?: string;
  /** target для ссылки (по умолчанию открывать в новой вкладке) */
  target?: string;
  /** Доп. обработчик клика (срабатывает наряду с переходом по ссылке, например для аналитики) */
  onClick?: () => void;
  className?: string;
}

const DEFAULT_TOP = "Нужен сайт?";
const DEFAULT_BOTTOM = "ЖМИ сюда";
const DEFAULT_HREF = "https://web-developer-s.netlify.app";

export default function LogoCircularCta({
  topText = DEFAULT_TOP,
  bottomText = DEFAULT_BOTTOM,
  size = 300,
  fontSize = 13,
  logoScale = 0.46,
  logoCycleDuration = 5,
  href = DEFAULT_HREF,
  target = "_blank",
  onClick,
  className,
}: LogoCircularCtaProps) {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const topPathId = `lcc-top-${rawId}`;
  const bottomPathId = `lcc-bottom-${rawId}`;

  // viewBox фиксирован (0..200) — при изменении size весь компонент
  // масштабируется как единое целое, дуги пересчитывать не нужно.
  const cx = 100;
  const cy = 100;
  const radius = 86;
  const topPath = `M ${cx - radius},${cy} A ${radius},${radius} 0 0,1 ${cx + radius},${cy}`;
  const bottomPath = `M ${cx - radius},${cy} A ${radius},${radius} 0 0,0 ${cx + radius},${cy}`;

  const logoSize = size * logoScale;

  const cssVars = {
    "--lcc-logo-duration": `${logoCycleDuration}s`,
    "--lcc-text-size": `${fontSize}px`,
  } as CSSProperties;

  const isLink = Boolean(href);
  const isInteractive = isLink || Boolean(onClick);
  const label = `${topText} ${bottomText}`.trim();

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!onClick) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  const content: ReactNode = (
    <>
      {/* Статичный текст дугой: сверху и снизу */}
      <svg className="lcc-arcs" viewBox="0 0 200 200" aria-hidden="true">
        <defs>
          <path id={topPathId} d={topPath} />
          <path id={bottomPathId} d={bottomPath} />
        </defs>
        <text className="lcc-text" textAnchor="middle">
          <textPath href={`#${topPathId}`} startOffset="50%">
            {topText}
          </textPath>
        </text>
        <text className="lcc-text" textAnchor="middle">
          <textPath href={`#${bottomPathId}`} startOffset="50%">
            {bottomText}
          </textPath>
        </text>
      </svg>

      {/* Лого по центру: рост → несколько оборотов → возврат в исходное состояние */}
      <svg
        className="lcc-logo"
        style={{
          width: logoSize,
          height: logoSize,
          marginTop: -logoSize / 2,
          marginLeft: -logoSize / 2,
        }}
        viewBox="0 0 10500 10500"
        aria-hidden="true"
      >
        <circle cx="5290.6" cy="5292.52" r="5000" className="lcc-logo-fill" />
        <g transform="translate(2535.09, 8721.67) scale(10.29776, -10.29776)">
          <path
            className="lcc-logo-glyph"
            d="M478.5 661.666c-16.8338,-22.8331 -30.4998,-46.6665 -40.5001,-71.5 -19.8334,-48.833 -33.0004,-78.8327 -39.4999,-89.9992l-2.50054 -2.83363c-1.3333,3.49979 -2.33352,6.16639 -2.99968,8.16682 -9.00002,29.1665 -16.4997,49.3331 -22.5,60.6666 -5.83331,11.3335 -14.6663,22.167 -26.3329,32.5003 -29.6666,26.1659 -63.5002,39.3328 -101.334,39.3328 -34.8338,0 -64.0003,-9.66618 -87.1665,-28.9995 -23.1672,-19.3333 -34.6668,-43.6668 -34.6668,-72.8333 0,-54.6672 41.3333,-91.8336 123.833,-111.667l82.6675 -20.0005c117.666,-28.3333 176.5,-90.1662 176.5,-185.833 0,-53.3339 -20.1665,-98 -60.3335,-134.334 -40.166,-36.1661 -90.0002,-54.3332 -149.166,-54.3332 -37.1663,0 -78.6666,5.66725 -124.5,16.8338l-57.1668 14.0001c-23.1662,5.49925 -42.1665,8.16682 -57.1668,8.16682 -19.8334,0 -40.333,-6.16736 -61.4998,-18.6672l-3.9999 6.83352c40.5001,60.8336 68.8334,118.834 85,173.833l8.83299 -2.49957c6.83352,-51.0004 27.3331,-90.6673 61.4998,-119.001 34.1667,-28.3333 78.8336,-42.4995 134,-42.4995 43.6668,0 78.3335,10.1663 104,30.3338 25.6667,20.1665 38.4996,47.3326 38.4996,81.4993 0,39.3338 -17.833,71.8341 -53.666,97.4998 -25.6667,18.1671 -78.5006,35.1669 -158.166,50.8334 -61.5008,12.0007 -106.001,32.0002 -133.667,60.0004 -27.6672,28.0003 -41.5003,66.833 -41.5003,116.666 0,51.3335 18.5001,93.0008 55.5004,125.167 36.8333,32.0002 85,47.9998 144.333,47.9998 37.9995,0 82.4995,-6.83255 133.333,-20.3326 23.6673,-6.50044 41.3333,-9.66715 52.6668,-9.66715 15.9996,0 33.5005,5.66628 52.3337,16.9998l5.3332 -2.33352zm30.3328 -20.9997l-4.50001 -7.33363c-13.333,-22.5 -24.6665,-44.1659 -34.1667,-64.6665 -22.6661,-47.9998 -35.666,-74.6667 -38.4996,-80.166l-2.49957 -3.50076 -11.6676 4.83406 2.00044 4.50001c9.3331,21.4998 23.0001,49.4991 41.0002,84.1659l33.1664 64.5004 2.50054 3.9999 12.6659 -6.33342zm-142.666 -97.1668c-36.0001,38.3336 -74.5007,57.4999 -115.834,57.4999 -24.8336,0 -45.5002,-7.16661 -61.8329,-21.4998 -16.3336,-14.3332 -24.5005,-32.6663 -24.5005,-54.8333 0,-24.1664 16.8338,-48.833 50.3333,-74.3336l3.9999 -2.49957 -2.49957 -3.83287c-43.1667,19.1663 -64.8335,46.9995 -64.8335,83.4997 0,25.3327 9.16704,46.0003 27.3331,61.9999 18.3341,15.8335 42.1674,23.8333 71.5,23.8333 28.0003,0 52.5007,-6.00033 73.5005,-17.833 21.1667,-11.8336 36.5002,-28.5004 46.3334,-50.0002l-3.49979 -2.00044zm112.333 -193.833c44.3329,-33.4995 66.4999,-79.4998 66.4999,-137.833 0,-62.1669 -24.1664,-114.834 -72.3332,-158 -48.1668,-43.1667 -106.667,-64.8335 -175.667,-64.8335 -35.1659,0 -67,3.66682 -95.3334,10.8334l-78.1665 19.3333c-18.1661,4.50001 -37.6664,6.83352 -58.5001,6.83352 -18.6662,0 -35.666,-3.83287 -51.3325,-11.3335l-5.83331 14.1672c16.9998,8.16682 34.1667,12.1667 51.8326,12.1667 19.5004,0 41.8334,-3.00065 67,-8.83396l75.3339 -18.3331c29.9997,-7.16661 61.4998,-10.8334 94.8332,-10.8334 65.1666,0 120.666,20.8337 166.5,62.3339 45.8333,41.4993 68.6664,91.6665 68.6664,150.5 0,49.8332 -17.834,93.4999 -53.5,130.833l0 2.99968zm-347.667 -140.667c11.9997,-58.6662 44.3329,-100.166 96.6667,-124.5l0 -3.9999c-60.4996,17.6669 -97.1668,59.6664 -109.834,126l13.1669 2.49957zm-60.9997 158.166l16.6667 -9.16607c10.6664,-19.3333 41.9994,-35.1669 94.1661,-47.8337l78.6666 -19.6664c53.3339,-13.333 88.8339,-24.8336 106.667,-34.3337 17.6669,-9.66618 30.3338,-24.1664 37.8335,-43.6668l-3.49979 -1.99946c-14.6673,16.8328 -30.5008,29.3336 -47.5006,37.1663 -17.1668,7.66672 -50.0002,17.3339 -98.5001,28.6664 -70.3328,16.3336 -117.499,30.5008 -141.5,42.3335 -24.1664,11.8336 -38.4996,28.0003 -42.9996,48.4999z"
          />
        </g>
        <circle cx="5264.38" cy="5292.52" r="5000" className="lcc-logo-ring" />
      </svg>
    </>
  );

  const wrapperClassName = ["lcc-wrapper", className].filter(Boolean).join(" ");
  const wrapperStyle = { width: size, height: size, ...cssVars };

  if (isLink) {
    return (
      <a
        href={href}
        target={target}
        rel={target === "_blank" ? "noopener noreferrer" : undefined}
        className={wrapperClassName}
        style={wrapperStyle}
        onClick={onClick}
        aria-label={label}
        data-clickable="true"
      >
        {content}
      </a>
    );
  }

  return (
    <div
      className={wrapperClassName}
      style={wrapperStyle}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? label : undefined}
      data-clickable={isInteractive ? "true" : undefined}
    >
      {content}
    </div>
  );
}
