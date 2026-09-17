import type { CSSProperties, ReactNode } from "react";

/**
 * Порт компонента StarBorder с reactbits.dev (автор David Haz),
 * лицензия MIT — https://github.com/DavidHDev/react-bits
 *
 * Как это работает: контейнер с `overflow: hidden` и вертикальным паддингом
 * в `thickness` пикселей. Внутри — непрозрачная «шляпка» кнопки и два
 * широких радиальных градиента, которые ходят вдоль верхней и нижней кромки.
 * Из-за обрезки видна только тонкая полоса — по ней и пробегает блик,
 * как звезда по канту.
 *
 * Отличия от оригинала:
 *  • цвета передаются CSS-переменными, а не инлайновым `background` — иначе
 *    нельзя было бы сделать состояние наведения средствами CSS;
 *  • анимации выключаются при `prefers-reduced-motion`;
 *  • есть `focus-visible` — кнопка остаётся доступной с клавиатуры.
 *
 * Компонент без JS: ни состояния, ни эффектов — работает и в серверных,
 * и в клиентских компонентах.
 */

/** Готовый набор классов для «шляпки» кнопки-пилюли — общий для всех кнопок сайта. */
export const starBorderPill = "rounded-full px-5 py-2.5 text-sm font-medium";

export type StarBorderProps = {
  children: ReactNode;
  /** Какой элемент рисуем. По умолчанию ссылка — все CTA сайта ведут в мессенджеры. */
  as?: "a" | "button";
  /** Классы контейнера. */
  className?: string;
  /** Классы «шляпки» — здесь задаются паддинги, размер шрифта, radius. */
  innerClassName?: string;
  /** Цвет бегущей звезды. */
  color?: string;
  /** Длительность одного прохода, например `5s`. */
  speed?: string;
  /** Толщина видимой полосы в пикселях. */
  thickness?: number;
  /** Фон «шляпки». */
  backgroundColor?: string;
  /** Фон «шляпки» при наведении. */
  hoverBackgroundColor?: string;
  textColor?: string;
  /** Цвет внутренней обводки. */
  borderColor?: string;
  href?: string;
  target?: string;
  rel?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  "aria-label"?: string;
  style?: CSSProperties;
};

export default function StarBorder({
  children,
  as = "a",
  className,
  innerClassName,
  color = "#ffffff",
  speed = "6s",
  thickness = 2,
  backgroundColor = "#a95064",
  hoverBackgroundColor,
  textColor = "#ffffff",
  borderColor = "rgb(255 255 255 / 0.35)",
  href,
  target,
  rel,
  type,
  disabled,
  "aria-label": ariaLabel,
  style,
}: StarBorderProps) {
  const glowStyle: CSSProperties = {
    animationDuration: speed,
    background: `radial-gradient(circle, ${color}, transparent 10%)`,
  };

  const variables = {
    ...style,
    padding: `${thickness}px 0`,
    "--sb-bg": backgroundColor,
    "--sb-text": textColor,
    "--sb-border": borderColor,
    ...(hoverBackgroundColor ? { "--sb-bg-hover": hoverBackgroundColor } : {}),
  } as CSSProperties;

  const containerClass = `star-border-container ${className ?? ""}`;

  const content = (
    <>
      <span
        className="star-border-glow star-border-glow--bottom"
        style={glowStyle}
        aria-hidden="true"
      />
      <span
        className="star-border-glow star-border-glow--top"
        style={glowStyle}
        aria-hidden="true"
      />
      <span className={`star-border-inner ${innerClassName ?? ""}`}>{children}</span>
    </>
  );

  // Ветки разделены намеренно: <a> не принимает disabled, а <button> — href,
  // и общий «полиморфный» рендер ломал бы типы.
  if (as === "button") {
    return (
      <button
        className={containerClass}
        style={variables}
        type={type ?? "button"}
        disabled={disabled}
        aria-label={ariaLabel}
      >
        {content}
      </button>
    );
  }

  return (
    <a
      className={containerClass}
      style={variables}
      href={href}
      target={target}
      rel={rel}
      aria-label={ariaLabel}
    >
      {content}
    </a>
  );
}
