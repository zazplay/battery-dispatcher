import { useMemo } from 'react';
import { PTS, pMin, pMax, plan, price, type Mode } from '../sim/day';
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
  top: number; // y of the highest price
  bottom: number; // y of the lowest price
  strokeWidth?: number;
  ticks: string[]; // evenly spaced axis labels
  zoneLabels?: boolean; // "charge" / "sell" above wide zones
  marks?: Mark[]; // highlighted points on the curve
  cursor?: { hr: number; price: number; color: string };
  className?: string;
  label?: string;
}

/** One day of electricity price with the dispatcher's charge / sell windows. Shared by the panel, the dashboard and the "why" section. */
export function DayChart({ width, height, top, bottom, strokeWidth = 1.6, ticks, zoneLabels, marks, cursor, className, label }: Props) {
  const { t } = useT();
  const x = (hr: number) => 8 + (hr / 24) * (width - 16);
  const y = (p: number) => bottom - ((p - pMin) / (pMax - pMin)) * (bottom - top);

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
  }, [width, top, bottom]);

  const axisY = height - 2;
  return (
    <svg className={className} viewBox={`0 0 ${width} ${height}`} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <g>
        {zones.map((z, i) => (
          <rect
            key={i}
            x={x(z.from)}
            width={x(z.to) - x(z.from)}
            y={top - 8}
            height={bottom - top + 12}
            fill={z.mode === 'sell' ? '#3b6cff' : '#16a34a'}
            fillOpacity={0.14}
          />
        ))}
      </g>
      <path d={path} fill="none" stroke="#1b1d21" strokeWidth={strokeWidth} />
      {zoneLabels &&
        zones
          .filter((z) => z.to - z.from > 2.5)
          .map((z, i) => (
            <text key={i} className="zlabel" x={(x(z.from) + x(z.to)) / 2} y={top - 14} textAnchor="middle" fill={z.mode === 'sell' ? '#3b6cff' : '#16a34a'}>
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
          <line x1={x(cursor.hr)} x2={x(cursor.hr)} y1={top - 6} y2={bottom + 4} stroke="#c4c8ce" strokeWidth={1} />
          <circle cx={x(cursor.hr)} cy={y(cursor.price)} r={4.5} fill={cursor.color} />
        </>
      )}
      {ticks.map((tk, i) => {
        const n = ticks.length - 1;
        const tx = 8 + (i / n) * (width - 16);
        return (
          <text key={tk} className="axis" x={tx} y={axisY} textAnchor={i === 0 ? 'start' : i === n ? 'end' : 'middle'}>
            {tk}
          </text>
        );
      })}
    </svg>
  );
}
