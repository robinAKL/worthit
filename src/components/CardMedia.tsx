interface Props {
  /** Shown only when a source has granted image use. */
  src?: string;
  /** Large mark in the placeholder, e.g. "TA" for Toyota Aqua. */
  mark: string;
  /** Small caption under the mark, e.g. "Hatchback · Hybrid". */
  caption?: string;
  /** Picks one of a few calm tints so a row of placeholders is not monotone. */
  tone?: number;
}

/** Fixed-ratio image slot. Every card has one, so card rows stay aligned with or without photos. */
export function CardMedia({ src, mark, caption, tone = 0 }: Props) {
  if (src) {
    return (
      <div className="card-media">
        <img src={src} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
      </div>
    );
  }
  return (
    <div className="card-media card-media-empty" data-tone={tone % 4} aria-hidden="true">
      <span className="card-media-mark">{mark}</span>
      {caption ? <span className="card-media-caption">{caption}</span> : null}
    </div>
  );
}

/** Stable small number from a string, for picking a placeholder tone. */
export function toneOf(text: string): number {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}
