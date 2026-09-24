# Notes

The inputs that change requirements after the RFP: meeting transcripts, workshop notes, email
threads, Q&A. One file per session, named `YYYY-MM-DD-<slug>.md` (the date the input happened, not
when it was filed), so the folder sorts by time. Keep the raw wording; add a short heading block at
the top saying who was there and what it covered.

Notes are evidence, not requirements: they are append only. When a note changes a requirement,
edit the item and add a source that points back here.

## Citing a note from an item

An item's `sources` is an ordered list, oldest origin first. The RFP comes first when the item
started there; every later input that shaped it follows in date order.

```yaml
sources:
  - "RFP p.24 · Billing Engine › The three components"
  - "RFP p.25 · Billing Engine › Modifying units in detail"
  - "Notes 2026-10-02 · stakeholder workshop"
```

`Notes <date> · <slug in words>` resolves to `notes/<date>-<slug>.md`. Add `#n` to point at a
numbered point inside the note (`"Notes 2026-10-02 · stakeholder workshop #3"`).

## Older citations

`2026-09-24-source-notes.md` predates this convention. These existing citation shapes all resolve
to it:

| Citation | Section of `2026-09-24-source-notes.md` |
| --- | --- |
| `Meeting notes 2026-09 (AA lead administrator)` | Meeting notes (AA lead administrator) |
| `Diagram ...` | Future-state diagrams supplied |
| `Q&A 2026-09-24 #n` | Q&A with Donald, 2026-09-24, point n |
| `Data files (...)` | `../../../Data files/` (fee schedules, NZSA RVG 2021) |

## No known source

An item with no source gets an outstanding item of kind `missing-source` in `questions/` that
affects it. To resolve one: find or file the note, add the source to the item, then set the
outstanding item to `Answered` with a line saying where it came from.
