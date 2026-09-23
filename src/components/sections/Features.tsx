import { Eye, Zap, Sparkles, LayoutGrid, Bell, FileText, BatteryCharging, Wifi } from 'lucide-react';
import { Reveal } from '../Reveal';
import { useT } from '../../i18n';

const ICONS = [Eye, Zap, Sparkles, LayoutGrid, Bell, FileText, BatteryCharging, Wifi];

export function Features() {
  const { t } = useT();
  return (
    <section className="sec alt" id="features">
      <div className="wrap">
        <p className="eyebrow">{t.features.eyebrow}</p>
        <h2>{t.features.title}</h2>
        <Reveal>
          <div className="features">
            {t.features.items.map(({ title, text }, i) => {
              const Icon = ICONS[i];
              return (
                <div className="feature" key={title}>
                  <span className="ico"><Icon aria-hidden="true" /></span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
