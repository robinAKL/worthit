import type { ReactNode } from 'react';
import { Art, type ArtKind } from './art/Art';

/** An openly licensed photo of the model (not the item for sale), with its credit. */
export interface ModelPhoto {
  src: string;
  /** Short visible tag, e.g. "Illustrative photo". */
  label: string;
  /** Author, licence and source, shown on hover and to screen readers. */
  credit: string;
}

interface Props {
  /** Overlay in the top-left corner, e.g. the deal badge. */
  badge?: ReactNode;
  /** The listing's own photo. Shown only when the source has granted image use. */
  src?: string;
  /** Next best: an openly licensed photo of the same model. */
  photo?: ModelPhoto;
  /** Otherwise: our own illustration. */
  art?: ArtKind;
  /** Brand or make shown with the illustration, e.g. "Toyota". */
  mark: string;
  /** Small caption under it, e.g. "Hatchback · Hybrid". */
  caption?: string;
  /** Picks one of a few calm tints so a row of placeholders is not monotone. */
  tone?: number;
}

/** Fixed-ratio image slot. Every card has one, so card rows stay aligned with or without photos. */
export function CardMedia({ src, photo, art = 'generic', mark, caption, tone = 0, badge }: Props) {
  const overlay = badge ? <div className="card-media-badge">{badge}</div> : null;
  if (src) {
    return (
      <div className="card-media">
        <img src={src} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
        {overlay}
      </div>
    );
  }
  if (photo) {
    return (
      <figure className="card-media card-media-photo" title={photo.credit}>
        <img src={photo.src} alt={photo.credit} loading="lazy" decoding="async" />
        <figcaption className="card-media-tag">{photo.label}</figcaption>
        {overlay}
      </figure>
    );
  }
  return (
    <div className="card-media card-media-art" data-tone={tone % 4}>
      <Art kind={art} />
      <span className="card-media-mark" aria-hidden="true">
        {mark}
      </span>
      {caption ? (
        <span className="card-media-caption" aria-hidden="true">
          {caption}
        </span>
      ) : null}
      {overlay}
    </div>
  );
}

/** Stable small number from a string, for picking a placeholder tone. */
export function toneOf(text: string): number {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}
