import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import App from './App';
import { LangProvider, LANGS, type Lang } from './i18n';

/* Server entry for the build: renders the page in a given language to HTML, which scripts/prerender.mjs writes into
   dist/<lang>/index.html. The browser then hydrates that markup (src/main.tsx), so crawlers that run no JavaScript
   still get the full text. The 3D scene is not part of the markup — it mounts in the browser. */
export { LANGS };
export function render(lang: Lang) {
  return renderToString(
    <StrictMode>
      <LangProvider initialLang={lang}>
        <App />
      </LangProvider>
    </StrictMode>,
  );
}
