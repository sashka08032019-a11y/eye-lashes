import { site } from "./site";

export const locales = ["ru", "kk"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ru";

/** Человекочитаемые названия локалей для переключателя языка. */
export const localeLabels: Record<Locale, string> = {
  ru: "Рус",
  kk: "Қаз",
};

/** Для <html lang> — kk требует казахского кода языка. */
export const htmlLang: Record<Locale, string> = {
  ru: "ru-KZ",
  kk: "kk-KZ",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** Абсолютный URL — нужен для canonical, Open Graph и sitemap. */
export function absoluteUrl(path = "/"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalized, site.url).toString();
}

/**
 * Путь внутри локали. `localizedPath("kk", "/uslugi")` → `/kk/uslugi`.
 * Сегменты URL намеренно одинаковые для ru и kk: так проще поддерживать
 * hreflang-пары один-к-одному и не плодить дубли страниц.
 */
export function localizedPath(locale: Locale, path = ""): string {
  if (!path || path === "/") return `/${locale}`;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${normalized}`;
}

/**
 * Значения для `alternates.languages` — hreflang между языковыми версиями.
 * `x-default` указывает на русскую версию как основную.
 */
export function languageAlternates(path = ""): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    languages[locale] = absoluteUrl(localizedPath(locale, path));
  }
  languages["x-default"] = absoluteUrl(localizedPath(defaultLocale, path));
  return languages;
}
