import Rating from "@/components/Rating";
import type { Dictionary } from "@/content/dictionary";
import type { Locale } from "@/lib/i18n";
import type { Review } from "@/lib/reviews";

type Props = {
  locale: Locale;
  dict: Dictionary;
  reviews: Review[];
};

/**
 * Отзывы рендерятся на сервере обычным HTML — они должны индексироваться
 * вместе со страницей, а не подгружаться скриптом.
 */
export default function ReviewsList({ locale, dict, reviews }: Props) {
  if (reviews.length === 0) {
    return <p className="text-muted">{dict.reviews.empty}</p>;
  }

  const average =
    Math.round((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length) * 10) / 10;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        {dict.reviews.average}: <strong className="text-ink">{average}</strong> / 5 ·{" "}
        {reviews.length}
      </p>

      <ul className="grid gap-4 sm:grid-cols-2">
        {reviews.map((review) => (
          <li
            key={review.id}
            className="rounded-2xl border border-blush-100 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium text-ink">{review.name}</p>
              <Rating value={review.rating} />
            </div>
            <p className="mt-3 text-sm text-muted">{review.text[locale]}</p>
            <time dateTime={review.createdAt} className="mt-3 block text-xs text-blush-300">
              {new Date(review.createdAt).toLocaleDateString(locale === "ru" ? "ru-RU" : "kk-KZ")}
            </time>
          </li>
        ))}
      </ul>
    </div>
  );
}
