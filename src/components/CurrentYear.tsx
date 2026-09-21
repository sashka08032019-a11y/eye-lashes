"use client";

import { useEffect, useState } from "react";

/**
 * Текущий год для копирайта в футере.
 *
 * Страницы сайта статические (SSG), поэтому `new Date().getFullYear()` на
 * сервере выполнился бы один раз — на сборке, и после 1 января в футере
 * висел бы прошлый год до следующего деплоя. Здесь год считается уже в
 * браузере: на сервере рендерится `null`, после монтирования подставляется
 * текущий год — новый build/deploy не нужен.
 */
export default function CurrentYear() {
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  if (!year) return null;

  return <>{year}</>;
}
