---
name: transcript-reconciler
description: Reconcile two or more imperfect transcripts of the same recording (Word, Teams, Zoom, Otter, Whisper, Voice Memos and the like) into one speaker-attributed Markdown transcript - the strongest source for who spoke and when, the others for wording, genuine uncertainty marked, nothing summarised - and save it as a reconciled transcript file ready to register as an artifact. Use when the user hands over duplicate transcripts of one meeting and asks to combine, merge, reconcile, clean up or reconstruct them, or when update-requirements receives more than one transcript of the same session.
argument-hint: "<two or more transcript files or pasted text> [meeting name and date] [near-verbatim | readable] [output path]"
---

# Reconcile transcripts of one recording

Reconstructs the best-supported transcript from several imperfect transcriptions of the same
recording. It is still a transcript: it keeps the conversation, it does not summarise it.

Output: one Markdown file, by default
`requirements-board/requirements/artifacts/files/<meeting name> Reconciled Transcript.md`.

## Ground rules

- Every source is evidence about one recording, not a separate document to summarise.
- Keep what people actually said. Fix transcription errors, not speaking style; never turn speech
  into business prose.
- Evidence from the sources beats outside knowledge. Use project context (the catalogue, earlier
  transcripts, glossaries) only to recognise a mis-heard term, never to add content.
- Never resolve genuine uncertainty silently: mark it.
- Keep questions, suggestions, current-state descriptions, proposals, decisions and confirmed
  requirements distinct. A proposal must not read as a decision.
- Don't move, rename or edit the source files. Don't commit or push.

## 1. Inputs (yourself)

1. Collect the sources: file paths (any folder) or pasted text. If there is only one, there is
   nothing to reconcile: say so, and offer a light clean-up instead.
2. Get every source into readable text, in the scratchpad if it needs converting: `.md`, `.txt`,
   `.vtt` and `.srt` read as they are; a PDF reads with Read (`pages` for long ones); a `.docx`
   converts with `textutil -convert txt -output <scratch>/<name>.txt <file>` on macOS, or
   `pandoc -t plain` elsewhere.
3. Read every source in full. Long ones exceed one Read: page through with `offset` and `limit`
   until the end. Note for each: speaker names or not, timestamps or not, length, and its first and
   last exchanges (to confirm they cover the same span).
4. Spot a duplicate: two files with the same speaker labels and wording line for line are one
   source, not two independent readings. Use one and say so in the provenance line.
5. Settle the meeting name, date and participants from the file names, the transcripts and the
   user. Ask only if the name or date can't be inferred. Decide the style: **readable** (default:
   light clean-up of filler and false starts) or **near-verbatim** (keep fillers, false starts and
   repetitions) if the user asks.

## 2. Weigh the sources

For each dimension, pick the strongest source:

- **Speaker attribution and turn boundaries:** normally the source with explicit names and
  timestamps.
- **Wording:** no single winner. Compare passage by passage; prefer the reading best supported by
  agreement between sources and by context.
- **Names, acronyms, domain terms:** repeated occurrences across the transcripts, then project
  context.

Cases:

- One source has names, another doesn't: the named one sets attribution, the other is a second
  reading for wording.
- Both have names and disagree: decide from turn-taking and context; if still ambiguous, mark it.
- Diarisation lumps people together (a room microphone labelled "Alex, Sam or Jo"): keep the
  shared label unless the dialogue makes one person clear (they're addressed by name, they answer a
  question put to them). Explain it in a `> **Speaker note:**` under the provenance line.
- A passage appears in only one source: include it if it clearly belongs to this recording and its
  position can be established. Don't invent matching text to make sources symmetrical.
- More than two sources: weigh them all the same way.

## 3. Reconcile

Small input (under about an hour of recording): do it yourself. Long input: split the recording
into consecutive time segments of 20 to 40 minutes, cut at a topic change where possible, with a
couple of exchanges of overlap. Give each segment to an Agent subagent in parallel, passing the
matching slice of every source (by timestamp, or by distinctive phrases where a source has none),
the rules in sections 2 to 4 and the style, and ask for the reconciled blocks only (no title,
headings optional, reconciliation notes as a separate list). Stitch the segments yourself, removing
the overlap.

For each speaker block:

1. Align corresponding passages by sequence, speaker changes, timestamps and distinctive phrases.
   Don't assume line-for-line alignment.
2. Keep the speaker from the attribution source unless another source clearly disproves it.
3. Combine complementary fragments that are clearly the same utterance.
4. Fix obvious ASR substitutions, homophones, punctuation and sentence boundaries.
5. Remove ASR debris only when it clearly carries no spoken meaning. Keep repetition, hesitation
   or informal phrasing that carries meaning; in readable style, trim ordinary filler.
6. Keep timestamps when the attribution source has them.

Uncertainty:

- `[unclear]` where the wording can't be recovered.
- `[unclear: possibly "term"]` only when a plausible reading helps but isn't certain.
- Two readings that change the meaning: keep both (`[unclear: "forty" or "fourteen"]`), don't
  choose.

Terminology: correct a term only when the correction is strongly supported (an established product
name fixing a phonetically similar ASR error). If something factually wrong was actually said, keep
it as said; a reconciliation note may flag it.

## 4. Write the file

Group the transcript under topical `##` headings that help navigation without reordering it or
implying conclusions the meeting didn't reach. Chronology wins over grouping: a topic that comes
back gets a second heading later.

```markdown
# <Meeting name> — <D Month YYYY> — Reconciled Transcript

> Reconciled from <n> automatic transcriptions of the same <length> recording. The <source> transcript was used for speaker attribution and timestamps; the <other> transcript was used to cross-check wording and correct obvious ASR errors. <Style: speaking style retained with light clean-up | near-verbatim.> Genuine uncertainty is marked rather than guessed.

**Participants:** <Full Name>, <Full Name>

## <Topic heading>

**<Speaker Name> (<h:mm:ss>):** Reconstructed speaker block.

**<Other Speaker> (<h:mm:ss>):** Next block.

## <Next topic heading>

...

## Reconciliation notes

- Which source set attribution and timestamps, and why.
- What the other source(s) added or corrected (a dropped phrase recovered, a passage only one had).
- Terms normalised across the document (acronyms, product names, people's names).
- Where uncertainty remains and how it is marked.
```

- Drop the timestamp part of the speaker label when no source has timestamps.
- Reconciliation notes explain unresolved transcription questions only: not a summary, not
  requirements analysis, unless the user asks.
- Call it a **reconciled transcript**, never verbatim.
- No separate summary unless asked.
- Follow any copy rules the project sets for its documents.

Save to the default path above unless the user names another. If the project has no
`requirements-board/requirements/artifacts/files/`, save beside the first source and say where. If
the file already exists, ask before overwriting it.

## 5. Check

1. **Consistency pass (yourself):** participant names, company and product names, acronyms,
   technical terms and repeated concepts read the same throughout.
2. **Verifier (fresh Agent subagent, adversarial):** give it the sources and the output. For a long
   recording, one verifier per segment. It reports:
   - substantive passages in any source that are missing from the output (not intentionally dropped
     as duplicate or noise), with their location;
   - speaker misattributions;
   - wording changed in meaning, or proposals and questions rewritten as decisions;
   - corrections not supported by the evidence, and uncertainty resolved silently;
   - chronology out of order.
   Fix what it finds, then recheck the fixed spots.
3. Confirm the file renders as clean Markdown (one `#` title, `##` topics, `**Name:**` labels, no
   stray ASR artefacts) and holds the whole recording, first exchange to last.

## 6. Report

Briefly: the file's path, the sources used and which set attribution, its length (speaker blocks
and topics), the count of `[unclear]` marks, and any attribution left ambiguous.

Then the next step:

- On its own: tell the user to register it as an artifact with the `add-artifact` skill (kind
  `transcript`, `--date` the meeting date, a source such as `"Recording YYYY-MM-DD · <meeting>"`),
  so requirements can link to a spot in it.
- Called from `update-requirements`: hand the path back; that skill registers it and digests it into
  a note.
