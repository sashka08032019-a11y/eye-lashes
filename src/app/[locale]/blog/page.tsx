import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import Breadcrumbs from "@/components/Breadcrumbs";
import Section from "@/components/Section";
import { getDictionary } from "@/content/dictionary";
import { posts } from "@/content/posts";
import { isLocale, localizedPath } from "@/lib/i18n";
import { postPath, routes } from "@/lib/routes";
import { buildMetadata } from "@/lib/seo";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const page = getDictionary(locale).pages.blog;

  return buildMetadata({
    locale,
    path: routes.blog,
    title: page.metaTitle,
    description: page.metaDescription,
    keywords: page.metaKeywords,
  });
}

/**
 * Блог — рабочий инструмент SEO: каждая статья закрывает свой набор
 * информационных запросов и ссылается на страницы услуг.
 * TODO: заменить черновики на полные статьи (см. src/content/posts.ts).
 */
export default async function BlogPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const page = dict.pages.blog;
  const sorted = [...posts].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <Breadcrumbs locale={locale} items={[{ name: dict.nav.blog }]} />

      <Section as="h1" title={page.title} lead={page.lead}>
        <ul className="grid gap-5 sm:grid-cols-2">
          {sorted.map((post) => (
            <li key={post.slug}>
              <article className="flex h-full flex-col rounded-2xl border border-blush-100 bg-white p-6 shadow-sm">
                <time
                  dateTime={post.date}
                  className="text-xs uppercase tracking-wider text-blush-400"
                >
                  {new Date(post.date).toLocaleDateString(locale === "ru" ? "ru-RU" : "kk-KZ")}
                  {post.draft ? ` · ${dict.common.draft}` : ""}
                </time>

                <h2 className="mt-2 text-lg font-semibold text-ink">
                  <Link
                    href={localizedPath(locale, postPath(post.slug))}
                    className="transition-colors hover:text-blush-700"
                  >
                    {post.title[locale]}
                  </Link>
                </h2>

                <p className="mt-2 flex-1 text-sm text-muted">{post.description[locale]}</p>

                <Link
                  href={localizedPath(locale, postPath(post.slug))}
                  className="mt-4 inline-block py-1.5 text-sm font-medium text-blush-600 transition-colors hover:text-blush-700"
                >
                  {dict.common.readMore} →
                </Link>
              </article>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
