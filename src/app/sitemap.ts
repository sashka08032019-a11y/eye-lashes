import type { MetadataRoute } from "next";

import { posts } from "@/content/posts";
import { services } from "@/content/services";
import { absoluteUrl, locales, localizedPath, type Locale } from "@/lib/i18n";
import { postPath, routes, servicePath } from "@/lib/routes";

type Entry = {
  path: string;
  lastModified?: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
};

/**
 * Карта сайта: по записи на каждую страницу каждой локали.
 * `alternates.languages` добавляет xhtml:link-и — так робот видит,
 * что ru и kk версии страницы — переводы друг друга, а не дубли.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const entries: Entry[] = [
    { path: routes.home, changeFrequency: "weekly", priority: 1 },
    { path: routes.services, changeFrequency: "weekly", priority: 0.9 },
    { path: routes.prices, changeFrequency: "weekly", priority: 0.9 },
    { path: routes.portfolio, changeFrequency: "monthly", priority: 0.6 },
    { path: routes.blog, changeFrequency: "weekly", priority: 0.7 },
    { path: routes.map, changeFrequency: "yearly", priority: 0.5 },
    { path: routes.contacts, changeFrequency: "yearly", priority: 0.8 },

    ...services.map((service) => ({
      path: servicePath(service.slug),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),

    // Черновики статей не попадают в sitemap — на них стоит noindex,
    // и «тонкие» страницы только портят общее качество сайта для робота.
    ...posts
      .filter((post) => !post.draft)
      .map((post) => ({
        path: postPath(post.slug),
        lastModified: post.updated ?? post.date,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
  ];

  const languagesFor = (path: string): Record<string, string> => {
    const languages: Record<string, string> = {};
    for (const locale of locales) {
      languages[locale] = absoluteUrl(localizedPath(locale as Locale, path));
    }
    languages["x-default"] = absoluteUrl(localizedPath("ru", path));
    return languages;
  };

  return locales.flatMap((locale) =>
    entries.map((entry) => ({
      url: absoluteUrl(localizedPath(locale, entry.path)),
      lastModified: entry.lastModified,
      changeFrequency: entry.changeFrequency,
      priority: entry.priority,
      alternates: { languages: languagesFor(entry.path) },
    })),
  );
}
