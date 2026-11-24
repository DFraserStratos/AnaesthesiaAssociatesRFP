Please run requirements catch-up Phase 43b (Support: the help line for app users and product support for AA) of the Anaesthesia Associates (AA) prototype.

Load the run-build-phase skill and follow it for this phase (1 session, track: NFR). The phase doc's Before you start, Reference, Work items, Demo triggers, Manual test checklist, Demo guide updates, Catalogue screenshots, Adversarial review (after build) and PROGRESS.md updates sections hold the phase's reads, drift-check stops, rules and finish items; below is only what the doc does not already say.

Also read:
- The PROGRESS entries of Phases 42 (the public-holiday names), 43a (what it left on the More tab and the navs) and U2 (where `SidePanel` lives).

Hold to these above all:
- One config: the hours, phone line, both response tables, holiday kinds and Christmas window live in SUPPORT_CONFIG (domain/support.ts); an 8:00am start on one channel is a one-line change, and no hour is retyped elsewhere.
- Time comes only from the demo clock and 42's calendar; the triggers move the clock forward only, and the panel reads closed at the seed's 8:00am.
- Two tables, never crossed: help line P3 is 4 hours, product support P3 is 3 business days; after hours only a security breach or the platform offline is answered on the help line.
- One panel body in shared/support, hosted by the one SidePanel (moved to shared/surface) and a BottomSheet; nothing imported from apps/admin or apps/web, and the PWA purity test unchanged.
- Say "help line", never "help desk"; simulated and badged once, with no ticketing, SLA or incident-process claim; no provisional label on answered items.

Phase goal: a Help entry in the mobile More tab (and the PWA), the web top nav and the Admin side nav opens one support panel with the phone line, the hours (8:30am to 5:00pm NZT, weekdays, excluding national public holidays, from one config value), the P1 to P4 response times, whether the line is open at the demo clock's moment and a request form that logs an audited ticket tracked Logged, Responded, Closed, with out-of-hours requests answered only for a security breach or the platform offline. Admin's panel adds a Product support tab for incident, fix, change and new-feature tickets with its own response table, best effort after hours, a public-holiday call-out that waits for AA's approval and limited Christmas cover, all simulated and badged.
