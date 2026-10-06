// Render an SVG to a PNG at its own size, for visual checking.
// Usage (from the repo root): node .claude/skills/aa-svg-diagram/render.mjs <in.svg> [out.png]
// Uses the Playwright install in aa-prototype/ (run `npm --prefix aa-prototype install` if missing).
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '../../..');
const { chromium } = await import(pathToFileURL(resolve(repo, 'aa-prototype/node_modules/playwright/index.mjs')).href);

const input = resolve(process.argv[2] ?? '');
const output = resolve(process.argv[3] ?? input.replace(/\.svg$/, '.png'));
const head = readFileSync(input, 'utf8').slice(0, 600);
const width = Math.ceil(Number(/width="([\d.]+)"/.exec(head)?.[1] ?? 1600));
const height = Math.ceil(Number(/height="([\d.]+)"/.exec(head)?.[1] ?? 1000));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height } });
await page.goto(pathToFileURL(input).href);
await page.screenshot({ path: output });
await browser.close();
console.log(`${output} (${width}×${height})`);
