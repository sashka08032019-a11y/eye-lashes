import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import Breadcrumbs from "@/components/Breadcrumbs";
import CtaButtons from "@/components/CtaButtons";
import Section from "@/components/Section";
import { getDictionary } from "@/content/dictionary";
import { isLocale, localizedPath } from "@/lib/i18n";
import { routes } from "@/lib/routes";
import { buildMetadata } from "@/lib/seo";
import { mapLinks, messengerLinks, site } from "@/lib/site";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const page = getDictionary(locale).pages.contacts;

  return buildMetadata({
    locale,
    path: routes.contacts,
    title: page.metaTitle,
    description: page.metaDescription,
    keywords: page.metaKeywords,
  });
}

/**
 * Контакты — опорная страница для локального SEO. Название, адрес и телефон
 * берутся из lib/site.ts и совпадают с JSON-LD, футером и картами.
 * TODO: после создания профилей в Яндекс.Бизнесе и 2ГИС сверить NAP
 * символ в символ — расхождения ломают локальную выдачу.
 */
export default async function ContactsPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const page = dict.pages.contacts;
  const links = messengerLinks(locale);

  return (
    <>
      <Breadcrumbs locale={locale} items={[{ name: dict.nav.contacts }]} />

      <Section as="h1" title={page.title} lead={page.lead}>
        <dl className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-blush-100 bg-white p-5">
            <dt className="text-sm text-muted">{page.addressLabel}</dt>
            <dd className="mt-1 font-medium text-ink">
              {site.address.street}, {site.address.city}, {site.address.region}
            </dd>
          </div>

          <div className="rounded-2xl border border-blush-100 bg-white p-5">
            <dt className="text-sm text-muted">{page.phoneLabel}</dt>
            <dd className="mt-1 font-medium text-ink">
              <a
                href={links.phone}
                className="inline-block py-1 transition-colors hover:text-blush-700"
              >
                {site.phone.display}
              </a>
            </dd>
          </div>

          <div className="rounded-2xl border border-blush-100 bg-white p-5">
            <dt className="text-sm text-muted">{page.hoursLabel}</dt>
            <dd className="mt-1 font-medium text-ink">{site.openingHours.display[locale]}</dd>
          </div>
        </dl>

        <p className="mt-4 text-xs text-muted">{dict.common.placeholder}</p>

        <h2 className="mt-10 text-xl font-semibold text-ink">{page.messengersLabel}</h2>
        <ul className="mt-4 space-y-2 text-sm">
          <li>
            <a
              href={links.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block py-1.5 text-blush-600 transition-colors hover:text-blush-700"
            >
              WhatsApp — {site.phone.display}
            </a>
          </li>
          <li>
            <a
              href={links.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block py-1.5 text-blush-600 transition-colors hover:text-blush-700"
            >
              Telegram — @{site.telegram}
            </a>
          </li>
          <li>
            <a
              href={links.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block py-1.5 text-blush-600 transition-colors hover:text-blush-700"
            >
              Instagram — @{site.instagram}
            </a>
          </li>
          <li>
            <a
              href={links.email}
              className="inline-block py-1.5 text-blush-600 transition-colors hover:text-blush-700"
            >
              {site.email}
            </a>
          </li>
        </ul>

        <div className="mt-8">
          <CtaButtons locale={locale} dict={dict} />
        </div>

        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <Link
            href={localizedPath(locale, routes.map)}
            className="rounded-full border border-blush-300 px-5 py-2.5 font-medium text-blush-700 transition-colors hover:bg-blush-50"
          >
            {dict.nav.map}
          </Link>
          <a
            href={mapLinks.yandex}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-blush-300 px-5 py-2.5 font-medium text-blush-700 transition-colors hover:bg-blush-50"
          >
            {dict.common.openYandex}
          </a>
          <a
            href={mapLinks.twogis}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-blush-300 px-5 py-2.5 font-medium text-blush-700 transition-colors hover:bg-blush-50"
          >
            {dict.common.open2gis}
          </a>
        </div>
      </Section>
    </>
  );
}
