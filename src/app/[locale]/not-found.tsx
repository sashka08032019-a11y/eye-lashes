import Link from "next/link";

import Section from "@/components/Section";
import { dictionaries } from "@/content/dictionary";
import { defaultLocale, localizedPath } from "@/lib/i18n";
import { routes } from "@/lib/routes";

/**
 * 404 внутри локали: показываем текст на двух языках, потому что
 * Not Found не получает параметр locale. Ссылки ведут в русскую версию
 * как в основную (совпадает с x-default в hreflang).
 */
export default function LocaleNotFound() {
  const dict = dictionaries[defaultLocale];

  return (
    <Section as="h1" title={dict.notFound.title}>
      <p className="max-w-2xl text-muted">{dict.notFound.text}</p>
      <p className="mt-2 max-w-2xl text-muted">{dictionaries.kk.notFound.text}</p>

      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <Link
          href={localizedPath(defaultLocale, routes.home)}
          className="rounded-full bg-blush-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-blush-700"
        >
          {dict.common.backHome}
        </Link>
        <Link
          href={localizedPath(defaultLocale, routes.services)}
          className="rounded-full border border-blush-300 px-5 py-2.5 font-medium text-blush-700 transition-colors hover:bg-blush-50"
        >
          {dict.nav.services}
        </Link>
      </div>
    </Section>
  );
}
