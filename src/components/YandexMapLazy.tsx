"use client";

import dynamic from "next/dynamic";

/**
 * Карта подключается динамически с отключённым SSR.
 *
 * Так сторонний iframe не участвует в серверном рендере и гидрации, а
 * заглушка той же высоты не даёт вёрстке сдвинуться, пока грузится чанк
 * карты. `ssr: false` разрешён только в клиентском компоненте — в серверных
 * (как страница /karta) такой импорт запрещён, поэтому обёртка помечена
 * `"use client"`.
 */
const YandexMap = dynamic(() => import("@/components/YandexMap"), {
  ssr: false,
  loading: () => (
    <div
      aria-hidden="true"
      className="h-[480px] w-full animate-pulse rounded-2xl border border-brand-100 bg-brand-100/60"
    />
  ),
});

export default YandexMap;
