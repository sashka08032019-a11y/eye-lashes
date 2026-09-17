import StarBorder, { starBorderPill } from "@/components/StarBorder";
import type { Dictionary } from "@/content/dictionary";
import type { Locale } from "@/lib/i18n";
import { messengerLinks } from "@/lib/site";

type Props = {
  locale: Locale;
  dict: Dictionary;
  /**
   * Какая кнопка получает «звёздную» рамку. Акцент делаем на одной кнопке
   * в блоке — если анимировать все четыре, эффект превращается в шум.
   */
  primary?: "whatsapp" | "telegram";
};

const OUTLINE =
  "inline-block rounded-full border border-blush-300 px-5 py-2.5 text-sm font-medium text-blush-700 transition-colors hover:bg-blush-50";

/**
 * Кнопки связи вместо формы онлайн-записи. Ссылки ведут в мессенджеры
 * с уже подставленным текстом сообщения — клиентке остаётся нажать
 * «Отправить», а мастер сразу видит, что запрос пришёл с сайта.
 *
 * Главная кнопка оформлена через Star Border (аналог reactbits.dev) —
 * по её канту пробегает блик.
 */
export default function CtaButtons({ locale, dict, primary = "whatsapp" }: Props) {
  const links = messengerLinks(locale);

  const items = [
    {
      key: "whatsapp" as const,
      href: links.whatsapp,
      label: dict.common.whatsapp,
      external: true,
    },
    {
      key: "telegram" as const,
      href: links.telegram,
      label: dict.common.telegram,
      external: true,
    },
    { key: "phone" as const, href: links.phone, label: dict.common.call, external: false },
    { key: "instagram" as const, href: links.instagram, label: dict.common.instagram, external: true },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      {items.map((item) =>
        item.key === primary ? (
          <StarBorder
            key={item.key}
            href={item.href}
            {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            color="#ffffff"
            speed="5s"
            thickness={2}
            backgroundColor="#a95064"
            hoverBackgroundColor="#833b4c"
            textColor="#ffffff"
            borderColor="rgb(255 255 255 / 0.4)"
            innerClassName={starBorderPill}
          >
            {item.label}
          </StarBorder>
        ) : (
          <a
            key={item.key}
            href={item.href}
            {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className={OUTLINE}
          >
            {item.label}
          </a>
        ),
      )}
    </div>
  );
}
