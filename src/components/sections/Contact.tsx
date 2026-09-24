import { Phone, Mail, Globe, User } from 'lucide-react';
import { Rich, useT } from '../../i18n';

/** Closing card of the pitch page: who we are, one ask, the contacts as plain text. */
export function Contact() {
  const { t } = useT();
  return (
    <section className="sec" id="contact">
      <div className="wrap">
        <div className="cta">
          <div>
            <p className="eyebrow">{t.contact.eyebrow}</p>
            <h2>{t.contact.title}</h2>
            <p className="sub">{t.contact.sub}</p>
            <p className="about"><Rich text={t.contact.about} /></p>
          </div>
          <div className="cta-side">
            <div className="cinfo">
              <span><User aria-hidden="true" /><span><b>Yehor Zhyliaiev</b>, {t.contact.role}</span></span>
              <span><Phone aria-hidden="true" /><b>+420 774 903 190</b></span>
              <span><Mail aria-hidden="true" /><b>yz@azileon.cz</b></span>
              <span><Globe aria-hidden="true" /><a href="https://azileon.cz" target="_blank" rel="noreferrer">azileon.cz</a></span>
            </div>
            <a className="btn pri" href="mailto:yz@azileon.cz?subject=Battery%20dispatcher%20demo">{t.contact.write}</a>
          </div>
        </div>
      </div>
    </section>
  );
}
