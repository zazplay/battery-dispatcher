import { Activity, AlertTriangle, TrendingDown, BatteryWarning, BellRing, ClipboardCheck } from 'lucide-react';
import { Reveal } from '../Reveal';
import { useT } from '../../i18n';

const ICONS = [Activity, AlertTriangle, TrendingDown, BatteryWarning, BellRing];

/** What the AI finds in the hardware data: string voltage drift, faults, underperformance, battery health. */
export function Diagnostics() {
  const { t } = useT();
  return (
    <section className="sec" id="diagnostics">
      <div className="wrap diag">
        <div className="diag-intro">
          <p className="eyebrow">{t.diag.eyebrow}</p>
          <h2>{t.diag.title}</h2>
          <p className="sub">{t.diag.sub}</p>
          <p className="diag-note"><ClipboardCheck aria-hidden="true" />{t.diag.note}</p>
        </div>
        <Reveal>
          <div className="diag-list">
            {t.diag.items.map(({ title, text }, i) => {
              const Icon = ICONS[i];
              return (
                <div className="diag-item" key={title}>
                  <span className="ico g"><Icon aria-hidden="true" /></span>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
