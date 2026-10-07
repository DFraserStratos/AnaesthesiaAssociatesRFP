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
numbered point inside the note (`"Notes 2026-10-02 · stakeholder workshop #3"`), and the board opens
the note at that point.

## Notes and transcripts are artifacts

Every note here, and every transcript in `../artifacts/files/`, is also registered as an
artifact (`../artifacts/AR-nn.md`, kind `note` or `transcript`), so the Requirements Board shows it
on its Artifacts tab and an item can link straight to a spot in it: a heading
(`AR-11#questions-answered`), a line range as the notes cite transcripts (`AR-04#L27-33`), or a
named highlight. When you file a new note or transcript, register it the same way (the
`add-artifact` skill; `--date` is the day of the session). A transcript also takes `--cited-as` with
the names sources use for it (`Transcript <date> · <name>`, `Recording <date> · <name>`), so
`"Transcript <date> · <name> L27-33"` opens those lines. The note stays where it is: the
artifact only points at it.

## How a citation opens its spot

The board opens each source at the spot it cites (SCHEMA.md, Sources). `Notes <date> · <words> #n`
needs nothing set up: the words find the file, `#n` the point. For that, **points are numbered list
items at the very start of a line** (`16. **Title.** ...`, continuation lines indented), numbered once
across the whole note, never restarting per section, never written as headings or a bold `**16.**`.
Several at once: `#2 #16`.

`2026-09-24-source-notes.md` (AR-09) predates the convention; its `cited_as` maps the older shapes:

| Citation | Opens |
| --- | --- |
| `Q&A 2026-09-24 #n` | point n of its "Q&A with Donald, 2026-09-24" section (its numbering restarts there) |
| `Meeting notes 2026-09 (AA lead administrator)` | its "Meeting notes (AA lead administrator)" section |
| `Diagram: <name>` | the current drawing of that diagram (AR-17 to AR-24), not the description here |
| `Data files (...)` | the NZSA RVG 2021 (AR-16); the fee schedules are in `../../../docs/discovery-reference/Data files/` |
| `Audit 2026-09-24 #n` | nothing (no audit file exists): plain text |

## No known source

An item with no source gets an outstanding item of kind `missing-source` in `questions/` that
affects it. To resolve one: find or file the note, add the source to the item, then set the
outstanding item to `Answered` with a line saying where it came from.
