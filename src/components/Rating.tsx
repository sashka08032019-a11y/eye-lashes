type Props = {
  value: number;
  max?: number;
};

/** Звёзды с текстовым дублем для скринридеров: рейтинг = смысл, не декор. */
export default function Rating({ value, max = 5 }: Props) {
  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <span aria-hidden="true" className="text-blush-500">
        {"★".repeat(value)}
        <span className="text-blush-200">{"★".repeat(Math.max(0, max - value))}</span>
      </span>
      <span className="text-muted">
        {value}/{max}
      </span>
    </span>
  );
}
