import { useCatalogue } from '../store.ts'

/** The masthead's quiet note that this is a snapshot, and from when: the commit and board version in its tooltip. */
export function SnapshotMark() {
  const snap = useCatalogue((s) => s.snapshot)
  if (!snap) return null
  const day = new Date(snap.takenAt).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })
  const commit = snap.commit ? `commit ${snap.commit.slice(0, 7)}${snap.dirty ? ' with uncommitted changes' : ''}` : 'no commit'
  return (
    <span className="snapshot-mark" title={`A read-only snapshot taken ${day} · ${commit} · board ${snap.boardVersion}`}>
      Snapshot · {day}
    </span>
  )
}
