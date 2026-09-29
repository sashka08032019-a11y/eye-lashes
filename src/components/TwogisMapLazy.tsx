"use client";

import dynamic from "next/dynamic";

/**
 * Карта 2ГИС подключается динамически с отключённым SSR.
 *
 * Причина: виджет 2ГИС — это сторонний скрипт, который при серверном
 * рендере и гидрации выполняется до готовности DOM и вместо карты
 * показывает страницу ошибки. `ssr: false` требует клиентского
 * компонента, поэтому обёртка помечена `"use client"` — в серверных
 * компонентах (как страница /karta) такой импорт запрещён.
 *
 * Пока чанк карты грузится, показывается заглушка той же высоты,
 * чтобы вёрстка не сдвигалась.
 */
const TwogisMap = dynamic(() => import("@/components/TwogisMap"), {
  ssr: false,
  loading: () => (
    <div
      aria-hidden="true"
      className="h-[480px] w-full animate-pulse rounded-2xl border border-brand-100 bg-brand-100/60"
    />
  ),
});

export default TwogisMap;
