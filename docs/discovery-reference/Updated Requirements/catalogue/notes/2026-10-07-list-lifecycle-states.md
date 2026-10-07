# List lifecycle states, 2026-10-07

- **Who:** Donald Fraser (Stratos), working alone.
- **Covered:** a List's lifecycle states. While redrawing the early-project Booking & List lifecycle
  flowchart as [AR-22](../artifacts/AR-22.md), Donald noticed that its DRAFT state described an
  assigned List, while the catalogue now uses Draft List for a List with no anaesthetist. He added a
  new state to separate the two.
- **Inputs gathered here:** Donald's typed decision in a Claude Code session on 2026-10-07, read
  against the List pairing on the hierarchy diagram [AR-17](../artifacts/AR-17.md) and the redrawn
  lifecycle diagram [AR-22](../artifacts/AR-22.md).

Cite a point as `"Notes 2026-10-07 · List lifecycle states #n"`. Points are numbered once across the
whole note. Donald's wording is kept (filler dropped).

## Donald's notes

1. **DRAFT means a Draft List.** "When this diagram was first made, we had this status of a draft
   which was used to describe what's in here: the List is assigned to an anaesthetist and the
   Bookings are created, Bookings remain editable, all that sort of stuff. But we actually have this
   new language within the requirement set where we specifically describe a Draft List as a List
   that's not assigned to an anaesthetist." A List is DRAFT while it has no anaesthetist.
2. **ACTIVE: a List with all five.** Citing AR-17, "A List is a specific pairing of: 1 Anaesthetist,
   1 Surgeon, 1 Hospital, 1 Day, 1 Session (AM or PM). This becomes an active List when it has all
   of these things." Everything the old diagram called DRAFT (Bookings created and editable, the
   anaesthetist completing them and submitting the List) now happens while the List is ACTIVE.
3. **Four states.** "It would go draft, active, submitted, authorised, so this is essentially adding
   in a new status." The lifecycle is DRAFT → ACTIVE → SUBMITTED → AUTHORISED.
4. **The diagram.** AR-22 is updated to show it: a DRAFT panel (no anaesthetist yet: how a Draft List
   arises, shown as unassigned in the Admin App, assigned by an admin or removed or re-dated), then
   ACTIVE (anaesthetist assigned), SUBMITTED and AUTHORISED. Donald asked for the features and
   requirements to use the new language and to point at the diagram.
