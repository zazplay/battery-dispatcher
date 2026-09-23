import { Usb, Cpu, Cable, Layers, Radio, Cloud, Gauge, Signal } from 'lucide-react';
import { Reveal } from '../Reveal';
import { useT } from '../../i18n';

const ICONS = [Usb, Cpu, Cable, Layers, Radio, Cloud, Gauge, Signal];

/** How we get to the data: dongles and loggers, the on-site gateway, protocols, clouds, meters. */
export function Tech() {
  const { t } = useT();
  return (
    <section className="sec" id="tech">
      <div className="wrap">
        <p className="eyebrow">{t.tech.eyebrow}</p>
        <h2>{t.tech.title}</h2>
        <p className="sub">{t.tech.sub}</p>
        <Reveal>
          <div className="features">
            {t.tech.items.map(({ title, text }, i) => {
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
