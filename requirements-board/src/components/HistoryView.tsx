/**
 * A card's history, read like the anaesthetic chart's time column: times in the gutter, a trace
 * running down beside them with one mark per change (filled: the board, ring: an edit on disk,
 * square: a git commit), and commits ruled across the page like the chart's hour lines. Changes
 * not committed yet turn the trace amber. Newest first; view only.
 */
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react'
import { TEXT_FIELDS, lineCounts, lineDiff, type DiffLine, type FieldChange, type ScreenshotVersion, type TimelineEntry } from '../../shared/history.ts'
import { firstLaneName, parseArtifactRef, type ImageRef, type Item } from '../../shared/types.ts'
import { spotName } from '../artifactIndex.ts'
import { api, historyBlobUrl } from '../api.ts'
import { useCatalogue, type Index } from '../store.ts'
import { typeClass } from '../vocab.ts'
import { ArtifactName, ItemName, StatusLabel } from './bits.tsx'

export const TEXT_LABEL: Record<string, string> = { description: 'Description', acceptance: 'Acceptance criteria', technical: 'Technical discussion', notes: 'Notes', source: 'Diagram source' }

export function HistoryView({ item, index }: { item: Item; index: Index }) {
  const rev = useCatalogue((s) => s.items[item.id]?.rev)
  const pos = useCatalogue((s) => JSON.stringify(s.layout.positions[item.id] ?? null))
  const [entries, setEntries] = useState<TimelineEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Live, like the rest of the board: a save, an agent's edit or a drag adds its entry while open.
  useEffect(() => {
    let live = true
    api
      .itemHistory(item.id)
      .then((r) => live && (setEntries(r.entries), setError(null)))
      .catch((e: Error) => live && setError(e.message))
    return () => {
      live = false
    }
  }, [item.id, rev, pos])

  const changes = entries?.filter((e) => e.type === 'change').length ?? 0
  return (
    <div className="history">
      <h2>{item.title}</h2>
      <h3 className="section-head">
        History {entries && <span className="count">{changes}</span>}
      </h3>
      {error ? (
        <p className="hist-note bad">History could not be read: {error}</p>
      ) : !entries ? (
        <p className="hist-note">Reading history</p>
      ) : !entries.length ? (
        <p className="hist-note">No changes recorded yet. Edits and moves from now on appear here, and so does anything committed to git.</p>
      ) : (
        <Timeline entries={entries} index={index} images={item.images} />
      )}
    </div>
  )
}

function Timeline({ entries, index, images }: { entries: TimelineEntry[]; index: Index; images: ImageRef[] }) {
  const lanes = useCatalogue((s) => s.layout)
  return (
    <HistoryTimeline entries={entries}>
      {(e) => (
        <ul className="hist-changes">
          {e.changes
            .filter((c) => c.field !== 'screenshot')
            .map((c) => (
              <li key={c.field}>
                <ChangeRow change={c} index={index} firstLane={firstLaneName(lanes)} />
              </li>
            ))}
          {e.changes.some((c) => c.field === 'screenshot') && (
            <li>
              <ScreenshotsRow changes={e.changes.filter((c) => c.field === 'screenshot')} images={images} />
            </li>
          )}
        </ul>
      )}
    </HistoryTimeline>
  )
}

export type ChangeEntry = Extract<TimelineEntry, { type: 'change' }>

/**
 * The chart's time column, for any record: day headings, a mark per change on the trace, commits
 * ruled across, the uncommitted run in amber. `children` draws an entry's changes.
 */
export function HistoryTimeline({ entries, children }: { entries: TimelineEntry[]; children: (e: ChangeEntry) => ReactNode }) {
  const firstUncommitted = entries.findIndex((e) => e.type === 'change' && e.uncommitted)
  let day = ''
  return (
    <ol className="hist-list">
      {entries.map((e, i) => {
        const d = dayLabel(e.at)
        const head = d !== day ? <li className="hist-day" key={`d${i}`}>{(day = d)}</li> : null
        if (e.type === 'commit') {
          return (
            <Fragment key={i}>
              {head}
              <li className="hist-commit" title={`${e.commit.sha.slice(0, 7)} by ${e.commit.author}`}>
                <time className="hist-time">{timeLabel(e.at)}</time>
                <span className="hist-commit-label">
                  Committed <q>{e.commit.subject}</q>
                </span>
              </li>
            </Fragment>
          )
        }
        return (
          <Fragment key={i}>
            {head}
            {i === firstUncommitted && <li className="hist-pending-label">Not committed yet</li>}
            <li className={`hist-entry src-${e.source}${e.uncommitted ? ' uncommitted' : ''}`}>
              <time className="hist-time" dateTime={e.at} title={new Date(e.at).toLocaleString('en-NZ')}>
                {timeLabel(e.at)}
              </time>
              <span className="hist-mark" aria-hidden />
              <div className="hist-body">
                <div className="hist-src" title={e.commit ? `${e.commit.sha.slice(0, 7)} by ${e.commit.author}` : undefined}>
                  {sourceLabel(e)}
                </div>
                {e.kind === 'created' ? <p className="hist-row">{e.source === 'git' ? 'Added to the catalogue' : 'Created'}</p> : children(e)}
              </div>
            </li>
          </Fragment>
        )
      })}
    </ol>
  )
}

export function sourceLabel(e: Extract<TimelineEntry, { type: 'change' }>): ReactNode {
  if (e.source === 'git') return <>In git, <q>{e.commit?.subject}</q></>
  if (e.source === 'board') return 'On the board'
  return e.offline ? 'On disk, while the board was off' : 'On disk'
}

export function ChangeRow({ change: c, index, firstLane }: { change: FieldChange; index: Index; firstLane: string }) {
  const [open, setOpen] = useState(false)
  if (TEXT_FIELDS.has(c.field)) {
    const diff = lineDiff(String(c.from ?? ''), String(c.to ?? ''))
    const n = lineCounts(diff)
    return (
      <>
        <button type="button" className="hist-toggle" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <span>{TEXT_LABEL[c.field]}</span>
          <Counts add={n.add} del={n.del} unit="line" />
        </button>
        {open && <Diff lines={diff} />}
      </>
    )
  }
  switch (c.field) {
    case 'title':
      return (
        <p className="hist-row">
          <span className="hist-field">Title</span> <del>{String(c.from)}</del> to <ins>{String(c.to)}</ins>
        </p>
      )
    case 'status':
      return (
        <p className="hist-row">
          <span className="hist-field">Status</span> <StatusLabel status={String(c.from)} /> to <StatusLabel status={String(c.to)} />
        </p>
      )
    case 'parent':
      return (
        <p className="hist-row">
          Moved from <Named id={c.from as string | null} index={index} /> to <Named id={c.to as string | null} index={index} />
        </p>
      )
    case 'swimlane':
      return (
        <p className="hist-row">
          <span className="hist-field">Lane</span> {(c.from as string | null) ?? firstLane} to {(c.to as string | null) ?? firstLane}
        </p>
      )
    case 'order':
      return <p className="hist-row quiet">Reordered among its siblings</p>
    case 'position':
      return <p className="hist-row quiet">{c.to === null ? 'Put back in its story-map place on the Freeform board' : c.from === null ? 'Placed by hand on the Freeform board' : 'Moved on the Freeform board'}</p>
    case 'type':
      return (
        <p className="hist-row">
          <span className="hist-field">Type</span> {String(c.from)} to {String(c.to)}
        </p>
      )
    case 'components':
    case 'sources': {
      const { added, removed } = setDiff(c.from as string[], c.to as string[])
      return (
        <div className="hist-row">
          <span className="hist-field">{c.field === 'components' ? 'Area' : 'Sources'}</span>
          <ul className="hist-lines">
            {added.map((s) => (
              <li key={`+${s}`} className="add">
                {s}
              </li>
            ))}
            {removed.map((s) => (
              <li key={`-${s}`} className="del">
                {s}
              </li>
            ))}
            {!added.length && !removed.length && <li className="quiet">Reordered</li>}
          </ul>
        </div>
      )
    }
    case 'artifacts': {
      const { added, removed } = setDiff((c.from as string[] | undefined) ?? [], (c.to as string[] | undefined) ?? [])
      return (
        <div className="hist-row">
          <span className="hist-field">Artifacts</span>
          <ul className="hist-lines">
            {added.map((ref) => (
              <li key={`+${ref}`} className="add">
                <ArtifactRefName refText={ref} />
              </li>
            ))}
            {removed.map((ref) => (
              <li key={`-${ref}`} className="del">
                <ArtifactRefName refText={ref} />
              </li>
            ))}
            {!added.length && !removed.length && <li className="quiet">Reordered</li>}
          </ul>
        </div>
      )
    }
    case 'related': {
      const { added, removed } = setDiff(c.from as string[], c.to as string[])
      return (
        <div className="hist-row">
          <span className="hist-field">Related</span>
          <ul className="hist-lines">
            {added.map((id) => (
              <li key={`+${id}`} className="add">
                <Named id={id} index={index} />
              </li>
            ))}
            {removed.map((id) => (
              <li key={`-${id}`} className="del">
                <Named id={id} index={index} />
              </li>
            ))}
            {!added.length && !removed.length && <li className="quiet">Reordered</li>}
          </ul>
        </div>
      )
    }
    case 'images': {
      const key = (i: ImageRef) => i.src
      const { added, removed } = setDiff((c.from as ImageRef[]).map(key), (c.to as ImageRef[]).map(key))
      return (
        <p className="hist-row">
          <span className="hist-field">Screenshots</span> {added.length || removed.length ? <Counts add={added.length} del={removed.length} /> : 'captions or order changed'}
        </p>
      )
    }
    default:
      return <p className="hist-row quiet">Other file details changed</p>
  }
}

/** Screenshot files rewritten in place (a re-capture): a disclosure over a before and after of each. */
function ScreenshotsRow({ changes, images }: { changes: FieldChange[]; images: ImageRef[] }) {
  const [open, setOpen] = useState(false)
  const shots = changes.map((c) => ({ from: c.from as ScreenshotVersion, to: c.to as ScreenshotVersion }))
  const name = (src: string) => images.find((i) => i.src === src)?.caption || src.split('/').pop()!
  return (
    <>
      <button type="button" className="hist-toggle" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span>{shots.length === 1 ? 'Screenshot updated' : `${shots.length} screenshots updated`}</span>
        {shots.length === 1 && <span className="quiet hist-shot-name">{name(shots[0]!.to.src)}</span>}
      </button>
      {open && (
        <ul className="hist-shots">
          {shots.map((s) => (
            <li key={s.to.src}>
              {shots.length > 1 && <p className="hist-shot-caption">{name(s.to.src)}</p>}
              <div className="hist-shot-pair">
                <Shot v={s.from} label="Before" />
                <Shot v={s.to} label="After" />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

/** One version of a screenshot, from git or the file on disk; a version never committed and since overwritten is gone. */
function Shot({ v, label }: { v: ScreenshotVersion; label: string }) {
  const [gone, setGone] = useState(false)
  const url = historyBlobUrl(v)
  return (
    <figure className="hist-shot">
      {gone ? (
        <div className="hist-shot-gone">Not kept: this version was never committed</div>
      ) : (
        <a href={url} target="_blank" rel="noreferrer" title={`Open the ${label.toLowerCase()} image full size`}>
          <img src={url} alt={`${label}: ${v.src.split('/').pop()}`} loading="lazy" onError={() => setGone(true)} />
        </a>
      )}
      <figcaption>{label}</figcaption>
    </figure>
  )
}

/** An item named as everywhere else: type icon and title, never the bare ID (unless it no longer exists). */
function Named({ id, index }: { id: string | null; index: Index }) {
  if (!id) return <span className="hist-field">the top level</span>
  const it = index.byId.get(id)
  return it ? (
    <span className={`chip item hist-name ${typeClass(it.type)}`}>
      <ItemName item={it} />
    </span>
  ) : (
    <span className="mono" title="No longer in the catalogue">
      {id}
    </span>
  )
}

/** An artifact link named as everywhere else: its mark, its title and the spot; the bare ref once it is gone. */
function ArtifactRefName({ refText }: { refText: string }) {
  const { id, region } = parseArtifactRef(refText)
  const rec = useCatalogue((s) => s.artifacts[id])
  if (!rec) return <span className="mono">{refText}</span>
  return (
    <span className="chip item hist-name">
      <ArtifactName artifact={rec.data} spot={region ? (spotName(rec, region) ?? region) : null} />
    </span>
  )
}

export function Counts({ add, del, unit }: { add: number; del: number; unit?: string }) {
  return (
    <span className="hist-counts" aria-label={`${add} added, ${del} removed${unit ? ` ${unit}s` : ''}`}>
      {add > 0 && <span className="add">+{add}</span>}
      {del > 0 && <span className="del">−{del}</span>}
      {unit && <span className="quiet">{add + del === 1 ? unit : `${unit}s`}</span>}
    </span>
  )
}

/** Changed lines with one line of context; longer unchanged runs fold to a count. */
export function Diff({ lines }: { lines: DiffLine[] }) {
  const rows = useMemo(() => {
    const near = (i: number) => lines[i - 1]?.op !== 'same' || lines[i + 1]?.op !== 'same'
    const out: (DiffLine | { fold: number })[] = []
    lines.forEach((l, i) => {
      if (l.op !== 'same' || near(i)) out.push(l)
      else {
        const last = out.at(-1)
        if (last && 'fold' in last) last.fold++
        else out.push({ fold: 1 })
      }
    })
    return out
  }, [lines])
  return (
    <div className="hist-diff">
      {rows.map((r, i) =>
        'fold' in r ? (
          <div key={i} className="fold">
            {r.fold} unchanged line{r.fold > 1 ? 's' : ''}
          </div>
        ) : (
          <div key={i} className={r.op}>
            <span className="sign" aria-hidden>
              {r.op === 'add' ? '+' : r.op === 'del' ? '−' : ''}
            </span>
            {r.text || ' '}
          </div>
        ),
      )}
    </div>
  )
}

export function setDiff(from: string[], to: string[]) {
  return { added: to.filter((s) => !from.includes(s)), removed: from.filter((s) => !to.includes(s)) }
}

const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

function dayLabel(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  if (sameDay(d, now)) return 'Today'
  if (sameDay(d, new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1))) return 'Yesterday'
  return d.toLocaleDateString('en-NZ', { weekday: 'short', day: 'numeric', month: 'short', ...(d.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}) })
}

const timeLabel = (iso: string) => new Date(iso).toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit', hour12: false })
