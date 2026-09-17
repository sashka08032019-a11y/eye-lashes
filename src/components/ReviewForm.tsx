"use client";

import { useState } from "react";

import StarBorder, { starBorderPill } from "@/components/StarBorder";
import type { Dictionary } from "@/content/dictionary";
import type { Locale } from "@/lib/i18n";

type Props = {
  locale: Locale;
  dict: Dictionary;
};

type Status = "idle" | "sending" | "success" | "error";

/**
 * Форма отзыва. Отправляется в /api/reviews, отзыв попадает на модерацию.
 * Защита от спама: honeypot-поле + серверная валидация длины и рейтинга.
 */
export default function ReviewForm({ locale, dict }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    setStatus("sending");
    setError(null);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          text: data.get("text"),
          rating: Number(data.get("rating")),
          locale,
          website: data.get("website"),
        }),
      });

      const payload = (await response.json()) as { ok?: boolean; message?: string };

      if (!response.ok || !payload.ok) {
        setError(payload.message ?? dict.reviews.error);
        setStatus("error");
        return;
      }

      form.reset();
      setStatus("success");
    } catch {
      setError(dict.reviews.error);
      setStatus("error");
    }
  }

  const field =
    "mt-1 w-full rounded-xl border border-blush-200 bg-white px-3 py-2 text-sm text-ink placeholder:text-blush-300 focus:border-blush-400 focus:outline-none";

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-blush-100 bg-white p-5">
      <h3 className="text-lg font-semibold text-ink">{dict.reviews.title}</h3>
      <p className="mt-1 text-sm text-muted">{dict.reviews.lead}</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-sm" htmlFor="review-name">
          <span className="text-ink">{dict.reviews.nameLabel}</span>
          <input
            id="review-name"
            name="name"
            required
            minLength={2}
            maxLength={60}
            autoComplete="name"
            placeholder={dict.reviews.namePlaceholder}
            className={field}
          />
        </label>

        <label className="text-sm" htmlFor="review-rating">
          <span className="text-ink">{dict.reviews.ratingLabel}</span>
          <select id="review-rating" name="rating" defaultValue="5" className={field}>
            {[5, 4, 3, 2, 1].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-4 block text-sm" htmlFor="review-text">
        <span className="text-ink">{dict.reviews.textLabel}</span>
        <textarea
          id="review-text"
          name="text"
          required
          minLength={20}
          maxLength={1200}
          rows={4}
          placeholder={dict.reviews.textPlaceholder}
          className={field}
        />
      </label>

      {/*
        Honeypot: скрыто от людей, но видно ботам-автозаполнителям.
        Если поле заполнено — запрос отбрасывается на сервере.
      */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="review-website">{dict.reviews.honeypotNote}</label>
        <input id="review-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <StarBorder
          as="button"
          type="submit"
          disabled={status === "sending"}
          color="#ffffff"
          speed="5s"
          thickness={2}
          backgroundColor="#a95064"
          hoverBackgroundColor="#833b4c"
          textColor="#ffffff"
          borderColor="rgb(255 255 255 / 0.4)"
          innerClassName={starBorderPill}
        >
          {status === "sending" ? dict.reviews.sending : dict.reviews.submit}
        </StarBorder>

        <p
          role="status"
          aria-live="polite"
          className={`text-sm ${status === "error" ? "text-blush-700" : "text-muted"}`}
        >
          {status === "success" ? dict.reviews.success : null}
          {status === "error" ? (error ?? dict.reviews.error) : null}
        </p>
      </div>
    </form>
  );
}
