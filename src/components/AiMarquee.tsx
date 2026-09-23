import { siClaude, siAnthropic, siGooglegemini, siMeta, siMistralai, siDeepseek, siPerplexity, siHuggingface, siNvidia, siQwen, siGithubcopilot } from 'simple-icons';
import { useT } from '../i18n';

/* The AI providers and models the dispatcher can run on. OpenAI's mark is drawn from its petal (see AiLogos.tsx);
   the rest come from simple-icons in their brand colours. */
const OPENAI_PETAL =
  'M1107.3 299.1c-197.999 0-373.9 127.3-435.2 315.3L650 743.5v427.9c0 21.4 11 40.4 29.4 51.4l344.5 198.515V833.3h.1v-27.9L1372.7 604c33.715-19.52 70.44-32.857 108.47-39.828L1447.6 450.3C1361 353.5 1237.1 298.5 1107.3 299.1zm0 117.5-.6.6c79.699 0 156.3 27.5 217.6 78.4-2.5 1.2-7.4 4.3-11 6.1L952.8 709.3c-18.4 10.4-29.4 30-29.4 51.4V1248l-155.1-89.4V755.8c-.1-187.099 151.601-338.9 339-339.2z';

type Icon = { path: string; hex: string };
const AI: { name: string; icon?: Icon; openai?: boolean }[] = [
  { name: 'OpenAI', openai: true },
  { name: 'Claude', icon: siClaude },
  { name: 'Anthropic', icon: siAnthropic },
  { name: 'Google Gemini', icon: siGooglegemini },
  { name: 'Meta Llama', icon: siMeta },
  { name: 'Mistral AI', icon: siMistralai },
  { name: 'DeepSeek', icon: siDeepseek },
  { name: 'Qwen', icon: siQwen },
  { name: 'Perplexity', icon: siPerplexity },
  { name: 'Hugging Face', icon: siHuggingface },
  { name: 'NVIDIA', icon: siNvidia },
  { name: 'GitHub Copilot', icon: siGithubcopilot },
];

function Mark({ name, icon, openai }: (typeof AI)[number]) {
  return (
    <span className="brand-mark ai-mark">
      {openai ? (
        <svg viewBox="0 0 2406 2406" aria-hidden="true">
          {[0, 60, 120, 180, 240, 300].map((a) => <path key={a} d={OPENAI_PETAL} fill="#111" transform={`rotate(${a} 1203 1203)`} />)}
        </svg>
      ) : (
        icon && <svg viewBox="0 0 24 24" aria-hidden="true"><path d={icon.path} fill={`#${icon.hex}`} /></svg>
      )}
      {name}
    </span>
  );
}

/** Second ribbon: the AI models behind the dispatcher. Same mechanics as the manufacturer ribbon, scrolling the other way. */
export function AiMarquee() {
  const { t } = useT();
  return (
    <section className="marquee marquee-ai" aria-label={t.marqueeAi.label}>
      <div className="marquee-label">{t.marqueeAi.label}</div>
      <div className="marquee-track">
        <div className="marquee-row reverse">
          {AI.map((b) => <Mark key={b.name} {...b} />)}
          {AI.map((b) => <Mark key={b.name + '-2'} {...b} />)}
        </div>
      </div>
    </section>
  );
}
