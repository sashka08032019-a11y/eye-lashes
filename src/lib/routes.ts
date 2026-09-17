/**
 * Карта путей сайта без префикса локали.
 *
 * Держим её в одном месте: навигация, крошки, sitemap и внутренние ссылки
 * берут пути отсюда, поэтому переименование раздела не превращается в поиск
 * строк по всему проекту.
 */
export const routes = {
  home: "",
  services: "/uslugi",
  prices: "/ceny",
  portfolio: "/portfolio",
  blog: "/blog",
  map: "/karta",
  contacts: "/kontakty",
} as const;

export type RouteKey = keyof typeof routes;

/** Порядок пунктов меню. */
export const navOrder: RouteKey[] = [
  "home",
  "services",
  "prices",
  "portfolio",
  "blog",
  "map",
  "contacts",
];

export function servicePath(slug: string): string {
  return `${routes.services}/${slug}`;
}

export function postPath(slug: string): string {
  return `${routes.blog}/${slug}`;
}
