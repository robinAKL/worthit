import ascent from './ascent.mjs';
import autoCourt from './auto-court.mjs';
import babyFactory from './baby-factory.mjs';
import brendanFoot from './brendan-foot.mjs';
import brianScott from './brian-scott.mjs';
import cariCars from './cari-cars.mjs';
import cookeHowlison from './cooke-howlison.mjs';
import croydons from './croydons.mjs';
import daveAllen from './dave-allen.mjs';
import fourGuys from './four-guys.mjs';
import gvi from './gvi.mjs';
import motorco from './motorco.mjs';
import nzc from './nzc.mjs';

/** Every adapter the runner knows. Add one import and one entry per site. */
export const ADAPTERS = [
  ascent,
  babyFactory,
  // Used-car dealers, batch B (T-22)
  autoCourt,
  brendanFoot,
  brianScott,
  cookeHowlison,
  croydons,
  // Used-car dealers, batch C (T-23)
  cariCars,
  daveAllen,
  fourGuys,
  gvi,
  motorco,
  nzc,
];
