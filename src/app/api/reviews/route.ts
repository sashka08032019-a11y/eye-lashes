import { NextResponse } from "next/server";

import { isLocale } from "@/lib/i18n";
import { getPublishedReviews, submitReview, type SubmitReviewInput } from "@/lib/reviews";

/**
 * API отзывов.
 *
 * GET  /api/reviews — опубликованные отзывы (json)
 * POST /api/reviews — приём отзыва: валидация → очередь на модерацию
 *
 * Runtime nodejs нужен, потому что временное хранилище работает с файлами.
 * TODO: после подключения внешнего хранилища (Supabase / Airtable) перевести
 * маршрут на edge-совместимую реализацию.
 */
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ ok: true, reviews: getPublishedReviews() });
}

export async function POST(request: Request) {
  let body: Partial<SubmitReviewInput>;

  try {
    body = (await request.json()) as Partial<SubmitReviewInput>;
  } catch {
    return NextResponse.json({ ok: false, message: "Некорректный JSON." }, { status: 400 });
  }

  const locale = body.locale;

  if (typeof locale !== "string" || !isLocale(locale)) {
    return NextResponse.json({ ok: false, message: "Не указана локаль." }, { status: 400 });
  }

  const result = await submitReview({
    name: typeof body.name === "string" ? body.name : "",
    text: typeof body.text === "string" ? body.text : "",
    rating: typeof body.rating === "number" ? body.rating : 0,
    locale,
    website: typeof body.website === "string" ? body.website : "",
  });

  if (!result.ok) {
    const status = result.error === "storage" ? 503 : 400;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result, { status: 201 });
}
