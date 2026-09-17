import { promises as fs } from "node:fs";
import path from "node:path";

import seed from "@/data/reviews.json";
import type { Locale } from "./i18n";

export type ReviewStatus = "published" | "pending" | "rejected";

export type Review = {
  id: string;
  name: string;
  rating: number;
  status: ReviewStatus;
  /** Дата в формате ISO. */
  createdAt: string;
  text: Record<Locale, string>;
};

/**
 * ЗАГЛУШКА ХРАНИЛИЩА.
 *
 * Сейчас отзывы лежат в src/data/reviews.json, а новые заявки складываются
 * в файл `data/pending-reviews.json` (в .gitignore). Это работает при
 * локальном запуске (`npm run dev` / `npm start`), но НЕ работает на
 * Netlify: файловая система функции доступна только для чтения.
 *
 * Когда заказчик выберет сервис, достаточно заменить тело `submitReview`
 * и `getReviews` на вызовы выбранного хранилища (например Supabase или
 * Airtable) — интерфейс и валидация останутся прежними.
 */

const PENDING_FILE = path.join(process.cwd(), "data", "pending-reviews.json");

export const reviewLimits = {
  nameMin: 2,
  nameMax: 60,
  textMin: 20,
  textMax: 1200,
} as const;

export function getReviews(): Review[] {
  return seed as Review[];
}

/** Опубликованные отзывы, отсортированные от новых к старым. */
export function getPublishedReviews(): Review[] {
  return getReviews()
    .filter((review) => review.status === "published")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getPlaceholderReviews(count = 3): Review[] {
  return getPublishedReviews().slice(0, count);
}

export type SubmitReviewInput = {
  name: string;
  text: string;
  rating: number;
  /** Локаль, с которой оставлен отзыв — сохраняется для модерации. */
  locale: Locale;
  /** Honeypot-поле: должно быть пустым. */
  website?: string;
};

export type SubmitReviewResult =
  | { ok: true; id: string }
  | { ok: false; error: "validation" | "spam" | "storage"; message: string };

function validate(input: SubmitReviewInput): SubmitReviewResult | null {
  const name = input.name.trim();
  const text = input.text.trim();

  if (name.length < reviewLimits.nameMin || name.length > reviewLimits.nameMax) {
    return { ok: false, error: "validation", message: "Укажите имя (2–60 символов)." };
  }
  if (text.length < reviewLimits.textMin || text.length > reviewLimits.textMax) {
    return { ok: false, error: "validation", message: "Отзыв должен быть от 20 до 1200 символов." };
  }
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    return { ok: false, error: "validation", message: "Оценка — целое число от 1 до 5." };
  }
  return null;
}

async function persist(review: Review): Promise<void> {
  let existing: Review[] = [];
  try {
    existing = JSON.parse(await fs.readFile(PENDING_FILE, "utf8")) as Review[];
  } catch {
    existing = [];
  }
  existing.push(review);
  await fs.mkdir(path.dirname(PENDING_FILE), { recursive: true });
  await fs.writeFile(PENDING_FILE, JSON.stringify(existing, null, 2), "utf8");
}

/**
 * Приём отзыва. Проходит валидацию и honeypot, попадает в очередь
 * «На модерации» — публикуется вручную.
 */
export async function submitReview(input: SubmitReviewInput): Promise<SubmitReviewResult> {
  if (input.website && input.website.trim() !== "") {
    return { ok: false, error: "spam", message: "Отзыв отклонён." };
  }

  const invalid = validate(input);
  if (invalid) return invalid;

  const review: Review = {
    id: `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: input.name.trim(),
    rating: input.rating,
    status: "pending",
    createdAt: new Date().toISOString(),
    // Отзыв оставлен на одном языке: показываем его в обеих версиях сайта,
    // чтобы не плодить пустые блоки. TODO: подключить перевод при модерации.
    text: { ru: input.text.trim(), kk: input.text.trim() },
  };

  try {
    await persist(review);
    return { ok: true, id: review.id };
  } catch {
    // Ожидаемо на Netlify (read-only FS) — до подключения внешнего хранилища.
    return {
      ok: false,
      error: "storage",
      message: "Хранилище отзывов ещё не подключено. Напишите нам в WhatsApp.",
    };
  }
}
