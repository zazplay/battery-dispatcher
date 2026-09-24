/* One simulated day of a 1 MWp solar plant with a 2.4 MWh battery behind a 1 MW grid connection.
   A model day: the price curve is illustrative, the real market figures live in the "Market prices" section. */
import type { Dict } from '../i18n/en';

export const CAP = 2.4; // battery capacity, MWh
export const PMAX = 1.2; // battery inverter (PCS) power, MW
export const GRID = 1.0; // grid connection, MW — the export never goes above it
export const PV_PEAK = 0.85; // MW a 1 MWp plant gives at noon on a clear September day (~6.5 MWh over the day)
export const SUNRISE = 7, SUNSET = 19;

/* Pacing: the loop starts before sunrise, daytime runs slowly, the night is fast-forwarded. */
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

/** Solar output, MW: a half-sine between sunrise and sunset. */
export const solar = (hr: number) => Math.max(0, Math.sin(((hr - SUNRISE) / (SUNSET - SUNRISE)) * Math.PI)) * PV_PEAK;

export const PTS = Array.from({ length: 97 }, (_, i) => price(i / 4));
export const pMin = Math.min(...PTS);
export const pMax = Math.max(...PTS);
export const buyT = pMin + (pMax - pMin) * 0.28;
export const sellT = pMin + (pMax - pMin) * 0.62;

export type Mode = 'charge' | 'sell' | 'hold';

/** What the dispatcher plans for a given hour — used to paint the chart zones. Charge only in the cheapest hours
 *  (the battery holds less than the day's solar, so the dearer morning output is sold as it comes), sell at the
 *  evening peak. The battery sold out the evening before, so the high morning prices carry no zone. */
export const plan = (hr: number): Mode | null =>
  price(hr) >= sellT ? (hr >= 12 ? 'sell' : null) : price(hr) <= buyT && solar(hr) > 0.05 ? 'charge' : null;

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

/** The next quarter hour (from `hr` on, wrapping past midnight) when the plan says "sell", with the price then. */
export function nextSale(hr: number) {
  const from = Math.ceil(hr * 4);
  for (let i = 1; i <= 96; i++) {
    const h = ((from + i) % 96) / 4;
    if (plan(h) === 'sell') return { clock: clockOf(h), price: price(h) };
  }
  return { clock: clockOf(19.5), price: price(19.5) };
}

export const RESERVE = 0.08; // the battery never goes below this state of charge

/** One sentence on what the dispatcher is doing right now, with the money in it. */
export function reason(s: Snapshot, t: Dict) {
  const p = t.price(s.price), tag = priceTag(s.price, t);
  if (s.mode === 'sell') return t.reason.sell(p, tag, s.rate);
  if (s.mode === 'hold' && s.price >= sellT && s.soc <= RESERVE + 0.02) return t.reason.empty(p, tag);
  const next = nextSale(s.hr);
  const nextPrice = t.price(next.price);
  return s.mode === 'charge' ? t.reason.charge(p, tag, next.clock, nextPrice) : t.reason.hold(p, tag, next.clock, nextPrice);
}

export class DaySim {
  soc = RESERVE; // the day starts where the evening sale left the battery, so every loop is the same day
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
    if (p >= sellT && this.soc > RESERVE) {
      mode = 'sell';
      // discharge only into the room the grid connection leaves next to the solar output
      batP = -Math.min(PMAX, Math.max(0, GRID - pv), (this.soc * CAP) / Math.max(dh, 1e-3));
    } else if (p <= buyT && pv > 0.05 && this.soc < 0.98) {
      mode = 'charge'; // the cheapest hours fill the battery; solar at other times goes to the grid
      batP = Math.min(pv, PMAX);
    }
    this.soc = Math.min(1, Math.max(0, this.soc + (batP * dh) / CAP));
    const pvToGrid = Math.max(0, pv - Math.max(0, batP));
    const batToGrid = Math.max(0, -batP);
    const gridP = Math.min(GRID, pvToGrid + batToGrid);
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

/** The figures of the model day that the texts quote (journal, scene notes, the result tile). */
export interface DaySummary {
  chargeFrom: string; // when the charge that fills the battery starts (the price drops below the sell level)
  fullClock: string; // when the battery is full from solar
  sellFrom: string; // when the evening sale starts
  sellFromPrice: number; // €/kWh at that moment
  sellTo: string; // when the evening sale ends
  peakClock: string; // the most expensive moment of the day
  peakPrice: number;
  revenue: number; // € earned over the day
  soldMWh: number; // MWh exported over the day
  baselineRevenue: number; // € the same plant makes selling solar as it comes, no battery
  upliftPct: number; // revenue vs. baseline, per cent
}

/** Runs the first loop of the simulation once, at fine steps, and collects the figures above. */
export function summarizeDay(): DaySummary {
  const sim = new DaySim();
  const dt = 0.005;
  let prev = sim.step(0, 0);
  let chargeStart = '', chargeFrom = '', fullClock = '', sellFrom = '', sellTo = '', sellFromPrice = 0;
  let revenue = 0, sold = 0, baseline = 0, peakPrice = 0, peakHr = 0;
  for (let t = dt; t <= LOOP; t += dt) {
    const s = sim.step(t, dt);
    let dh = s.hr - prev.hr;
    if (dh < 0) dh += 24;
    sold += s.gridP * dh;
    baseline += Math.min(GRID, s.pv) * s.price * dh * 1000;
    revenue = Math.max(revenue, s.rev);
    if (s.price > peakPrice) { peakPrice = s.price; peakHr = s.hr; }
    if (s.mode === 'charge' && prev.mode !== 'charge') chargeStart = s.clock;
    if (!fullClock && s.soc >= 0.98) { fullClock = s.clock; chargeFrom = chargeStart; }
    if (!sellFrom && s.hr > 12 && s.mode === 'sell') { sellFrom = s.clock; sellFromPrice = s.price; }
    if (sellFrom && s.mode === 'sell') sellTo = s.clock;
    prev = s;
  }
  return {
    chargeFrom,
    fullClock,
    sellFrom,
    sellFromPrice,
    sellTo,
    peakClock: clockOf(peakHr),
    peakPrice,
    revenue,
    soldMWh: sold,
    baselineRevenue: baseline,
    upliftPct: Math.round(((revenue - baseline) / baseline) * 100),
  };
}

/** Computed once at load; the dictionaries quote it so the journal always matches the scene. */
export const DAY = summarizeDay();
