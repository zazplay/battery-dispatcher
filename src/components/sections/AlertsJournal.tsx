import { Bell, Mail, MessageCircle, Smartphone, StickyNote, Check, Send, BellRing, ShieldCheck, Moon, ArrowUpRight } from 'lucide-react';
import { Reveal } from '../Reveal';
import { useT } from '../../i18n';

const CHANNEL_ICONS = [MessageCircle, Mail, Smartphone, BellRing];
const RULE_ICONS = [ShieldCheck, Moon, ArrowUpRight];
const KIND_ICON = { alert: Bell, note: StickyNote, ok: Check, mail: Mail } as const;

/** The AI finds a problem → a message to the phone; everything else goes into the site's journal, with the operator's notes. */
export function AlertsJournal() {
  const { t } = useT();
  const a = t.alerts;
  return (
    <section className="sec alt" id="alerts">
      <div className="wrap">
        <p className="eyebrow">{a.eyebrow}</p>
        <h2>{a.title}</h2>
        <p className="sub">{a.sub}</p>
        <div className="alerts">
          {/* left: the message that reaches the phone + channels + rules */}
          <Reveal>
            <div className="phone-wrap">
              <div className="phone">
                <div className="phone-bar"><span>{a.phone.time}</span><span className="phone-app"><MessageCircle aria-hidden="true" />Telegram</span></div>
                <div className="tg-msg">
                  <div className="tg-from"><span className="avatar ai"><Bell aria-hidden="true" /></span><b>{a.phone.from}</b></div>
                  <p>{a.phone.text}</p>
                  <div className="tg-actions">
                    {a.phone.actions.map((x, i) => <span key={x} className={i === 0 ? 'pri' : ''}>{x}</span>)}
                  </div>
                </div>
              </div>
              <div className="channels">
                {a.channels.map((c, i) => {
                  const Icon = CHANNEL_ICONS[i];
                  return <span key={c}><Icon aria-hidden="true" />{c}</span>;
                })}
              </div>
              <ul className="rules">
                {a.rules.map((r, i) => {
                  const Icon = RULE_ICONS[i];
                  return <li key={r}><span className="ico g"><Icon aria-hidden="true" /></span>{r}</li>;
                })}
              </ul>
            </div>
          </Reveal>
          {/* right: the journal with the operator's notes */}
          <Reveal>
            <div className="journal">
              <div className="journal-head"><b>{a.journalTitle}</b><span>Kolín — Farma Jih</span></div>
              <ol className="journal-list">
                {a.journal.map(([time, text, kind]) => {
                  const Icon = KIND_ICON[kind as keyof typeof KIND_ICON];
                  return (
                    <li key={time} className={`j-${kind}`}>
                      <time>{time}</time>
                      <span className="j-ico"><Icon aria-hidden="true" /></span>
                      <span>{text}</span>
                    </li>
                  );
                })}
              </ol>
              <div className="note-input" aria-hidden="true">
                <StickyNote />
                <span>{a.notePlaceholder}</span>
                <span className="send"><Send /></span>
              </div>
              <p className="note-hint">{a.noteHint}</p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
