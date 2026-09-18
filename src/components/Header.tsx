"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { localizedPath, localeLabels, locales, type Locale } from "@/lib/i18n";
import { navOrder, routes, type RouteKey } from "@/lib/routes";
import { messengerLinks, site } from "@/lib/site";
import type { Dictionary } from "@/content/dictionary";

type Props = {
  locale: Locale;
  dict: Dictionary;
};

/** Элементы, которые участвуют в обходе по Tab внутри модального меню. */
const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Навигация и переключатель языка.
 *
 * На широком экране меню — обычная строка ссылок. На мобильном пункты меню
 * прячутся в модальное окно: семь разделов в шапке телефона либо не влезают,
 * либо отнимают треть экрана.
 *
 * Компонент "use client" только из-за состояния меню — при этом он всё равно
 * пререндерится на сервере, поэтому HTML с меню и ссылками попадает в индекс
 * без выполнения JS.
 */
export default function Header({ locale, dict }: Props) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const links = messengerLinks(locale);

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

  const isActive = (key: RouteKey) =>
    key === "home" ? pathWithoutLocale === "" : pathWithoutLocale.startsWith(routes[key]);

  /** Закрывает меню и возвращает фокус на кнопку-бургер: иначе он улетает в <body>. */
  const closeMenu = () => {
    setMenuOpen(false);
    triggerRef.current?.focus();
  };

  // Переход по ссылке может не размонтировать шапку — закрываем меню вручную.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    const { body } = document;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;
    // Прокрутка страницы под модалкой блокируется, но полоса прокрутки
    // исчезает — компенсируем паддингом, иначе контент «дёргается».
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;

    // Фокус сразу уходит внутрь окна — меню доступно с клавиатуры без лишних Tab.
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
        return;
      }

      // Простой фокус-ловушка: Tab не выходит за пределы панели.
      if (event.key !== "Tab" || !panelRef.current) return;

      const nodes = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((node) => node.offsetParent !== null);

      if (nodes.length === 0) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey && (active === first || !panelRef.current.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    /*
      Модалка существует только до 640px. Если при открытом меню расширить
      окно, панель станет невидимой (sm:hidden), но продолжила бы блокировать
      прокрутку страницы — поэтому закрываем её на смене брейкпоинта.
    */
    const desktop = window.matchMedia("(min-width: 640px)");
    const onBreakpoint = (event: MediaQueryListEvent) => {
      if (event.matches) setMenuOpen(false);
    };
    desktop.addEventListener("change", onBreakpoint);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", onBreakpoint);
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
    };
  }, [menuOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-blush-100 bg-cream-50/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-x-4 px-4 py-1.5 sm:gap-x-6 sm:py-3">
          <Link
            href={localizedPath(locale, routes.home)}
            className="inline-block py-1 text-lg font-semibold tracking-tight text-blush-700"
            aria-label={site.name}
          >
            {site.name}
          </Link>

          {/*
            Строка ссылок живёт в разметке и на мобильном (просто скрыта через
            display:none) — внутренние ссылки остаются в HTML для робота.
          */}
          <nav aria-label={dict.footer.navigation} className="hidden sm:block">
            <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              {navOrder.map((key) => {
                const active = isActive(key);

                return (
                  <li key={key}>
                    {/*
                      inline-block + вертикальные паддинги: у строчного элемента
                      паддинг не увеличивает высоту строки, а тап-таргет в 19px
                      на телефоне — промах.
                    */}
                    <Link
                      href={localizedPath(locale, routes[key])}
                      aria-current={active ? "page" : undefined}
                      className={`inline-block whitespace-nowrap py-2.5 ${
                        active
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

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
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
              href={links.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden rounded-full bg-blush-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blush-700 sm:inline-block"
            >
              {dict.common.whatsapp}
            </a>

            <button
              ref={triggerRef}
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={dict.nav.openMenu}
              className="-mr-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-blush-700 transition-colors hover:bg-blush-50 sm:hidden"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/*
        Модальное меню только для мобильного. Рендерится по состоянию, а не
        прячется через CSS: так в DOM нет второго набора тех же ссылок, и при
        этом поисковик всё равно видит навигацию — она есть в строке выше.
      */}
      {menuOpen && (
        <div id="mobile-menu" className="fixed inset-0 z-[60] sm:hidden">
          {/* Подложка: закрывает меню по тапу, для скринридеров скрыта — есть кнопка «Закрыть». */}
          <div
            aria-hidden="true"
            onClick={closeMenu}
            className="mobile-menu-backdrop absolute inset-0 bg-ink/40 backdrop-blur-sm"
          />

          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={dict.nav.menu}
            className="mobile-menu-panel absolute inset-y-0 right-0 flex w-[86%] max-w-sm flex-col overflow-y-auto border-l border-blush-100 bg-cream-50 px-5 pb-8 pt-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted">
                {dict.nav.menu}
              </p>

              <button
                ref={closeRef}
                type="button"
                onClick={closeMenu}
                aria-label={dict.nav.closeMenu}
                className="-mr-2 inline-flex h-11 w-11 items-center justify-center rounded-full text-muted transition-colors hover:bg-blush-50 hover:text-blush-700"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <nav aria-label={dict.footer.navigation} className="mt-3">
              {/* min-h-11 (44px) — минимальный комфортный тап-таргет по WCAG 2.5.8. */}
              <ul className="flex flex-col gap-1">
                {navOrder.map((key) => {
                  const active = isActive(key);

                  return (
                    <li key={key}>
                      <Link
                        href={localizedPath(locale, routes[key])}
                        onClick={closeMenu}
                        aria-current={active ? "page" : undefined}
                        className={`flex min-h-11 items-center rounded-2xl px-3 text-base ${
                          active
                            ? "bg-blush-100 font-medium text-blush-700"
                            : "text-ink transition-colors hover:bg-blush-50 hover:text-blush-700"
                        }`}
                      >
                        {labels[key]}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="mt-auto space-y-2 pt-8">
              <a
                href={links.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-12 items-center justify-center rounded-full bg-blush-600 px-5 text-sm font-medium text-white transition-colors hover:bg-blush-700"
              >
                {dict.common.whatsapp}
              </a>
              <a
                href={links.phone}
                className="flex min-h-12 items-center justify-center rounded-full border border-blush-200 px-5 text-sm font-medium text-blush-700 transition-colors hover:bg-blush-50"
              >
                {site.phone.display}
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
