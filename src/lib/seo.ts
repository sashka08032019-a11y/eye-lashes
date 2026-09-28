import type { Metadata } from "next";

import { absoluteUrl, languageAlternates, localizedPath, type Locale } from "./i18n";
import { site } from "./site";

/**
 * Картинка превью для соцсетей и мессенджеров (в т.ч. WhatsApp):
 * статичный PNG 1200×630, ~60 КБ — укладывается в лимит WhatsApp (~300 КБ)
 * и отдаётся как обычный файл из public/, без авторизации и редиректов.
 * Пересобирается скриптом `node scripts/generate-og.mjs`.
 */
const ogImage = {
  url: "/og-preview.png",
  width: 1200,
  height: 630,
  type: "image/png",
  alt: `${site.name} — салон красоты в Есике`,
};

export type SeoInput = {
  locale: Locale;
  /** Путь БЕЗ локали, например `/uslugi`. По умолчанию — главная. */
  path?: string;
  title: string;
  description: string;
  keywords?: string[];
  /** Для страниц блога и карточек услуг. */
  article?: { publishedTime: string; modifiedTime?: string; section?: string };
  noIndex?: boolean;
};

/**
 * Единая точка сборки метаданных. Каждая страница обязана отдавать
 * уникальные title/description, canonical и hreflang-пары ru/kk,
 * а также OG/Twitter-разметку для красивых сниппетов в мессенджерах.
 */
export function buildMetadata({
  locale,
  path = "",
  title,
  description,
  keywords,
  article,
  noIndex,
}: SeoInput): Metadata {
  const canonical = absoluteUrl(localizedPath(locale, path));
  const languages = languageAlternates(path);
  const url = absoluteUrl(localizedPath(locale, path));

  return {
    // absolute: title страницы используется как есть, без шаблона из layout —
    // иначе бренд и город дублируются в сниппете дважды.
    title: { absolute: title },
    description,
    keywords,
    metadataBase: new URL(site.url),
    alternates: {
      canonical,
      languages,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
    openGraph: {
      type: article ? "article" : "website",
      siteName: site.name,
      locale: locale === "ru" ? "ru_KZ" : "kk_KZ",
      alternateLocale: locale === "ru" ? "kk_KZ" : "ru_KZ",
      title,
      description,
      url,
      images: [ogImage],
      ...(article
        ? {
            publishedTime: article.publishedTime,
            modifiedTime: article.modifiedTime ?? article.publishedTime,
            section: article.section,
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: ogImage.url, alt: ogImage.alt }],
    },
  };
}
