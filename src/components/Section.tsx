type Props = {
  id?: string;
  title?: string;
  lead?: string;
  children: React.ReactNode;
  className?: string;
  /** h1 для страниц, где заголовок раздела и есть заголовок страницы. */
  as?: "h1" | "h2";
};

export default function Section({ id, title, lead, children, className, as = "h2" }: Props) {
  const Heading = as;

  return (
    <section id={id} className={`mx-auto max-w-6xl px-4 py-10 sm:py-14 ${className ?? ""}`}>
      {title ? (
        <Heading className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          {title}
        </Heading>
      ) : null}
      {lead ? <p className="mt-3 max-w-3xl text-muted">{lead}</p> : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}
