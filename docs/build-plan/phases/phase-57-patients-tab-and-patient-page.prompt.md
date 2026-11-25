Please run build plan Phase 57 (The Patients tab and the patient's page) of the Anaesthesia Associates (AA) prototype.

This phase runs in Lane C of the build lanes (docs/build-plan/LANES.md). If this session is not the Lane C session inside its worktree (branch lane/c), stop and tell me to paste docs/build-plan/lanes/lane-c.prompt.md instead.

Load the run-build-phase skill and follow it for this phase (1 to 2 sessions: session 1 is work items 1 to 5, session 2 work items 6 to 11). The phase doc's Before you start, Reference, Work items, Demo triggers, Manual test checklist, Demo guide updates, Adversarial review (after build) and PROGRESS.md updates sections hold the phase's reads, drift-check stops, rules and finish items; below is only what the doc does not already say.

Override: commit when green (stage by path; never push). Skip the catalogue screenshot recipes, the demo guide and the capture: the owner's sweep does them.
If the work runs to two sessions, session 1 ends after work item 5, green and committed on lane/c, with a "When done" note in the progress entry naming where session 2 starts; session 2 makes the `57 complete:` commit.

Hold to these above all:
- One pure read, `patientsNeedingOffice`, feeds the Needs follow-up rows, the filter's figure, the People badge (`patientAttentionCount` re-based on it) and the page's Needs the office card: one row per patient, mild warnings in both list and count, no waiting NHI rows.
- No action on a list row: Clear, Done, Keep and Use live only on the patient's page and call the existing audited store actions.
- The 50 cap goes (`PATIENT_SEARCH_LIMIT` deleted, the shared admin `Pager` pages the list); Coming up is the default and no longer appends follow-up patients.
- The patient's page is 53's record pattern, extended by prop, never copied: Details edited in the side panel as one audited `patient.update`, the form fields shared with `EditPatientSheet`, no tabs (the catalogue wins over the design page), the internal id never shown.
- Stay inside Lane C: swap only the Patients tab's and page's elements and the `/admin/patients/follow-up` redirect in the People block; never edit `AdminApp.tsx`, `SideNav.tsx`, the capture recipes, ATLAS or the demo guide.

Phase goal: the Patients tab of People becomes one list, searched by name, NHI or date of birth and paged, with the filters Coming up (the default), Needs follow-up (one row per patient, its reasons on the row: a balance warning, a follow-up due, details that differ) and All. The Needs follow-up count is the People entry's attention count, the three follow-up tables are retired and their old link lands on the filter. A row opens the patient's page, rebuilt on the shared record pattern: the NHI beside the name, Details in the side panel with their own Edit, and the main column holding the alerts with their actions, the invoices across every anaesthetist and the follow-up log, so a patient leaves the list once nothing is left to do.
