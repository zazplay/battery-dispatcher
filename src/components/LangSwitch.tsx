import { useLayoutEffect, useRef, useState, type MouseEvent } from 'react';
import { Flag, type Country } from './Flag';
import { LANGS, pathFor, useT, type Lang } from '../i18n';

/* Language switcher: links to the page in each language (every language has its own address, so a right click
   copies it and crawlers follow it), a plain click switches in place. The selection is a liquid-glass lens — like
   the AI-note cards on the scene: translucent white, a light rim, a soft shadow — that slides to the chosen
   language with a small spring. */

const SHORT: Record<Lang, string> = { en: 'EN', cs: 'CZ', pl: 'PL', uk: 'UA' };
const FLAG: Record<Lang, Country> = { en: 'gb', cs: 'cz', pl: 'pl', uk: 'ua' };

export function LangSwitch() {
  const { lang, setLang } = useT();
  const rootRef = useRef<HTMLElement>(null);
  const [lens, setLens] = useState({ left: 0, width: 0 }); // 0 wide until measured in the browser (the markup is prerendered)
  const [moving, setMoving] = useState(false); // true from a click until the slide ends: only then the lens animates

  // put the lens over the active link; measure again when the fonts load or the box resizes (label widths change)
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const place = () => {
      const a = root.querySelector<HTMLAnchorElement>(`[data-lang="${lang}"]`);
      if (a) setLens({ left: a.offsetLeft, width: a.offsetWidth });
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(root);
    document.fonts?.ready.then(place);
    return () => ro.disconnect();
  }, [lang]);

  const pick = (l: Lang) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // "open in a new tab" keeps working
    e.preventDefault();
    if (l === lang) return;
    setMoving(true); // same commit as the new position, so the slide is animated; a resize or font load is not
    setLang(l);
  };

  return (
    <nav ref={rootRef} className="lang" aria-label="Language">
      <i className={'lang-lens' + (moving ? ' moving' : '')} style={{ left: lens.left, width: lens.width }} onAnimationEnd={() => setMoving(false)} aria-hidden="true" />
      {LANGS.map((l) => (
        <a key={l} href={pathFor(l)} hrefLang={l} data-lang={l} className={l === lang ? 'on' : ''} aria-current={l === lang ? 'page' : undefined} onClick={pick(l)}>
          <Flag of={FLAG[l]} className="sm" />
          {SHORT[l]}
        </a>
      ))}
    </nav>
  );
}
