import { createContext, useContext, useEffect, useMemo, useState, Fragment, type MouseEvent, type ReactNode } from 'react';
import { Flag, type Country } from '../components/Flag';
import { en, type Dict } from './en';
import { cs } from './cs';
import { pl } from './pl';
import { uk } from './uk';

export type Lang = 'en' | 'cs' | 'pl' | 'uk';
export const DICTS: Record<Lang, Dict> = { en, cs, pl, uk };
export const LANGS: Lang[] = ['en', 'cs', 'pl', 'uk'];
const KEY = 'lang';
const BASE = import.meta.env.BASE_URL; // "/" — the site is served from the domain root (BASE_PATH in the deploy workflow); always ends with a slash
const isLang = (s: string): s is Lang => (LANGS as string[]).includes(s);

/* Every language lives at its own address, <base><lang>/ — the link itself says which language it opens.
   The build writes a copy of index.html per language (vite.config.ts), so the static host serves those addresses directly. */

/** The address of the page in a given language, e.g. "/uk/". */
export const pathFor = (lang: Lang) => BASE + lang + '/';

/** The language named in the address: "/uk/" → "uk"; null when the address carries none. */
export function langInPath(pathname = location.pathname): Lang | null {
  const rest = pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname.replace(/^\//, '');
  const first = rest.split('/')[0];
  return isLang(first) ? first : null;
}

/** Language for the first render: the address first, then the saved choice, then the browser. */
function detect(): Lang {
  const fromPath = langInPath();
  if (fromPath) return fromPath;
  try {
    const saved = localStorage.getItem(KEY);
    if (saved && isLang(saved)) return saved;
  } catch {
    /* storage may be unavailable */
  }
  const nav = (navigator.language || '').toLowerCase();
  if (nav.startsWith('cs') || nav.startsWith('sk')) return 'cs';
  if (nav.startsWith('pl')) return 'pl';
  if (nav.startsWith('uk')) return 'uk';
  return 'en';
}

/** The current address with the language part swapped, keeping the query and the #anchor. */
const addressFor = (lang: Lang) => pathFor(lang) + location.search + location.hash;

const Ctx = createContext<{ lang: Lang; t: Dict; setLang: (l: Lang) => void }>({ lang: 'en', t: en, setLang: () => {} });

/** The current dictionary for the whole page; the scene reads it through `currentDict` without re-rendering. */
export let currentDict: Dict = en;

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detect);
  const setLang = (l: Lang) => {
    if (l === lang) return;
    setLangState(l);
    try {
      localStorage.setItem(KEY, l);
    } catch {
      /* ignore */
    }
    history.pushState(null, '', addressFor(l)); // a new address without a reload — the scene keeps running
  };
  const t = DICTS[lang];
  currentDict = t;
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = t.meta.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', t.meta.description);
  }, [lang, t]);
  useEffect(() => {
    // opened at the bare root, without a language in the address: show the detected one in the address bar
    if (!langInPath()) history.replaceState(null, '', addressFor(lang));
    // back / forward between the language addresses
    const onPop = () => {
      const l = langInPath();
      if (l) setLangState(l);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const value = useMemo(() => ({ lang, t, setLang }), [lang, t]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useT = () => useContext(Ctx);

/** Renders a dictionary string, turning `**text**` into <b>. */
export function Rich({ text }: { text: string }) {
  const parts = text.split('**');
  return <>{parts.map((p, i) => (i % 2 ? <b key={i}>{p}</b> : <Fragment key={i}>{p}</Fragment>))}</>;
}

/* What the switcher shows: a flag and a country-style code people recognise. The internal codes stay the ISO
   language ones ("cs", "uk" — used for <html lang> and the address), the links say "CZ" and "UA". */
const SHORT: Record<Lang, string> = { en: 'EN', cs: 'CZ', pl: 'PL', uk: 'UA' };
const FLAG: Record<Lang, Country> = { en: 'gb', cs: 'cz', pl: 'pl', uk: 'ua' };

/** Links to the page in each language: a right click copies the address, a plain click switches in place. */
export function LangSwitch() {
  const { lang, setLang } = useT();
  const pick = (l: Lang) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // "open in a new tab" keeps working
    e.preventDefault();
    setLang(l);
  };
  return (
    <nav className="lang" aria-label="Language">
      {LANGS.map((l) => (
        <a key={l} href={pathFor(l)} hrefLang={l} className={l === lang ? 'on' : ''} aria-current={l === lang ? 'page' : undefined} onClick={pick(l)}>
          <Flag of={FLAG[l]} className="sm" />
          {SHORT[l]}
        </a>
      ))}
    </nav>
  );
}
