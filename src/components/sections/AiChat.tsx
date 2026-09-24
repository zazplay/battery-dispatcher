import { Bot, User, Sparkles, MessageSquare, Hand, ShieldCheck, Send } from 'lucide-react';
import { Reveal } from '../Reveal';
import { Rich, useT } from '../../i18n';

const NOTE_ICONS = [MessageSquare, ShieldCheck, Hand];

/** A chat with the AI assistant, styled like a messenger so it reads as AI at a glance. */
export function AiChat() {
  const { t } = useT();
  return (
    <section className="sec" id="ai">
      <div className="wrap center">
        <p className="eyebrow"><Sparkles aria-hidden="true" /> {t.ai.eyebrow}</p>
        <h2>{t.ai.title}</h2>
        <Reveal>
          <div className="chat-card">
            <div className="chat-head">
              <span className="avatar ai"><Bot aria-hidden="true" /></span>
              <div>
                <b>{t.ai.name}</b>
                <span className="status"><i />{t.ai.status}</span>
              </div>
            </div>
            <div className="chat">
              {t.ai.messages.map((text, i) => {
                const from = i % 2 ? 'ai' : 'user';
                return (
                  <div className={`row ${from}`} key={i}>
                    <span className={`avatar ${from}`}>{from === 'ai' ? <Bot aria-hidden="true" /> : <User aria-hidden="true" />}</span>
                    <div className={`msg ${from}`}>
                      <span className="who">{from === 'ai' ? t.ai.name : t.ai.owner}</span>
                      <Rich text={text} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="chat-input" aria-hidden="true">
              <span>{t.ai.input}</span>
              <span className="send"><Send /></span>
            </div>
          </div>
        </Reveal>
        <div className="notes">
          {t.ai.notes.map((text, i) => {
            const Icon = NOTE_ICONS[i];
            return <span key={text}><Icon aria-hidden="true" />{text}</span>;
          })}
        </div>
      </div>
    </section>
  );
}
