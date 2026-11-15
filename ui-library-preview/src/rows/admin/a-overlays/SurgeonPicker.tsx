import { useId, useMemo, useState } from 'react'
import { useAppStore } from '@proto/store'
import { PAIRING_LABELS, groupSurgeonsForAnaesthetist } from '@proto/domain/pairingPreferences'
import { titledSurname } from '@proto/shared/format'
import { usePairingEntries } from '@proto/apps/admin/components/pairing'
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
} from '@/components/ui/combobox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Echo } from './parts'

interface Surgeon {
  id: string
  name: string
}
interface Anaesthetist {
  registrationNumber: string
  name: string
}
interface SurgeonOption {
  id: string
  name: string
  /** The option text with its suffix, as the native select shows it ("Mr J. Whitford · preferred"). */
  label: string
}
interface SurgeonGroup {
  value: string
  items: SurgeonOption[]
}

/** The seed's first active not-preferred pairing, as the catalogue example opens on. */
export function useNotPreferredPair(): { anaesthetistId: string; surgeonId: string } | undefined {
  const entries = usePairingEntries() as Record<string, { kind: string; endedAtISO?: string; anaesthetistId: string; surgeonId: string }>
  return useMemo(() => {
    const e = Object.values(entries).find((x) => x.kind === 'NOT_PREFERRED' && x.endedAtISO === undefined)
    return e !== undefined ? { anaesthetistId: e.anaesthetistId, surgeonId: e.surgeonId } : undefined
  }, [entries])
}

/**
 * The surgeon choice on Base UI Combobox with groups: "Surgeons" (preferred ones
 * suffixed) and, when there are any, "Not preferred with Dr X". Typing filters
 * both groups; the not-preferred ones stay selectable, as today.
 */
function SurgeonCombobox({ anaesthetistId, value, onChange }: { anaesthetistId: string | undefined; value: string; onChange: (id: string) => void }) {
  const surgeons: Record<string, Surgeon> = useAppStore((s: { masters: { surgeons: Record<string, Surgeon> } }) => s.masters.surgeons)
  const anaesthetistName = useAppStore((s: { masters: { anaesthetists: Record<string, Anaesthetist> } }) =>
    anaesthetistId !== undefined ? s.masters.anaesthetists[anaesthetistId]?.name : undefined,
  )
  const entries = usePairingEntries()
  const id = useId()
  const groups = useMemo<SurgeonGroup[]>(() => {
    const { clear, notPreferred } = groupSurgeonsForAnaesthetist({ surgeons, entries, anaesthetistId }) as {
      clear: { surgeon: Surgeon; preferred: boolean }[]
      notPreferred: { surgeon: Surgeon }[]
    }
    const main: SurgeonGroup = {
      value: 'Surgeons',
      items: clear.map(({ surgeon, preferred }) => ({ id: surgeon.id, name: surgeon.name, label: `${surgeon.name}${preferred ? PAIRING_LABELS.optionSuffix('PREFERRED') : ''}` })),
    }
    if (notPreferred.length === 0) return [main]
    return [
      main,
      {
        value: PAIRING_LABELS.notPreferredWith(titledSurname(anaesthetistName ?? '')) as string,
        items: notPreferred.map(({ surgeon }) => ({ id: surgeon.id, name: surgeon.name, label: `${surgeon.name}${PAIRING_LABELS.optionSuffix('NOT_PREFERRED')}` })),
      },
    ]
  }, [surgeons, entries, anaesthetistId, anaesthetistName])
  const selected = useMemo(() => groups.flatMap((g) => g.items).find((o) => o.id === value) ?? null, [groups, value])

  return (
    <Combobox<SurgeonOption>
        items={groups}
        value={selected}
        onValueChange={(o, details) => {
          // Base UI clears the choice on Escape when the list is closed; keep it, as the native select does.
          if (details.reason === 'escape-key') return
          onChange(o?.id ?? '')
        }}
        itemToStringLabel={(o) => o.label}
        isItemEqualToValue={(a, b) => a.id === b.id}
        autoHighlight
      >
        {/* No visible label, as the left; the placeholder reads in ink like the native select's "Choose a surgeon" option. */}
        <ComboboxInput id={id} aria-label="Surgeon" placeholder="Choose a surgeon" className="tw:w-full tw:**:placeholder:text-ink" />
        <ComboboxContent>
          <ComboboxEmpty>No surgeon matches.</ComboboxEmpty>
          <ComboboxList>
            {(group: SurgeonGroup) => (
              <ComboboxGroup key={group.value} items={group.items}>
                {groups.length > 1 && <ComboboxLabel>{group.value}</ComboboxLabel>}
                <ComboboxCollection>
                  {(o: SurgeonOption) => (
                    <ComboboxItem key={o.id} value={o}>
                      {o.label}
                    </ComboboxItem>
                  )}
                </ComboboxCollection>
              </ComboboxGroup>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
  )
}

export function SurgeonPickerReplacement() {
  const anaesthetists: Record<string, Anaesthetist> = useAppStore((s: { masters: { anaesthetists: Record<string, Anaesthetist> } }) => s.masters.anaesthetists)
  const pair = useNotPreferredPair()
  const options = useMemo(() => Object.values(anaesthetists).sort((a, b) => a.name.localeCompare(b.name)), [anaesthetists])
  const items = useMemo(() => options.map((a) => ({ value: a.registrationNumber, label: a.name })), [options])
  const [anaesthetistId, setAnaesthetistId] = useState<string>(pair?.anaesthetistId ?? options[0]?.registrationNumber ?? '')
  const [surgeonId, setSurgeonId] = useState('')
  return (
    <div className="tw:flex tw:flex-col tw:gap-2.5">
      <Select items={items} value={anaesthetistId} onValueChange={(v) => setAnaesthetistId((v as string | null) ?? '')}>
        <SelectTrigger aria-label="Anaesthetist" className="tw:w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false} className="tw:max-h-72">
          {items.map((a) => (
            <SelectItem key={a.value} value={a.value}>
              {a.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <SurgeonCombobox anaesthetistId={anaesthetistId} value={surgeonId} onChange={setSurgeonId} />
      <Echo>{surgeonId === '' ? 'No surgeon chosen.' : `Surgeon ${surgeonId}`}</Echo>
    </div>
  )
}
