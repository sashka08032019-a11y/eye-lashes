"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Порт компонента MagicBento с reactbits.dev (автор David Haz),
 * лицензия MIT — https://github.com/DavidHDev/react-bits
 *
 * Что воспроизведено:
 *  • общий для секции «спотлайт» — мягкое пятно света, следующее за курсором;
 *  • рамка карточки подсвечивается радиальным градиентом в точке курсора,
 *    яркость зависит от расстояния до карточки;
 *  • при наведении внутри карточки загораются частицы-искры;
 *  • карточка слегка притягивается к курсору (magnetism) и может наклоняться;
 *  • при клике по карточке расходится волна света.
 *
 * Отличия от оригинала (осознанные):
 *  • анимации на CSS и requestAnimationFrame вместо GSAP — компонент не тянет
 *    внешнюю библиотеку ради трёх эффектов;
 *  • палитра под бренд: глубокий сливовый вместо чёрного, пудрово-розовое
 *    свечение вместо фиолетового (задаётся в globals.css);
 *  • сетка 3×N с крупной первой ячейкой 2×2 вместо жёстких nth-child из
 *    оригинала — так раскладка без дырок работает и на 6 карточках, и на 9;
 *  • карточки — обычные ссылки на страницы услуг: <a> с текстом внутри
 *    индексируется, а псевдоэлемент лишь растягивает область клика;
 *  • уважение к prefers-reduced-motion (в оригинале только мобильная проверка);
 *  • позиции карточек кэшируются — оригинал читал getBoundingClientRect
 *    каждой карточки на каждое движение курсора.
 */

export type BentoCard = {
  id: string;
  /** Подпись в углу карточки — обычно категория услуги. */
  label?: string;
  title: string;
  description: string;
  /** Цена или длительность — выводится в правом верхнем углу. */
  meta?: string;
  /** Строка под описанием. */
  foot?: string;
  /** Если задан, вся карточка становится ссылкой. */
  href?: string;
};

export type MagicBentoProps = {
  cards: BentoCard[];
  /** id для aria-labelledby, если секция уже озаглавлена снаружи. */
  ariaLabel?: string;
  /** Сколько искр загорается внутри карточки при наведении. */
  particleCount?: number;
  /** Радиус влияния спотлайта в пикселях. */
  spotlightRadius?: number;
  /** Наклон карточки за курсором. В оригинале по умолчанию выключен. */
  enableTilt?: boolean;
  /** Притяжение карточки к курсору. */
  enableMagnetism?: boolean;
  /** Волна света от клика. */
  clickEffect?: boolean;
  /**
   * Уровень заголовка карточки. Зависит от структуры страницы:
   * на главной над сеткой есть h2, а на странице услуг карточки сами
   * являются разделами верхнего уровня.
   */
  headingLevel?: "h2" | "h3";
};

/** Совпадает с оригиналом: на узких экранах все эффекты выключаются. */
const MOBILE_BREAKPOINT = 768;

type CardBox = {
  element: HTMLElement;
  left: number;
  top: number;
  width: number;
  height: number;
};

export default function MagicBento({
  cards,
  ariaLabel,
  particleCount = 12,
  spotlightRadius = 300,
  enableTilt = false,
  enableMagnetism = true,
  clickEffect = true,
  headingLevel = "h3",
}: MagicBentoProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const boxesRef = useRef<CardBox[]>([]);
  const rafRef = useRef(0);
  const pointerRef = useRef({ clientX: 0, clientY: 0, active: false });

  /** Id карточки под курсором — по нему рендерятся искры. */
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  /**
   * Эффекты включаем только после монтирования: на сервере неизвестны ни
   * размер экрана, ни настройки пользователя, а расхождение разметки дало бы
   * ошибку гидратации.
   */
  const [interactive, setInteractive] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const check = () => {
      setInteractive(!reduceMotion.matches && window.innerWidth > MOBILE_BREAKPOINT);
    };

    check();
    reduceMotion.addEventListener("change", check);
    window.addEventListener("resize", check);

    return () => {
      reduceMotion.removeEventListener("change", check);
      window.removeEventListener("resize", check);
    };
  }, []);

  /**
   * Позиции карточек считаем относительно секции и кэшируем: в отличие от
   * координат вьюпорта, они не меняются при скролле, поэтому читать layout
   * на каждое движение курсора не нужно.
   */
  const measure = useCallback(() => {
    const section = sectionRef.current;
    if (!section) return;

    boxesRef.current = Array.from(
      section.querySelectorAll<HTMLElement>(".magic-bento-card"),
    ).map((element) => ({
      element,
      left: element.offsetLeft,
      top: element.offsetTop,
      width: element.offsetWidth,
      height: element.offsetHeight,
    }));
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(section);

    return () => observer.disconnect();
  }, [measure, cards.length]);

  /** Покадровое применение позиции курсора: за один кадр, а не на каждое событие. */
  const applyPointer = useCallback(() => {
    rafRef.current = 0;

    const section = sectionRef.current;
    const pointer = pointerRef.current;
    if (!section || !pointer.active) return;

    const proximity = spotlightRadius * 0.5;
    const fadeDistance = spotlightRadius * 0.75;

    // Одно чтение layout на кадр вместо одного на каждую карточку.
    const sectionRect = section.getBoundingClientRect();
    const x = pointer.clientX - sectionRect.left;
    const y = pointer.clientY - sectionRect.top;

    let minDistance = Number.POSITIVE_INFINITY;

    for (const box of boxesRef.current) {
      const centerX = box.left + box.width / 2;
      const centerY = box.top + box.height / 2;

      // Расстояние до края карточки, а не до центра — «залив» начинается
      // ещё до того, как курсор дошёл до самой карточки.
      const distance =
        Math.hypot(x - centerX, y - centerY) - Math.max(box.width, box.height) / 2;
      const effective = Math.max(0, distance);
      minDistance = Math.min(minDistance, effective);

      let intensity = 0;
      if (effective <= proximity) intensity = 1;
      else if (effective <= fadeDistance) {
        intensity = (fadeDistance - effective) / (fadeDistance - proximity);
      }

      if (intensity > 0) {
        box.element.style.setProperty(
          "--glow-x",
          `${((x - box.left) / box.width) * 100}%`,
        );
        box.element.style.setProperty(
          "--glow-y",
          `${((y - box.top) / box.height) * 100}%`,
        );
      }
      box.element.style.setProperty("--glow-intensity", intensity.toFixed(3));

      const inside =
        x >= box.left &&
        x <= box.left + box.width &&
        y >= box.top &&
        y <= box.top + box.height;

      if (!inside || (!enableTilt && !enableMagnetism)) continue;

      const relX = (x - box.left) / box.width - 0.5;
      const relY = (y - box.top) / box.height - 0.5;

      if (enableTilt) {
        box.element.style.setProperty("--tilt-x", (relX * 10).toFixed(2));
        box.element.style.setProperty("--tilt-y", (-relY * 10).toFixed(2));
      }
      if (enableMagnetism) {
        box.element.style.setProperty("--mag-x", (relX * box.width * 0.05).toFixed(1));
        box.element.style.setProperty("--mag-y", (relY * box.height * 0.05).toFixed(1));
      }
    }

    const spotlight = spotlightRef.current;
    if (spotlight) {
      spotlight.style.setProperty("--spot-x", String(pointer.clientX));
      spotlight.style.setProperty("--spot-y", String(pointer.clientY));

      const opacity =
        minDistance <= proximity
          ? 0.8
          : minDistance <= fadeDistance
            ? ((fadeDistance - minDistance) / (fadeDistance - proximity)) * 0.8
            : 0;
      spotlight.style.opacity = String(opacity);
    }
  }, [enableMagnetism, enableTilt, spotlightRadius]);

  const scheduleFrame = useCallback(() => {
    if (rafRef.current !== 0) return;
    rafRef.current = requestAnimationFrame(applyPointer);
  }, [applyPointer]);

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!interactive) return;
      pointerRef.current = {
        clientX: event.clientX,
        clientY: event.clientY,
        active: true,
      };
      scheduleFrame();
    },
    [interactive, scheduleFrame],
  );

  const resetCards = useCallback(() => {
    for (const box of boxesRef.current) {
      box.element.style.setProperty("--glow-intensity", "0");
      box.element.style.setProperty("--tilt-x", "0");
      box.element.style.setProperty("--tilt-y", "0");
      box.element.style.setProperty("--mag-x", "0");
      box.element.style.setProperty("--mag-y", "0");
    }
  }, []);

  const handlePointerLeave = useCallback(() => {
    pointerRef.current.active = false;
    if (spotlightRef.current) spotlightRef.current.style.opacity = "0";
    resetCards();
  }, [resetCards]);

  useEffect(() => {
    if (rafRef.current !== 0) cancelAnimationFrame(rafRef.current);
    return () => {
      if (rafRef.current !== 0) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  /** Искры: положение в процентах, направление дрейфа — в пикселях. */
  const particles = useMemo(() => {
    if (hoveredId === null) return [];

    return Array.from({ length: particleCount }, (_, index) => ({
      key: index,
      style: {
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        "--i": index,
        "--dx": Math.round((Math.random() - 0.5) * 90),
        "--dy": Math.round((Math.random() - 0.5) * 90),
      } as React.CSSProperties,
    }));
  }, [hoveredId, particleCount]);

  /**
   * Волна от клика. Узел живёт один кадр анимации, поэтому добавляется
   * напрямую в DOM — держать его в состоянии React смысла нет.
   */
  const handleCardClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (!interactive || !clickEffect) return;

      const card = event.currentTarget;
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const maxDistance = Math.max(
        Math.hypot(x, y),
        Math.hypot(x - rect.width, y),
        Math.hypot(x, y - rect.height),
        Math.hypot(x - rect.width, y - rect.height),
      );

      const ripple = document.createElement("span");
      ripple.className = "magic-bento-ripple";
      ripple.style.width = `${maxDistance * 2}px`;
      ripple.style.height = `${maxDistance * 2}px`;
      ripple.style.left = `${x - maxDistance}px`;
      ripple.style.top = `${y - maxDistance}px`;
      ripple.addEventListener("animationend", () => ripple.remove(), { once: true });

      card.appendChild(ripple);
    },
    [clickEffect, interactive],
  );

  const Heading = headingLevel;

  return (
    <div
      ref={sectionRef}
      className="magic-bento-section"
      aria-label={ariaLabel}
      onPointerMove={interactive ? handlePointerMove : undefined}
      onPointerLeave={interactive ? handlePointerLeave : undefined}
    >
      {interactive ? (
        <div ref={spotlightRef} className="magic-bento-spotlight" aria-hidden="true" />
      ) : null}

      <ul className="magic-bento-grid">
        {cards.map((card) => {
          const isHovered = interactive && hoveredId === card.id;

          return (
            <li key={card.id} className="magic-bento-cell">
              <article
                className="magic-bento-card"
                onPointerEnter={interactive ? () => setHoveredId(card.id) : undefined}
                onPointerLeave={interactive ? () => setHoveredId(null) : undefined}
                onClick={handleCardClick}
              >
                {isHovered
                  ? particles.map((particle) => (
                      <span
                        key={particle.key}
                        className="magic-bento-particle"
                        style={particle.style}
                        aria-hidden="true"
                      />
                    ))
                  : null}

                <div className="magic-bento-card__header">
                  {card.label ? (
                    <span className="magic-bento-card__label">{card.label}</span>
                  ) : (
                    <span />
                  )}
                  {card.meta ? (
                    <span className="magic-bento-card__meta">{card.meta}</span>
                  ) : null}
                </div>

                <div>
                  {/* Уровень заголовка задаётся снаружи — зависит от структуры страницы. */}
                  <Heading className="magic-bento-card__title">
                    {card.href ? (
                      <Link href={card.href} className="magic-bento-card__link">
                        {card.title}
                      </Link>
                    ) : (
                      card.title
                    )}
                  </Heading>
                  <p className="magic-bento-card__description">{card.description}</p>
                  {card.foot ? <p className="magic-bento-card__foot">{card.foot}</p> : null}
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
