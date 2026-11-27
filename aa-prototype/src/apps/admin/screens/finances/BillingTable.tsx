/**
 * The Billing tab's table (build plan Phase 60, the mock's version C; US-13.3.1,
 * US-13.3.2): rows are Bookings only. A `GroupRow` per anaesthetist, then a
 * `GroupRow level="sub"` per List carrying its date, session, hospital, status,
 * its counts as a sentence, its run and "Show all". Each Booking shows the
 * patient, the Booking id, the problem's reason under the name, a status pill,
 * its invoice count and the four steps as words; its fix sits on the right
 * (Retry, Fix the payer, Mark resolved; the Xero tab for anything stuck at
 * Xero). Nothing here approves a List.
 */

import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { neutral, semantic, type as typeScale } from '../../../../theme/tokens'
import { retryBillingFailure, useAppStore, type Actor } from '../../../../store'
import type { BillingProblem, BillingStepState, BookingBillingStatus, ListBillingStatus } from '../../../../domain/billing/billingStatus'
import { sessionText } from '../../../../domain/outOfHours'
import { hhmm, shortDay } from '../../../../shared/format'
import { CREDIT_LABELS } from '../../../../shared/procedureEventCopy'
import { ClickableRow, GroupRow, RowOpenButton, TableShell, Td, Th } from '../../../../shared/table'
import { Button, EmptyState, FormError, Pill, TextAction, visuallyHidden, type PillTone } from '../../../../shared/ui'
import { Pager } from '../../components/Pager'
import { CorrectionRetry } from './CorrectionRetry'
import { financePath } from './financePaths'
import { BILLING_PAGE_SIZE, type BillingShow, type BillingTabList, type BillingTabParams, type BillingTabView } from './billingTabState'
import { FixPayerSheet, MarkResolvedSheet } from './BillingFixSheets'

const COLUMNS = 8

/** A failed Booking whose fix sheet is open. */
interface FixTarget {
  exceptionId: string
  bookingId: string
  patientName: string
}

export interface BillingTableProps {
  view: BillingTabView
  params: BillingTabParams
  actor: Actor
  /** Turn a List's Show all on or off. */
  onShowAll: (listId: string, on: boolean) => void
  onPage: (page: number) => void
  onShow: (show: BillingShow) => void
  /** Clear the search and the anaesthetist. */
  onClearSearch: () => void
}

export function BillingTable({ view, params, actor, onShowAll, onPage, onShow, onClearSearch }: BillingTableProps) {
  const navigate = useNavigate()
  const [fixing, setFixing] = useState<FixTarget | null>(null)
  const [resolving, setResolving] = useState<FixTarget | null>(null)

  if (view.totalLists === 0) return <BillingEmpty params={params} onShow={onShow} onClearSearch={onClearSearch} />

  return (
    <>
      <TableShell
        label="Billing"
        shot="billing-table"
        density="dense"
        fit
        {...(view.pages > 1 ? { footer: <Pager total={view.totalLists} size={BILLING_PAGE_SIZE} page={view.page} onPage={onPage} lead="Lists" shot="billing-pager" /> } : {})}
      >
        <thead>
          <tr>
            <Th>Booking</Th>
            <Th nowrap>Status</Th>
            <Th align="right" nowrap>Invoices</Th>
            <Th nowrap>Sent</Th>
            <Th nowrap>Xero</Th>
            <Th nowrap>Paid in</Th>
            <Th nowrap>Disbursed</Th>
            <Th align="right">
              <span style={visuallyHidden}>Fix</span>
            </Th>
          </tr>
        </thead>
        <tbody>
          {view.groups.map((group) => [
            <GroupRow
              key={`g-${group.anaesthetistId}`}
              span={COLUMNS}
              data-shot={`billing-group-${group.anaesthetistId}`}
              data-anaesthetist-id={group.anaesthetistId}
              counts={
                <>
                  {`${group.listCount} authorised`}
                  {group.problemListCount > 0 && (
                    <>
                      {' · '}
                      <span style={{ color: semantic.warning.onTint, fontWeight: 700 }}>{`${group.problemListCount} with problems`}</span>
                    </>
                  )}
                </>
              }
              style={{ color: neutral.ink }}
            >
              <span style={{ fontSize: typeScale.label.size, fontWeight: 700, color: neutral.ink }}>{group.anaesthetistName}</span>
            </GroupRow>,
            ...group.lists.map((entry) => [
              <ListHeading key={`l-${entry.list.listId}`} entry={entry} landed={params.listId === entry.list.listId} onShowAll={onShowAll} />,
              ...entry.bookings.map((b) => (
                <BookingLine
                  key={b.bookingId}
                  booking={b}
                  actor={actor}
                  onOpen={() => navigate(`/admin/day/${entry.list.dateISO}/bookings/${b.bookingId}`)}
                  onFixPayer={(t) => setFixing(t)}
                  onMarkResolved={(t) => setResolving(t)}
                />
              )),
            ]),
          ])}
        </tbody>
      </TableShell>
      {fixing !== null && (
        <FixPayerSheet
          exceptionId={fixing.exceptionId}
          patientName={fixing.patientName}
          actor={actor}
          onClose={() => setFixing(null)}
          onMarkResolved={() => {
            setResolving(fixing)
            setFixing(null)
          }}
        />
      )}
      {resolving !== null && <MarkResolvedSheet exceptionId={resolving.exceptionId} patientName={resolving.patientName} actor={actor} onClose={() => setResolving(null)} />}
    </>
  )
}

// ---------------------------------------------------------------------------
// Empty
// ---------------------------------------------------------------------------

const EMPTY_TITLE: Record<BillingShow, string> = {
  problems: 'No billing problems.',
  'in-progress': 'Nothing in progress.',
  done: 'Nothing done yet.',
  all: 'No Lists are authorised yet.',
}

const EMPTY_LINE: Record<BillingShow, string> = {
  problems: 'Every authorised List has billed, been sent and reached Xero.',
  'in-progress': 'No authorised List is waiting to be sent, reach Xero, be paid in or be disbursed.',
  done: 'No authorised List has been paid in and disbursed in full yet.',
  all: 'A List shows here once it is authorised on To authorise.',
}

function BillingEmpty({ params, onShow, onClearSearch }: { params: BillingTabParams; onShow: (show: BillingShow) => void; onClearSearch: () => void }) {
  const narrowed = params.q !== '' || params.anaesthetistId !== undefined
  if (narrowed) {
    return (
      <EmptyState
        variant="card"
        shot="billing-empty"
        title="No Lists match."
        action={
          <TextAction size="sm" flush onClick={onClearSearch} shot="billing-empty-clear">
            Clear the search
          </TextAction>
        }
      >
        Check the spelling, or clear the search and the anaesthetist.
      </EmptyState>
    )
  }
  return (
    <EmptyState
      variant="card"
      shot="billing-empty"
      title={EMPTY_TITLE[params.show]}
      {...(params.show !== 'all'
        ? {
            action: (
              <TextAction size="sm" flush onClick={() => onShow('all')} shot="billing-empty-show-all">
                Show all Lists
              </TextAction>
            ),
          }
        : {})}
    >
      {EMPTY_LINE[params.show]}
    </EmptyState>
  )
}

// ---------------------------------------------------------------------------
// A List's heading
// ---------------------------------------------------------------------------

const LIST_STATUS_TONE: Record<ListBillingStatus['status'], PillTone> = {
  'Needs attention': 'warning',
  'Voided in Xero': 'error',
  Billing: 'neutral',
  Complete: 'success',
}

const failedInRun = (b: BookingBillingStatus): boolean => b.problems.some((p) => p.kind === 'billingException')

function ListHeading({ entry, landed, onShowAll }: { entry: BillingTabList; landed: boolean; onShowAll: (listId: string, on: boolean) => void }) {
  const { list } = entry
  const failed = list.bookings.some(failedInRun)
  const tone = failed ? 'error' : list.hasProblem ? 'warning' : undefined
  const status: { label: string; tone: PillTone } = failed ? { label: 'Billing failed', tone: 'error' } : { label: list.status, tone: LIST_STATUS_TONE[list.status] }
  const { sent, inXero, paidIn, of } = list.counts
  // Show fewer only for a List the office opened with Show all (a List landed on from elsewhere stays whole).
  const canShowFewer = entry.showingAll && !landed
  return (
    <GroupRow
      span={COLUMNS}
      level="sub"
      {...(tone !== undefined ? { tone } : {})}
      data-shot={`billing-list-${list.listId}`}
      data-list-id={list.listId}
      counts={`${sent} of ${of} sent · ${inXero} of ${of} in Xero · ${paidIn} of ${of} paid in`}
      aside={
        <>
          <span className="mono">{list.billedAtISO !== undefined ? `Run ${shortDay(list.billedAtISO)} ${hhmm(list.billedAtISO)}` : 'Not run yet'}</span>
          {entry.hiddenCount > 0 ? (
            <TextAction size="sm" flush onClick={() => onShowAll(list.listId, true)} shot={`billing-show-all-${list.listId}`} label={`Show all ${entry.bookingCount} Bookings on this List`}>
              {`Show all ${entry.bookingCount}`}
            </TextAction>
          ) : canShowFewer ? (
            <ShowFewer listId={list.listId} onShowAll={onShowAll} />
          ) : null}
        </>
      }
    >
      <span className="mono" style={{ color: neutral.ink, fontWeight: 600 }}>{`${shortDay(list.dateISO)} · ${sessionText(list.session)}`}</span>
      <span style={{ color: neutral.ink, fontWeight: 500 }}>{list.hospitalName ?? list.hospitalId}</span>
      <Pill size="sm" tone={status.tone} data-list-status={status.label}>
        {status.label}
      </Pill>
    </GroupRow>
  )
}

/** Folds a List the office opened with Show all back to the Bookings the filter keeps. */
function ShowFewer({ listId, onShowAll }: { listId: string; onShowAll: (listId: string, on: boolean) => void }) {
  return (
    <TextAction size="sm" flush onClick={() => onShowAll(listId, false)} shot={`billing-show-fewer-${listId}`}>
      Show fewer
    </TextAction>
  )
}

// ---------------------------------------------------------------------------
// A Booking's row
// ---------------------------------------------------------------------------

const XERO_KINDS: ReadonlySet<BillingProblem['kind']> = new Set(['waitingForXero', 'xeroAlert'])
const DIVERGENCE_KINDS: ReadonlySet<BillingProblem['kind']> = new Set(['voidedInXero', 'amendedInXero', 'paidAfterCredit'])

const PROBLEM_PILL: Record<BillingProblem['kind'], { label: string; tone: PillTone }> = {
  billingException: { label: 'Billing failed', tone: 'error' },
  xeroAlert: { label: 'Xero alert', tone: 'error' },
  waitingForXero: { label: 'Waiting for Xero', tone: 'warning' },
  amendedInXero: { label: 'Changed in Xero', tone: 'warning' },
  voidedInXero: { label: 'Voided in Xero', tone: 'error' },
  paidAfterCredit: { label: 'Paid after credit', tone: 'error' },
}

const STAGE_PILL: Record<BookingBillingStatus['stage'], { label: string; tone: PillTone }> = {
  pending: { label: 'Not billed yet', tone: 'neutral' },
  failed: { label: 'Billing failed', tone: 'error' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
  invoiced: { label: 'Billed', tone: 'neutral' },
  waitingForXero: { label: 'Waiting for Xero', tone: 'warning' },
  handedOff: { label: 'Handed off', tone: 'success' },
  partPaid: { label: 'Part paid', tone: 'neutral' },
  paid: { label: 'Paid', tone: 'success' },
  partPaidOut: { label: 'Part disbursed', tone: 'success' },
  disbursed: { label: 'Disbursed', tone: 'success' },
  credited: { label: CREDIT_LABELS.credited, tone: 'neutral' },
}

function statusPill(b: BookingBillingStatus): { label: string; tone: PillTone } {
  if (b.problem !== undefined) return PROBLEM_PILL[b.problem.kind]
  if (b.resolvedByHand !== undefined) return { label: 'Done', tone: 'success' }
  return STAGE_PILL[b.stage]
}

/** A step as a word: done in the success colour, waiting or flagged in bold warning, not yet dimmed. */
function StepWord({ state, done }: { state: BillingStepState; done: string }) {
  const word = state === 'done' ? done : state === 'waiting' ? 'Waiting' : state === 'flagged' ? 'Flagged' : 'Not yet'
  const style =
    state === 'done'
      ? { color: semantic.success.onTint }
      : state === 'notYet'
        ? { color: neutral.mist }
        : { color: semantic.warning.onTint, fontWeight: 600 }
  return (
    <span data-step-state={state} style={style}>
      {word}
    </span>
  )
}

function sentWord(b: BookingBillingStatus): string {
  return b.sentBy === 'post' ? 'To post' : 'Emailed'
}

function BookingLine({
  booking: b,
  actor,
  onOpen,
  onFixPayer,
  onMarkResolved,
}: {
  booking: BookingBillingStatus
  actor: Actor
  onOpen: () => void
  onFixPayer: (t: FixTarget) => void
  onMarkResolved: (t: FixTarget) => void
}) {
  const problem = b.problem
  const pill = statusPill(b)
  const failed = problem?.kind === 'billingException'
  const reasonColour = failed ? semantic.error.onTint : semantic.warning.onTint
  return (
    <ClickableRow onOpen={onOpen} data-shot={`billing-row-${b.bookingId}`} data-booking-id={b.bookingId} {...(problem !== undefined ? { 'data-problem': problem.kind } : {})}>
      <Td>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <RowOpenButton label={`Open ${b.patientName}'s Booking`} onOpen={onOpen} style={{ fontWeight: 600, color: neutral.ink }}>
              {b.patientName}
            </RowOpenButton>
            <span className="mono" style={{ fontSize: typeScale.captionSm.size, color: neutral.mist }}>{b.bookingId}</span>
          </span>
          {problem !== undefined ? (
            <span data-shot={`billing-reason-${b.bookingId}`} style={{ fontSize: typeScale.small.size, lineHeight: `${typeScale.small.line}px`, color: reasonColour }}>
              {problem.reason}
            </span>
          ) : b.resolvedByHand !== undefined ? (
            <span data-shot={`billing-resolved-${b.bookingId}`} style={{ fontSize: typeScale.small.size, lineHeight: `${typeScale.small.line}px`, color: neutral.slate }}>
              {b.resolvedByHand.note !== undefined && b.resolvedByHand.note !== '' ? `Resolved by hand · ${b.resolvedByHand.note}` : 'Resolved by hand'}
            </span>
          ) : null}
        </div>
      </Td>
      <Td nowrap>
        <Pill size="sm" tone={pill.tone}>
          {pill.label}
        </Pill>
      </Td>
      <Td mono align="right" nowrap>
        {b.invoiceIds.length}
      </Td>
      <Td nowrap>
        <StepWord state={b.steps.sent} done={sentWord(b)} />
      </Td>
      <Td nowrap>
        <StepWord state={b.steps.inXero} done="In Xero" />
      </Td>
      <Td nowrap>
        <StepWord state={b.steps.paidIn} done="Paid in" />
      </Td>
      <Td nowrap>
        <StepWord state={b.steps.disbursed} done="Disbursed" />
      </Td>
      <Td align="right">
        {problem !== undefined ? <ProblemFix booking={b} problem={problem} actor={actor} onFixPayer={onFixPayer} onMarkResolved={onMarkResolved} /> : null}
      </Td>
    </ClickableRow>
  )
}

/** The fix beside a Booking with a problem. Its controls are buttons and links, so the row never opens from them. */
function ProblemFix({
  booking: b,
  problem,
  actor,
  onFixPayer,
  onMarkResolved,
}: {
  booking: BookingBillingStatus
  problem: BillingProblem
  actor: Actor
  onFixPayer: (t: FixTarget) => void
  onMarkResolved: (t: FixTarget) => void
}) {
  const [error, setError] = useState<string | null>(null)
  let controls: ReactNode = null

  if (problem.kind === 'billingException' && problem.exceptionId !== undefined) {
    const target: FixTarget = { exceptionId: problem.exceptionId, bookingId: b.bookingId, patientName: b.patientName }
    const retry = () => {
      const outcome = retryBillingFailure(useAppStore, actor, target.exceptionId)
      setError(outcome.ok ? null : outcome.message)
    }
    controls = (
      <>
        {problem.fix === 'fixPayer' && (
          <Button variant="primary" size="compact" onClick={() => onFixPayer(target)} shot={`billing-fix-payer-${b.bookingId}`}>
            Fix the payer
          </Button>
        )}
        <Button variant="secondary" size="compact" onClick={retry} shot={`billing-retry-${b.bookingId}`}>
          Retry
        </Button>
        <TextAction size="sm" flush onClick={() => onMarkResolved(target)} shot={`billing-mark-resolved-${b.bookingId}`}>
          Mark resolved
        </TextAction>
      </>
    )
  } else if (XERO_KINDS.has(problem.kind)) {
    controls = (
      <>
        <CorrectionRetry bookingId={b.bookingId} actor={actor} />
        <TextAction size="sm" flush to={financePath('xero')} shot={`billing-open-xero-${b.bookingId}`}>
          Open the Xero tab
        </TextAction>
      </>
    )
  } else if (DIVERGENCE_KINDS.has(problem.kind)) {
    controls = (
      <TextAction size="sm" flush to={financePath('xero')} shot={`billing-resolve-xero-${b.bookingId}`}>
        Resolve in the Xero tab
      </TextAction>
    )
  }

  return (
    // A click between the controls or on a refusal stays here: the row opens only from its own cells.
    <div data-fix={problem.fix} onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>{controls}</div>
      <FormError message={error} variant="inline" shot={`billing-retry-error-${b.bookingId}`} />
    </div>
  )
}
