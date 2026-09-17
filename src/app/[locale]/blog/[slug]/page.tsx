import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import Breadcrumbs from "@/components/Breadcrumbs";
import CtaButtons from "@/components/CtaButtons";
import JsonLd from "@/components/JsonLd";
import Section from "@/components/Section";
import { getDictionary } from "@/content/dictionary";
import { getPost, posts } from "@/content/posts";
import { services } from "@/content/services";
import { isLocale, locales, localizedPath } from "@/lib/i18n";
import { articleJsonLd } from "@/lib/jsonld";
import { postPath, routes, servicePath } from "@/lib/routes";
import { buildMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

type PageProps = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return locales.flatMap((locale) => posts.map((post) => ({ locale, slug: post.slug })));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};

  const post = getPost(slug);
  if (!post) return {};

  return buildMetadata({
    locale,
    path: postPath(post.slug),
    title: post.title[locale],
    description: post.description[locale],
    keywords: [
      post.title[locale].toLowerCase(),
      "наращивание ресниц Есик",
      "уход за наращёнными ресницами",
    ],
    article: { publishedTime: post.date, modifiedTime: post.updated, section: "Блог" },
    // Черновики не отправляем в индекс, чтобы не получить «тонкие» страницы.
    noIndex: post.draft,
  });
}

export default async function PostPage({ params }: PageProps) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const post = getPost(slug);
  if (!post) notFound();

  const dict = getDictionary(locale);
  const related = services.slice(0, 3);

  return (
    <>
      <Breadcrumbs
        locale={locale}
        items={[{ name: dict.nav.blog, path: routes.blog }, { name: post.title[locale] }]}
      />

      <Section as="h1" title={post.title[locale]}>
        <p className="text-xs uppercase tracking-wider text-blush-400">
          <time dateTime={post.date}>
            {new Date(post.date).toLocaleDateString(locale === "ru" ? "ru-RU" : "kk-KZ")}
          </time>
          {post.draft ? ` · ${dict.common.draft}` : ""}
        </p>

        <div className="mt-6 max-w-3xl space-y-4 text-muted">
          {post.body[locale].map((paragraph) => (
            <p key={paragraph.slice(0, 32)}>{paragraph}</p>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-blush-100 bg-cream-100 p-6">
          <h2 className="text-lg font-semibold text-ink">{dict.nav.services}</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {related.map((service) => (
              <li key={service.slug}>
                <Link
                  href={localizedPath(locale, servicePath(service.slug))}
                  className="inline-block py-1.5 text-blush-600 transition-colors hover:text-blush-700"
                >
                  {service.name[locale]} — {dict.common.priceFrom}{" "}
                  {service.price.toLocaleString("ru-RU")} {dict.common.currency}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-5">
            <CtaButtons locale={locale} dict={dict} />
          </div>
        </div>

        <p className="mt-8 text-xs text-muted">
          {site.name} · {site.address.city}, {site.address.region}
        </p>
      </Section>

      <JsonLd
        data={articleJsonLd(locale, {
          title: post.title[locale],
          description: post.description[locale],
          slug: post.slug,
          date: post.date,
          updated: post.updated,
        })}
      />
    </>
  );
}
