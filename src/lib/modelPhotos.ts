import manifest from '../data/model-photos.json';

/** One openly licensed photo per make + model, collected by scripts/enrich/model-photos.mjs. */
export interface ModelPhotoEntry {
  file: string;
  title: string;
  author: string;
  license: string;
  licenseUrl?: string;
  source: string;
}

const entries = manifest as Record<string, ModelPhotoEntry | null>;

/** Accepted licences. Anything else in the manifest is ignored, even if a file exists. */
export const OPEN_LICENCE = /^(cc0|cc[- ]?by(?:-sa)?(?:[- ]\d(?:\.\d)?)?(?:\s\w+)?|public domain|pd(?:[- ].*)?)$/i;

export function modelPhotoFor(make: string, model: string): ModelPhotoEntry | null {
  const m = make === 'Mercedes' ? 'Mercedes-Benz' : make;
  const entry = entries[`${m} ${model}`.toLowerCase()] ?? null;
  return entry && OPEN_LICENCE.test(entry.license) ? entry : null;
}
