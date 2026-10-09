import { useMemo, useState } from 'react'
import { accent, neutral, radius } from '../../../theme/tokens'
import { STATUS_COLOUR_TOKENS, type SlotStatus, type StatusColourToken, type StatusTreatment } from '../../../domain/types'
import { validateSlotStatusDraft, type SlotStatusDraft } from '../../../domain/slotStatus'
import { addSlotStatus, editSlotStatus, useAppStore, type Actor } from '../../../store'
import { resolveStatusVisual, STATUS_PALETTE } from '../../../theme/statusColours'
import { blockFill, Button, FieldLabel, FormError, Segmented, StatusChipView, TextArea, TextField, useSurface } from '../../../shared'

const TREATMENTS: { value: StatusTreatment; label: string }[] = [
  { value: 'solid', label: 'Solid' },
  { value: 'hatched', label: 'Hatched' },
  { value: 'dashed', label: 'Dashed' },
]

function draftOf(status: SlotStatus | undefined): SlotStatusDraft {
  if (status === undefined) {
    return { label: '', longLabel: '', description: '', colour: 'unavailable', treatment: 'hatched', bookable: false, anaesthetistCanSet: true, isDefault: false }
  }
  return {
    label: status.label,
    longLabel: status.longLabel,
    description: status.description,
    colour: status.colour,
    treatment: status.treatment,
    bookable: status.bookable,
    anaesthetistCanSet: status.anaesthetistCanSet,
    isDefault: status.isDefault === true,
  }
}

/**
 * Add or edit an availability status (catch-up Phase 29; US-01.2.2). The ID is
 * shown read only (assigned when saved, then fixed); the label, long label,
 * description, colour (one of the design's six tokens), fill and the two flags
 * are editable, with a live preview of the chip and a session block. The
 * validator's messages show inline as the admin types.
 */
export function SlotStatusSheet({ status, actor, onClose }: { status?: SlotStatus; actor: Actor; onClose: () => void }) {
  const { Overlay } = useSurface()
  const statuses = useAppStore((s) => s.masters.slotStatuses)
  const [draft, setDraft] = useState<SlotStatusDraft>(() => draftOf(status))
  const [error, setError] = useState<string | null>(null)
  const [touched, setTouched] = useState(false)
  const visual = resolveStatusVisual(draft)
  const issues = useMemo(
    () => validateSlotStatusDraft(draft, statuses, status !== undefined ? { key: status.key } : {}),
    [draft, statuses, status],
  )

  function set<K extends keyof SlotStatusDraft>(key: K, value: SlotStatusDraft[K]) {
    setTouched(true)
    setError(null)
    setDraft((d) => ({ ...d, [key]: value }))
  }

  function save() {
    const outcome = status === undefined ? addSlotStatus(useAppStore, actor, draft) : editSlotStatus(useAppStore, actor, status.key, draft)
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    onClose()
  }

  const previewLabel = draft.label.trim() === '' ? 'Label' : draft.label.trim()
  const previewLong = draft.longLabel.trim() === '' ? 'Long label' : draft.longLabel.trim()

  return (
    <Overlay open onClose={onClose}>
      <div data-shot="admin-availability-status-sheet" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{status === undefined ? 'Add an availability status' : `Edit ${status.label}`}</div>
          <div style={{ fontSize: 13, color: neutral.slate, marginTop: 2 }}>
            Rules read the ID, so a new name or colour changes how it looks, never how it behaves.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: neutral.bg, borderRadius: radius.ctl, padding: '10px 12px' }}>
          <FieldLabel>ID</FieldLabel>
          <span className="mono" data-shot="status-sheet-id" style={{ fontSize: 13, color: status === undefined ? neutral.mist : neutral.ink }}>
            {status === undefined ? 'Assigned when saved' : status.key}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 12 }}>
          <TextField label="Label" value={draft.label} onChange={(v) => set('label', v)} placeholder="e.g. Lecturing" hint="On chips, up to 16 characters." />
          <TextField label="Long label" value={draft.longLabel} onChange={(v) => set('longLabel', v)} placeholder="e.g. Teaching or lecturing" hint="In headers and pickers, up to 32." />
        </div>
        <TextArea label="Description" value={draft.description} onChange={(v) => set('description', v)} placeholder="What this status means, in a sentence." />

        <fieldset style={{ border: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <legend style={{ padding: 0, marginBottom: 8 }}><FieldLabel>Colour</FieldLabel></legend>
          <div role="group" aria-label="Colour" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
            {STATUS_COLOUR_TOKENS.map((token) => (
              <Swatch key={token} token={token} selected={draft.colour === token} onSelect={() => set('colour', token)} />
            ))}
          </div>
        </fieldset>

        <Segmented label="Fill" value={draft.treatment} options={TREATMENTS} onChange={(v) => set('treatment', v)} />

        <div style={{ display: 'flex', flexDirection: 'column', border: `1px solid ${neutral.line}`, borderRadius: radius.ctl }}>
          <Check
            label="Open for bookings"
            hint="The office may place a List here and the finders count it as free."
            checked={draft.bookable}
            onChange={(v) => set('bookable', v)}
          />
          <Check
            label="Anaesthetists can set this"
            hint="Offered in the anaesthetists' availability calendar."
            checked={draft.anaesthetistCanSet}
            onChange={(v) => set('anaesthetistCanSet', v)}
            divided
          />
          <Check
            label="Default for new sessions"
            hint="Every new session starts here, and a removed day off returns to it."
            checked={draft.isDefault}
            onChange={(v) => set('isDefault', v)}
            divided
          />
        </div>

        <div data-shot="status-sheet-preview" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <FieldLabel>Preview</FieldLabel>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.ctl, background: neutral.bg }}>
            <StatusChipView visual={visual} label={previewLabel} style={{ flex: 'none' }} />
            <span style={{ flex: 1, minWidth: 0, display: 'block', borderRadius: 6, padding: '6px 9px', ...blockFill(visual) }}>
              <span style={{ display: 'block', fontSize: 11, fontWeight: 600, color: visual.onTint }}>{previewLong}</span>
              <span style={{ display: 'block', fontSize: 10, color: visual.onTint, opacity: 0.75 }}>AM · a session with no List</span>
            </span>
          </div>
        </div>

        {touched && issues.length > 0 && error === null && (
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: neutral.slate, lineHeight: '18px' }}>
            {issues.map((i) => <li key={i}>{i}</li>)}
          </ul>
        )}
        <FormError message={error} />
        <Button variant="primary" block onClick={save} disabled={issues.length > 0}>
          {status === undefined ? 'Add status' : 'Save changes'}
        </Button>
      </div>
    </Overlay>
  )
}

function Swatch({ token, selected, onSelect }: { token: StatusColourToken; selected: boolean; onSelect: () => void }) {
  const p = STATUS_PALETTE[token]
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`Colour ${token}`}
      data-swatch={token}
      onClick={onSelect}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        padding: '10px 4px 8px',
        borderRadius: radius.ctl,
        border: selected ? `2px solid ${accent.base}` : `1px solid ${neutral.line}`,
        margin: selected ? 0 : 1,
        background: neutral.surface,
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      <span aria-hidden style={{ width: 28, height: 20, borderRadius: 6, background: p.tint, borderLeft: `4px solid ${p.solid}` }} />
      <span className="mono" style={{ fontSize: 10.5, color: selected ? accent.pressed : neutral.slate }}>{token}</span>
    </button>
  )
}

function Check({ label, hint, checked, onChange, divided }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void; divided?: boolean }) {
  return (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderTop: divided === true ? `1px solid ${neutral.line}` : 'none', cursor: 'pointer' }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ accentColor: accent.base, width: 16, height: 16, marginTop: 2 }} />
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 12, color: neutral.mist }}>{hint}</span>
      </span>
    </label>
  )
}
