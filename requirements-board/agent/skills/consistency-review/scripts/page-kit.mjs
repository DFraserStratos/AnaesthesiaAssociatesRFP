// Shared bits for the local review pages: escaping, a tiny Markdown-inline renderer, and the page shell.
export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function inline(s) {
  return esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])_([^_]+)_(?=[\s.,;)]|$)/g, '$1<em>$2</em>')
}

export function shell({ title, css = '', body, script = '', extra = '' }) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
:root{--bg:#f6f7f6;--paper:#fff;--ink:#1d2321;--muted:#5d6763;--faint:#8a938f;--line:#e2e6e4;--teal:#0D6E63;--teal-t:#e3f1ef;
--epic:#E06C00;--feature:#773B93;--story:#009CCC;--artifact:#4B56B0;
--large:#b3261e;--large-t:#fbe9e7;--medium:#9a6700;--medium-t:#fdf3d8;--small:#4d6b2f;--small-t:#eef4e6;
--del:#fbe4e4;--del-ink:#8d1f1f;--ins:#dff3e4;--ins-ink:#1d5e2e;--shadow:0 1px 2px rgba(20,30,25,.06),0 2px 8px rgba(20,30,25,.05)}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]){--bg:#141816;--paper:#1c211f;--ink:#e6ebe8;--muted:#a3aea9;--faint:#76817c;--line:#2d3532;--teal:#4fb8aa;--teal-t:#15312d;
--large:#ff8a80;--large-t:#3a1e1c;--medium:#e8b84a;--medium-t:#352b14;--small:#a5c97f;--small-t:#232e1a;--del:#3d1f1f;--del-ink:#ffb4ab;--ins:#183522;--ins-ink:#9fe0ae;--shadow:none}}
*{box-sizing:border-box}html{scroll-padding-top:72px}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.55 "Hanken Grotesk",system-ui,sans-serif}
code,.mono{font-family:"JetBrains Mono",ui-monospace,monospace;font-size:.86em}
a{color:inherit;text-decoration-color:var(--teal);text-underline-offset:2px}
h1{font-size:26px;margin:0 0 4px;letter-spacing:-.01em}h2{font-size:20px;margin:36px 0 12px}h3{font-size:16px;margin:24px 0 8px}
.wrap{max-width:1080px;margin:0 auto;padding:24px 16px 80px}
.sub{color:var(--muted)}
.pill{display:inline-block;padding:1px 9px;border-radius:999px;font-size:12px;font-weight:600;white-space:nowrap}
.card{background:var(--paper);border:1px solid var(--line);border-radius:10px;box-shadow:var(--shadow)}
input[type=search]{font:inherit;padding:8px 12px;border:1px solid var(--line);border-radius:8px;background:var(--paper);color:var(--ink);width:100%}
button{font:inherit;font-size:13px;font-weight:600;padding:5px 12px;border-radius:7px;border:1px solid var(--line);background:var(--paper);color:var(--ink);cursor:pointer}
button:hover{border-color:var(--teal)}button.primary{background:var(--teal);border-color:var(--teal);color:#fff}
${css}
</style></head><body>
${body}
${script ? `<script>${script}</script>` : ''}
${extra}
</body></html>`
}
