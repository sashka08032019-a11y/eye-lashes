import Link from "next/link";

import CurrentYear from "@/components/CurrentYear";
import LogoCircularCta from "@/components/Web Development Studio/LogoCircularCta";
import type { Dictionary } from "@/content/dictionary";
import { localizedPath, type Locale } from "@/lib/i18n";
import { mapLinks, messengerLinks, site } from "@/lib/site";
import { navOrder, routes, type RouteKey } from "@/lib/routes";

type Props = {
  locale: Locale;
  dict: Dictionary;
};

/**
 * Футер дублирует NAP-данные (название, адрес, телефон) и внутренние ссылки.
 * Совпадение этих данных с карточками в Яндекс.Бизнесе и 2ГИС — базовое
 * требование локального SEO, поэтому значения берутся только из lib/site.ts.
 */
export default function Footer({ locale, dict }: Props) {
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

  return (
    <footer className="mt-16 border-t border-blush-100 bg-cream-100">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="text-base font-semibold text-blush-700">{site.name}</p>
          <p className="mt-2 text-sm text-muted">{dict.footer.about}</p>
        </div>

        <nav aria-label={dict.footer.navigation}>
          <p className="text-sm font-semibold text-ink">{dict.footer.navigation}</p>
          {/*
            Ссылки занимают строку целиком (w-full): на телефоне палец должен
            попадать в пункт, а не в текст шириной в слово. py-1.5 поднимает
            высоту строки до 32px — минимум по WCAG 2.2 — поэтому зазор между
            пунктами задаётся padding'ом, а не space-y.
          */}
          <ul className="mt-2 space-y-0.5 text-sm">
            {navOrder.map((key) => (
              <li key={key}>
                <Link
                  href={localizedPath(locale, routes[key])}
                  className="inline-block w-full py-1.5 text-muted transition-colors hover:text-blush-700"
                >
                  {labels[key]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="text-sm font-semibold text-ink">{dict.footer.contacts}</p>
          <address className="mt-3 space-y-1.5 text-sm not-italic text-muted">
            <p>
              {dict.pages.contacts.addressLabel}: {site.address.street}, {site.address.city},{" "}
              {site.address.region}
            </p>
            <p>
              {dict.pages.contacts.phoneLabel}:{" "}
              <a
                href={links.phone}
                className="inline-block py-1 transition-colors hover:text-blush-700"
              >
                {site.phone.display}
              </a>
            </p>
            <p>
              {dict.pages.contacts.hoursLabel}: {site.openingHours.display[locale]}
            </p>
          </address>

          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <li>
              <a
                href={links.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block py-1.5 text-muted transition-colors hover:text-blush-700"
              >
                WhatsApp
              </a>
            </li>
            <li>
              <a
                href={links.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block py-1.5 text-muted transition-colors hover:text-blush-700"
              >
                Telegram
              </a>
            </li>
            <li>
              <a
                href={links.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block py-1.5 text-muted transition-colors hover:text-blush-700"
              >
                Instagram
              </a>
            </li>
            <li>
              <a
                href={mapLinks.yandex}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block py-1.5 text-muted transition-colors hover:text-blush-700"
              >
                {dict.common.openYandex}
              </a>
            </li>
            <li>
              <a
                href={mapLinks.twogis}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block py-1.5 text-muted transition-colors hover:text-blush-700"
              >
                {dict.common.open2gis}
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/*
        Нижняя полоса: копирайт слева, круглая CTA веб-студии справа.
        На телефоне блоки встают в колонку и центрируются — круглая ссылка
        остаётся крупной мишенью для пальца (размер задаётся в px, не в %).
      */}
      <div className="border-t border-blush-100 px-4 py-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1 text-center text-xs text-muted sm:text-left">
            <p>
              © <CurrentYear /> {site.name}. {dict.footer.rights}
            </p>
            <p>{dict.footer.disclaimer}</p>
          </div>

          {/*
            size — диаметр в px, fontSize — размер текста в единицах viewBox
            (200×200): на экране текст получается fontSize * size / 200, то есть
            при size=160 и fontSize=17 — около 13.6px. Меньше 15 единиц брать
            нельзя: дуги перестают читаться.
          */}
          <LogoCircularCta
            topText={dict.footer.ctaTop}
            bottomText={dict.footer.ctaBottom}
            size={160}
            fontSize={17}
            className="shrink-0"
          />
        </div>
      </div>
    </footer>
  );
}
