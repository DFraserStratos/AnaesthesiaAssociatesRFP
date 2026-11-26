/**
 * Needs NHI bench, Ask for the NHI (build plan Phase 72; US-11.1.5, US-02.2.4, US-13.6.5; D74): the one address to
 * chase (the List's sender, else the surgeon's first office contact) with its name and phone, the surgeon's other
 * office addresses offered to switch to (never sent to together), and the request as a `mailto:` draft the office
 * sends from its own mail. On the opened arrival the draft's button sits in the decision column's footer (`useChase`). The click audits the request (`requestNhiFromOffice`); "Requested" shows the last one.
 * With no office address held the card says so and offers no draft. Not drawn in the mockups: built from the shared
 * Card, SelectField and Button.
 *
 * Hooks: `waiting-nhi-chase-card` on the card, `waiting-nhi-chase` on the address, `waiting-nhi-email` on the draft,
 * `waiting-nhi-requested` on the Requested line.
 */

import { useMemo, useState, type ReactNode } from 'react'
import { nhiRequestEmailFor, requestNhiFromOffice, useAppStore, type Actor, type WaitingNhiRow } from '../../../../../../store'
import { Button, Card, FormError, SelectField } from '../../../../../../shared/ui'
import { stampText } from '../../../../../../shared/format'
import { neutral, space, type as typeScale } from '../../../../../../theme/tokens'

const SMALL = { fontSize: typeScale.small.size, lineHeight: `${typeScale.small.line}px` } as const

/** The chase card and its email button apart, so the opened arrival puts the button in the column's footer. */
export function useChase(row: WaitingNhiRow, actor: Actor): { card: ReactNode; email: ReactNode } {
  const intake = useAppStore((s) => s.intake)
  const masters = useAppStore((s) => s.masters)
  const schedule = useAppStore((s) => s.schedule)
  const [to, setTo] = useState(row.chase.to)
  const [error, setError] = useState<string | null>(null)
  const email = useMemo(() => (to !== '' ? nhiRequestEmailFor({ intake, masters, schedule }, row.rowId, to) : undefined), [intake, masters, schedule, row.rowId, to])
  const contact = to !== '' ? row.chase.contacts.find((c) => c.email === to) : undefined
  const choices = [row.chase.to, ...row.chase.alternatives.map((a) => a.email)].filter((a) => a !== '')

  const button =
    email !== undefined ? (
      <Button
        variant="secondary"
        size="desktop"
        href={email.href}
        shot="waiting-nhi-email"
        onClick={() => {
          const res = requestNhiFromOffice(useAppStore, actor, row.rowId, to)
          setError(res.ok ? null : res.message)
        }}
      >
        Email for the NHI
      </Button>
    ) : null

  const card = (
    <Card title="Ask for the NHI" titleLevel={3} shot="waiting-nhi-chase-card">
      {to === '' ? (
        <span style={{ ...SMALL, color: neutral.mist }}>No office address held</span>
      ) : (
        <div data-shot="waiting-nhi-chase" style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          {contact?.name !== undefined && <span style={{ fontWeight: 600 }}>{contact.name}</span>}
          <span style={{ ...SMALL, overflowWrap: 'anywhere' }}>{to}</span>
          {contact?.phone !== undefined && <span className="mono" style={{ ...SMALL, color: neutral.slate }}>{contact.phone}</span>}
        </div>
      )}
      {choices.length > 1 && (
        <SelectField label="Send the request to" size="compact" value={to} onChange={setTo} shot="waiting-nhi-chase-to">
          {choices.map((c) => (
            <option key={c} value={c}>{c === row.chase.to ? `${c} (first)` : c}</option>
          ))}
        </SelectField>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: space[3] }}>
        <span data-shot="waiting-nhi-requested" style={{ ...SMALL, color: row.requestedAtISO !== undefined ? neutral.slate : neutral.mist }}>
          {row.requestedAtISO !== undefined ? (
            <>
              Requested <span className="mono">{stampText(row.requestedAtISO)}</span>
            </>
          ) : (
            'Not requested yet'
          )}
        </span>
      </div>
      <FormError message={error} />
    </Card>
  )
  return { card, email: button }
}
