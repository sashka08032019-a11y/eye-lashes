import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import Breadcrumbs from "@/components/Breadcrumbs";
import CtaButtons from "@/components/CtaButtons";
import Section from "@/components/Section";
import { getDictionary } from "@/content/dictionary";
import { services } from "@/content/services";
import { isLocale, localizedPath } from "@/lib/i18n";
import { routes, servicePath } from "@/lib/routes";
import { buildMetadata } from "@/lib/seo";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const page = getDictionary(locale).pages.portfolio;

  return buildMetadata({
    locale,
    path: routes.portfolio,
    title: page.metaTitle,
    description: page.metaDescription,
    keywords: page.metaKeywords,
  });
}

/**
 * TODO: заменить заглушки на реальные фотографии работ.
 * Когда появятся снимки — добавить их в /public/portfolio и вывести
 * через next/image с alt вида «наращивание ресниц 3D, Есик».
 */
export default async function PortfolioPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const page = dict.pages.portfolio;
  const featured = services.filter((service) => service.category === "extensions");

  return (
    <>
      <Breadcrumbs locale={locale} items={[{ name: dict.nav.portfolio }]} />

      <Section as="h1" title={page.title} lead={page.lead}>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((service) => (
            <li
              key={service.slug}
              className="flex aspect-4/5 flex-col justify-end rounded-2xl border border-dashed border-blush-200 bg-cream-100 p-5"
            >
              <p className="text-xs uppercase tracking-wider text-blush-400">
                {dict.common.placeholder}
              </p>
              <p className="mt-2 font-medium text-ink">{service.name[locale]}</p>
              <Link
                href={localizedPath(locale, servicePath(service.slug))}
                className="mt-2 inline-block py-1.5 text-sm text-blush-600 transition-colors hover:text-blush-700"
              >
                {dict.common.details} →
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-8">
          <CtaButtons locale={locale} dict={dict} />
        </div>
      </Section>
    </>
  );
}
