import type { Metadata } from "next";
import { notFound } from "next/navigation";

import Breadcrumbs from "@/components/Breadcrumbs";
import CtaButtons from "@/components/CtaButtons";
import JsonLd from "@/components/JsonLd";
import Section from "@/components/Section";
import { getDictionary } from "@/content/dictionary";
import { getService, services } from "@/content/services";
import { isLocale, locales } from "@/lib/i18n";
import { serviceJsonLd } from "@/lib/jsonld";
import { routes, servicePath } from "@/lib/routes";
import { buildMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

type PageProps = { params: Promise<{ locale: string; slug: string }> };

/**
 * Страницы отдельных услуг. На старте на них ведут ссылки из карточек услуг
 * и из sitemap — это дополнительные точки входа по длинному хвосту
 * («наращивание ресниц мега-объём Есик» и подобным запросам).
 */
export function generateStaticParams() {
  return locales.flatMap((locale) =>
    services.flatMap((service) => [{ locale, slug: service.slug }]),
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};

  const service = getService(slug);
  if (!service) return {};

  const name = service.name[locale];
  const price = service.price.toLocaleString("ru-RU");
  const duration = service.duration[locale];

  return buildMetadata({
    locale,
    path: servicePath(service.slug),
    // Заголовки собираем по локали: в казахской версии не должно быть
    // русских слов, иначе сниппет выглядит «смешанным».
    title:
      locale === "ru"
        ? `${name} в Есике — цена от ${price} ₸, ${site.name}`
        : `${name} — Есік, бағасы ${price} ₸-ден, ${site.name}`,
    description:
      locale === "ru"
        ? `${name} в салоне ${site.name}, Есик: цена от ${price} ₸, длительность ${duration}. Запись в WhatsApp.`
        : `${name} — ${site.name} салоны, Есік: бағасы ${price} ₸-ден, ұзақтығы ${duration}. WhatsApp арқылы жазылу.`,
    keywords: [
      name.toLowerCase(),
      `${name.toLowerCase()} Есик`,
      `${name.toLowerCase()} цена`,
      "наращивание ресниц Алматинская область",
    ],
  });
}

export default async function ServicePage({ params }: PageProps) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const service = getService(slug);
  if (!service) notFound();

  const dict = getDictionary(locale);

  return (
    <>
      <Breadcrumbs
        locale={locale}
        items={[
          { name: dict.nav.services, path: routes.services },
          { name: service.name[locale] },
        ]}
      />

      <Section as="h1" title={service.name[locale]}>
        <p className="max-w-3xl text-muted">{service.description[locale]}</p>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-blush-100 bg-white p-5">
            <dt className="text-sm text-muted">{dict.common.price}</dt>
            <dd className="mt-1 text-xl font-semibold text-blush-700">
              {dict.common.priceFrom} {service.price.toLocaleString("ru-RU")} {dict.common.currency}
            </dd>
          </div>
          <div className="rounded-2xl border border-blush-100 bg-white p-5">
            <dt className="text-sm text-muted">{dict.common.duration}</dt>
            <dd className="mt-1 text-xl font-semibold text-ink">{service.duration[locale]}</dd>
          </div>
        </dl>

        <p className="mt-6 text-xs text-muted">{dict.services.minPriceNote}</p>

        <div className="mt-6">
          <CtaButtons locale={locale} dict={dict} />
        </div>
      </Section>

      <JsonLd
        data={serviceJsonLd(locale, {
          name: service.name[locale],
          description: service.description[locale],
          slug: service.slug,
          price: service.price,
        })}
      />
    </>
  );
}
