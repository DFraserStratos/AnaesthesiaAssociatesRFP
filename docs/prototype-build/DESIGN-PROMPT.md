# Claude Design — visual language brief

> **✅ COMPLETE (21 Jul 2026).** This prompt has been run. The outputs live in **`Design/` at the
> repo root**: `Design Language.dc.html` (the token source of truth), `Mobile App.dc.html`
> (Forward Lists → List detail → Card/BTM tap-through), `Mobile Availability.dc.html`,
> `Web Dashboard.dc.html`, `Web Availability.dc.html`, `Admin Day.dc.html`,
> `Admin Review.dc.html`, plus `ios-frame.jsx` (reusable iOS device-frame component).
> These are now the **authoritative visual reference** for the build — see PROGRESS.md
> conventions 16–17 and the per-phase design references in the phase docs. Keep this file for
> re-runs/iteration only.

**How to use (for iteration):** paste the prompt below into a Claude Design session. It is fully
self-contained — the design session doesn't need repo access. After iterating:

1. Save the exported mockups into `Design/` at the repo root (overwriting the page being revised).
2. If tokens changed, update `src/theme/` (or Phase 00's plan if not yet built).
3. Record any changed pattern decisions in `PROGRESS.md`'s Decisions log.

---

## The prompt

```
I'm building a demo prototype of a practice-management platform for Anaesthesia Associates (AA) —
a Christchurch, NZ company that handles booking and billing for ~85 independent anaesthetists.
Before any build work starts, I want you to set the visual language: a design system direction and
six sample pages (two per app) I can hand to developers as the definitive reference.

## The product, briefly

One React prototype containing three apps behind an app switcher:

1. **Anaesthetist Mobile App** — the primary interface. Doctors check their upcoming half-day
   theatre sessions ("Lists" — every day has an AM and PM list), open patient appointment "Cards",
   and on procedure day capture billing data ("BTM": a base procedure code, timed units from
   start/handover times, and modifier units — with a live computed fee). When a list's cards are
   all complete they tap "Completed" to submit it to the office. Used in theatre corridors, often
   one-handed, by users of varying IT confidence.
2. **Anaesthetist Web App** — the desktop twin. A dashboard (week calendar strip, receivables
   aging, productivity stats, leave, and a "who's free" locum panel), a lists table, an
   all-anaesthetists availability grid used to find cover at short notice, and an overdue-accounts
   table.
3. **Admin Web App** — office staff. A dense one-day dashboard (one row per anaesthetist,
   07:00–18:00 columns, AM/PM session blocks colour-coded by status with hospital/surgeon labels),
   plus a review queue where submitted lists are sanity-checked and authorised for billing.

Everything is scheduled around a six-colour status language that must stay consistent across all
three apps: Private, Public, Pre-op Assessment, Holiday, Unavailable, Free. (The legacy system
used saturated blue/dark-blue/orange/red/yellow/green — modernise the palette but keep six
instantly distinguishable semantic colours; Free should read as inviting/positive, Holiday and
Unavailable as clearly "not bookable".)

## Aesthetic direction

- **Slick, clean, modern — not flashy.** Calm, clinical confidence. Generous whitespace, strong
  typographic hierarchy, restrained colour (neutrals + one accent, with the six status colours
  doing the semantic work). No gradients-for-gradients'-sake, no glassmorphism, no dark-mode-first
  drama. Think premium healthcare SaaS, not fintech landing page.
- **Functional first.** Ease of use is the client's headline requirement — some users "aren't
  comfortable with modern IT". Large targets, obvious affordances, labels over icons alone,
  minimal typing. Density is welcome on the admin day-grid (office power users), but never at the
  cost of scannability.
- **Hints of delight in the actions, not the chrome.** Delight lives in feedback moments: a
  satisfying tick + subtle haptic-style pulse when a card is marked complete, the fee counter
  ticking up as time units accrue, a list row settling into its "submitted" state, a gentle
  confetti-free success state when a list is authorised. Micro-transitions of 150–250ms, natural
  easing. Never animation that delays a task.

## Mobile must feel mobile-first, not a web app in a phone shell

This matters a lot. The mobile app renders inside a fixed phone frame (390×844 logical px,
displayed centred on a grey backdrop on a desktop screen for demos), but its interaction grammar
must be genuinely native-feeling:

- **Drawers and sheets, not modals.** Detail and actions arrive as bottom sheets sliding up, or
  cards/panels pushing in from the right with a parallax hint on the underlying view. Nothing
  should appear as a centred desktop modal with a dimmed backdrop-and-X.
- **Cards come to you.** Opening a patient Card should feel like the card physically slides/expands
  into place; going back swipes/slides it away. Show the transition choreography in the mockups.
- **Bottom tab bar** for primary nav (Lists, Availability, Balances, More), thumb-reachable
  primary actions, sticky contextual action bar (e.g. the "Completed" submit button) at the bottom
  of a list's card stack.
- **Steppers, chips, segmented controls and pickers** over dropdowns and text inputs wherever
  possible (e.g. ASA score as a segmented control, modifier codes as tappable chips, time capture
  via big "Start Now" / "Finish Now" buttons with editable stamps).
- The two web apps, by contrast, are proper desktop layouts (top-nav for the anaesthetist web app,
  side-nav for admin) — comfortable information density, hover states, keyboard-friendly tables.

## What to produce

First, a **one-screen design-language summary**: palette (neutrals, accent, the six status
colours, semantic success/warning/error), type scale and face pairing, spacing/radius/elevation
system, and 3–4 named motion patterns (sheet-in, card-advance, complete-tick, value-tick) with
durations/easings. Make it precise enough that a developer can transcribe it into design tokens.

Then **six high-fidelity sample pages** (interactive HTML where the interactions matter):

1. **Mobile — Forward Lists** (home): day-grouped list rows (AM/PM rhythm visible), status
   accents, card-count badges, a "completed, unbilled" state on one list, filter chips
   (Week/Month/To-Do/Done), bottom tab bar.
2. **Mobile — Card detail with BTM capture**: patient header (name, NHI, DOB, operation), then the
   capture flow: ASA segmented control, searchable procedure-code field, Start Now/Finish Now,
   B/T/M unit steppers, live total-units + fee readout, notes, and the "mark complete" moment —
   show the sheet/transition behaviour and the completion micro-delight.
3. **Web — Anaesthetist dashboard**: welcome header, week calendar strip (7 days × AM/PM,
   status-coloured), receivables aging panel, productivity panel, leave list, "unassigned
   anaesthetists next 5 days" locum panel.
4. **Web — Availability grid**: date picker + grid of ~14 anaesthetists × AM/PM with status
   colours and annotations; free sessions visually inviting (this screen's job: find cover in
   under 10 seconds).
5. **Admin — One-day dashboard**: the dense grid (14+ anaesthetist rows × hour columns, coloured
   session blocks with hospital/surgeon text, a couple of annotation notes and warning flags),
   legend, mini-calendar, day navigation, internal-notes panel. Prove density and calm can coexist.
6. **Admin — List authorisation review**: a submitted list's cards in a review table (patient,
   route, contract, code, times, units, flags on oddities), with "Authorise" as the confident
   primary action and "Log phone note" secondary — plus the locked/authorised success state.

Use realistic NZ demo data: anaesthetist names like "Dr Melanie Souter", hospitals "St George's",
"Southern Cross", "Forte Health", "Christchurch Eye Surgery"; NHI-style IDs (e.g. ZAA0067);
procedures like "Left total hip replacement"; fees in NZD. All data fictional.

Start with the design-language summary and the two mobile pages — mobile is the flagship and its
interaction grammar sets the tone. Then we'll iterate before doing the web/admin pages.
```
