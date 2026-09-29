"use client";

import { useState } from "react";

type Props = {
  /** URL виджета 2ГИС (см. `mapEmbeds` в lib/site.ts). */
  src: string;
  /** Заголовок iframe — читается скринридерами и показывается, если карта не грузится. */
  title: string;
  /** Подпись, которая видна, пока виджет не загрузился. */
  loadingLabel: string;
};

/**
 * Виджет 2ГИС — сторонний iframe, который инициализируется своим скриптом.
 * Компонент рендерится только в браузере (см. TwogisMapLazy): при SSR и
 * гидрации скрипт виджета стартует раньше, чем готов DOM, и карта отдаёт
 * страницу ошибки вместо карты.
 *
 * Высота задана контейнером, а не атрибутом iframe, — карта не «прыгает»
 * и не ломает CLS, пока грузится.
 */
export default function TwogisMap({ src, title, loadingLabel }: Props) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative h-[480px] w-full overflow-hidden rounded-2xl border border-brand-100 bg-brand-50">
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
