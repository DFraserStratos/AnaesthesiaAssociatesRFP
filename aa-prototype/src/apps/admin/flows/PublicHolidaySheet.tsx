import { useEffect, useMemo, useState } from 'react'
import { plural } from '../../../shared/format'
import { OverlayHeader, SheetActions } from '../../../shared/surface'
import { neutral } from '../../../theme/tokens'
import { addPublicHoliday, editPublicHoliday, listsFlaggedByPublicHoliday, useAppStore, type Actor } from '../../../store'
import { Button, FormError, TextField, useSurface } from '../../../shared'
import { Segmented } from '../../../shared/ui'
import type { PublicHoliday } from '../../../domain/types'
import { ChipMultiSelect } from '../components/ChipMultiSelect'

interface Props {
  open: boolean
  actor: Actor
  /** Edit mode: the public holiday to change. Absent: add one. */
  publicHolidayId?: string
  onClose: () => void
  /** The result line, in 30's shape, for the view to show once the sheet closes. */
  onDone: (line: string) => void
}

type Kind = PublicHoliday['kind']

const DEFAULT_REGION = 'Canterbury'

/** "Christchurch Public", "St George's and Southern Cross", "A, B and C". */
function names(list: readonly string[]): string {
  if (list.length <= 1) return list.join('')
  return `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`
}

/**
 * The words for an edit's result, in 30's shape: what changed, then what the
 * conflict rule did ("Christchurch Public marked open. 2 flags cleared.").
 */
function publicHolidayEditLine(
  before: PublicHoliday,
  after: { dateISO: string; name: string; kind: Kind; region?: string; openHospitalIds: readonly string[] },
  hospitalName: (id: string) => string,
  counts: { flagged: number; resolved: number },
): string {
  const opened = after.openHospitalIds.filter((id) => !before.openHospitalIds.includes(id)).map(hospitalName)
  const closed = before.openHospitalIds.filter((id) => !after.openHospitalIds.includes(id)).map(hospitalName)
  const detailsChanged =
    before.dateISO !== after.dateISO || before.name !== after.name.trim() || before.kind !== after.kind || (after.kind === 'regional' && (before.region ?? '') !== (after.region ?? '').trim())
  const parts: string[] = []
  if (detailsChanged) parts.push('Public holiday changed.')
  if (opened.length > 0) parts.push(`${names(opened)} marked open.`)
  if (closed.length > 0) parts.push(`${names(closed)} marked closed.`)
  if (parts.length === 0) parts.push('No changes.')
  if (counts.flagged > 0 || closed.length > 0 || before.dateISO !== after.dateISO) parts.push(`${plural(counts.flagged, 'List')} flagged.`)
  if (counts.resolved > 0 || opened.length > 0) parts.push(`${plural(counts.resolved, 'flag')} cleared.`)
  return parts.join(' ')
}

/**
 * A public holiday on the master calendar (catch-up Phase 42; DM-38), modelled
 * on 30's `HolidaySheet`: date, name, kind (National, or Regional with its
 * region label) and the hospitals open that day. Every other hospital, AA's
 * rooms among them, is closed and its Lists are flagged by the one conflict
 * rule, so the result line counts what the store did. Delete sits on the view,
 * behind its own confirmation.
 */
export function PublicHolidaySheet({ open, actor, publicHolidayId, onClose, onDone }: Props) {
  const { Overlay } = useSurface()
  const hospitals = useAppStore((s) => s.masters.hospitals)
  const flaggedNow = useAppStore((s) => (publicHolidayId !== undefined ? listsFlaggedByPublicHoliday(s, publicHolidayId) : 0))
  const editing = publicHolidayId !== undefined
  const [dateISO, setDateISO] = useState('')
  const [name, setName] = useState('')
  const [kind, setKind] = useState<Kind>('national')
  const [region, setRegion] = useState(DEFAULT_REGION)
  const [openIds, setOpenIds] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const row = publicHolidayId !== undefined ? useAppStore.getState().masters.publicHolidays[publicHolidayId] : undefined
    setDateISO(row?.dateISO ?? '')
    setName(row?.name ?? '')
    setKind(row?.kind ?? 'national')
    setRegion(row?.region ?? DEFAULT_REGION)
    setOpenIds(row !== undefined ? [...row.openHospitalIds] : [])
    setError(null)
  }, [open, publicHolidayId])

  // Every location can be listed open, AA's rooms included; a retired one only when it is already listed.
  const options = useMemo(
    () =>
      Object.values(hospitals)
        .filter((h) => h.retiredAtISO === undefined || openIds.includes(h.id))
        .map((h) => ({ id: h.id, name: h.retiredAtISO !== undefined ? `${h.name} (retired)` : h.name })),
    [hospitals, openIds],
  )

  function save() {
    const fields = { dateISO, name, kind, ...(kind === 'regional' ? { region } : {}), openHospitalIds: openIds }
    const hospitalName = (id: string) => hospitals[id]?.name ?? id
    if (editing && publicHolidayId !== undefined) {
      const before = useAppStore.getState().masters.publicHolidays[publicHolidayId]
      const out = editPublicHoliday(useAppStore, actor, publicHolidayId, fields)
      if (!out.ok) {
        setError(out.message)
        return
      }
      onDone(before !== undefined ? publicHolidayEditLine(before, fields, hospitalName, out.value) : 'Public holiday changed.')
      onClose()
      return
    }
    const out = addPublicHoliday(useAppStore, actor, fields)
    if (!out.ok) {
      setError(out.message)
      return
    }
    onDone(`Public holiday added. ${plural(out.value.flagged, 'List')} flagged.`)
    onClose()
  }

  return (
    <Overlay open={open} onClose={onClose}>
      <div data-shot={editing ? 'public-holiday-edit-sheet' : 'public-holiday-add-sheet'} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <OverlayHeader
          title={editing ? 'Change a public holiday' : 'Add a public holiday'}
          description="Every hospital not listed open is closed that day, and its Lists are flagged."
        />
        <TextField label="Date" value={dateISO} onChange={setDateISO} type="date" />
        <TextField label="Name" value={name} onChange={setName} placeholder="e.g. Labour Day" />
        <Segmented
          label="Kind"
          value={kind}
          onChange={setKind}
          options={[
            { value: 'national', label: 'National' },
            { value: 'regional', label: 'Regional' },
          ]}
        />
        {kind === 'regional' && (
          <TextField label="Region" value={region} onChange={setRegion} hint="A label only: every AA hospital is in Christchurch." />
        )}
        <ChipMultiSelect
          label="Open that day"
          options={options}
          value={openIds}
          onChange={setOpenIds}
          addLabel="Add a hospital that stays open"
          empty="None: every hospital is closed."
          hint="Hospitals, or AA's rooms, that run as normal that day."
          shot="public-holiday-open-hospitals"
        />
        {editing && (
          <div style={{ fontSize: 12.5, color: neutral.slate }}>
            It flags {plural(flaggedNow, 'List')} now. Marking a hospital open clears its flags.
          </div>
        )}
        <FormError message={error} />
        <SheetActions primary={<Button variant="primary" block onClick={save}>{editing ? 'Save changes' : 'Add public holiday'}</Button>} />
      </div>
    </Overlay>
  )
}
