import { createContext, useContext, useEffect, useMemo, useState, Fragment, type ReactNode } from 'react';
import { en, type Dict } from './en';
import { cs } from './cs';
import { pl } from './pl';
import { uk } from './uk';

export type Lang = 'en' | 'cs' | 'pl' | 'uk';
export const DICTS: Record<Lang, Dict> = { en, cs, pl, uk };
const LANGS: Lang[] = ['en', 'cs', 'pl', 'uk'];
const KEY = 'lang';

function detect(): Lang {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved && LANGS.includes(saved as Lang)) return saved as Lang;
  } catch {
    /* storage may be unavailable */
  }
  const nav = (navigator.language || '').toLowerCase();
  if (nav.startsWith('cs') || nav.startsWith('sk')) return 'cs';
  if (nav.startsWith('pl')) return 'pl';
  if (nav.startsWith('uk')) return 'uk';
  return 'en';
}

const Ctx = createContext<{ lang: Lang; t: Dict; setLang: (l: Lang) => void }>({ lang: 'en', t: en, setLang: () => {} });

/** The current dictionary for the whole page; the scene reads it through `currentDict` without re-rendering. */
export let currentDict: Dict = en;

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detect);
  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(KEY, l);
    } catch {
      /* ignore */
    }
  };
  const t = DICTS[lang];
  currentDict = t;
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const value = useMemo(() => ({ lang, t, setLang }), [lang, t]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useT = () => useContext(Ctx);

/** Renders a dictionary string, turning `**text**` into <b>. */
export function Rich({ text }: { text: string }) {
  const parts = text.split('**');
  return <>{parts.map((p, i) => (i % 2 ? <b key={i}>{p}</b> : <Fragment key={i}>{p}</Fragment>))}</>;
}

/* What the switcher shows. The internal code stays the ISO one ("uk" — used for <html lang>), the button says "UA". */
const SHORT: Record<Lang, string> = { en: 'EN', cs: 'CS', pl: 'PL', uk: 'UA' };

export function LangSwitch() {
  const { lang, setLang } = useT();
  return (
    <div className="lang" role="group" aria-label="Language">
      {LANGS.map((l) => (
        <button key={l} type="button" className={l === lang ? 'on' : ''} aria-pressed={l === lang} onClick={() => setLang(l)}>
          {SHORT[l]}
        </button>
      ))}
    </div>
  );
}
