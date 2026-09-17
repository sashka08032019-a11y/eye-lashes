"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { localizedPath, localeLabels, locales, type Locale } from "@/lib/i18n";
import { navOrder, routes, type RouteKey } from "@/lib/routes";
import { messengerLinks, site } from "@/lib/site";
import type { Dictionary } from "@/content/dictionary";

type Props = {
  locale: Locale;
  dict: Dictionary;
};

/** Навигация и переключатель языка. Компонент пререндерится на сервере, поэтому HTML с меню попадает в индекс. */
export default function Header({ locale, dict }: Props) {
  const pathname = usePathname();
  const wa = messengerLinks(locale).whatsapp;

  const labels: Record<RouteKey, string> = {
    home: dict.nav.home,
    services: dict.nav.services,
    prices: dict.nav.prices,
    portfolio: dict.nav.portfolio,
    blog: dict.nav.blog,
    map: dict.nav.map,
    contacts: dict.nav.contacts,
  };

  /** Текущий путь без префикса локали — чтобы переключатель вёл на ту же страницу. */
  const pathWithoutLocale = pathname.replace(/^\/(ru|kk)(?=\/|$)/, "");

  return (
    <header className="sticky top-0 z-50 border-b border-blush-100 bg-cream-50/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-1.5 sm:gap-y-3 sm:py-3">
        <Link
          href={localizedPath(locale, routes.home)}
          className="inline-block py-1 text-lg font-semibold tracking-tight text-blush-700"
          aria-label={site.name}
        >
          {site.name}
        </Link>

        <nav aria-label={dict.footer.navigation} className="order-last w-full sm:order-none sm:w-auto">
          {/*
            На мобильном — одна строка с горизонтальной прокруткой: семь пунктов
            иначе переносятся на две строки, и шапка съедает 14% экрана вместо 11%.
            Прокрутка выведена за паддинг контейнера (-mx-4/px-4), чтобы пункты
            уходили под край экрана, а не обрезались на отступе.
          */}
          <ul className="mobile-nav-scroll -mx-4 flex items-center gap-x-4 overflow-x-auto px-4 text-sm sm:mx-0 sm:flex-wrap sm:gap-y-2 sm:overflow-x-visible sm:px-0">
            {navOrder.map((key) => {
              const path = localizedPath(locale, routes[key]);
              const isActive =
                key === "home"
                  ? pathWithoutLocale === ""
                  : pathWithoutLocale.startsWith(routes[key]);

              return (
                <li key={key}>
                  {/*
                    inline-block + вертикальные паддинги: у строчного элемента
                    паддинг не увеличивает высоту строки, а тап-таргет в 19px
                    на телефоне — промах.
                  */}
                  <Link
                    href={path}
                    aria-current={isActive ? "page" : undefined}
                    className={`inline-block whitespace-nowrap py-2.5 ${
                      isActive
                        ? "font-medium text-blush-700 underline decoration-blush-300 decoration-2 underline-offset-4"
                        : "text-muted transition-colors hover:text-blush-700"
                    }`}
                  >
                    {labels[key]}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <ul className="flex items-center gap-1 text-sm" aria-label="Язык сайта">
            {locales.map((code) => (
              <li key={code}>
                <Link
                  href={`/${code}${pathWithoutLocale}`}
                  hrefLang={code}
                  aria-current={code === locale ? "true" : undefined}
                  className={
                    code === locale
                      ? "inline-block rounded-full bg-blush-100 px-3 py-2 font-medium text-blush-700"
                      : "inline-block rounded-full px-3 py-2 text-muted transition-colors hover:bg-blush-50 hover:text-blush-700"
                  }
                >
                  {localeLabels[code]}
                </Link>
              </li>
            ))}
          </ul>

          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden rounded-full bg-blush-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blush-700 sm:inline-block"
          >
            {dict.common.whatsapp}
          </a>
        </div>
      </div>
    </header>
  );
}
