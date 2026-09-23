/* One simulated day of a 1 MWp solar plant with a 2.4 MWh battery — the model from the original mockup. */
import type { Dict } from '../i18n/en';

export const CAP = 2.4; // battery capacity, MWh
export const PMAX = 1.2; // inverter power, MW

/* Pacing: the loop starts at sunrise, daytime runs slowly, the night is fast-forwarded. */
export const DAY_START = 6; // the loop begins at 06:00
export const DAY_SECONDS = 64; // 06:00–22:00 in real seconds (4 s per hour)
export const NIGHT_SECONDS = 6; // 22:00–06:00 in real seconds
export const LOOP = DAY_SECONDS + NIGHT_SECONDS;

/** Simulated hour for a real time `t` (seconds since start). */
export const hourAt = (t: number) => {
  const u = t % LOOP;
  const hr = u < DAY_SECONDS ? DAY_START + (u / DAY_SECONDS) * 16 : 22 + ((u - DAY_SECONDS) / NIGHT_SECONDS) * 8;
  return hr % 24;
};

/** Electricity price, €/kWh: a morning bump, a noon dip (everyone exports solar) and an evening peak. */
export const price = (hr: number) =>
  0.022 *
  (3.2 +
    3.4 * Math.exp(-((hr - 8.5) ** 2) / 3) +
    4.6 * Math.exp(-((hr - 19.5) ** 2) / 4) -
    1.6 * Math.exp(-((hr - 13) ** 2) / 8) -
    0.8 * Math.exp(-((hr - 3) ** 2) / 6));

/** Solar output, MW. */
export const solar = (hr: number) => Math.max(0, Math.sin(((hr - 6) / 13) * Math.PI)) * 1.023;

export const PTS = Array.from({ length: 97 }, (_, i) => price(i / 4));
export const pMin = Math.min(...PTS);
export const pMax = Math.max(...PTS);
export const buyT = pMin + (pMax - pMin) * 0.28;
export const sellT = pMin + (pMax - pMin) * 0.62;

export type Mode = 'charge' | 'sell' | 'hold';

/** What the dispatcher plans for a given hour — used to paint the chart zones. */
export const plan = (hr: number): Mode | null => (price(hr) >= sellT ? 'sell' : solar(hr) > 0.05 ? 'charge' : null);

/** Colour of each mode; the labels live in the dictionaries (t.modes). */
export const MODE_COLOR: Record<Mode, string> = { charge: '#16a34a', sell: '#3b6cff', hold: '#8b8f96' };

export interface Flows {
  solarTrunk: boolean;
  solarBattery: boolean;
  batteryGrid: boolean;
  solarGrid: boolean;
}

export interface Snapshot {
  t: number; // seconds since start
  dt: number; // seconds since the previous step
  hr: number; // simulated hour, 0–24
  clock: string; // "HH:MM"
  price: number; // €/kWh
  pv: number; // MW
  soc: number; // 0–1
  gridP: number; // MW exported
  rev: number; // € today
  rate: number; // € per hour right now
  mode: Mode;
  flows: Flows;
}

export const fmt = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 0 });
export const clockOf = (hr: number) =>
  String(Math.floor(hr)).padStart(2, '0') + ':' + String(Math.floor((hr % 1) * 60)).padStart(2, '0');
/** Where the current price sits among today's prices: 0 = the cheapest moment, 1 = the most expensive. */
export const pricePercentile = (p: number) => PTS.filter((x) => x <= p).length / PTS.length;

/** Short tag for the price level in the given language, e.g. "top 8 % of the day" or "cheapest 20 % of the day". */
export function priceTag(p: number, t: Dict) {
  const pct = pricePercentile(p);
  if (pct >= 0.6) return t.tags.top(Math.max(1, Math.round((1 - pct) * 100)));
  if (pct <= 0.4) return t.tags.cheapest(Math.max(1, Math.round(pct * 100)));
  return t.tags.average;
}

/** One sentence on what the dispatcher is doing right now, with the money in it. */
export function reason(s: Snapshot, t: Dict) {
  const p = t.price(s.price), tag = priceTag(s.price, t);
  if (s.mode === 'sell') return t.reason.sell(p, tag, s.rate);
  if (s.mode === 'charge') return t.reason.charge(p, tag);
  return t.reason.hold(p, tag);
}

export class DaySim {
  soc = 0.35;
  rev = 0;
  private lastHr = DAY_START;

  step(t: number, dt: number): Snapshot {
    const hr = hourAt(t);
    let dh = hr - this.lastHr; // simulated hours since the previous step
    if (dh < 0) {
      dh += 24; // passed midnight
      this.rev = 0;
    }
    dh = Math.min(dh, 0.5);
    this.lastHr = hr;
    const p = price(hr);
    const pv = solar(hr);
    let mode: Mode = 'hold';
    let batP = 0;
    if (p >= sellT && this.soc > 0.08) {
      mode = 'sell';
      batP = -Math.min(PMAX, (this.soc * CAP) / Math.max(dh, 1e-3));
    } else if (p <= sellT && pv > 0.05 && this.soc < 0.98) {
      mode = 'charge';
      batP = Math.min(pv, PMAX);
    }
    this.soc = Math.min(1, Math.max(0, this.soc + (batP * dh) / CAP));
    const pvToGrid = Math.max(0, pv - Math.max(0, batP));
    const batToGrid = Math.max(0, -batP);
    const gridP = pvToGrid + batToGrid;
    this.rev += gridP * p * dh * 1000;
    return {
      t,
      dt,
      hr,
      clock: clockOf(hr),
      price: p,
      pv,
      soc: this.soc,
      gridP,
      rev: this.rev,
      rate: gridP * 1000 * p,
      mode,
      flows: {
        solarTrunk: pv > 0.05,
        solarBattery: mode === 'charge',
        batteryGrid: mode === 'sell',
        solarGrid: pvToGrid > 0.05,
      },
    };
  }
}
