# DEMO-SCRIPT.md — pointer to the demo guide hub

Phase 12 mandated a presenter script. Rather than maintain a second competing script here, the demo
material lives in **one hub** (a deliberate deviation from the phase doc's literal "write
DEMO-SCRIPT.md", per the user's single-source-of-truth decision, logged in PROGRESS.md).

## The one runnable script

**[`docs/demo-guide/03-demo-script.md`](../demo-guide/03-demo-script.md)** is the canonical S1 to S5
presenter run-sheet: setup, then each scenario with where to click, the one-line RFP tie-in to say,
and the expected result, plus discovery talking points and a recovering-from-demo-accidents note. A
cold presenter can run the whole demo from that file alone.

## The full learning hub

Everything needed to present as an expert on the RFP, the requirements and the prototype lives in
[`docs/demo-guide/`](../demo-guide/):

- **[master-demo-guide.html](../demo-guide/master-demo-guide.html)** — the primary read: a single
  self-contained page (mental model, personas, workflows, the S1 to S5 script, cheat sheet and RFP
  discovery items) with light tab and collapse navigation. Open it in a browser; no server needed.
- **[README.md](../demo-guide/README.md)** — the hub index and readiness snapshot.
- **[01-personas-and-responsibilities.md](../demo-guide/01-personas-and-responsibilities.md)**
- **[02-workflows-and-handoffs.md](../demo-guide/02-workflows-and-handoffs.md)**
- **[03-demo-script.md](../demo-guide/03-demo-script.md)** — the run-sheet (above).
- **[04-presenter-cheat-sheet.md](../demo-guide/04-presenter-cheat-sheet.md)**

## Driving the demo

The demo control panel (`/demo/control`) is the presenter's cockpit. Its **Scenario jumps (S1 to S5)**
each reset to the pristine seed and stage one scenario, so any scenario can start cold and any mistake
is recovered by re-staging or **Reset demo data**.
