/**
 * The Matching row panel (catch-up Phase 33; US-02.1.2 to US-02.1.4, FT-02.5;
 * AR-21 `look-for-match`, `review-differences`, `create-booking`): the
 * Admin right-docked `SidePanel` at the List drawer's width. It shows the row
 * as received and what is missing, the match and its field differences with a
 * tick per change, each Procedure as the shared stack with Choose Contract
 * (Phase 20's step rail) and Choose RVG code (Phase 19's type-ahead), the
 * decision cards and the footer, and after a decision the Admin Review
 * banner choreography with Next row. Every write goes through the store's
 * `correctImportRow` and `decideImportRow` (and 20a's
 * "Use it" rides on the decision as `useNewerText`); nothing here decides a rule.
 */

import { useMemo, useState } from 'react'
import { fontFamily, neutral, radius, semantic } from '../../../theme/tokens'
import type { IncomingFieldKey, OfficePicks, RailAnswers } from '../../../domain/types'
import {
  INVOICE_EFFECT_LABELS,
  MATCH_BASIS_LABELS,
  classifyChange,
  diffFields,
  effectiveIncoming,
  listOwnerLabel,
  listsForRow,
  openSlotsForRow,
  searchBookingsForRow,
  sessionLabel,
  suggestDecision,
  targetProcedure,
  type FieldDiff,
  type RowAssessment,
} from '../../../domain/intake'
import { railAnswersFor, type RailContext } from '../../../domain/billing/contractRail'
import { validateNhi } from '../../../domain/nhi'
import {
  INVALID_NHI_MESSAGE,
  LIST_LOCKED_MESSAGE,
  NHI_REQUIRED_MESSAGE,
  SURGEON_REQUIRED_MESSAGE,
  WORDING_OR_CODE_MESSAGE,
  correctImportRow,
  decideImportRow,
  matchingView,
  railActorOf,
  railContextForList,
  railContextForProcedure,
  railStartFor,
  rowStackViews,
  useAppStore,
  type Actor,
  type DecisionInput,
} from '../../../store'
import { ProcedureStack } from '../../../shared/booking'
import { ContractRail } from '../../../shared/flows/ContractRail'
import { CodePickerSheet } from '../../../shared/capture/CodePickerSheet'
import { Button, Checkbox, DefList, DefRow, Eyebrow, FormError, NameSearchBox, Notice, OptionRow, Pill, SelectField, TextAction, TextField, TickBadge } from '../../../shared/ui'
import { locationName, stampText } from '../../../shared/format'
import { SidePanel } from '../components/SidePanel'
import { AnaesthetistCandidates, NotPreferredWarning, SurgeonPicker, useNotPreferredWarning, useSuggestionKey } from '../components/pairing'
import { RowField } from '../components/RowField'
import { DiffTable } from './DiffTable'
import { DRAFT_LIST } from '../../../shared/scheduleTerms'
import { DecisionCards, type DecisionKind, type DecisionOption } from './DecisionCards'
import { CHANNEL_CAPS, QUICK_REJECT_REASONS, byWhen, changeTypePill, decisionText, insurerText, missingFields, whenText } from './matchingText'

const NOT_SUPPLIED = <span style={{ color: neutral.mist }}>Not supplied</span>

export function RowPanel({
  rowId,
  actor,
  todayISO,
  justDecided,
  nextRowId,
  onClose,
  onDecided,
  onNext,
  onOpenBooking,
}: {
  rowId: string
  actor: Actor
  todayISO: string
  /** The row was decided in this panel: show the banner. */
  justDecided: boolean
  nextRowId: string | undefined
  onClose: () => void
  onDecided: (rowId: string) => void
  onNext: () => void
  onOpenBooking: (dateISO: string, bookingId: string) => void
}) {
  const masters = useAppStore((s) => s.masters)
  const schedule = useAppStore((s) => s.schedule)
  const intake = useAppStore((s) => s.intake)
  const billing = useAppStore((s) => s.billing)
  const view = useMemo(() => matchingView({ masters, schedule, intake }), [masters, schedule, intake])
  const row = intake.rows[rowId]
  const assessment: RowAssessment | undefined = useMemo(() => (row !== undefined && row.status === 'open' ? suggestDecision(view, row) : undefined), [view, row])

  // The office's choices on this row (the panel is keyed by row, so they reset per row).
  const [chosen, setChosen] = useState<DecisionKind | undefined>(undefined)
  const [unticked, setUnticked] = useState<ReadonlySet<IncomingFieldKey>>(new Set())
  const [contractId, setContractId] = useState<string | undefined>(undefined)
  const [enteredPrice, setEnteredPrice] = useState<number | undefined>(undefined)
  const [rvgGroupId, setRvgGroupId] = useState<string | undefined>(undefined)
  const [recordInsurer, setRecordInsurer] = useState(true)
  const [byHandId, setByHandId] = useState<string | undefined>(undefined)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [listId, setListId] = useState<string | undefined>(undefined)
  const [anaesthetistId, setAnaesthetistId] = useState<string | undefined>(undefined)
  const [surgeonPick, setSurgeonPick] = useState('')
  const [reason, setReason] = useState('')
  const [useNewer, setUseNewer] = useState(false)
  const [nhiDraft, setNhiDraft] = useState<string | null>(null)
  const [correcting, setCorrecting] = useState(false)
  const [draft, setDraft] = useState<{ patientName: string; dobISO: string; scheduledTime: string } | null>(null)
  const [railOpen, setRailOpen] = useState(false)
  const [codeOpen, setCodeOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const open = row?.status === 'open'
  const fields = assessment?.fields ?? (row !== undefined ? effectiveIncoming(row) : undefined)

  // The match: the office's pick by hand, else the matcher's.
  const matchBookingId = byHandId ?? assessment?.match?.bookingId
  const matchBooking = matchBookingId !== undefined ? view.bookings[matchBookingId] : undefined
  const matchList = matchBooking !== undefined ? view.lists[matchBooking.listId] : undefined
  const effective = useMemo(() => {
    if (assessment === undefined || row === undefined) return undefined
    if (byHandId === undefined || matchBooking === undefined) return { diffs: assessment.diffs, changeType: assessment.changeType, insurerNote: assessment.insurerNote }
    const d = diffFields(view, matchBooking, row)
    return { diffs: d.diffs, changeType: classifyChange({ cancelled: matchBooking.cancelled }, assessment.fields, d.diffs), insurerNote: d.insurerNote }
  }, [assessment, row, byHandId, matchBooking, view])
  const stackAssessment: RowAssessment | undefined =
    assessment !== undefined && byHandId !== undefined && matchBooking !== undefined
      ? { ...assessment, match: { bookingId: matchBooking.id, listId: matchBooking.listId, basis: 'byHand', cancelled: matchBooking.cancelled } }
      : assessment
  const stacks = useMemo(
    () => (stackAssessment !== undefined ? rowStackViews({ masters, schedule, intake, billing }, rowId, { ...(rvgGroupId !== undefined ? { rvgGroupId } : {}), ...(contractId !== undefined ? { contractId } : {}) }, stackAssessment) : []),
    [masters, schedule, intake, billing, rowId, rvgGroupId, contractId, stackAssessment],
  )

  // Decision options.
  const blockedByNhi = assessment !== undefined && (assessment.waitingForNhi || assessment.flags.some((f) => f.code === 'nhiInvalid'))
  const lists = fields !== undefined ? listsForRow(view, fields) : []
  const slots = fields !== undefined ? openSlotsForRow(view, fields) : []
  const suggested: DecisionKind | undefined = assessment?.suggestion?.kind
  const options: DecisionOption[] = []
  if (assessment !== undefined && fields !== undefined) {
    const nhiReason = assessment.waitingForNhi ? NHI_REQUIRED_MESSAGE : blockedByNhi ? INVALID_NHI_MESSAGE : undefined
    if (matchBooking !== undefined) {
      const ct = effective?.changeType
      options.push({
        kind: 'match',
        title: 'Match and apply',
        description:
          ct === 'cancellation'
            ? `Cancel ${matchBooking.patient.name}'s Booking. It stays visible and is left out of billing.`
            : ct === 'noChange'
              ? `Record the match. Nothing on ${matchBooking.patient.name}'s Booking changes.`
              : `Apply the ticked changes to ${matchBooking.patient.name}'s Booking.`,
        ...(nhiReason !== undefined ? { disabledReason: nhiReason } : {}),
      })
    } else if (fields.hospitalStatus !== 'cancelled') {
      options.push({
        kind: 'createBooking',
        title: 'Create a Booking on a List',
        description: `Add the Booking to a List or ${DRAFT_LIST} at this hospital that day.`,
        ...(nhiReason !== undefined ? { disabledReason: nhiReason } : lists.length === 0 ? { disabledReason: 'No List at this hospital that day.' } : {}),
      })
      options.push({
        kind: 'createList',
        title: 'Create a List in a session',
        description: `A new List in a free anaesthetist's ${fields.session} session, holding this Booking.`,
        ...(nhiReason !== undefined ? { disabledReason: nhiReason } : slots.length === 0 ? { disabledReason: `No anaesthetist is free on ${sessionLabel(fields.dateISO, fields.session)}.` } : {}),
      })
      options.push({
        kind: 'createDraft',
        title: `Create a ${DRAFT_LIST}`,
        description: 'Holds this Booking until the office assigns an anaesthetist.',
        ...(nhiReason !== undefined ? { disabledReason: nhiReason } : {}),
      })
    }
    options.push({ kind: 'reject', title: 'Reject', description: 'Nothing is created or changed. The reason is kept with the row.' })
  }
  const enabledKinds = new Set(options.filter((o) => o.disabledReason === undefined).map((o) => o.kind))
  const defaultKind: DecisionKind | undefined = byHandId !== undefined ? 'match' : suggested !== undefined && enabledKinds.has(suggested) ? suggested : undefined
  const kind = chosen !== undefined && enabledKinds.has(chosen) ? chosen : defaultKind

  const suggestedListId = assessment?.suggestion?.kind === 'createBooking' ? assessment.suggestion.listId : undefined
  const chosenListId = listId ?? suggestedListId ?? lists[0]?.id
  const surgeonId = assessment?.surgeonId ?? (surgeonPick !== '' ? surgeonPick : undefined)
  const slot = slots.find((s) => s.anaesthetistId === anaesthetistId)
  const requestKey = useSuggestionKey(rowId, kind === 'createList')
  const pairingWarning = useNotPreferredWarning(anaesthetistId, surgeonId)

  const diffs = effective?.diffs ?? []
  const tickable = (d: FieldDiff) => d.effect !== 'flagged' && effective?.changeType === 'modification'
  const ticked = diffs.filter((d) => tickable(d) && !unticked.has(d.key)).map((d) => d.key)
  const pickCount = (contractId !== undefined ? 1 : 0) + (rvgGroupId !== undefined ? 1 : 0)
  const wording = fields?.procedure?.text
  const noWording = wording === undefined || wording.trim() === ''
  const textDiff = diffs.find((d) => d.key === 'procedureText')
  const targetProc = matchBooking !== undefined ? targetProcedure(matchBooking) : undefined

  // The footer's label and the reason it is disabled.
  let primaryLabel = 'Choose a decision'
  let blocked: string | undefined = kind === undefined ? (assessment?.waitingForNhi === true ? NHI_REQUIRED_MESSAGE : blockedByNhi ? INVALID_NHI_MESSAGE : 'Choose a decision first.') : undefined
  if (kind === 'match') {
    const ct = effective?.changeType
    const n = (ct === 'modification' ? ticked.length : 0) + (ct === 'cancellation' ? 0 : pickCount)
    primaryLabel = ct === 'cancellation' ? 'Cancel Booking' : n === 0 ? 'Mark as matched' : `Apply ${n} ${n === 1 ? 'change' : 'changes'}`
    if (matchList?.state === 'AUTHORISED') blocked = LIST_LOCKED_MESSAGE
  } else if (kind === 'createBooking') {
    primaryLabel = 'Create Booking'
    if (chosenListId === undefined) blocked = 'Choose a List first.'
  } else if (kind === 'createList') {
    primaryLabel = 'Create List and Booking'
    if (surgeonId === undefined) blocked = SURGEON_REQUIRED_MESSAGE
    else if (slot === undefined) blocked = 'Choose the anaesthetist first.'
  } else if (kind === 'createDraft') {
    primaryLabel = `Create ${DRAFT_LIST} and Booking`
    if (surgeonId === undefined) blocked = SURGEON_REQUIRED_MESSAGE
  } else if (kind === 'reject') {
    primaryLabel = 'Reject row'
    if (reason.trim() === '') blocked = 'Give a reason to reject this row.'
  }
  if (blocked === undefined && kind !== undefined && kind !== 'reject' && kind !== 'match' && noWording && rvgGroupId === undefined) blocked = WORDING_OR_CODE_MESSAGE

  if (row === undefined || fields === undefined) return null

  const hospitalName = locationName(fields.hospitalId, masters.hospitals)
  const batch = intake.batches[row.batchId]
  const missing = missingFields(fields)
  const change = assessment !== undefined ? changeTypePill(effective?.changeType ?? assessment.changeType) : null
  const insurer = insurerText(fields)
  // The NHI field's value and verdict, worked out once.
  const nhiValue = nhiDraft ?? fields.patient.nhi ?? ''
  const nhiInvalid = nhiValue.trim().length === 7 && !validateNhi(nhiValue).valid

  function picks(forCreate: boolean): OfficePicks | undefined {
    const p: OfficePicks = {
      ...(contractId !== undefined ? { contract: { contractId, ...(enteredPrice !== undefined ? { enteredPrice } : {}) } } : {}),
      ...(rvgGroupId !== undefined ? { rvgGroupId } : {}),
      ...(forCreate && fields?.insurer?.insurerPartyId !== undefined ? { recordInsurer } : {}),
    }
    return Object.keys(p).length > 0 ? p : undefined
  }

  function decide() {
    if (kind === undefined || blocked !== undefined) return
    let input: DecisionInput
    if (kind === 'reject') input = { kind: 'reject', reason: reason.trim() }
    else if (kind === 'match') {
      const p = picks(false)
      input = {
        kind: 'match',
        bookingId: matchBookingId!,
        fieldsApplied: ticked,
        ...(p !== undefined ? { picks: p } : {}),
        ...(useNewer && ticked.includes('procedureText') ? { useNewerText: true } : {}),
      }
    } else {
      const p = picks(true)
      const withPicks = p !== undefined ? { picks: p } : {}
      if (kind === 'createBooking') input = { kind, listId: chosenListId!, ...withPicks }
      else if (kind === 'createList') input = { kind, slotId: slot!.id, ...(assessment?.surgeonId === undefined && surgeonId !== undefined ? { surgeonId } : {}), ...withPicks }
      else input = { kind, ...(assessment?.surgeonId === undefined && surgeonId !== undefined ? { surgeonId } : {}), ...withPicks }
    }
    const out = decideImportRow(useAppStore, actor, rowId, input)
    if (!out.ok) {
      setError(out.message)
      return
    }
    setError(null)
    onDecided(rowId)
  }

  function onNhi(value: string) {
    setNhiDraft(value)
    const v = validateNhi(value)
    if (v.valid) {
      const out = correctImportRow(useAppStore, actor, rowId, { nhi: v.normalised })
      if (out.ok) {
        setNhiDraft(null)
        setError(null)
      } else setError(out.message)
    }
  }

  function saveCorrections() {
    if (draft === null) return
    const patch: { patientName?: string; dobISO?: string; scheduledTime?: string } = {}
    if (draft.patientName !== fields!.patient.name) patch.patientName = draft.patientName
    if (draft.dobISO !== (fields!.patient.dobISO ?? '')) patch.dobISO = draft.dobISO
    if (draft.scheduledTime !== (fields!.scheduledTime ?? '')) patch.scheduledTime = draft.scheduledTime
    if (Object.keys(patch).length === 0) {
      setCorrecting(false)
      return
    }
    const out = correctImportRow(useAppStore, actor, rowId, patch)
    if (!out.ok) setError(out.message)
    else {
      setError(null)
      setCorrecting(false)
    }
  }

  // The Contract step rail's context: the matched Procedure's List, else the List the Booking would land on.
  const railContext: RailContext | undefined = (() => {
    const funder = fields.insurer?.insurerPartyId
    const recordFunder = funder !== undefined && (kind === 'match' ? ticked.includes('insurer') : recordInsurer)
    let base: RailContext | undefined
    if (targetProc !== undefined) base = railContextForProcedure({ masters, schedule }, targetProc.id)
    else {
      const landing = kind === 'createBooking' ? chosenListId : assessment?.targetListId
      const list = landing !== undefined ? schedule.lists[landing] : undefined
      base = list !== undefined ? railContextForList({ masters }, list) : { listDateISO: fields.dateISO, hospitalId: fields.hospitalId, ...(surgeonId !== undefined ? { surgeonId } : {}), ...(slot !== undefined ? { anaesthetistId: slot.anaesthetistId } : {}) }
    }
    return base === undefined ? undefined : recordFunder ? { ...base, funderPartyId: funder } : base
  })()
  const railStart: RailAnswers | undefined =
    contractId !== undefined ? railAnswersFor(masters, contractId) : targetProc !== undefined ? railStartFor({ masters, schedule }, targetProc.id) : undefined
  const currentContractId = contractId ?? (targetProc !== undefined ? schedule.procedures[targetProc.id]?.governingContractId : undefined)

  // After the decision: the banner (Admin Review's choreography).
  const decidedBookingId = row.decision !== undefined && 'bookingId' in row.decision ? row.decision.bookingId : undefined
  const decidedBooking = decidedBookingId !== undefined ? schedule.bookings[decidedBookingId] : undefined
  const decidedList = decidedBooking !== undefined ? schedule.lists[decidedBooking.listId] : undefined
  const needsDestination =
    decidedBookingId !== undefined && row.decision?.kind !== 'reject' && decidedBooking?.cancellation === undefined && Object.values(schedule.procedures).some((p) => p.bookingId === decidedBookingId && p.governingContractId === undefined)

  const footer = open ? (
    <>
      {kind !== 'reject' && (
        <Button variant="secondary" size="desktop" onClick={() => setChosen('reject')}>
          Reject
        </Button>
      )}
      <Button variant="primary" size="desktop" shot="matching-apply" disabled={blocked !== undefined} disabledReason={blocked} onClick={decide} style={{ marginLeft: 'auto' }}>
        {primaryLabel}
      </Button>
    </>
  ) : nextRowId !== undefined ? (
    <Button variant="outline" size="desktop" onClick={onNext} style={{ marginLeft: 'auto' }}>
      Next row
    </Button>
  ) : undefined

  return (
    <SidePanel
      open
      onClose={onClose}
      width="list"
      shot="matching-panel"
      testId="matching-panel"
      panelAttrs={{ 'data-import-row-id': rowId }}
      above={
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {change !== null ? <Pill size="lg" tone={change.tone}>{change.label}</Pill> : <Pill size="lg" tone={row.status === 'applied' ? 'success' : 'neutral'}>{row.status === 'applied' ? 'Applied' : 'Rejected'}</Pill>}
          {assessment?.queue === 'unmatched' && !assessment.waitingForNhi && <Pill size="lg" tone="warning">Unmatched</Pill>}
          {(assessment?.flags ?? []).map((f) => (
            <Pill key={f.code} size="lg" tone={f.code === 'nhiInvalid' ? 'error' : 'warning'}>{f.label}</Pill>
          ))}
        </div>
      }
      title={fields.patient.name}
      meta={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 4, fontSize: 12.5, color: neutral.slate }}>
          <span>
            {hospitalName} · {CHANNEL_CAPS[row.channel]} · received {stampText(row.receivedAtISO, { weekday: false })}
          </span>
          {batch !== undefined && <span style={{ color: neutral.mist }}>{batch.label}</span>}
          {missing !== null && <span data-missing style={{ color: semantic.warning.onTint }}>{missing}</span>}
        </div>
      }
      footer={footer}
      footerLayout="wrap"
      footerTestId="matching-panel-footer"
    >
      {justDecided && row.decision !== undefined && (
        <Notice tone="success" live="status" shot="matching-banner" enter icon={<TickBadge size={30} animate />} title={`${decisionText(view, row, row.decision)} · ${byWhen(row, todayISO)}`}>
          {needsDestination && (
            <span>
              <Pill size="sm" tone="warning">Needs an invoice destination</Pill>
            </span>
          )}
          <span style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {decidedBookingId !== undefined && decidedList !== undefined && (
              <TextAction size="sm" flush onClick={() => onOpenBooking(decidedList.dateISO, decidedBookingId)}>Open Booking</TextAction>
            )}
            {nextRowId !== undefined && <TextAction size="sm" flush onClick={onNext}>Next row</TextAction>}
          </span>
        </Notice>
      )}

      {!open && !justDecided && row.decision !== undefined && (
        <Notice tone="neutral" title={decisionText(view, row, row.decision)}>
          <span className="mono" style={{ fontSize: 12, color: neutral.slate }}>{byWhen(row, todayISO)}</span>
          {decidedBookingId !== undefined && decidedList !== undefined && (
            <span><TextAction size="sm" flush onClick={() => onOpenBooking(decidedList.dateISO, decidedBookingId)}>Open Booking</TextAction></span>
          )}
        </Notice>
      )}

      {/* NHI first (D11): nothing is created until it is added. */}
      {open && blockedByNhi && (
        <div data-shot="matching-nhi" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <TextField
            label="NHI"
            mono
            value={nhiValue}
            onChange={onNhi}
            maxLength={7}
            autoFocus
            invalid={nhiInvalid}
            hint={
              nhiInvalid
                ? 'NHI invalid. Check it against the hospital record.'
                : assessment?.waitingForNhi === true
                  ? 'Add the NHI to continue. Nothing is created until it is added.'
                  : 'Correct the NHI to continue.'
            }
            data-row-nhi
          />
        </div>
      )}

      {/* The wording as received, verbatim (US-02.1.2): never an edit field. */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Eyebrow as="h3" style={{ margin: 0 }}>Procedure as received</Eyebrow>
        {noWording ? (
          NOT_SUPPLIED
        ) : (
          <div style={{ fontFamily: fontFamily.mono, fontSize: 13, lineHeight: '19px', color: neutral.ink, background: neutral.bg, borderRadius: radius.ctl, padding: '8px 10px', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>“{wording}”</div>
        )}
        {fields.procedure?.code !== undefined && <span style={{ fontSize: 12, color: neutral.slate }}>Hospital's code <span className="mono">{fields.procedure.code}</span></span>}
      </section>

      {/* The match and the differences (US-02.1.3; AR-21 review-differences). */}
      {open && (
        <section data-shot="matching-diff" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {matchBooking !== undefined && matchList !== undefined ? (
            <>
              <div style={{ fontSize: 13, lineHeight: '19px' }}>
                Matched to{' '}
                <TextAction size="sm" flush inline onClick={() => onOpenBooking(matchList.dateISO, matchBooking.id)}>
                  {matchBooking.patient.name}'s Booking
                </TextAction>{' '}
                on {listOwnerLabel(view, matchList)}'s {sessionLabel(matchList.dateISO, matchList.session)} List
                {matchBooking.cancelled ? ' (cancelled)' : ''}
                <div style={{ fontSize: 12, color: neutral.slate }}>{byHandId !== undefined ? MATCH_BASIS_LABELS.byHand : MATCH_BASIS_LABELS[assessment!.match!.basis]}</div>
              </div>
              {diffs.length === 0 ? (
                <div style={{ fontSize: 12.5, color: neutral.slate }}>{effective?.changeType === 'cancellation' ? 'The hospital cancelled this booking.' : 'No differences from the Booking.'}</div>
              ) : (
                <DiffTable
                  diffs={diffs}
                  tickable={tickable}
                  unticked={unticked}
                  onToggle={(key) =>
                    setUnticked((cur) => {
                      const next = new Set(cur)
                      if (next.has(key)) next.delete(key)
                      else next.add(key)
                      return next
                    })
                  }
                />
              )}
              {textDiff !== undefined && (
                <div data-invoice-effect={textDiff.invoiceEffect} style={{ fontSize: 12, color: neutral.slate, lineHeight: '17px' }}>
                  The current text is kept in the change history.{' '}
                  {textDiff.invoiceEffect !== undefined && (useNewer ? 'The hospital\'s text will be used on the invoice.' : INVOICE_EFFECT_LABELS[textDiff.invoiceEffect] + '.')}
                  {textDiff.invoiceEffect === 'keptEdit' && (
                    <>
                      {' '}
                      <TextAction size="sm" flush inline onClick={() => setUseNewer((u) => !u)}>{useNewer ? 'Keep the edit' : 'Use it'}</TextAction>
                    </>
                  )}
                </div>
              )}
            </>
          ) : (
            <DefList>
              <DefRow label="NHI">{fields.patient.nhi !== undefined && fields.patient.nhi !== '' ? <span className="mono">{fields.patient.nhi}</span> : NOT_SUPPLIED}</DefRow>
              <DefRow label="Born">{fields.patient.dobISO !== undefined ? <span className="mono">{fields.patient.dobISO}</span> : NOT_SUPPLIED}</DefRow>
              <DefRow label="Surgeon">{fields.surgeon?.name ?? NOT_SUPPLIED}</DefRow>
              <DefRow label="When"><span className="mono">{whenText(fields)}</span></DefRow>
              {fields.note !== undefined && <DefRow label="Note">{fields.note}</DefRow>}
            </DefList>
          )}
          {assessment?.unmatchedReason !== undefined && !assessment.waitingForNhi && matchBooking === undefined && (
            <Notice tone="warning">{assessment.unmatchedReason}</Notice>
          )}
          {!blockedByNhi && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span>
                <TextAction size="sm" flush ariaExpanded={searchOpen} onClick={() => setSearchOpen((o) => !o)}>Match to another Booking</TextAction>
              </span>
              {searchOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <NameSearchBox value={query} onChange={setQuery} label={`Find a Booking at ${hospitalName} on ${sessionLabel(fields.dateISO, fields.session).replace(/ (AM|PM|Out-of-hours)$/, '')}`} placeholder="Patient name or NHI" fill="well" autoFocus />
                  <div role="list" style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 220, overflow: 'auto' }}>
                    {searchBookingsForRow(view, fields, query).map((b) => {
                      const l = view.lists[b.listId]!
                      return (
                        <div role="listitem" key={b.id}>
                          <OptionRow
                            data-search-booking={b.id}
                            selected={b.id === matchBookingId}
                            trailing={`${l.session}${b.scheduledTime !== undefined ? ` · ${b.scheduledTime}` : ''} · ${listOwnerLabel(view, l)}`}
                            onClick={() => {
                              setByHandId(b.id)
                              setChosen('match')
                              setUnticked(new Set())
                              // Picks made for another Booking never carry over (review fix).
                              setContractId(undefined)
                              setEnteredPrice(undefined)
                              setRvgGroupId(undefined)
                              setSearchOpen(false)
                            }}
                          >
                            {b.patient.name} <span className="mono" style={{ color: neutral.slate, fontSize: 12 }}>{b.patient.nhi ?? ''}</span>
                          </OptionRow>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Each Procedure as 20a's shared stack, then the office's optional picks. */}
      {open && !blockedByNhi && kind !== 'reject' && effective?.changeType !== 'cancellation' && stacks.length > 0 && (
        <section data-shot="matching-stack" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {stacks.map((v, i) => (
            <ProcedureStack key={i} view={v} density="full" surface="office" {...(stacks.length > 1 ? { heading: `Procedure ${i + 1}` } : {})} />
          ))}
          {matchBooking !== undefined && textDiff !== undefined && ticked.includes('procedureText') && (
            <div style={{ fontSize: 12, color: neutral.slate }}>The hospital's text replaces this one when you apply.</div>
          )}
          {matchBooking !== undefined && (contractId !== undefined || rvgGroupId !== undefined) && (
            <div style={{ fontSize: 12.5, color: neutral.ink }}>
              {contractId !== undefined && <div>Contract to set: {masters.contracts[contractId]?.name ?? contractId}</div>}
              {rvgGroupId !== undefined && <div>RVG code to set: <span className="mono">{masters.rvgGroups[rvgGroupId]?.code ?? rvgGroupId}</span></div>}
            </div>
          )}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextAction size="sm" flush onClick={() => setRailOpen(true)} disabled={railContext === undefined} shot="matching-choose-contract">
              {contractId !== undefined ? 'Change Contract' : 'Choose Contract'}
            </TextAction>
            <TextAction size="sm" flush onClick={() => setCodeOpen(true)} shot="matching-choose-rvg">
              {rvgGroupId !== undefined ? 'Change RVG code' : 'Choose RVG code'}
            </TextAction>
          </div>
          <div style={{ fontSize: 12, color: neutral.mist, lineHeight: '17px' }}>
            Leave either to choose later: the Booking waits on Needs an invoice destination, and the RVG code is the anaesthetist's.
          </div>
          {insurer !== null && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5, color: neutral.ink }}>
              <span>Insurer from the hospital: {fields.insurer!.text}{fields.insurer!.approvalNumber !== undefined ? `, approval ${fields.insurer!.approvalNumber}` : ''}</span>
              {matchBooking === undefined && fields.insurer!.insurerPartyId !== undefined && (
                <Checkbox checked={recordInsurer} onChange={setRecordInsurer}>Record on the Booking</Checkbox>
              )}
            </div>
          )}
        </section>
      )}

      {/* Correct the identifying fields (never the wording). */}
      {open && !blockedByNhi && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {!correcting ? (
            <span>
              <TextAction
                size="sm"
                flush
                onClick={() => {
                  setDraft({ patientName: fields.patient.name, dobISO: fields.patient.dobISO ?? '', scheduledTime: fields.scheduledTime ?? '' })
                  setCorrecting(true)
                }}
              >
                Correct name, date of birth or time
              </TextAction>
            </span>
          ) : (
            draft !== null && (
              <>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <RowField label="Name" value={draft.patientName} onChange={(v) => setDraft({ ...draft, patientName: v })} width={150} />
                  <RowField label="Date of birth" value={draft.dobISO} mono onChange={(v) => setDraft({ ...draft, dobISO: v })} width={100} />
                  <RowField label="Time" value={draft.scheduledTime} mono onChange={(v) => setDraft({ ...draft, scheduledTime: v })} width={64} />
                </div>
                <span style={{ display: 'flex', gap: 14 }}>
                  <TextAction size="sm" flush onClick={saveCorrections}>Save corrections</TextAction>
                  <TextAction size="sm" flush onClick={() => setCorrecting(false)}>Cancel</TextAction>
                </span>
              </>
            )
          )}
        </section>
      )}

      {open && options.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Eyebrow as="h3" style={{ margin: 0 }}>Decision</Eyebrow>
          <DecisionCards
            options={options}
            value={kind}
            suggested={suggested}
            onChange={(k) => {
              setChosen(k)
              setError(null)
            }}
            detail={
              kind === 'createBooking' ? (
                <SelectField label="List" value={chosenListId ?? ''} onChange={setListId} size="compact">
                  {lists.map((l) => (
                    <option key={l.id} value={l.id}>
                      {listOwnerLabel(view, l)} · {sessionLabel(l.dateISO, l.session)}
                    </option>
                  ))}
                </SelectField>
              ) : kind === 'createList' ? (
                <>
                  {assessment?.surgeonId === undefined && (
                    <SurgeonPicker anaesthetistId={anaesthetistId} value={surgeonPick} onChange={setSurgeonPick} emptyLabel="Choose the surgeon" label="Surgeon" size="compact" />
                  )}
                  {anaesthetistId === undefined || slot === undefined ? (
                    <AnaesthetistCandidates
                      candidates={[...new Set(slots.map((s) => s.anaesthetistId))]}
                      surgeonId={surgeonId}
                      requestKey={requestKey}
                      onPick={setAnaesthetistId}
                      trailing={() => <span className="mono" style={{ fontSize: 12, color: neutral.slate }}>Free {fields.session}</span>}
                      emptyText="No anaesthetist is free that session."
                    />
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, fontSize: 13 }}>
                        <span>
                          <strong>{masters.anaesthetists[anaesthetistId]?.name ?? anaesthetistId}</strong> · {sessionLabel(fields.dateISO, fields.session)}
                        </span>
                        <TextAction size="sm" flush onClick={() => setAnaesthetistId(undefined)}>Change</TextAction>
                      </div>
                      <NotPreferredWarning warning={pairingWarning} shot="matching-pairing-warning" />
                    </>
                  )}
                </>
              ) : kind === 'createDraft' ? (
                assessment?.surgeonId === undefined ? (
                  <SurgeonPicker anaesthetistId={undefined} value={surgeonPick} onChange={setSurgeonPick} emptyLabel="Choose the surgeon" label="Surgeon" size="compact" />
                ) : null
              ) : kind === 'reject' ? (
                <>
                  <TextField label="Reason" value={reason} onChange={setReason} size="compact" placeholder="Why this row is rejected" />
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {QUICK_REJECT_REASONS.map((r) => (
                      <Button key={r} variant={reason === r ? 'pill' : 'secondary'} size="compact" onClick={() => setReason(r)}>
                        {r}
                      </Button>
                    ))}
                  </div>
                </>
              ) : null
            }
          />
        </section>
      )}

      <FormError message={error} />

      {railContext !== undefined && (
        <ContractRail
          open={railOpen}
          actor={railActorOf(actor)}
          context={railContext}
          start={railStart}
          {...(currentContractId !== undefined ? { currentContractId } : {})}
          onDone={(pick) => {
            setContractId(pick.contractId)
            setEnteredPrice(pick.enteredPrice)
            if (pick.rvgGroupId !== undefined) setRvgGroupId(pick.rvgGroupId)
            return null
          }}
          onClose={() => setRailOpen(false)}
        />
      )}
      <CodePickerSheet
        open={codeOpen}
        {...(rvgGroupId !== undefined ? { currentId: rvgGroupId } : {})}
        rvgGroups={masters.rvgGroups}
        onPick={(id) => {
          setRvgGroupId(id)
          setCodeOpen(false)
        }}
        onClose={() => setCodeOpen(false)}
      />
    </SidePanel>
  )
}
