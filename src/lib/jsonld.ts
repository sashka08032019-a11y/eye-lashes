import { absoluteUrl, localizedPath, type Locale } from "./i18n";
import { site } from "./site";

type Json = Record<string, unknown>;

/**
 * Карточка организации. Схема BeautySalon — подтип LocalBusiness,
 * именно её Яндекс и Google используют для локальной выдачи.
 * Данные берутся из src/lib/site.ts, чтобы NAP совпадал с сайтом.
 */
export function beautySalonJsonLd(locale: Locale): Json {
  const cityLaced: Record<Locale, string> = {
    ru: `${site.address.city}, ${site.address.region}`,
    kk: `${site.address.city}, ${site.address.region}`,
  };

  return {
    "@context": "https://schema.org",
    "@type": "BeautySalon",
    "@id": `${absoluteUrl("/")}#organization`,
    name: site.name,
    url: absoluteUrl(localizedPath(locale, "/")),
    image: absoluteUrl("/Logo.png"),
    logo: absoluteUrl("/Logo.png"),
    telephone: site.phone.href,
    email: site.email,
    priceRange: "₸₸",
    currenciesAccepted: "KZT",
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.street,
      addressLocality: site.address.city,
      addressRegion: site.address.region,
      postalCode: site.address.postalCode,
      addressCountry: site.address.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: site.geo.latitude,
      longitude: site.geo.longitude,
    },
    areaServed: [
      { "@type": "City", name: site.address.city },
      { "@type": "AdministrativeArea", name: site.address.region },
    ],
    openingHoursSpecification: site.openingHours.spec.map((entry) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: entry.days.map((day) => `https://schema.org/${day}`),
      opens: entry.opens,
      closes: entry.closes,
    })),
    sameAs: [
      `https://instagram.com/${site.instagram}`,
      `https://t.me/${site.telegram}`,
    ],
    makesOffer: [],
  };
}

/** Хлебные крошки — помогают Яндексу показывать путь к странице в сниппете. */
export function breadcrumbJsonLd(
  locale: Locale,
  items: { name: string; path: string }[],
): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(localizedPath(locale, item.path)),
    })),
  };
}

/** Карточка услуги для страницы /uslugi/[slug]. */
export function serviceJsonLd(
  locale: Locale,
  service: { name: string; description: string; slug: string; price: number },
): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name,
    description: service.description,
    serviceType: service.name,
    url: absoluteUrl(localizedPath(locale, `/uslugi/${service.slug}`)),
    provider: { "@id": `${absoluteUrl("/")}#organization` },
    areaServed: { "@type": "City", name: site.address.city },
    offers: {
      "@type": "Offer",
      price: service.price,
      priceCurrency: "KZT",
      availability: "https://schema.org/InStock",
    },
  };
}

/** Разметка статьи для блога. */
export function articleJsonLd(
  locale: Locale,
  post: { title: string; description: string; slug: string; date: string; updated?: string },
): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    inLanguage: locale === "ru" ? "ru-KZ" : "kk-KZ",
    mainEntityOfPage: absoluteUrl(localizedPath(locale, `/blog/${post.slug}`)),
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    author: { "@type": "Organization", name: site.name },
    publisher: { "@id": `${absoluteUrl("/")}#organization` },
    image: absoluteUrl("/Logo.png"),
  };
}

/** Сериализация JSON-LD для вставки в <script type="application/ld+json">. */
export function jsonLdString(data: Json): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
