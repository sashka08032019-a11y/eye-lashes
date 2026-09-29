import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import Breadcrumbs from "@/components/Breadcrumbs";
import CtaButtons from "@/components/CtaButtons";
import Section from "@/components/Section";
import TwogisMapLazy from "@/components/TwogisMapLazy";
import { getDictionary } from "@/content/dictionary";
import { isLocale, localizedPath } from "@/lib/i18n";
import { routes } from "@/lib/routes";
import { buildMetadata } from "@/lib/seo";
import { addressLine, mapEmbeds, mapLinks, site } from "@/lib/site";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const page = getDictionary(locale).pages.map;

  return buildMetadata({
    locale,
    path: routes.map,
    title: page.metaTitle,
    description: page.metaDescription,
    keywords: page.metaKeywords,
  });
}

/**
 * Карта с одним виджетом 2ГИС — других картографических сервисов на сайте нет.
 * Виджет подключается динамически, только в браузере (см. TwogisMapLazy),
 * и не мешает основному контенту страницы — адрес и часы работы присутствуют
 * в HTML обычным текстом, поэтому индексируются даже без загрузки iframe.
 */
export default async function MapPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const page = dict.pages.map;

  const rows = [
    {
      label: page.addressLabel,
      value: `${addressLine(locale)}, ${site.address.postalCode}`,
    },
    { label: page.hoursLabel, value: site.openingHours.display[locale] },
    { label: page.phoneLabel, value: site.phone.display },
  ];

  return (
    <>
      <Breadcrumbs locale={locale} items={[{ name: dict.nav.map }]} />

      <Section as="h1" title={page.title} lead={page.lead}>
        <dl className="grid gap-4 sm:grid-cols-3">
          {rows.map((row) => (
            <div key={row.label} className="rounded-2xl border border-brand-100 bg-white p-5">
              <dt className="text-sm text-muted">{row.label}</dt>
              <dd className="mt-1 font-medium text-ink">{row.value}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-4 text-xs text-muted">{dict.common.placeholder}</p>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={mapLinks.twogis}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-clay-400 px-5 py-2.5 text-sm font-medium text-brand-700 transition-colors hover:bg-clay-400/20"
          >
            {dict.common.open2gis}
          </a>
          <Link
            href={localizedPath(locale, routes.contacts)}
            className="rounded-full border border-clay-400 px-5 py-2.5 text-sm font-medium text-brand-700 transition-colors hover:bg-clay-400/20"
          >
            {dict.nav.contacts}
          </Link>
        </div>
      </Section>

      <Section>
        <TwogisMapLazy
          src={mapEmbeds.twogis}
          title={`${site.name} — ${dict.nav.map} (2ГИС)`}
          loadingLabel={page.loadingLabel}
        />

        <div className="mt-8">
          <CtaButtons locale={locale} dict={dict} />
        </div>
      </Section>
    </>
  );
}
