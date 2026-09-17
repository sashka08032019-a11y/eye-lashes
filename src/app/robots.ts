import type { MetadataRoute } from "next";

import { site } from "@/lib/site";

/**
 * robots.txt. Генерируется на этапе сборки, поэтому в продакшене
 * доступен по /robots.txt и содержит актуальную ссылку на sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Служебные адреса не нужны в индексе: JSON-ответы и заглушка почты.
        disallow: ["/api/", "/_next/"],
      },
      {
        // Яндекс дополнительно уважает Host-директиву — дублируем её ниже.
        userAgent: "Yandex",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
