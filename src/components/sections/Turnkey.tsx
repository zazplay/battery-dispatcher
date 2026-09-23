import { Building2, Server, Code, Percent, MapPin, Search, Wrench } from 'lucide-react';
import { Reveal } from '../Reveal';
import { useT } from '../../i18n';

const ICONS = [Building2, Server, Code, Percent];
const VISIT_ICONS = [MapPin, Search, Wrench];

export function Turnkey() {
  const { t } = useT();
  return (
    <section className="sec" id="turnkey">
      <div className="wrap">
        <p className="eyebrow">{t.turnkey.eyebrow}</p>
        <h2>{t.turnkey.title}</h2>
        <p className="sub">{t.turnkey.sub}</p>
        <Reveal>
          <div className="tiles">
            {t.turnkey.tiles.map(({ title, text }, i) => {
              const Icon = ICONS[i];
              return (
                <div className="tile" key={title}>
                  <span className="ico g"><Icon aria-hidden="true" /></span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              );
            })}
          </div>
        </Reveal>
        <Reveal>
          <div className="visit">
            <div>
              <h3>{t.turnkey.visit.title}</h3>
              <p>{t.turnkey.visit.text}</p>
            </div>
            <ol className="visit-steps">
              {t.turnkey.visit.steps.map((s, i) => {
                const Icon = VISIT_ICONS[i];
                return (
                  <li key={s}>
                    <span className="ico"><Icon aria-hidden="true" /></span>
                    <span>{s}</span>
                  </li>
                );
              })}
            </ol>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
