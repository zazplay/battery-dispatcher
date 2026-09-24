// Fills dist/<lang>/index.html with the page rendered in that language (npm run build runs this last).
// Needs the server bundle from `vite build --ssr src/entry-server.tsx --outDir .tmp/ssr`.
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const { render, LANGS } = await import(pathToFileURL('.tmp/ssr/entry-server.js').href);
const EMPTY_ROOT = '<div id="root"></div>';

for (const lang of LANGS) {
  const file = `dist/${lang}/index.html`;
  const html = readFileSync(file, 'utf8');
  if (!html.includes(EMPTY_ROOT)) throw new Error(`${file}: no empty #root to fill`);
  const markup = render(lang);
  writeFileSync(file, html.replace(EMPTY_ROOT, `<div id="root">${markup}</div>`));
  console.log(`prerendered ${file} — ${(markup.length / 1024).toFixed(0)} kB of markup`);
}
