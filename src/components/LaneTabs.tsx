import { useRef, type KeyboardEvent } from 'react';
import { LANES, type Lane } from '../lib/types';
import type { Copy } from '../i18n';

interface Props {
  copy: Copy;
  lane: Lane;
  onChange: (lane: Lane) => void;
  panelId: string;
  /** Tab ids are `${idPrefix}-${lane}`; use a different prefix for each tab set on the page. */
  idPrefix?: string;
  /** Labels and hints; defaults to the product lanes. */
  labels?: Record<Lane, { label: string; hint: string }>;
  /** Accessible name of the tab list; defaults to the product sort label. */
  label?: string;
}

/** WAI-ARIA tabs with roving focus: arrows, Home and End move between lanes. */
export function LaneTabs({ lane, onChange, panelId, copy, idPrefix = 'lane', labels = copy.lanes, label = copy.a11y.sort }: Props) {
  const refs = useRef<Record<Lane, HTMLButtonElement | null>>({ value: null, cheap: null, refined: null });

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    const i = LANES.indexOf(lane);
    let next: Lane | undefined;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = LANES[(i + 1) % LANES.length];
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = LANES[(i - 1 + LANES.length) % LANES.length];
    if (e.key === 'Home') next = LANES[0];
    if (e.key === 'End') next = LANES[LANES.length - 1];
    if (!next) return;
    e.preventDefault();
    onChange(next);
    refs.current[next]?.focus();
  }

  return (
    <div className="lanes" role="tablist" aria-label={label}>
      {LANES.map((l) => {
        const selected = l === lane;
        return (
          <button
            key={l}
            ref={(el) => {
              refs.current[l] = el;
            }}
            type="button"
            role="tab"
            id={`${idPrefix}-${l}`}
            aria-selected={selected}
            aria-controls={panelId}
            tabIndex={selected ? 0 : -1}
            className="lane"
            onClick={() => onChange(l)}
            onKeyDown={onKeyDown}
          >
            <span className="lane-label">{labels[l].label}</span>
            <span className="lane-hint">{labels[l].hint}</span>
          </button>
        );
      })}
    </div>
  );
}
