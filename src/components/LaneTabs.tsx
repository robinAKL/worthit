import { useRef, type KeyboardEvent } from 'react';
import { LANES, type Lane } from '../lib/types';
import type { Copy } from '../i18n';

interface Props {
  copy: Copy;
  lane: Lane;
  onChange: (lane: Lane) => void;
  panelId: string;
}

/** WAI-ARIA tabs with roving focus: arrows, Home and End move between lanes. */
export function LaneTabs({ lane, onChange, panelId, copy }: Props) {
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
    <div className="lanes" role="tablist" aria-label={copy.a11y.sort}>
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
            id={`lane-${l}`}
            aria-selected={selected}
            aria-controls={panelId}
            tabIndex={selected ? 0 : -1}
            className="lane"
            onClick={() => onChange(l)}
            onKeyDown={onKeyDown}
          >
            <span className="lane-label">{copy.lanes[l].label}</span>
            <span className="lane-hint">{copy.lanes[l].hint}</span>
          </button>
        );
      })}
    </div>
  );
}
