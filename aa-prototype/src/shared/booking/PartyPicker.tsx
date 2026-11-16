/**
 * Choose who an invoice goes to (catch-up Phase 22; the Split sheet's party
 * field, and the "party search" Phases 38b, 39 and 39b reuse): the payer on
 * the Booking and the Contract's party first, then every Party, searchable by
 * name. Pure props: the options come from one pure selector
 * (`partyOptionsFor`, through the store's `partyOptionsForProcedure`); it
 * creates no party record. PWA-safe (no admin import).
 */

import { useId, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { accent, neutral, radius } from '../../theme/tokens'
import type { CounterpartyRef } from '../../domain/types'
import { filterPartyOptions, type PartyOption } from '../../domain/billing/partyOptions'
import { FieldLabel, NameSearchBox } from '../ui'

export interface PartyPickerProps {
  options: readonly PartyOption[]
  value: CounterpartyRef | null
  onChange: (ref: CounterpartyRef) => void
  /** The accessible name of the field. */
  label: string
  /** Parties to leave out (already chosen elsewhere). */
  exclude?: readonly CounterpartyRef[]
  shot?: string
}

const same = (a: CounterpartyRef | null | undefined, b: CounterpartyRef | null | undefined): boolean =>
  a != null && b != null && a.kind === b.kind && a.id === b.id

export function PartyPicker({ options, value, onChange, label, exclude = [], shot = 'party-picker' }: PartyPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const listId = useId()
  const chosen = options.find((o) => same(o.ref, value))
  const shown = filterPartyOptions(
    options.filter((o) => same(o.ref, value) || !exclude.some((e) => same(e, o.ref))),
    query,
  )
  const groups: { title: string; rows: PartyOption[] }[] = [
    { title: 'On this Booking', rows: shown.filter((o) => o.group === 'booking') },
    { title: 'Parties', rows: shown.filter((o) => o.group === 'parties') },
  ]

  return (
    <div
      data-shot={shot}
      style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}
      // Escape closes the open list first, never the sheet under it (the modal stack honours a stopped event).
      onKeyDown={(e) => {
        if (e.key === 'Escape' && open) {
          e.stopPropagation()
          setOpen(false)
          setQuery('')
        }
      }}
    >
      <FieldLabel>{label}</FieldLabel>
      <button
        type="button"
        aria-label={`${label}: ${chosen?.name ?? 'choose a party'}`}
        aria-expanded={open}
        aria-controls={listId}
        data-testid="party-picker-toggle"
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          minHeight: 44,
          width: '100%',
          padding: '6px 12px',
          borderRadius: radius.ctl,
          border: `1px solid ${open ? accent.base : neutral.lineStrong}`,
          background: neutral.surface,
          fontFamily: 'inherit',
          textAlign: 'left',
          cursor: 'pointer',
        }}
      >
        <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: chosen !== undefined ? neutral.ink : neutral.mist, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {chosen?.name ?? 'Choose a party'}
          </span>
          {chosen !== undefined && <span style={{ fontSize: 11.5, color: neutral.slate }}>{chosen.hint}</span>}
        </span>
        <ChevronDown size={16} color={neutral.slate} aria-hidden style={{ flex: 'none', transform: open ? 'rotate(180deg)' : undefined }} />
      </button>

      {open && (
        <div id={listId} style={{ display: 'flex', flexDirection: 'column', gap: 8, border: `1px solid ${neutral.line}`, borderRadius: radius.ctl, padding: 8, background: neutral.surface }}>
          <NameSearchBox value={query} onChange={setQuery} label="Search parties by name" size="pill" autoFocus shot="party-picker-search" />
          <div role="listbox" aria-label={label} style={{ display: 'flex', flexDirection: 'column', maxHeight: 240, overflowY: 'auto' }}>
            {groups.map((g) =>
              g.rows.length === 0 ? null : (
                <div key={g.title} role="group" aria-label={g.title} style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: neutral.slate, padding: '6px 8px 2px' }}>{g.title}</div>
                  {g.rows.map((o) => {
                    const selected = same(o.ref, value)
                    return (
                      <button
                        key={`${o.ref.kind}:${o.ref.id}`}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        data-shot="party-option"
                        onClick={() => {
                          onChange(o.ref)
                          setOpen(false)
                          setQuery('')
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 8,
                          minHeight: 40,
                          padding: '4px 8px',
                          border: 'none',
                          borderRadius: radius.ctl,
                          background: selected ? accent.tint : 'transparent',
                          fontFamily: 'inherit',
                          textAlign: 'left',
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: 13.5, fontWeight: 600, color: neutral.ink }}>{o.name}</span>
                          <span style={{ fontSize: 11.5, color: neutral.slate }}>{o.hint}</span>
                        </span>
                        {selected && <Check size={16} color={accent.pressed} aria-hidden />}
                      </button>
                    )
                  })}
                </div>
              ),
            )}
            {shown.length === 0 && <div style={{ fontSize: 13, color: neutral.slate, padding: 8 }}>No party matches that name.</div>}
          </div>
        </div>
      )}
    </div>
  )
}
