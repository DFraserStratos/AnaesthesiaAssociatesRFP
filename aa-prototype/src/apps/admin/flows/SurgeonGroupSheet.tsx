import { useState } from 'react'
import { accent, neutral, radius } from '../../../theme/tokens'
import type { SurgeonGroup } from '../../../domain/types'
import { compareBySurname } from '../../../domain/surgeons'
import { createSurgeonGroup, editSurgeonGroup, useAppStore, type Actor } from '../../../store'
import { Button, FieldLabel, TextField, useSurface, FormError } from '../../../shared'

/** Add or edit a surgeon group and its members (catch-up Phase 17, US-13.4.1). */
export function SurgeonGroupSheet({ group, actor, onClose }: { group?: SurgeonGroup; actor: Actor; onClose: () => void }) {
  const { Overlay } = useSurface()
  const surgeons = useAppStore((s) => s.masters.surgeons)
  const [name, setName] = useState(group?.name ?? '')
  const [description, setDescription] = useState(group?.description ?? '')
  const [members, setMembers] = useState<readonly string[]>(group?.memberSurgeonIds ?? [])
  const [error, setError] = useState<string | null>(null)
  const options = Object.values(surgeons).sort(compareBySurname)

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
        <div style={{ fontSize: 18, fontWeight: 700 }}>{group === undefined ? 'Add a surgeon group' : 'Edit surgeon group'}</div>
        <TextField label="Name" value={name} onChange={setName} placeholder="e.g. Canterbury Orthopaedic Surgeons" />
        <TextField label="Description (optional)" value={description} onChange={setDescription} />
        <fieldset style={{ border: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <legend style={{ padding: 0, marginBottom: 6 }}><FieldLabel>Members</FieldLabel></legend>
          <div style={{ border: `1px solid ${neutral.line}`, borderRadius: radius.ctl, maxHeight: 240, overflowY: 'auto' }}>
            {options.map((s, i) => (
              <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', fontSize: 14, borderTop: i === 0 ? 'none' : `1px solid ${neutral.line}`, cursor: 'pointer' }}>
                <input type="checkbox" checked={members.includes(s.id)} onChange={() => toggle(s.id)} style={{ accentColor: accent.base, width: 16, height: 16 }} />
                <span>{s.name}</span>
                {s.specialty !== undefined && <span style={{ color: neutral.mist, fontSize: 12.5 }}>{s.specialty}</span>}
              </label>
            ))}
          </div>
        </fieldset>
        <FormError message={error} />
        <Button variant="primary" block onClick={save}>{group === undefined ? 'Add group' : 'Save changes'}</Button>
      </div>
    </Overlay>
  )
}
