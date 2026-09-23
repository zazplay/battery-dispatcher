import { AiLogos } from './AiLogos';
import { EnergyScene } from './EnergyScene';
import { DispatcherPanel } from './DispatcherPanel';
import { SceneStats } from './SceneStats';
import { LangSwitch, Rich, useT } from '../i18n';

export function Hero() {
  const { t } = useT();
  return (
    <section className="hero" id="top">
      <div className="hero-card">
        <div className="hero-top">
          <div className="brand">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="4" y="4" width="16" height="16" rx="4" transform="rotate(45 12 12)" fill="#3b6cff" />
              <path d="M13.2 7 9.6 12.6h2.6L10.8 17l3.6-5.6h-2.6z" fill="#fff" />
            </svg>
            Azileon
          </div>
          <LangSwitch />
        </div>
        {/* the first thing on the page is the AI, not a slogan */}
        <span className="ai-badge"><AiLogos />{t.hero.badge}</span>
        <h1 className="ai-line"><Rich text={t.hero.title} /></h1>
      </div>
      <EnergyScene />
      <SceneStats />
      <DispatcherPanel />
      {/* buttons + site facts: under the text on desktop, under the dispatcher panel on phones */}
      <div className="hero-cta">
        <div className="btns">
          <a className="btn pri" href="#how">{t.hero.how}</a>
          <a className="btn soft" href="#contact">{t.hero.demo}</a>
        </div>
        <p className="facts">
          <b>{t.hero.facts}</b> · {t.hero.dayNote}
        </p>
      </div>
    </section>
  );
}
