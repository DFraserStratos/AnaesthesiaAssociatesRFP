Please run catch-up Phase 26 (Anaesthetist profile and bank details) of the Anaesthesia Associates prototype.

Load the run-build-phase skill and follow it for this phase. The phase doc (it keeps its historical file name, phase-26-prepaid-settings-and-profile.md) holds the reads, drift-check stops, work items, checklist, screenshots, demo guide and progress updates; below is only what the doc does not already say.

Also read:
- ROADMAP.md: D64 (prepaid is a Contract setting, nothing about prepayment on the profile, the GST period goes too), the Profile track and the sequencing note "26 needs only U6" (before 38 and 40a).
- PROGRESS.md Decisions log: 2026-07-21 (navigation structures: the web app keeps its four tabs), the 2026-07-23 Phase 07 build decisions (office-only master data), 2026-07-24 Phase 13 (the persona avatar treatment on More), 2026-09-28 (no calculation on the anaesthetist's Booking) and the entries Phases 17 to 25 wrote. Catch-up entries 14 (where the PWA demo-actions chip landed), 17 (the HPI CPN helpers, label and duplicate refusal, the record page, the officePrivate slice, officePrivacy.test.ts) and 28 (the start date on the record page and add form); 22 and 25 if they have landed.
- Maps in analysis/: prototype-map-apps-mobile-web, -admin section 9, -store-seed and -shell-demo-pwa.

Hold to these above all:
- The profile holds the unit value, contact details, registration, HPI CPN and a masked, display-only bank account, nothing else: no GST period, no GST number (22's stays office-held), no prepaid setting. Never write "estimate" or "deposit" anywhere.
- One Anaesthetist record, one unitValue, one hpiId: extend 17's record page with a Profile card, never a second editor; keep Unit $ the third column of the Master data table.
- Privacy: the profile and its selectors read masters only, never the officePrivate slice or a tier or pairing audit entry; the bank number is masked in every audit entry; the shared ProfileRow imports nothing from apps/.
- Seed bank details for all 14 first, then make the HPI CPN and bank details mandatory; seeded numbers come from the registration number on non-issued bank code 99, with no RNG draw. Bank details are master data only: no payout reads or snapshots them.
- List every gstPeriod hit before removing any; no S1 to S5 figure moves; no demo trigger.

Phase goal: give each anaesthetist a profile they can see on mobile and web (contact details, registration, HPI CPN, a masked display-only bank account and the dollar value per unit, which is the only setting they edit), let the office hold and edit it on the Admin record page with every edit audited, and remove the GST period from the prototype everywhere, leaving the GST report in calendar months for Phase 38.
