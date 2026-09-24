import { TrendingUp, Sun, Timer } from 'lucide-react';
import { Reveal } from '../Reveal';
import { useT } from '../../i18n';

const ICONS = [TrendingUp, Sun, Timer];

export function Results() {
  const { t } = useT();
  return (
    <section className="sec" id="results">
      <div className="wrap">
        <p className="eyebrow">{t.results.eyebrow}</p>
        <h2>{t.results.title}</h2>
        <Reveal>
          <div className="nums">
            {t.results.items.map(({ value, text }, i) => {
              const Icon = ICONS[i];
              const green = i === 1;
              return (
                <div className="num" key={value}>
                  <span className={`ico ${green ? 'g' : ''}`}><Icon aria-hidden="true" /></span>
                  <b className={green ? 'g' : ''}>{value}</b>
                  <span className="t">{text}</span>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
