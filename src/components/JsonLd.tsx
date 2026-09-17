import { jsonLdString } from "@/lib/jsonld";

type Props = {
  data: Record<string, unknown>;
};

/**
 * Разметка schema.org. Рендерится на сервере и попадает в исходный HTML,
 * поэтому робот Яндекса/Google видит её без выполнения JavaScript.
 */
export default function JsonLd({ data }: Props) {
  return (
    <script
      type="application/ld+json"
      // Экранирование "<" выполняется в jsonLdString — защита от инъекции тега.
      dangerouslySetInnerHTML={{ __html: jsonLdString(data) }}
    />
  );
}
