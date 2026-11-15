import { useId, useMemo, useState } from 'react'
import { ChevronDownIcon } from 'lucide-react'
import { useAppStore } from '@proto/store'
import { contractSearch } from '@proto/domain/billing/contracts'
import { contractChoosableForProcedure } from '@proto/domain/billing/fallbacks'
import { contractLabel } from '@proto/shared/contracts/labels'
import { Field, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Echo } from './parts'

interface Contract {
  id: string
  status: string
  holderId: string
  systemRole?: string
  pricing: { kind: string }
}

/** The ContractSelect's groups: system Contracts first, then every active one under its holder Party. */
function useContractGroups(value: string) {
  const contracts = useAppStore((s: { masters: { contracts: Record<string, Contract> } }) => s.masters.contracts)
  const parties = useAppStore((s: { masters: { parties: Record<string, { name: string }> } }) => s.masters.parties)
  return useMemo(() => {
    const listed = (contractSearch('', { contracts, parties, filters: { status: 'all' } }) as Contract[]).filter(
      (c) => (c.status === 'active' || c.id === value) && contractChoosableForProcedure(c),
    )
    const system = listed.filter((c) => c.systemRole !== undefined)
    const byHolder = new Map<string, Contract[]>()
    for (const c of listed) {
      if (c.systemRole !== undefined) continue
      const name = parties[c.holderId]?.name ?? c.holderId
      byHolder.set(name, [...(byHolder.get(name) ?? []), c])
    }
    const label = (c: Contract) => contractLabel(c, { withStatus: true }) as string
    return { system, byHolder: [...byHolder.entries()], label }
  }, [contracts, parties, value])
}

const LABEL = 'Governing contract'

/** Native select in the kit field chrome (48px, bg, line border, teal chevron). */
function NativeContractSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const id = useId()
  const { system, byHolder, label } = useContractGroups(value)
  return (
    <Field>
      <FieldLabel htmlFor={id}>{LABEL}</FieldLabel>
      <div className="tw:relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="tw:h-12 tw:w-full tw:cursor-pointer tw:appearance-none tw:rounded-ctl tw:border tw:border-line tw:bg-background tw:pr-10 tw:pl-3.5 tw:text-[15px] tw:text-ink tw:outline-none tw:transition-[border-color,box-shadow] tw:duration-150 tw:focus-visible:border-primary tw:focus-visible:shadow-focus"
        >
          {value === '' && (
            <option value="" disabled>
              Choose a Contract
            </option>
          )}
          {system.map((c) => (
            <option key={c.id} value={c.id}>
              {label(c)}
            </option>
          ))}
          {byHolder.map(([holder, list]) => (
            <optgroup key={holder} label={holder}>
              {list.map((c) => (
                <option key={c.id} value={c.id}>
                  {label(c)}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <ChevronDownIcon aria-hidden className="tw:pointer-events-none tw:absolute tw:top-1/2 tw:right-3 tw:size-4 tw:-translate-y-1/2 tw:text-primary" />
      </div>
    </Field>
  )
}

/** Base UI Select: a styled popup with the holder groups as labelled groups. */
function PopupContractSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const id = useId()
  const { system, byHolder, label } = useContractGroups(value)
  const items = useMemo(
    () => [...system, ...byHolder.flatMap(([, l]) => l)].map((c) => ({ value: c.id, label: label(c) })),
    [system, byHolder, label],
  )
  return (
    <Field>
      <FieldLabel htmlFor={id}>{LABEL}</FieldLabel>
      <Select items={items} value={value === '' ? null : value} onValueChange={(v) => onChange((v as string | null) ?? '')}>
        <SelectTrigger id={id} className="tw:w-full">
          <SelectValue placeholder="Choose a Contract" />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false} className="tw:max-h-80">
          {system.length > 0 && (
            <SelectGroup>
              {system.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {label(c)}
                </SelectItem>
              ))}
            </SelectGroup>
          )}
          {byHolder.map(([holder, list]) => (
            <SelectGroup key={holder}>
              <SelectLabel>{holder}</SelectLabel>
              {list.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {label(c)}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}

export function ContractSelectReplacement({ kind = 'native' }: { kind?: 'native' | 'popup' }) {
  const [value, setValue] = useState('')
  return (
    <div>
      {kind === 'native' ? <NativeContractSelect value={value} onChange={setValue} /> : <PopupContractSelect value={value} onChange={setValue} />}
      <Echo>Value: {value === '' ? '(none)' : value}</Echo>
    </div>
  )
}
