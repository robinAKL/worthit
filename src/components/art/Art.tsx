import type { ReactElement } from 'react';

/**
 * WorthIt's own illustrations (no third-party artwork). One line style for every card:
 * side views for car body types, front views for appliances, simple icons for the rest.
 * Colours come from CSS custom properties set by the card's tone.
 */

export type ArtKind =
  | 'hatch'
  | 'sedan'
  | 'wagon'
  | 'suv'
  | 'ute'
  | 'van'
  | 'coupe'
  | 'fridge'
  | 'freezer'
  | 'washer'
  | 'dryer'
  | 'microwave'
  | 'dishwasher'
  | 'oven'
  | 'cooktop'
  | 'laptop'
  | 'phone'
  | 'stroller'
  | 'car-seat'
  | 'towel'
  | 'furniture'
  | 'generic';

const CAR: Record<'hatch' | 'sedan' | 'wagon' | 'suv' | 'ute' | 'van' | 'coupe', { body: string; glass: string[]; wheels: [number, number] }> = {
  hatch: {
    body: 'M22 66 L20 54 Q21 47 31 45 L54 43 L68 31 Q72 28 80 28 L106 28 Q113 28 117 33 L128 45 L136 47 Q141 49 141 56 L141 66 Z',
    glass: ['M58 44 L70 33 Q73 31 79 31 L92 31 L92 44 Z', 'M96 31 L106 31 Q111 31 114 35 L122 44 L96 44 Z'],
    wheels: [46, 118],
  },
  sedan: {
    body: 'M14 66 L13 55 Q14 49 23 47 L48 44 L64 31 Q68 28 76 28 L100 28 Q107 28 112 33 L124 44 L142 46 Q147 48 147 55 L147 66 Z',
    glass: ['M54 44 L66 33 Q69 31 75 31 L88 31 L88 44 Z', 'M92 31 L100 31 Q105 31 109 35 L118 44 L92 44 Z'],
    wheels: [40, 124],
  },
  wagon: {
    body: 'M16 66 L15 54 Q16 48 25 46 L48 44 L62 30 Q66 27 74 27 L130 27 Q136 27 138 33 L141 46 Q145 49 145 56 L145 66 Z',
    glass: ['M53 44 L65 32 Q68 30 74 30 L92 30 L92 44 Z', 'M96 30 L114 30 L114 44 L96 44 Z', 'M118 30 L131 30 Q134 30 135 34 L137 44 L118 44 Z'],
    wheels: [40, 122],
  },
  suv: {
    body: 'M18 66 L17 50 Q18 44 26 42 L46 40 L58 24 Q61 21 68 21 L128 21 Q134 21 136 27 L140 41 Q145 44 145 52 L145 66 Z',
    glass: ['M52 40 L62 26 Q64 24 69 24 L92 24 L92 40 Z', 'M96 24 L114 24 L114 40 L96 40 Z', 'M118 24 L128 24 Q132 24 133 28 L136 40 L118 40 Z'],
    wheels: [42, 122],
  },
  ute: {
    body: 'M16 66 L15 50 Q16 45 24 43 L44 41 L56 26 Q59 23 66 23 L90 23 Q95 23 96 28 L97 44 L146 44 L146 66 Z',
    glass: ['M50 41 L60 28 Q62 26 67 26 L78 26 L78 41 Z', 'M82 26 L90 26 Q93 26 93 30 L93 41 L82 41 Z'],
    wheels: [40, 124],
  },
  van: {
    body: 'M14 66 L14 32 Q14 20 27 19 L134 19 Q144 19 145 28 L146 66 Z',
    glass: ['M19 40 L22 27 Q24 22 31 22 L44 22 L44 40 Z', 'M50 24 L72 24 L72 40 L50 40 Z', 'M78 24 L100 24 L100 40 L78 40 Z', 'M106 24 L128 24 L128 40 L106 40 Z'],
    wheels: [38, 124],
  },
  coupe: {
    body: 'M16 66 L15 56 Q16 50 25 48 L52 45 L72 33 Q77 30 86 30 L104 30 Q111 30 116 35 L128 46 L140 48 Q146 50 146 57 L146 66 Z',
    glass: ['M60 45 L74 35 Q78 33 85 33 L102 33 Q107 33 110 37 L118 45 Z'],
    wheels: [42, 122],
  },
};

function Car({ kind }: { kind: keyof typeof CAR }) {
  const c = CAR[kind];
  return (
    <>
      <line x1="8" x2="152" y1="76.5" y2="76.5" className="art-ground" />
      <path d={c.body} className="art-body" />
      {c.glass.map((d) => (
        <path key={d} d={d} className="art-glass" />
      ))}
      {c.wheels.map((x) => (
        <g key={x}>
          <circle cx={x} cy={66} r={10.5} className="art-tyre" />
          <circle cx={x} cy={66} r={4.5} className="art-hub" />
        </g>
      ))}
    </>
  );
}

type CarKind = 'hatch' | 'sedan' | 'wagon' | 'suv' | 'ute' | 'van' | 'coupe';

const SHAPES: Record<Exclude<ArtKind, CarKind>, () => ReactElement> = {
  fridge: () => (
    <>
      <rect x="60" y="8" width="40" height="74" rx="5" className="art-body" />
      <line x1="60" x2="100" y1="34" y2="34" className="art-line" />
      <rect x="92" y="15" width="3" height="12" rx="1.5" className="art-accent" />
      <rect x="92" y="40" width="3" height="20" rx="1.5" className="art-accent" />
    </>
  ),
  freezer: () => (
    <>
      <rect x="36" y="34" width="88" height="44" rx="5" className="art-body" />
      <line x1="36" x2="124" y1="44" y2="44" className="art-line" />
      <rect x="70" y="38" width="20" height="3" rx="1.5" className="art-accent" />
    </>
  ),
  washer: () => (
    <>
      <rect x="50" y="10" width="60" height="70" rx="6" className="art-body" />
      <line x1="50" x2="110" y1="24" y2="24" className="art-line" />
      <circle cx="98" cy="17" r="3" className="art-accent" />
      <circle cx="80" cy="51" r="18" className="art-glass" />
      <circle cx="80" cy="51" r="11" className="art-line-fill" />
    </>
  ),
  dryer: () => (
    <>
      <rect x="50" y="10" width="60" height="70" rx="6" className="art-body" />
      <line x1="50" x2="110" y1="24" y2="24" className="art-line" />
      <circle cx="62" cy="17" r="3" className="art-accent" />
      <circle cx="80" cy="51" r="18" className="art-glass" />
      <path d="M72 47 Q80 43 88 47 M72 55 Q80 51 88 55" className="art-line" />
    </>
  ),
  microwave: () => (
    <>
      <rect x="32" y="22" width="96" height="50" rx="5" className="art-body" />
      <rect x="39" y="29" width="60" height="36" rx="3" className="art-glass" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x="106" y={31 + i * 8} width="14" height="4" rx="2" className="art-accent" />
      ))}
    </>
  ),
  dishwasher: () => (
    <>
      <rect x="52" y="10" width="56" height="70" rx="5" className="art-body" />
      <line x1="52" x2="108" y1="22" y2="22" className="art-line" />
      <rect x="66" y="27" width="28" height="3" rx="1.5" className="art-accent" />
      <path d="M60 44 H100 M60 54 H100 M60 64 H100" className="art-line" />
    </>
  ),
  oven: () => (
    <>
      <rect x="42" y="12" width="76" height="68" rx="5" className="art-body" />
      {[56, 72, 88, 104].map((x) => (
        <circle key={x} cx={x} cy={22} r="3.5" className="art-accent" />
      ))}
      <rect x="52" y="34" width="56" height="36" rx="3" className="art-glass" />
    </>
  ),
  cooktop: () => (
    <>
      <rect x="30" y="18" width="100" height="54" rx="7" className="art-body" />
      {[
        [58, 36, 11],
        [102, 36, 8],
        [58, 58, 8],
        [102, 58, 11],
      ].map(([x, y, r]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={r} className="art-glass" />
      ))}
    </>
  ),
  laptop: () => (
    <>
      <rect x="46" y="12" width="68" height="46" rx="4" className="art-body" />
      <rect x="52" y="18" width="56" height="34" rx="2" className="art-glass" />
      <path d="M34 62 L126 62 L134 72 L26 72 Z" className="art-body" />
    </>
  ),
  phone: () => (
    <>
      <rect x="62" y="6" width="36" height="78" rx="7" className="art-body" />
      <rect x="66" y="14" width="28" height="58" rx="3" className="art-glass" />
      <rect x="74" y="76" width="12" height="3" rx="1.5" className="art-accent" />
    </>
  ),
  stroller: () => (
    <>
      <path d="M50 46 Q52 18 84 16 L84 46 Z" className="art-glass" />
      <path d="M46 46 L112 46 Q112 62 96 64 L58 64 Q46 62 46 46 Z" className="art-body" />
      <path d="M112 46 L124 20" className="art-line" />
      <circle cx="60" cy="72" r="7" className="art-tyre" />
      <circle cx="100" cy="72" r="7" className="art-tyre" />
    </>
  ),
  'car-seat': () => (
    <>
      <path d="M58 14 Q80 8 96 14 L100 52 Q100 60 92 62 L66 62 Q58 60 58 52 Z" className="art-body" />
      <path d="M58 46 Q46 52 48 66 L110 66 Q112 52 100 46" className="art-glass" />
      <path d="M70 28 L78 52 M90 28 L82 52" className="art-line" />
      <rect x="50" y="66" width="60" height="8" rx="3" className="art-accent" />
    </>
  ),
  towel: () => (
    <>
      <rect x="40" y="52" width="80" height="16" rx="4" className="art-body" />
      <rect x="44" y="38" width="72" height="14" rx="4" className="art-glass" />
      <rect x="48" y="24" width="64" height="14" rx="4" className="art-body" />
    </>
  ),
  furniture: () => (
    <>
      <rect x="40" y="26" width="80" height="26" rx="8" className="art-glass" />
      <rect x="34" y="44" width="92" height="20" rx="6" className="art-body" />
      <rect x="30" y="38" width="14" height="28" rx="6" className="art-body" />
      <rect x="116" y="38" width="14" height="28" rx="6" className="art-body" />
      <path d="M42 66 V74 M118 66 V74" className="art-line" />
    </>
  ),
  generic: () => (
    <>
      <path d="M48 30 L80 18 L112 30 L112 66 L80 78 L48 66 Z" className="art-body" />
      <path d="M48 30 L80 42 L112 30 M80 42 V78" className="art-line" />
    </>
  ),
};

export function Art({ kind }: { kind: ArtKind }) {
  return (
    <svg className="art" viewBox="0 0 160 90" aria-hidden="true" focusable="false">
      {kind in CAR ? <Car kind={kind as CarKind} /> : SHAPES[kind as Exclude<ArtKind, CarKind>]()}
    </svg>
  );
}
