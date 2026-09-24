import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { en } from './src/i18n/en';
import { cs } from './src/i18n/cs';
import { pl } from './src/i18n/pl';
import { uk } from './src/i18n/uk';

const SITE = 'https://battery.azileon.cz';
const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

/* Every language has its own address, <base><lang>/ (see src/i18n/index.tsx). A static host can only serve what exists
   on disk, so after the build this writes dist/<lang>/index.html for each language: the same page with <html lang>,
   <title>, the description, the canonical and the Open Graph tags already in that language — a shared link previews
   in the right language. The hreflang set (English as x-default) is the same on every page and stays as written in index.html. */
function languagePages(): Plugin {
  let outDir = 'dist';
  return {
    name: 'language-pages',
    apply: 'build',
    configResolved(config) {
      outDir = join(config.root, config.build.outDir);
    },
    closeBundle() {
      const html = readFileSync(join(outDir, 'index.html'), 'utf8');
      for (const [lang, dict] of Object.entries({ en, cs, pl, uk })) {
        const title = escapeHtml(dict.meta.title), description = escapeHtml(dict.meta.description);
        const page = html
          .replace(/<html lang="[^"]*"/, `<html lang="${lang}"`)
          .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
          .replace(/(<meta name="description" content=")[^"]*"/, `$1${description}"`)
          .replace(/(<link rel="canonical" href=")[^"]*"/, `$1${SITE}/${lang}/"`)
          .replace(/(<meta property="og:url" content=")[^"]*"/, `$1${SITE}/${lang}/"`)
          .replace(/(<meta property="og:title" content=")[^"]*"/, `$1${title}"`)
          .replace(/(<meta property="og:description" content=")[^"]*"/, `$1${description}"`);
        mkdirSync(join(outDir, lang), { recursive: true });
        writeFileSync(join(outDir, lang, 'index.html'), page);
      }
    },
  };
}

// BASE_PATH is set by the GitHub Pages workflow (/battery-dispatcher/); locally the app runs at /.
// `allowedHosts: true` lets tunnels (ngrok etc.) reach the dev and preview servers.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), languagePages()],
  server: { allowedHosts: true },
  preview: { allowedHosts: true },
});
