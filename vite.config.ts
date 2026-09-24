import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { en } from './src/i18n/en';
import { cs } from './src/i18n/cs';
import { pl } from './src/i18n/pl';
import { uk } from './src/i18n/uk';
import { EMAIL, PHONE, SITE } from './src/company';

const DICTS = { en, cs, pl, uk };
const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

/** Organization + SoftwareApplication for the search engines, in the page's language. */
const jsonLd = (lang: string, description: string) =>
  JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Organization', '@id': 'https://azileon.cz/#organization', name: 'Azileon', url: 'https://azileon.cz', email: EMAIL, telephone: PHONE },
      {
        '@type': 'SoftwareApplication',
        name: 'Battery Dispatcher',
        url: `${SITE}/${lang}/`,
        inLanguage: lang,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        description,
        provider: { '@id': 'https://azileon.cz/#organization' },
      },
    ],
  });
const LD_BLOCK = /<script type="application\/ld\+json">[\s\S]*?<\/script>/;

/* Every language has its own address, <base><lang>/ (see src/i18n/index.tsx). A static host can only serve what exists
   on disk, so after the client build this writes dist/<lang>/index.html for each language: the same page with <html lang>,
   <title>, the description, the canonical, the Open Graph tags and the JSON-LD already in that language — a shared link
   previews in the right language. The hreflang set (English as x-default) is the same on every page and stays as written
   in index.html. The page text itself is filled in afterwards by scripts/prerender.mjs. */
function languagePages(): Plugin {
  let outDir = 'dist';
  let ssr = false;
  return {
    name: 'language-pages',
    apply: 'build',
    configResolved(config) {
      outDir = join(config.root, config.build.outDir);
      ssr = !!config.build.ssr; // the server bundle build has no index.html to copy
    },
    closeBundle() {
      if (ssr) return;
      const rootFile = join(outDir, 'index.html');
      const html = readFileSync(rootFile, 'utf8').replace(LD_BLOCK, `<script type="application/ld+json">${jsonLd('en', en.meta.description)}</script>`);
      writeFileSync(rootFile, html); // the root is canonicalized to /en/, so it carries the English data
      for (const [lang, dict] of Object.entries(DICTS)) {
        const title = escapeHtml(dict.meta.title), description = escapeHtml(dict.meta.description);
        const page = html
          .replace(/<html lang="[^"]*"/, `<html lang="${lang}"`)
          .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
          .replace(/(<meta name="description" content=")[^"]*"/, `$1${description}"`)
          .replace(/(<link rel="canonical" href=")[^"]*"/, `$1${SITE}/${lang}/"`)
          .replace(/(<meta property="og:url" content=")[^"]*"/, `$1${SITE}/${lang}/"`)
          .replace(/(<meta property="og:title" content=")[^"]*"/, `$1${title}"`)
          .replace(/(<meta property="og:description" content=")[^"]*"/, `$1${description}"`)
          .replace(LD_BLOCK, `<script type="application/ld+json">${jsonLd(lang, dict.meta.description)}</script>`);
        mkdirSync(join(outDir, lang), { recursive: true });
        writeFileSync(join(outDir, lang, 'index.html'), page);
      }
    },
  };
}

// BASE_PATH is set by the GitHub Pages workflow (/ on battery.azileon.cz); locally the app runs at / as well.
// `allowedHosts: true` lets tunnels (ngrok etc.) reach the dev and preview servers.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), languagePages()],
  server: { allowedHosts: true },
  preview: { allowedHosts: true },
});
