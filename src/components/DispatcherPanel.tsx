import { useSim } from '../sim/useSim';
import { MODE_COLOR, priceTag } from '../sim/day';
import { useT } from '../i18n';
import { DayChart } from './DayChart';

/** The "AI battery dispatcher" panel: what the AI is doing now, at what price, and the day chart.
    The money lives in the card on the scene next to it. */
export function DispatcherPanel() {
  const s = useSim();
  const { t } = useT();
  const color = MODE_COLOR[s.mode];
  return (
    <div className="ai-panel">
      <div className="p-head">
        <div>{t.panel.title}</div>
        <div className="p-clock">{s.clock}</div>
      </div>
      <div className="p-row">
        <div className="pill" style={{ background: color }}>{t.modes[s.mode]}</div>
        <div className="p-price">{t.price(s.price)}</div>
        <div className="p-tag" style={{ color }}>{priceTag(s.price, t)}</div>
      </div>
      <DayChart className="p-chart" width={320} height={110} top={16} bottom={92} ticks={['00', '12', '24']} cursor={{ hr: s.hr, price: s.price, color }} />
      <div className="legend">
        <span><i style={{ background: 'var(--green)' }} />{t.panel.charges}</span>
        <span><i style={{ background: 'var(--blue)' }} />{t.panel.sells}</span>
        <span className="r">{t.panel.price}</span>
      </div>
    </div>
  );
}
