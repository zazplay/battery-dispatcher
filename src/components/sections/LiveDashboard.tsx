import { Euro, BatteryCharging, ArrowUpRight, Tag } from 'lucide-react';
import { useSim } from '../../sim/useSim';
import { MODE_COLOR, fmt, priceTag, reason } from '../../sim/day';
import { useT } from '../../i18n';
import { DayChart } from '../DayChart';
import { Reveal } from '../Reveal';

/** A dashboard screen that follows the same simulated day as the 3D scene. */
export function LiveDashboard() {
  const s = useSim();
  const { t } = useT();
  const color = MODE_COLOR[s.mode];
  const kpis = [
    { Icon: Euro, label: s.rate > 1 ? t.live.earnedRate(s.rate) : t.live.earned, value: t.eur(s.rev), green: false },
    { Icon: BatteryCharging, label: t.live.batteries, value: `${Math.round(s.soc * 100)} %`, green: true },
    { Icon: ArrowUpRight, label: t.live.grid, value: `${fmt(s.gridP * 1000)} kW`, green: false },
    { Icon: Tag, label: `${t.live.priceNow} · ${priceTag(s.price, t)}`, value: t.price(s.price), green: false },
  ];
  return (
    <section className="sec" id="live">
      <div className="wrap">
        <p className="eyebrow">{t.live.eyebrow}</p>
        <h2>{t.live.title}</h2>
        <p className="sub">{t.live.sub}</p>
        <Reveal>
          <div className="dash">
            <div className="dash-head">
              <span className="dash-site">{t.live.site}</span>
              <span className="dash-live"><i />{t.live.live} · <time>{s.clock}</time></span>
            </div>
            <div className="kpis">
              {kpis.map(({ Icon, label, value, green }, i) => (
                <div className="kpi" key={i}>
                  <span className={`ico ${green ? 'g' : ''}`}><Icon aria-hidden="true" /></span>
                  <span className="lbl-k">{label}</span>
                  <b>{value}</b>
                </div>
              ))}
            </div>
            <div className="dash-body">
              <div className="dash-chart">
                <DayChart width={640} height={200} top={24} bottom={160} strokeWidth={1.8} ticks={['00', '12', '24']} cursor={{ hr: s.hr, price: s.price, color }} />
                <div className="legend">
                  <span><i style={{ background: '#16a34a' }} />{t.live.charging}</span>
                  <span><i style={{ background: '#3b6cff' }} />{t.live.selling}</span>
                  <span className="r">{t.live.priceAxis}</span>
                </div>
              </div>
              <aside className="why-box">
                <h4>{t.live.now}</h4>
                <span className="pill" style={{ background: color }}>{t.modes[s.mode]}</span>
                <p>{reason(s, t)}</p>
                <p className="note">{t.live.note}</p>
              </aside>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
