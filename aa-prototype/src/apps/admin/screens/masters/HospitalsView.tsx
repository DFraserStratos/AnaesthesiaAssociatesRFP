import { useMemo, useState } from 'react'
import { neutral, radius } from '../../../../theme/tokens'
import { useAppStore, type Actor } from '../../../../store'
import { Button } from '../../../../shared'
import { AddHolidaySheet } from '../../flows/AddHolidaySheet'
import { AddHospitalSheet } from '../../flows/AddHospitalSheet'
import { EditHospitalSheet } from '../../flows/EditHospitalSheet'
import { Header, TextAction } from './chrome'

type Sheet = { kind: 'none' } | { kind: 'add' } | { kind: 'edit'; id: string } | { kind: 'holiday'; hospitalId: string }

/** Hospitals & holidays, each hospital with its contact email (catch-up Phase 17, US-13.4.1). */
export function HospitalsView({ actor }: { actor: Actor }) {
  const hospitalsById = useAppStore((s) => s.masters.hospitals)
  const holidays = useAppStore((s) => s.masters.holidays)
  const [sheet, setSheet] = useState<Sheet>({ kind: 'none' })
  const hospitals = Object.values(hospitalsById).sort((a, b) => a.name.localeCompare(b.name))
  const holidaysByHospital = useMemo(() => {
    const map: Record<string, { id: string; dateISO: string; name: string }[]> = {}
    for (const h of Object.values(holidays)) (map[h.hospitalId] ??= []).push(h)
    for (const list of Object.values(map)) list.sort((a, b) => a.dateISO.localeCompare(b.dateISO))
    return map
  }, [holidays])
  const close = () => setSheet({ kind: 'none' })
  const editing = sheet.kind === 'edit' ? hospitalsById[sheet.id] : undefined

  return (
    <>
      <Header
        title="Hospitals & holidays"
        sub="Adding a hospital atomically creates its protected default Type 1 contract (visible in Contracts). A holiday flags booked lists at that hospital."
        action={<Button variant="secondary" onClick={() => setSheet({ kind: 'add' })}>Add hospital</Button>}
      />
      <div data-shot="masters-hospitals" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {hospitals.map((h) => (
          <div key={h.id} data-hospital={h.id} style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{h.name}</div>
                {h.contactEmail !== undefined ? (
                  <div style={{ fontSize: 12.5, color: neutral.slate, marginTop: 2 }}>{h.contactEmail}</div>
                ) : (
                  <div style={{ fontSize: 12.5, color: neutral.mist, marginTop: 2 }}>No contact email</div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 16, flex: 'none' }}>
                <TextAction onClick={() => setSheet({ kind: 'edit', id: h.id })} label={`Edit ${h.name}`}>Edit</TextAction>
                <TextAction onClick={() => setSheet({ kind: 'holiday', hospitalId: h.id })}>Add holiday</TextAction>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              {(holidaysByHospital[h.id] ?? []).length === 0 ? (
                <span style={{ fontSize: 12, color: neutral.mist }}>No holidays recorded.</span>
              ) : (
                (holidaysByHospital[h.id] ?? []).map((hol) => (
                  <span key={hol.id} className="mono" style={{ fontSize: 11.5, background: neutral.sunken, borderRadius: 999, padding: '3px 10px', color: neutral.slate }}>
                    {hol.dateISO} · {hol.name}
                  </span>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
      {sheet.kind === 'add' && <AddHospitalSheet actor={actor} onClose={close} />}
      {editing !== undefined && <EditHospitalSheet key={editing.id} hospital={editing} actor={actor} onClose={close} />}
      <AddHolidaySheet open={sheet.kind === 'holiday'} actor={actor} hospitalId={sheet.kind === 'holiday' ? sheet.hospitalId : undefined} onClose={close} />
    </>
  )
}
