/**
 * The shared note (catch-up Phase 40; US-11.3.3): one component for all three
 * apps, on the Booking detail and the List detail. An Add note field and the
 * notes, newest first, each with its author and time. Append-only: a note is
 * never edited or removed. Any actor may add one (the anaesthetist on their own
 * List or Booking), through `addSharedNote`, which refuses a blank note.
 *
 * It reads and writes the real store, never a Booking draft (catch-up Phase
 * 35): a note is a message to the other side, sent at once, not a field of the
 * Booking the office saves with Save changes. It sits beside the Booking's own
 * Notes field and the office's List note, which stay as they are.
 * `SharedNotesPanel` is the same UI over plain props (the component catalogue).
 */

import { useState } from 'react'
import { addSharedNote, NOTE_REQUIRED_MESSAGE, SHARED_NOTE_MAX_LENGTH, useAppStore, type Actor, type SharedNoteTarget } from '../../store'
import type { SharedNote } from '../../domain/types'
import { neutral, radius } from '../../theme/tokens'
import { stampText } from '../format'
import { Button } from '../ui/Button'
import { FormError, TextArea } from '../ui/Field'

const NO_NOTES: readonly SharedNote[] = []

export type SharedNotesSize = 'touch' | 'desktop' | 'compact'

/** The notes on a List or Booking, newest first. */
export function useSharedNotes(target: SharedNoteTarget): readonly SharedNote[] {
  const log = useAppStore((s) => ('bookingId' in target ? s.schedule.bookings[target.bookingId]?.noteLog : s.schedule.lists[target.listId]?.noteLog))
  return log === undefined ? NO_NOTES : [...log].reverse()
}

/** The store-wired note on a List (`{ listId }`) or Booking (`{ bookingId }`). */
export function SharedNotes({ target, actor, size = 'desktop' }: { target: SharedNoteTarget; actor: Actor; size?: SharedNotesSize }) {
  const notes = useSharedNotes(target)
  return (
    <SharedNotesPanel
      notes={notes}
      what={'bookingId' in target ? 'Booking' : 'List'}
      size={size}
      onAdd={(text) => {
        const out = addSharedNote(useAppStore, actor, target, text)
        return out.ok ? null : out.message
      }}
    />
  )
}

/**
 * The field and the list. `onAdd` returns the refusal, or null when the note
 * was added (the field then clears). `size`: `touch` on the phone, `desktop`
 * on web, `compact` in the Admin drawer.
 */
export function SharedNotesPanel({
  notes,
  what,
  size = 'desktop',
  onAdd,
}: {
  /** Newest first. */
  notes: readonly SharedNote[]
  what: 'List' | 'Booking'
  size?: SharedNotesSize
  onAdd: (text: string) => string | null
}) {
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  function add() {
    const refusal = onAdd(text)
    setError(refusal)
    if (refusal === null) setText('')
  }

  return (
    <div data-shot="shared-notes" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <TextArea
        ariaLabel={`Add a note to this ${what}`}
        placeholder={`A note the office and the anaesthetist both see on this ${what}`}
        value={text}
        onChange={(v) => {
          setText(v)
          if (error === NOTE_REQUIRED_MESSAGE && v.trim() !== '') setError(null)
        }}
        maxLength={SHARED_NOTE_MAX_LENGTH}
        countTrimmed
        rows={2}
        size={size === 'compact' ? 'compact' : 'field'}
        data-testid="shared-note-input"
      />
      <FormError message={error} variant="inline" />
      <Button variant="secondary" size={size} onClick={add} style={{ alignSelf: size === 'touch' ? 'stretch' : 'flex-start' }} shot="shared-note-add">
        Add note
      </Button>
      {notes.length > 0 && (
        <ul aria-label={`Notes on this ${what}`} style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notes.map((n) => (
            <li key={n.id} data-note-id={n.id} style={{ background: neutral.bg, borderRadius: radius.ctl, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 12, color: neutral.slate }}>
                <span style={{ fontWeight: 600, color: neutral.ink }}>{n.by}</span>
                <span className="mono" style={{ marginLeft: 8 }}>{stampText(n.atISO)}</span>
              </span>
              <span data-aa-selectable style={{ fontSize: size === 'compact' ? 13 : 14, color: neutral.ink, lineHeight: '20px', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                {n.text}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
