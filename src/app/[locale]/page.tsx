import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import Ballpit from "@/components/Ballpit";
import CtaButtons from "@/components/CtaButtons";
import MetallicLogo from "@/components/MetallicLogo";
import ReviewForm from "@/components/ReviewForm";
import ReviewsList from "@/components/ReviewsList";
import Section from "@/components/Section";
import MagicBento from "@/components/MagicBento";
import { getDictionary } from "@/content/dictionary";
import { posts } from "@/content/posts";
import { services } from "@/content/services";
import { serviceBentoCards } from "@/lib/bento";
import { isLocale, localizedPath } from "@/lib/i18n";
import { getPublishedReviews } from "@/lib/reviews";
import { postPath, routes } from "@/lib/routes";
import { buildMetadata } from "@/lib/seo";
import { mapLinks, site } from "@/lib/site";

type PageProps = { params: Promise<{ locale: string }> };

/**
 * Пропорции Logo.png (3508×2480). Нужны, чтобы зарезервировать место
 * под логотип до загрузки файла — иначе hero «прыгает» и портится CLS.
 * После загрузки компонент берёт реальные пропорции из самого файла.
 */
const LOGO_ASPECT = 3508 / 2480;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const dict = getDictionary(locale);
  const page = dict.pages.home;

  return buildMetadata({
    locale,
    path: routes.home,
    title: page.metaTitle,
    description: page.metaDescription,
    keywords: page.metaKeywords,
  });
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const page = dict.pages.home;
  const featured = services.slice(0, 6);
  const latestPosts = posts.slice(0, 3);
  const reviews = getPublishedReviews();

  return (
    <>
      {/*
        Первый экран. Фон — аналог Ballpit с reactbits.dev (см. components/Ballpit.tsx),
        текст остаётся обычной серверной разметкой: h1, абзацы и CTA есть в HTML
        сразу, без ожидания JS — это важно для индексации.
      */}
      <section className="relative isolate overflow-hidden border-b border-blush-100">
        {/* Статичная подложка: видна до гидратации и при отключённом JS. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20 bg-linear-to-br from-blush-100 via-cream-100 to-blush-200"
        />

        <div aria-hidden="true" className="absolute inset-0 -z-10">
          <Ballpit
            count={56}
            minRadius={0.03}
            maxRadius={0.08}
            colors={["#ebb3be", "#de8b9b", "#f4d3d9", "#fae9ec", "#c96c80", "#efe5dc", "#ffffff"]}
          />
        </div>

        {/* Затемняющая вуаль: держит контраст текста поверх шариков. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-linear-to-r from-cream-50/95 via-cream-50/70 to-cream-50/20"
        />

        <div className="mx-auto flex min-h-[min(78vh,640px)] max-w-6xl flex-col justify-center px-4 py-14 sm:py-20">
          {/*
            Логотип с эффектом «жидкого металла» (аналог MetallicPaint
            с reactbits.dev). Ширину задаём, высоту выведет aspect-ratio
            из пропорций файла — иначе шейдер обрежет края.
          */}
          <MetallicLogo
            label={`${site.name} — салон наращивания ресниц`}
            initialAspect={LOGO_ASPECT}
            className="mb-6 w-[min(400px,72%)] select-none"
          />

          <p className="text-sm uppercase tracking-[0.2em] text-blush-500">
            {site.address.city} · {site.address.region}
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-ink sm:text-5xl">
            {page.heroTitle}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-blush-700">{page.heroSubtitle}</p>
          <p className="mt-4 max-w-3xl text-ink/80">{page.heroText}</p>

          <div className="mt-7">
            <CtaButtons locale={locale} dict={dict} />
          </div>
        </div>
      </section>

      <Section id="uslugi" title={page.servicesTitle} lead={page.servicesText}>
        {/*
          Сетка с эффектами Magic Bento. Карточки — настоящие ссылки на
          страницы услуг, поэтому внутренняя перелинковка не страдает.
        */}
        <MagicBento
          cards={serviceBentoCards(locale, dict, featured)}
          ariaLabel={page.servicesTitle}
        />

        <Link
          href={localizedPath(locale, routes.services)}
          className="mt-6 inline-block py-2 text-sm font-medium text-blush-600 transition-colors hover:text-blush-700"
        >
          {dict.common.allServices} →
        </Link>
      </Section>

      <Section title={page.advantagesTitle}>
        <ul className="grid gap-4 sm:grid-cols-2">
          {page.advantages.map((item) => (
            <li
              key={item}
              className="rounded-2xl border border-blush-100 bg-cream-100 p-5 text-sm text-ink"
            >
              {item}
            </li>
          ))}
        </ul>
      </Section>

      <Section id="otzyvy" title={page.reviewsTitle} lead={page.reviewsText}>
        <ReviewsList locale={locale} dict={dict} reviews={reviews} />
        <div className="mt-8">
          <ReviewForm locale={locale} dict={dict} />
        </div>
      </Section>

      <Section title={page.blogTitle} lead={page.blogText}>
        <ul className="grid gap-5 sm:grid-cols-3">
          {latestPosts.map((post) => (
            <li key={post.slug} className="rounded-2xl border border-blush-100 bg-white p-5">
              <h3 className="text-base font-semibold text-ink">
                <Link
                  href={localizedPath(locale, postPath(post.slug))}
                  className="inline-block py-1 transition-colors hover:text-blush-700"
                >
                  {post.title[locale]}
                </Link>
              </h3>
              <p className="mt-2 text-sm text-muted">{post.description[locale]}</p>
            </li>
          ))}
        </ul>

        <Link
          href={localizedPath(locale, routes.blog)}
          className="mt-6 inline-block py-2 text-sm font-medium text-blush-600 transition-colors hover:text-blush-700"
        >
          {dict.nav.blog} →
        </Link>
      </Section>

      <Section title={page.mapTitle} lead={page.mapText}>
        <div className="flex flex-wrap gap-3">
          <a
            href={mapLinks.yandex}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-blush-300 px-5 py-2.5 text-sm font-medium text-blush-700 transition-colors hover:bg-blush-50"
          >
            {dict.common.openYandex}
          </a>
          <a
            href={mapLinks.twogis}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-blush-300 px-5 py-2.5 text-sm font-medium text-blush-700 transition-colors hover:bg-blush-50"
          >
            {dict.common.open2gis}
          </a>
          <Link
            href={localizedPath(locale, routes.map)}
            className="rounded-full border border-blush-300 px-5 py-2.5 text-sm font-medium text-blush-700 transition-colors hover:bg-blush-50"
          >
            {dict.nav.map}
          </Link>
        </div>
      </Section>

      <Section className="pb-16">
        <div className="rounded-3xl bg-blush-100 p-8 sm:p-10">
          <h2 className="text-2xl font-semibold text-ink">{page.ctaTitle}</h2>
          <p className="mt-2 max-w-2xl text-muted">{page.ctaText}</p>
          <div className="mt-6">
            <CtaButtons locale={locale} dict={dict} />
          </div>
        </div>
      </Section>
    </>
  );
}
