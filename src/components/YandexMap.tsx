"use client";

import { useState } from "react";

import { mapLinks } from "@/lib/site";

type Props = {
  /**
   * URL виджета Яндекс Карт. Пустая строка = карта отключена, показывается
   * статичный блок со ссылкой на карточку салона в 2ГИС.
   */
  src: string;
  /** Заголовок iframe — читается скринридерами. */
  title: string;
  /** Подпись, которая видна, пока карта не загрузилась. */
  loadingLabel: string;
  /** Подпись в статичном блоке, если карта отключена. */
  unavailableLabel: string;
  /** Подпись кнопки-ссылки на карточку салона. */
  linkLabel: string;
};

const frame = "h-[480px] w-full rounded-2xl border border-brand-100";
const linkStyle =
  "mt-5 inline-block rounded-full border border-clay-400 px-5 py-2.5 text-sm font-medium text-brand-700 transition-colors hover:bg-clay-400/20";

/**
 * Карта Яндекс Карт — встроенный виджет (`yandex.ru/map-widget/v1/`).
 * API-ключ не нужен: сервис отдаёт готовый iframe с меткой по координатам
 * салона (см. `mapEmbeds` в lib/site.ts).
 *
 * Рендерится только в браузере (см. YandexMapLazy). Высота задана
 * контейнером, а не атрибутом iframe, — вёрстка не «прыгает», пока карта
 * грузится.
 *
 * Если ссылка карты не задана, iframe не создаётся вообще: вместо него
 * показывается статичный блок с маршрутом в 2ГИС, чтобы страница никогда
 * не показывала чужую страницу ошибки.
 */
export default function YandexMap({ src, title, loadingLabel, unavailableLabel, linkLabel }: Props) {
  const [loaded, setLoaded] = useState(false);

  if (!src) {
    return (
      <div className={`${frame} grid place-items-center bg-brand-50 p-6 text-center`}>
        <div>
          <p className="mx-auto max-w-sm text-sm text-muted">{unavailableLabel}</p>
          <a href={mapLinks.twogis} target="_blank" rel="noopener noreferrer" className={linkStyle}>
            {linkLabel}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`${frame} relative overflow-hidden bg-brand-50`}>
      <iframe
        src={src}
        title={title}
        loading="lazy"
        allowFullScreen
        onLoad={() => setLoaded(true)}
        className="block h-full w-full border-0"
      />

      {loaded ? null : (
        <p className="pointer-events-none absolute inset-0 grid place-items-center bg-brand-50 p-6 text-center text-sm text-muted">
          {loadingLabel}
        </p>
      )}
    </div>
  );
}
