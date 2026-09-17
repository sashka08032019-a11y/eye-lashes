import Link from "next/link";

import JsonLd from "@/components/JsonLd";
import { localizedPath, type Locale } from "@/lib/i18n";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { routes } from "@/lib/routes";

type Props = {
  locale: Locale;
  /** Последний элемент — текущая страница, без ссылки. */
  items: { name: string; path?: string }[];
};

export default function Breadcrumbs({ locale, items }: Props) {
  const withHome = [{ name: locale === "ru" ? "Главная" : "Басты бет", path: routes.home }, ...items];

  return (
    <>
      <nav aria-label="breadcrumb" className="mx-auto max-w-6xl px-4 pt-6">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
          {withHome.map((item, index) => {
            const isLast = index === withHome.length - 1;
            return (
              <li key={`${item.name}-${index}`} className="flex items-center gap-2">
                {item.path && !isLast ? (
                  <Link
                    href={localizedPath(locale, item.path)}
                    className="inline-block py-1.5 transition-colors hover:text-blush-700"
                  >
                    {item.name}
                  </Link>
                ) : (
                  <span aria-current={isLast ? "page" : undefined} className="text-ink">
                    {item.name}
                  </span>
                )}
                {!isLast ? <span aria-hidden="true">/</span> : null}
              </li>
            );
          })}
        </ol>
      </nav>

      <JsonLd
        data={breadcrumbJsonLd(
          locale,
          withHome.map((item) => ({ name: item.name, path: item.path ?? "" })),
        )}
      />
    </>
  );
}
