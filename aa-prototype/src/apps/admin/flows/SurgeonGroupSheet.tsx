import { useMemo, useState } from 'react'
import { neutral, radius } from '../../../theme/tokens'
import type { SurgeonGroup } from '../../../domain/types'
import { compareBySurname } from '../../../domain/surgeons'
import { activeSurgeons, createSurgeonGroup, editSurgeonGroup, useAppStore, type Actor } from '../../../store'
import { retiredLabel } from '../../../domain/masterLifecycle'
import { Button, FieldLabel, TextField, useSurface, FormError } from '../../../shared'
import { OverlayHeader, SheetActions } from '../../../shared/surface'
import { Checkbox } from '../../../shared/ui'
import { surgeonSpecialtyLabel } from '../../../domain/specialties'
import { RetireSection } from '../screens/masters/chrome'

/** Add or edit a surgeon group and its members (catch-up Phase 17, US-13.4.1). */
export function SurgeonGroupSheet({ group, actor, onClose }: { group?: SurgeonGroup; actor: Actor; onClose: () => void }) {
  const { Overlay } = useSurface()
  const surgeons = useAppStore((s) => s.masters.surgeons)
  const specialties = useAppStore((s) => s.masters.specialties)
  const [name, setName] = useState(group?.name ?? '')
  const [description, setDescription] = useState(group?.description ?? '')
  const [members, setMembers] = useState<readonly string[]>(group?.memberSurgeonIds ?? [])
  const [error, setError] = useState<string | null>(null)
  // Active surgeons, plus any retired surgeon already in the group (labelled), so an edit never drops a member silently.
  const options = useMemo(() => {
    const current = group?.memberSurgeonIds ?? []
    const active = activeSurgeons({ masters: { surgeons } })
    const kept = current.map((id) => surgeons[id]).filter((s): s is NonNullable<typeof s> => s !== undefined && !active.includes(s))
    return [...active, ...kept].sort(compareBySurname)
  }, [surgeons, group])

  function toggle(id: string) {
    setMembers((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]))
  }

  function save() {
    const fields = { name, description, memberSurgeonIds: members }
    const outcome = group === undefined ? createSurgeonGroup(useAppStore, actor, fields) : editSurgeonGroup(useAppStore, actor, group.id, fields)
    if (!outcome.ok) { setError(outcome.message); return }
    onClose()
  }

  return (
    <Overlay open onClose={onClose}>
      <div data-shot="surgeon-group-sheet" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <OverlayHeader title={group === undefined ? 'Add a surgeon group' : 'Edit surgeon group'} />
        <TextField label="Name" value={name} onChange={setName} placeholder="e.g. Canterbury Orthopaedic Surgeons" />
        <TextField label="Description (optional)" value={description} onChange={setDescription} />
        <fieldset style={{ border: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <legend style={{ padding: 0, marginBottom: 6 }}><FieldLabel>Members</FieldLabel></legend>
          <div style={{ border: `1px solid ${neutral.line}`, borderRadius: radius.ctl, maxHeight: 240, overflowY: 'auto' }}>
            {options.map((s, i) => (
              <Checkbox key={s.id} checked={members.includes(s.id)} onChange={() => toggle(s.id)} style={{ gap: 10, padding: '9px 12px', fontSize: 14, borderTop: i === 0 ? 'none' : `1px solid ${neutral.line}` }}>
                <span>{retiredLabel(s.name, s)}</span>
                <span style={{ color: neutral.mist, fontSize: 12.5 }}>{surgeonSpecialtyLabel({ specialties }, s)}</span>
              </Checkbox>
            ))}
          </div>
        </fieldset>
        <FormError message={error} />
        <SheetActions primary={<Button variant="primary" block onClick={save}>{group === undefined ? 'Add group' : 'Save changes'}</Button>} />
        {group !== undefined && <RetireSection kind="surgeonGroup" id={group.id} actor={actor} onDone={onClose} />}
      </div>
    </Overlay>
  )
}
