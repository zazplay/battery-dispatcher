import { useMemo } from 'react';
import { PTS, pMax, plan, price, SUNRISE, SUNSET, type Mode } from '../sim/day';
import { useT } from '../i18n';

interface Mark {
  hr: number;
  text: string;
  anchor?: 'start' | 'middle' | 'end';
  place?: 'above' | 'below'; // where the label sits relative to the point (default: above)
}
interface Props {
  width: number;
  height: number;
  top: number; // y of the top of the price axis
  bottom: number; // y of zero
  strokeWidth?: number;
  hourStep?: number; // an hour label every N hours (default 6)
  compact?: boolean; // the small panel: "06" instead of "06:00", fewer price ticks, smaller margins
  zoneLabels?: boolean; // "charge" / "sell" above wide zones
  marks?: Mark[]; // highlighted points on the curve
  cursor?: { hr: number; price: number; color: string };
  className?: string;
  label?: string;
}

/* The price axis starts at zero and ends at the next 0.05 step above the day's peak, so a night price never looks like "nothing"
   and the noon-to-evening ratio is visible as it is. */
const Y_STEP = 0.05;
const Y_MAX = Math.ceil(pMax / Y_STEP) * Y_STEP;
const PAD_R = 10;

/** One day of electricity price with the dispatcher's charge / sell windows. Shared by the panel, the dashboard and the "why" section. */
export function DayChart({ width, height, top, bottom, strokeWidth = 1.6, hourStep = 6, compact, zoneLabels, marks, cursor, className, label }: Props) {
  const { t, lang } = useT();
  const padL = compact ? 34 : 46; // room for the price labels
  const x = (hr: number) => padL + (hr / 24) * (width - padL - PAD_R);
  const y = (p: number) => bottom - (p / Y_MAX) * (bottom - top);
  const num = (v: number) => (v ? v.toFixed(2).replace('.', lang === 'en' ? '.' : ',') : '0');

  const { path, zones } = useMemo(() => {
    const path = PTS.map((p, i) => (i ? 'L' : 'M') + x(i / 4).toFixed(1) + ' ' + y(p).toFixed(1)).join(' ');
    // zones at 5-minute steps, so their edges sit where the simulation actually switches (not on the quarter hour)
    const zones: { from: number; to: number; mode: Mode }[] = [];
    let cur: Mode | null = null;
    let start = 0;
    for (let i = 0; i <= 288; i++) {
      const hr = i / 12;
      const m = i < 288 ? plan(hr) : null;
      if (m !== cur) {
        if (cur) zones.push({ from: start, to: hr, mode: cur });
        cur = m;
        start = hr;
      }
    }
    return { path, zones };
    // x/y only depend on the props below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, top, bottom, padL]);

  const yTicks: number[] = [];
  for (let v = 0; v <= Y_MAX + 1e-9; v += compact ? Y_STEP * 2 : Y_STEP) yTicks.push(v);
  const hours: number[] = [];
  for (let h = 0; h <= 24; h += hourStep) hours.push(h);
  const hourLabel = (h: number) => String(h).padStart(2, '0') + (compact ? '' : ':00');
  const nights: [number, number][] = [[0, SUNRISE], [SUNSET, 24]];
  const bandTop = top - 8, bandH = bottom - top + 12;
  const axisY = height - 2;
  const headY = top - 12; // row above the plot: the unit and the night labels

  return (
    <svg className={className} viewBox={`0 0 ${width} ${height}`} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {/* night: the hours without sun, so the low night price reads as night and not as a gap */}
      {nights.map(([a, b]) => (
        <g key={a}>
          <rect x={x(a)} width={x(b) - x(a)} y={bandTop} height={bandH} fill="#1b1d21" fillOpacity={0.045} />
          <text className="night" x={(x(a) + x(b)) / 2} y={headY} textAnchor="middle">{t.chart.night}</text>
        </g>
      ))}
      {zones.map((z, i) => (
        <rect key={i} x={x(z.from)} width={x(z.to) - x(z.from)} y={bandTop} height={bandH} fill={z.mode === 'sell' ? '#3b6cff' : '#16a34a'} fillOpacity={0.14} />
      ))}
      {/* price axis: grid lines with values, the unit above them */}
      {yTicks.map((v) => (
        <g key={v}>
          <line className="grid" x1={padL} x2={width - PAD_R} y1={y(v)} y2={y(v)} />
          <text className="axis" x={padL - 6} y={y(v) + 4} textAnchor="end">{num(v)}</text>
        </g>
      ))}
      <text className="axis unit" x={2} y={headY} textAnchor="start">{t.chart.unit}</text>
      <path d={path} fill="none" stroke="#1b1d21" strokeWidth={strokeWidth} />
      {zoneLabels &&
        zones
          .filter((z) => z.to - z.from > 2.5)
          .map((z, i) => (
            <text key={i} className="zlabel" x={(x(z.from) + x(z.to)) / 2} y={headY} textAnchor="middle" fill={z.mode === 'sell' ? '#3b6cff' : '#16a34a'}>
              {z.mode === 'sell' ? t.problem.zoneSell : t.problem.zoneCharge}
            </text>
          ))}
      {marks?.map((m, i) => {
        const p = price(m.hr);
        const anchor = m.anchor ?? 'middle';
        return (
          <g key={i}>
            <circle cx={x(m.hr)} cy={y(p)} r={5} fill="#1b1d21" />
            <text className="mark" x={x(m.hr) + (anchor === 'end' ? -8 : anchor === 'start' ? 8 : 0)} y={y(p) + (m.place === 'below' ? 24 : -14)} textAnchor={anchor}>
              {m.text}
            </text>
          </g>
        );
      })}
      {cursor && (
        <>
          <line x1={x(cursor.hr)} x2={x(cursor.hr)} y1={bandTop} y2={bottom + 4} stroke="#c4c8ce" strokeWidth={1} />
          <circle cx={x(cursor.hr)} cy={y(cursor.price)} r={4.5} fill={cursor.color} />
        </>
      )}
      {/* time axis: a baseline and an hour label every `hourStep` hours */}
      <line className="grid axis-line" x1={padL} x2={width - PAD_R} y1={bottom + 4} y2={bottom + 4} />
      {hours.map((h) => (
        <text key={h} className="axis" x={x(h)} y={axisY} textAnchor={h === 0 ? 'start' : h === 24 ? 'end' : 'middle'}>
          {hourLabel(h)}
        </text>
      ))}
    </svg>
  );
}
