# Notes

The inputs that change requirements after the catalogue started: meeting transcripts, workshop
notes, email threads, Q&A. One file per session, named `YYYY-MM-DD-<slug>.md` (the date the input
happened, not when it was filed), so the folder sorts by time. Keep the raw wording; add a short
heading block at the top saying who was there and what it covered.

Notes are evidence, not requirements: they are append only. When a note changes a requirement,
edit the item and add a source that points back here.

## Citing a note from an item

An item's `sources` is an ordered list, oldest origin first. The document the item started from
comes first; every later input that shaped it follows in date order.

```yaml
sources:
  - "Brief p.4 · Bookings › Who can book"
  - "Notes 2026-10-02 · stakeholder workshop"
```

`Notes <date> · <slug in words>` resolves to `notes/<date>-<slug>.md`. Add `#n` to point at a
numbered point inside the note (`"Notes 2026-10-02 · stakeholder workshop #3"`), and the board opens
the note at that point.

## Notes and transcripts are artifacts

Every note here, and every transcript in `../artifacts/files/`, is also registered as an
artifact (`../artifacts/AR-nn.md`, kind `note` or `transcript`), so the Requirements Board shows it
on its Artifacts tab and an item can link straight to a spot in it: a heading
(`AR-05#questions-answered`), a line range as the notes cite transcripts (`AR-04#L27-33`), or a
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
Several at once: `#2 #16`. A note written before this convention can map its older citation shapes
with `cited_as` on its artifact (SCHEMA.md, Artifacts).

## No known source

An item with no source gets an outstanding item of kind `missing-source` in `questions/` that
affects it. To resolve one: find or file the note, add the source to the item, then set the
outstanding item to the status with role `answered` (see `board.config.json`) with a line saying where it came from.
