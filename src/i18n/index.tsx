import { createContext, useContext, useEffect, useMemo, useState, Fragment, type ReactNode } from 'react';
import { en, type Dict } from './en';
import { cs } from './cs';
import { pl } from './pl';
import { uk } from './uk';

/* Internal codes are the ISO language ones ("cs", "uk" — used for <html lang> and the address); the switcher
   (components/LangSwitch.tsx) shows them as country-style "CZ" and "UA" with flags. */
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

/** `initialLang` — the language the page was prerendered in (the server entry passes it; the browser passes the one in the address).
 *  Without it the language is detected from the address, the saved choice and the browser. */
export function LangProvider({ children, initialLang }: { children: ReactNode; initialLang?: Lang }) {
  const [lang, setLangState] = useState<Lang>(() => initialLang ?? detect());
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
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', location.origin + pathFor(lang)); // follows an in-page switch
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
