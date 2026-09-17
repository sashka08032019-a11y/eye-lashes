import type { Metadata } from "next";
import { notFound } from "next/navigation";

import Breadcrumbs from "@/components/Breadcrumbs";
import CtaButtons from "@/components/CtaButtons";
import MagicBento from "@/components/MagicBento";
import Section from "@/components/Section";
import { getDictionary } from "@/content/dictionary";
import { categoryOrder, services } from "@/content/services";
import { serviceBentoCards } from "@/lib/bento";
import { isLocale } from "@/lib/i18n";
import { routes } from "@/lib/routes";
import { buildMetadata } from "@/lib/seo";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const page = getDictionary(locale).pages.services;

  return buildMetadata({
    locale,
    path: routes.services,
    title: page.metaTitle,
    description: page.metaDescription,
    keywords: page.metaKeywords,
  });
}

/**
 * Список услуг — одна bento-сетка на все процедуры.
 *
 * Порядок карточек повторяет порядок категорий, а сама категория выведена
 * в подписи карточки. Так группировка сохраняется (наращивание → коррекция →
 * уход → снятие), но сетка остаётся цельной: крупная ячейка 2×2 в ней
 * работает только при одном общем списке.
 *
 * Заголовки карточек здесь — h2: выше по странице только h1, а промежуточных
 * разделов, которым нужен h2, больше нет.
 */
export default async function ServicesPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const page = dict.pages.services;

  const ordered = categoryOrder.flatMap((category) =>
    services.filter((service) => service.category === category),
  );

  return (
    <>
      <Breadcrumbs locale={locale} items={[{ name: dict.nav.services }]} />

      <Section as="h1" title={page.title} lead={page.lead}>
        <MagicBento
          cards={serviceBentoCards(locale, dict, ordered)}
          ariaLabel={page.title}
          headingLevel="h2"
        />

        <p className="mt-6 text-xs text-muted">{dict.services.minPriceNote}</p>

        <div className="mt-6">
          <CtaButtons locale={locale} dict={dict} />
        </div>
      </Section>
    </>
  );
}
