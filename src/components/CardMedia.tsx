import type { ReactNode } from 'react';

interface Props {
  /** Overlay in the top-left corner, e.g. the deal badge. */
  badge?: ReactNode;
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
export function CardMedia({ src, mark, caption, tone = 0, badge }: Props) {
  if (src) {
    return (
      <div className="card-media">
        <img src={src} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
        {badge ? <div className="card-media-badge">{badge}</div> : null}
      </div>
    );
  }
  return (
    <div className="card-media card-media-empty" data-tone={tone % 4}>
      <span className="card-media-mark" aria-hidden="true">
        {mark}
      </span>
      {caption ? (
        <span className="card-media-caption" aria-hidden="true">
          {caption}
        </span>
      ) : null}
      {badge ? <div className="card-media-badge">{badge}</div> : null}
    </div>
  );
}

/** Stable small number from a string, for picking a placeholder tone. */
export function toneOf(text: string): number {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}
