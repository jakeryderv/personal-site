import { readFile, writeFile } from 'node:fs/promises';

// Generates the vector source; the committed PNG is rendered from it for social crawlers.

const xmlEscape = (value) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;');

const art = (await readFile(new URL('../src/assets/ascii-headshot.txt', import.meta.url), 'utf8'))
  .trimEnd()
  .split('\n');
const portrait = art
  .map((line, index) => `<tspan x="64" y="${64 + index * 56}">${xmlEscape(line)}</tspan>`)
  .join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
  </defs>
  <rect width="1200" height="630" fill="#161616"/>
  <rect x="54" y="54" width="1092" height="522" rx="18" fill="#0c0c0c" stroke="#353535" stroke-width="2"/>
  <circle cx="92" cy="92" r="8" fill="#ee5396"/>
  <circle cx="120" cy="92" r="8" fill="#08bdba"/>
  <circle cx="148" cy="92" r="8" fill="#25be6a"/>
  <g transform="translate(805 113) scale(.137)" opacity=".82">
    <text fill="#b6b8bb" font-family="DejaVu Sans Mono, ui-monospace, monospace" font-size="48" xml:space="preserve" dominant-baseline="text-before-edge" style="white-space:pre">${portrait}</text>
  </g>
  <g font-family="DejaVu Sans Mono, ui-monospace, monospace">
    <text x="96" y="178" fill="#8d8f91" font-size="27">jake@jvs.sh:~$ whoami</text>
    <text x="96" y="286" fill="#f9fbff" font-size="58" font-weight="700">Jake Van Slyke</text>
    <text x="96" y="358" fill="#b6b8bb" font-size="28">applied AI · robotics</text>
    <text x="96" y="401" fill="#b6b8bb" font-size="28">computer vision</text>
    <text x="96" y="500" fill="#25be6a" font-size="34">&gt;</text>
    <rect x="141" y="468" width="22" height="39" fill="#25be6a"/>
  </g>
</svg>\n`;

await writeFile(new URL('../public/og-image.svg', import.meta.url), svg);
