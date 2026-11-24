# Research: "designed component" libraries and business-block sources

Captured 11 Nov 2026 from the libraries' sites and the GitHub API. **Re-verify before acting.**

**Bottom line:** none of the video's designed-component libraries belongs in this project's unification work
(README principle 1: no new flourishes). They are recorded here so the question doesn't need re-researching.
The useful sources for a business app are shadcn's own blocks and, as reference, ReUI, Tremor and Kibo UI.

## The five from the video

### Beautiful UI (https://beautifului.dev)
21 "primitives for AI-native interfaces" by Turbo (turbodesign.co); licence MIT, (c) 2026 Shane Levine; free
(the studio sells consulting). Copy-paste only: no npm, registry or public repo; demo at /harness. Tailwind,
Next.js site. Components: Loading State, Thinking, Streaming Text, Tool Chips, Task Rows, Approval Card,
Recommendation Card, Chat Composer, Prompt Bar, Search, Context Cards, Diff Table, Records Table, Filter
Table, Insight Cards, Sidebar Nav, Flowchart, Code Block, Fine-tune Card, Selection Actions, Agent Screen.
Polished and restrained, but a one-person studio project with no versioning.
**For us:** reference only, and only if an AI assistant is added (Approval Card + Diff Table suit "assistant
proposes a booking or fee change for a human to approve"). Better-maintained AI options: Vercel AI Elements
(https://vercel.com/changelog/introducing-ai-elements), assistant-ui (https://www.assistant-ui.com), coss ui
chat components.

### RareUI (https://rareui.in)
"50+ animated components" by an individual (Codewithswappy), MIT, own CLI (`npx rareui add`), React 19 /
Next 16 / Tailwind v4 / Framer Motion 12. Liquid and metal buttons, neumorphism, particle cards, vapour text,
3D book. 31 stars, last push Apr 2026. **Skip.**

### Magic UI (https://magicui.design)
Dillion Verma; free library MIT (github.com/magicuidesign/magicui, 23.2k stars, active Nov 2026), Pro $199
one-time. shadcn registry (`npx shadcn add @magicui/number-ticker`). Depends on `motion` 12. Marketing-focused:
Marquee, Bento Grid, Animated List, Dock, Globe, Border Beam, Confetti, Particles, Blur Fade, Number Ticker,
backgrounds, fancy buttons. Caveat from source: Number Ticker counts from 0, hard-codes `en-US`, ignores
reduced motion; none of the motion parts check reduced motion. **Not for unification work.** If motion is ever
wanted, Number Ticker / Animated List / Blur Fade are the only plausible pieces, and all would need fixing.

### Aceternity UI (https://ui.aceternity.com)
Aceternity Labs (Manu Arora). Free 100+ components; paid one-time $169 (1 year) / $199 lifetime / $1,590
team. Copy-paste and shadcn CLI, MCP registry; Tailwind v4 + Motion. Landing-page effects (aurora, beams,
spotlight, 3D cards, parallax). Paid tier closed source. **Skip.**

### 21st.dev (https://21st.dev)
YC-backed community marketplace/registry; shadcn CLI and `npx @21st-dev/cli init --client claude`; per-item
licences; free tier 2 copies a day, paid from about $6 to $8 a month. Magic MCP (github.com/21st-dev/magic-mcp)
apparently replaced by a unified 21st MCP *(sources disagree)*. Quality varies. **Browse for ideas only.**

## Fit check for a calm clinical app

| Candidate | Verdict |
|---|---|
| Number ticker | Not now. Only where a figure already animates; never in tables, invoice lines or figures being checked. |
| Skeleton / shimmer | Use shadcn `Skeleton` (plain pulse) if the real build needs loading states; no shimmer effects. |
| Success / confetti | No confetti. The existing SuccessOverlay tick is the app's one celebration. |
| Bento / dashboard cards | Plain shadcn Card grid; shadcn `dashboard-01` or Tremor/ReUI KPI cards as reference. |
| Marquee | No (hurts reading and a11y). |
| Animated list | No new motion. |
| Blur fade | No new motion. |
| Empty states | shadcn `Empty`, or a lucide icon + one line + one teal action. |
| Login page | shadcn `login-03` / `login-04` (muted background, AA logo, single teal button). |
| Landing-page flash (aurora, meteors, particles, globe, beams, fancy buttons, 3D/tilt, text scramble, typing) | Never. Rainbow/gradient buttons also break the teal-only rule. |

## Business-block sources (found in the research)

- **shadcn blocks** (https://ui.shadcn.com/blocks): MIT, 127.8k stars, active. `dashboard-01`, sidebar-01 to
  16, login-01 to 05, signup, calendar blocks, Charts (Recharts). Since Feb 2026 every block ships in Radix
  and Base UI variants. **The base layer.**
- **Tremor** (https://tremor.so): Vercel acquired Jan 2025, made free. Raw components
  (github.com/tremorlabs/tremor, Apache-2.0, last push Oct 2025); npm package frozen (Jan 2025). Excellent KPI,
  bar list, tracker and chart blocks. **Copy as starting points, don't depend.**
- **coss ui, formerly Origin UI** (https://coss.com/ui): Cal.com's system on Base UI + Tailwind v4,
  `npx shadcn add @coss/ui`, about 53 primitives plus "particles". Scheduling domain, high quality. Monorepo is
  AGPL-3.0: **check licence first.**
- **Kibo UI** (https://www.kibo-ui.com): acquired by Shadcnblocks Oct 2025; MIT (github.com/shadcnblocks/kibo,
  last push May 2026, slowing). Gantt, Calendar, Kanban, Table, Dropzone. **Reference** for theatre-list and
  availability views.
- **ReUI** (https://reui.io): KeenThemes, free MIT (github.com/keenthemes/reui, active Oct 2026), paid Pro.
  React 19, Tailwind v4, Radix and Base UI variants, `@reui` namespace. **Data Grid** (editing, grouping,
  virtualisation), **Filters**, Timeline, Stats blocks. **Best fit for Admin review and master-data tables.**
- **Shadcnblocks** (https://www.shadcnblocks.com): large, mostly paid, mostly marketing blocks.

## Sources
https://beautifului.dev · https://beautifului.dev/license · https://www.drweb.de/beautiful-ui-ki-agenten-bausteine/
· https://rareui.in · https://github.com/Codewithswappy/RareUI · https://magicui.design/docs ·
https://magicui.design/r/number-ticker.json · https://github.com/magicuidesign/magicui ·
https://ui.aceternity.com/pricing · https://21st.dev/pricing · https://github.com/21st-dev/magic-mcp ·
https://ui.shadcn.com/docs/changelog/2026-02-blocks · https://ui.shadcn.com/docs/changelog/2026-01-base-ui ·
https://vercel.com/blog/vercel-acquires-tremor · https://github.com/tremorlabs/tremor ·
https://coss.com/ui/docs/get-started · https://github.com/shadcnblocks/kibo · https://reui.io/docs/get-started
· https://github.com/keenthemes/reui
