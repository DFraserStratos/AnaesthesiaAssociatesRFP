/**
 * Replace a Contract from a date (build plan Phase 49; US-04.1.8, DM-02; the
 * "Replace from a date" sheet of docs/explorations/contracts-section.html
 * #updating). A record side panel in four numbered steps:
 *
 * 1. What changes: New contract's sections (46), filled from the old Contract,
 *    every setting editable (the fixed ones included), the price first with
 *    Now and New side by side, and the AA code the copy takes.
 * 2. From: the change date, today by default (a past date is allowed).
 * 3. The Procedures from that date still on the old Contract (authorised Lists
 *    are locked and not listed), each ticked by default; a row the copy cannot
 *    take shows why and cannot be ticked.
 * 4. The old Contract: left active with a to-do on the date (the default), or
 *    disabled now.
 *
 * A replacement not priced as a fixed price says it is offered from today (D90,
 * OQ-144 open). Save runs the store's `replaceContract` (one change set) and
 * lands on the new Contract's page with the result; a refusal stays in place.
 * The story's word is "Procedures" where the design sheet says "Bookings".
 */

import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { formatRangePrice, rangesOf, sortRanges } from '../../../domain/billing/priceRanges'
import { plainDate, shortDay } from '../../../domain/dateText'
import type { Contract } from '../../../domain/types'
import { pricingLabel } from '../../../shared/contracts'
import { SidePanel } from '../../../shared/surface'
import { TableShell, Td, Th } from '../../../shared/table'
import { Button, Card, Checkbox, CountBadge, Disclosure, Eyebrow, FieldHint, FormError, Notice, RadioCard, TextAction, TextField, useRovingRadio, visuallyHidden } from '../../../shared/ui'
import { planReplaceRows, replaceContract, useAppStore, useToday, type Actor, type ReplacePatch, type ReplaceResult } from '../../../store'
import { neutral } from '../../../theme/tokens'
import { contractPath } from '../contractsPaths'
import { listShortLabel } from '../util'
import { PanelGrid } from '../components/MasterPanel'
import { HolderFields, NameFields, PricingFields, WhereFields } from '../screens/contracts/new/NewContractPage'
import { draftOf, useContractDraft } from './contractDraft'

/** What the new Contract's page shows after a replace (router state). */
export interface ReplacedState {
  replaced: { oldId: string; moved: number; refused: { patientName: string; message: string }[]; disabled: boolean }
}

type OldChoice = 'leave' | 'disable'

/** The patch the draft makes over the old Contract: a fixed price kept as fixed keeps its ranges. */
function patchOf(old: Contract, input: ReturnType<typeof useContractDraft>['input']): ReplacePatch {
  const { pricing, ...rest } = input
  const keepRanges = old.pricing.kind === 'fixed' && pricing.kind === 'fixed'
  return keepRanges ? rest : { ...rest, pricing }
}

/** "3 ranges, $3,350.00 from 1 Apr 2027 the newest" */
function keptRangesText(contract: Contract): string {
  const ranges = sortRanges(rangesOf(contract))
  const newest = ranges[ranges.length - 1]
  if (newest === undefined) return 'None'
  const price = `${formatRangePrice(newest.price)} from ${plainDate(newest.startISO)}`
  return ranges.length === 1 ? price : `${ranges.length} ranges, the newest ${price}`
}

export function ReplaceContractSheet({ contract, actor, open, onClose }: { contract: Contract; actor: Actor; open: boolean; onClose: () => void }) {
  if (!open) return null
  return <ReplaceContractForm contract={contract} actor={actor} onClose={onClose} />
}

function ReplaceContractForm({ contract, actor, onClose }: { contract: Contract; actor: Actor; onClose: () => void }) {
  const navigate = useNavigate()
  // The page's own router state (the catalogue's grouping, for Back) carries on to where the sheet lands.
  const { state: pageState } = useLocation()
  const carried = typeof pageState === 'object' && pageState !== null ? (pageState as Record<string, unknown>) : {}
  const today = useToday()
  const state = useAppStore((s) => s)
  const lists = useAppStore((s) => s.schedule.lists)
  const masters = useAppStore((s) => s.masters)
  const form = useContractDraft(draftOf(contract))
  const { draft, set, rules, input, holderGroups } = form
  const [fromISO, setFromISO] = useState(today)
  const [unticked, setUnticked] = useState<ReadonlySet<string>>(new Set())
  const [oldChoice, setOldChoice] = useState<OldChoice>('leave')
  const [error, setError] = useState<string | null>(null)

  const patch = useMemo(() => patchOf(contract, input), [contract, input])
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(fromISO)
  const preview = useMemo(() => planReplaceRows(state, actor, contract.id, { patch, fromISO }), [state, actor, contract.id, patch, fromISO])
  const movable = preview.rows.filter((r) => r.refusal === null)
  const ticked = movable.filter((r) => !unticked.has(r.row.procedureId)).map((r) => r.row.procedureId)
  const newCode = preview.aaCode !== '' ? preview.aaCode : 'the new Contract'
  const fromText = validDate ? plainDate(fromISO) : 'the date'
  const fixedOld = contract.pricing.kind === 'fixed'
  const fixedNew = input.pricing.kind === 'fixed'

  const choices: OldChoice[] = ['leave', 'disable']
  const { groupProps, itemProps } = useRovingRadio<OldChoice>({ values: choices, value: oldChoice, onChange: setOldChoice })

  function toggle(id: string, on: boolean) {
    setUnticked((prev) => {
      const next = new Set(prev)
      if (on) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll(on: boolean) {
    setUnticked(on ? new Set() : new Set(movable.map((r) => r.row.procedureId)))
  }

  function save() {
    const outcome = replaceContract(useAppStore, actor, contract.id, { patch, fromISO, moveProcedureIds: ticked, disableNow: oldChoice === 'disable' })
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    navigate(contractPath(outcome.value.contract.id), { state: { ...carried, ...resultState(outcome.value) } })
  }

  function resultState(result: ReplaceResult): ReplacedState {
    const name = (id: string) => preview.rows.find((r) => r.row.procedureId === id)?.row.patientName ?? id
    return {
      replaced: {
        oldId: contract.id,
        moved: result.rows.filter((r) => r.moved).length,
        refused: result.rows.flatMap((r) => (r.moved ? [] : [{ patientName: name(r.procedureId), message: r.message }])),
        disabled: result.disabled,
      },
    }
  }

  function addRangeInstead() {
    onClose()
    navigate(`${contractPath(contract.id)}?add=range`, { replace: true, state: pageState })
  }

  const allTicked = movable.length > 0 && ticked.length === movable.length

  return (
    <SidePanel
      open
      onClose={onClose}
      width="record"
      title={`Replace ${contract.name} from a date`}
      meta="A new Contract takes over. Everything is copied except what you change here."
      shot="contract-replace-sheet"
      footer={
        <>
          <Button variant="secondary" size="desktop" onClick={onClose} shot="contract-replace-cancel">Cancel</Button>
          <Button variant="primary" size="desktop" onClick={save} shot="contract-replace-save">
            {ticked.length > 0 ? `Create ${newCode} and move ${ticked.length}` : `Create ${newCode}`}
          </Button>
        </>
      }
    >
      <FormError message={error} shot="contract-replace-error" />

      <Card step={1} bare title="What changes" shot="contract-replace-what">
        {fixedOld && (
          <Notice
            tone="neutral"
            shot="contract-replace-range-pointer"
            action={<TextAction size="sm" flush onClick={addRangeInstead} shot="contract-replace-add-range">Add a price range</TextAction>}
          >
            Only the price changes from a date? Add a price range instead.
          </Notice>
        )}
        {/* Now and New Contract side by side (#updating): the price first, the one setting most replaced. */}
        <PanelGrid>
          <TextField label="Now" value={pricingWords(contract)} onChange={() => {}} disabled mono shot="contract-replace-now" />
          {draft.kind === 'rvgContractRate' ? (
            <TextField label="New Contract" value={draft.rate} onChange={(rate) => set({ rate })} mono inputMode="decimal" hint="$ per unit" shot="contract-replace-new-price" />
          ) : draft.kind === 'rvgDiscount' ? (
            <TextField label="New Contract" value={draft.discount} onChange={(discount) => set({ discount })} mono inputMode="decimal" hint="% off the RVG fee" shot="contract-replace-new-price" />
          ) : draft.kind === 'fixed' && fixedOld ? (
            <TextField label="New Contract" value={keptRangesText(contract)} onChange={() => {}} disabled mono hint="Its price ranges are copied as they stand." shot="contract-replace-new-price" />
          ) : draft.kind === 'fixed' ? (
            <TextField label="New Contract: first price (ex GST)" value={draft.firstPrice} onChange={(firstPrice) => set({ firstPrice })} mono placeholder="0.00" inputMode="decimal" shot="contract-replace-new-price" />
          ) : (
            <TextField label="New Contract" value={pricingLabel(input.pricing)} onChange={() => {}} disabled mono shot="contract-replace-new-price" />
          )}
          {draft.kind === 'fixed' && !fixedOld && (
            <TextField label="First price from" type="date" value={draft.firstStart} onChange={(firstStart) => set({ firstStart })} mono hint="May be in the past." />
          )}
        </PanelGrid>
        <Disclosure summary={(o) => (o ? 'Hide the other settings' : 'Every other setting: the pricing kind, the holder, where it is offered, the name and codes')} shot="contract-replace-other" gap={12}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Eyebrow as="h3">Pricing</Eyebrow>
            <PricingFields draft={draft} set={set} rules={rules} priceElsewhere />
            <Eyebrow as="h3">Holder and who it bills</Eyebrow>
            <HolderFields draft={draft} set={set} rules={rules} holderGroups={holderGroups} />
            <Eyebrow as="h3">Where it is offered</Eyebrow>
            <WhereFields draft={draft} set={set} rules={rules} />
            <Eyebrow as="h3">Name, codes and invoice wording</Eyebrow>
            <NameFields draft={draft} set={set} />
          </div>
        </Disclosure>
        <FieldHint shot="contract-replace-aa-code">
          {`Any setting can change here, the fixed ones included. AA code ${newCode} is assigned on save.`}
        </FieldHint>
      </Card>

      <Card step={2} bare title="From" shot="contract-replace-from">
        <TextField label="Change date" type="date" value={fromISO} onChange={setFromISO} mono width={200} hint="Today by default. A past date is allowed." shot="contract-replace-date" />
      </Card>

      <Card
        step={3}
        bare
        title={
          <>
            {`Procedures from ${validDate ? shortDay(fromISO) : 'the date'} still on ${contract.aaCode}`}
            <CountBadge count={preview.rows.length} hideAtZero={false} mono srNoun="Procedures" />
          </>
        }
        shot="contract-replace-rows"
      >
        {preview.rows.length === 0 ? (
          <span style={{ fontSize: 13, color: neutral.mist }}>{`No Procedure from ${fromText} is on ${contract.aaCode}.`}</span>
        ) : (
          <TableShell label={`Procedures still on ${contract.aaCode}`} density="dense" shot="contract-replace-table">
            <thead>
              <tr>
                <Th width={32}>
                  <Checkbox checked={allTicked} onChange={toggleAll} disabled={movable.length === 0} shot="contract-replace-tick-all">
                    <span style={visuallyHidden}>Tick every Procedure</span>
                  </Checkbox>
                </Th>
                <Th>Patient</Th>
                <Th>Date</Th>
                <Th>List</Th>
              </tr>
            </thead>
            <tbody>
              {preview.rows.map(({ row, refusal }) => {
                const list = lists[row.listId]
                const on = refusal === null && !unticked.has(row.procedureId)
                return (
                  <tr key={row.procedureId} data-procedure-id={row.procedureId} data-shot="contract-replace-row" {...(refusal !== null ? { 'data-refused': '' } : {})}>
                    <Td>
                      <Checkbox checked={on} onChange={(v) => toggle(row.procedureId, v)} disabled={refusal !== null}>
                        <span style={visuallyHidden}>{`Move ${row.patientName}`}</span>
                      </Checkbox>
                    </Td>
                    <Td bold>
                      {row.patientName}
                      {refusal !== null && <FieldHint tone="slate">{refusal}</FieldHint>}
                    </Td>
                    <Td mono nowrap>{shortDay(row.dateISO)}</Td>
                    <Td>{list !== undefined ? listShortLabel(list, masters) : row.listId}</Td>
                  </tr>
                )
              })}
            </tbody>
          </TableShell>
        )}
        <FieldHint>{`Ticked Procedures move to ${newCode} when you save. Authorised Lists are locked and are not listed.`}</FieldHint>
      </Card>

      <Card step={4} bare title="The old Contract" shot="contract-replace-old">
        <div {...groupProps} aria-label={`What happens to ${contract.aaCode}`} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <RadioCard
            radio={itemProps(0)}
            checked={oldChoice === 'leave'}
            onSelect={() => setOldChoice('leave')}
            title={`Leave ${contract.aaCode} active; a to-do on ${fromText} reminds you to disable it`}
            description={`Until then both are offered, so a Procedure before ${fromText} should stay on ${contract.aaCode}.`}
            data-old-choice="leave"
          />
          <RadioCard
            radio={itemProps(1)}
            checked={oldChoice === 'disable'}
            onSelect={() => setOldChoice('disable')}
            title={`Disable ${contract.aaCode} now`}
            description="Procedures already on it keep it."
            data-old-choice="disable"
          />
        </div>
      </Card>

      {!fixedNew && (
        <Notice tone="warning" shot="contract-replace-rate-notice">
          {`${input.pricing.kind === 'rvgDiscount' ? 'A discount' : 'A rate'} has no dates, so ${newCode} is offered from today, not from ${fromText}. Until ${contract.aaCode} is disabled, both are offered.`}
        </Notice>
      )}
    </SidePanel>
  )
}

/** The old Contract's price in words: its rate or discount, or a fixed price's range in force. */
function pricingWords(contract: Contract): string {
  return contract.pricing.kind === 'fixed' ? keptRangesText(contract) : pricingLabel(contract.pricing)
}
