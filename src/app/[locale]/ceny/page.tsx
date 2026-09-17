import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import Breadcrumbs from "@/components/Breadcrumbs";
import CtaButtons from "@/components/CtaButtons";
import Section from "@/components/Section";
import { getDictionary } from "@/content/dictionary";
import { categoryOrder, categoryTitles, services } from "@/content/services";
import { isLocale, localizedPath } from "@/lib/i18n";
import { routes, servicePath } from "@/lib/routes";
import { buildMetadata } from "@/lib/seo";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const page = getDictionary(locale).pages.prices;

  return buildMetadata({
    locale,
    path: routes.prices,
    title: page.metaTitle,
    description: page.metaDescription,
    keywords: page.metaKeywords,
  });
}

/** Отдельная страница прайса — самостоятельная точка входа по запросам «сколько стоит наращивание ресниц». */
export default async function PricesPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const page = dict.pages.prices;

  return (
    <>
      <Breadcrumbs locale={locale} items={[{ name: dict.nav.prices }]} />

      <Section as="h1" title={page.title} lead={page.lead}>
        {categoryOrder.map((category) => {
          const items = services.filter((service) => service.category === category);
          if (items.length === 0) return null;

          return (
            <table key={category} className="mb-10 w-full border-collapse text-sm">
              <caption className="mb-3 text-left text-lg font-semibold text-ink">
                {categoryTitles[category][locale]}
              </caption>
              <thead>
                <tr className="border-b border-blush-200 text-left text-xs uppercase tracking-wide text-muted">
                  <th scope="col" className="py-2 pr-4 font-medium">
                    {dict.common.service}
                  </th>
                  {/*
                    На мобильном колонка «Длительность» скрыта: на 375px она
                    забирала 114px из 343, и названия услуг сжимались до 182px.
                    Длительность всё равно есть в карточках услуг.
                  */}
                  <th scope="col" className="hidden py-2 pr-4 font-medium sm:table-cell">
                    {dict.common.duration}
                  </th>
                  <th scope="col" className="py-2 text-right font-medium">
                    {dict.common.price}
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((service) => (
                  <tr key={service.slug} className="border-b border-blush-100">
                    <th scope="row" className="py-3 pr-4 text-left font-normal text-ink">
                      {/*
                        Ссылка растянута на всю ячейку (w-full) и вместе с py-3
                        закрывает высоту строки целиком. Отрицательный -my-3
                        возвращает строке прежнюю высоту: палец попадает
                        в 44px-зону, а таблица не разъезжается.
                      */}
                      <Link
                        href={localizedPath(locale, servicePath(service.slug))}
                        className="-my-3 inline-block w-full py-3 transition-colors hover:text-blush-700"
                      >
                        {service.name[locale]}
                      </Link>
                    </th>
                    <td className="hidden py-3 pr-4 text-muted sm:table-cell">
                      {service.duration[locale]}
                    </td>
                    <td className="py-3 text-right font-medium text-blush-700">
                      {service.price.toLocaleString("ru-RU")} {dict.common.currency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          );
        })}

        <p className="text-xs text-muted">{dict.services.minPriceNote}</p>

        <div className="mt-6">
          <CtaButtons locale={locale} dict={dict} />
        </div>
      </Section>
    </>
  );
}
