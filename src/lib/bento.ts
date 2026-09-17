import type { BentoCard } from "@/components/MagicBento";
import type { Dictionary } from "@/content/dictionary";
import { categoryTitles, type Service } from "@/content/services";
import { localizedPath, type Locale } from "@/lib/i18n";
import { servicePath } from "@/lib/routes";

/**
 * Прокладывает данные услуг в карточки bento-сетки.
 *
 * Держим это отдельно от компонента: MagicBento ничего не знает про услуги,
 * салон и локали — он просто рисует карточки. Поменяется структура услуг —
 * правится только этот файл.
 */
export function serviceBentoCards(
  locale: Locale,
  dict: Dictionary,
  items: Service[],
): BentoCard[] {
  return items.map((service) => ({
    id: service.slug,
    // Категория в углу карточки заменяет отдельные подзаголовки-разделы,
    // поэтому группировка услуг сохраняется и в сетке.
    label: categoryTitles[service.category][locale],
    title: service.name[locale],
    description: service.description[locale],
    meta: `${dict.common.priceFrom} ${service.price.toLocaleString("ru-RU")} ${dict.common.currency}`,
    foot: `${dict.common.duration}: ${service.duration[locale]}`,
    href: localizedPath(locale, servicePath(service.slug)),
  }));
}
