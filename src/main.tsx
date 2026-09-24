import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App';
import { LangProvider, langInPath } from './i18n';
import '@fontsource-variable/inter'; // Inter served with the site, no request to Google Fonts
import './styles.css';

const root = document.getElementById('root')!;
const app = (
  <StrictMode>
    <LangProvider initialLang={langInPath() ?? undefined}>
      <App />
    </LangProvider>
  </StrictMode>
);
// The language pages come prerendered from the build (scripts/prerender.mjs): hydrate their markup.
// The bare root (and the dev server) start from an empty #root and render here, detecting the language.
if (root.hasChildNodes()) hydrateRoot(root, app);
else createRoot(root).render(app);
