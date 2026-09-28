import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";

import "../globals.css";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import JsonLd from "@/components/JsonLd";
import { getDictionary } from "@/content/dictionary";
import { htmlLang, isLocale, locales } from "@/lib/i18n";
import { beautySalonJsonLd } from "@/lib/jsonld";
import { site } from "@/lib/site";

/**
 * Это корневой layout проекта: весь публичный контент живёт под /[locale],
 * поэтому <html lang> всегда соответствует языку страницы — важно и для
 * поисковых роботов, и для скринридеров.
 */

/** Отключает генерацию неизвестных локалей по запросу: /en/... сразу отдаёт 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7ddd0",
};

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — наращивание ресниц в Есике`,
    template: `%s | ${site.name}`,
  },
  applicationName: site.name,
  authors: [{ name: site.name }],
  creator: site.name,
  formatDetection: { telephone: true, address: true, email: true },
  icons: {
    // favicon.ico оставлен для старых браузеров, PNG — с явными размерами.
    icon: [
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon.ico" },
    ],
    apple: [{ url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" }],
  },
  openGraph: {
    type: "website",
    siteName: site.name,
    images: [
      {
        url: "/og-preview.png",
        width: 1200,
        height: 630,
        type: "image/png",
        alt: `${site.name} — салон красоты в Есике`,
      },
    ],
  },
  // Коды подтверждения подставляются автоматически, когда их заполнят в lib/site.ts.
  ...(site.verification.yandex || site.verification.google
    ? {
        verification: {
          ...(site.verification.yandex ? { yandex: site.verification.yandex } : {}),
          ...(site.verification.google ? { google: site.verification.google } : {}),
        },
      }
    : {}),
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const dict = getDictionary(locale);

  return (
    <html lang={htmlLang[locale]}>
      <body className="flex min-h-screen flex-col">
        {/*
          Служебная ссылка для клавиатуры и скринридеров: появляется при первом
          Tab, позволяет перескочить меню. Подпись — именно про переход
          к содержанию: «Главная» здесь сбивала с толку, потому что ведёт она
          не на главную, а на #main.
        */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-sm focus:text-white"
        >
          {dict.common.skipToContent}
        </a>

        <Header locale={locale} dict={dict} />

        <main id="main" className="flex-1">
          {children}
        </main>

        <Footer locale={locale} dict={dict} />

        <JsonLd data={beautySalonJsonLd(locale)} />
      </body>
    </html>
  );
}
