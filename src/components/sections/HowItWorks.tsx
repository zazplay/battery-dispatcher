import { Activity, TrendingUp, CalendarClock, Zap } from 'lucide-react';
import { Reveal } from '../Reveal';
import { useT } from '../../i18n';

const ICONS = [Activity, TrendingUp, CalendarClock, Zap];

export function HowItWorks() {
  const { t } = useT();
  return (
    <section className="sec alt" id="how">
      <div className="wrap">
        <p className="eyebrow">{t.how.eyebrow}</p>
        <h2>{t.how.title}</h2>
        <Reveal>
          <div className="steps">
            {t.how.steps.map(({ title, text }, i) => {
              const Icon = ICONS[i];
              return (
                <div className="step" key={title}>
                  <div className="step-top">
                    <span className="ico"><Icon aria-hidden="true" /></span>
                    <span className="k">{t.how.step} {i + 1}</span>
                  </div>
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
