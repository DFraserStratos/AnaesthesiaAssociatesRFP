/**
 * Intake's six demo actions (build plan Phase 68; D119): played in order on Arrivals they tell the Okafor story. Each
 * runs as its source through the ingest (`store/intakeIngest.ts`: the rooms' mailbox, or a hospital's feed), never as
 * the office, decides nothing, and is disabled with its reason when it cannot run (already arrived, not yet possible,
 * or still standing in the feed). Deterministic: the samples are fixed (`OKAFOR_STORY`) and the rows built from the
 * schedule are sorted. Registered in `registry.ts`.
 *
 * Labels: four actions play a beat the demo guide's run sheet scripts under a retired trigger, so until the sweep
 * they keep that trigger's label (D119): Rooms email a List reads "Receive list with a missing NHI", Rooms re-send it
 * reads "Receive updated PDF from rooms", St George's sends the day-before List reads "Import hospital file", and
 * Southern Cross cancels a Booking (a hospital's update to a Booking AA holds) reads "Send update for a matched
 * Booking". The other two carry their D119 labels.
 */

import type { AppState } from '../../store'
import {
  heldMessageStanding,
  hospitalBatchReceived,
  hospitalFeedRefusal,
  identicalRowOpen,
  mailboxPdfReceived,
  receiveCancellation,
  receiveFailedMessage,
  receiveHospitalBatch,
  receiveMailboxPdf,
  receiveUnreadablePdf,
  stgDayBeforeRows,
  sxCancellationRow,
  unreadablePdfStanding,
} from '../../store'
import { OKAFOR_STORY, sessionLabel, toCheckCount } from '../../domain/intake'
import { plural } from '../format'
import type { DemoTrigger } from './types'

/** Arrivals (`intakePaths.ts`'s `INTAKE_BASE`): exactly that path, no deeper. */
export const INTAKE_ARRIVALS_ROUTE = '/admin/intake'
/** One arrival opened on its own page (`intakePaths.ts`'s `arrivalPath`): the same triggers show there. */
export const INTAKE_ARRIVAL_ROUTE = '/admin/intake/arrival/:key'
/** Sources. */
export const INTAKE_SOURCES_ROUTE = '/admin/intake/sources'
/** The Control Panel index headings. */
export const INTAKE_ARRIVALS_SCREEN = 'Admin · Intake · Arrivals'
export const INTAKE_SOURCES_SCREEN = 'Admin · Intake · Sources'

const ALREADY_RECEIVED = 'Already received'
const S = OKAFOR_STORY

/** Why St George's day-before List cannot be sent now, or null. */
function stgDayBeforeRefusal(state: AppState): string | null {
  if (hospitalBatchReceived(state, S.stgDayBefore.id)) return ALREADY_RECEIVED
  return hospitalFeedRefusal(state, S.stgDayBefore.hospitalId)
}

/** Why Southern Cross cannot cancel a Booking now, or null. */
function sxCancelRefusal(state: AppState): string | null {
  const feed = hospitalFeedRefusal(state, S.sxCancellation.hospitalId)
  if (feed !== null) return feed
  const row = sxCancellationRow(state)
  if (row === undefined) return 'No Southern Cross Booking ahead to cancel'
  return identicalRowOpen(state, row) ? `The cancellation for ${row.patient.name} is already waiting at Intake` : null
}

type ScanChoice = 'scan' | 'unreadable'
const scanChoice = (choiceId: string | undefined): ScanChoice => (choiceId === 'unreadable' ? 'unreadable' : 'scan')

function scanRefusal(state: AppState, choice: ScanChoice): string | null {
  if (choice === 'scan') return mailboxPdfReceived(state, S.scan.id) ? ALREADY_RECEIVED : null
  return unreadablePdfStanding(state, S.unreadable.fileName) ? `${S.unreadable.fileName} is still in the feed: dismiss it first` : null
}

function feedFailsRefusal(state: AppState): string | null {
  const feed = hospitalFeedRefusal(state, S.failedMessage.hospitalId)
  if (feed !== null) return feed
  return heldMessageStanding(state, S.failedMessage.hospitalId, S.failedMessage.label) ? 'This message is still held in the feed: dismiss it first' : null
}

export const INTAKE_ARRIVAL_TRIGGERS: readonly DemoTrigger[] = [
  {
    id: 'intake-rooms-email-list',
    // D119: "Rooms email a List" (the run sheet's label kept until the sweep).
    label: 'Receive list with a missing NHI',
    description:
      "Mr Okafor's rooms email his St George's List for Wed 25 Nov PM to the rooms' mailbox: four patients, Sione Faleolo with no NHI, naming Dr Rutherford, whose PM session is free. It is read at once and lands at the top of Arrivals as a New List, one patient waiting for an NHI. Nothing is decided.",
    screen: INTAKE_ARRIVALS_SCREEN,
    routes: [INTAKE_ARRIVALS_ROUTE, INTAKE_ARRIVAL_ROUTE],
    surfaces: ['bar'],
    disabledReason: (state) => (mailboxPdfReceived(state, S.roomsList.id) ? ALREADY_RECEIVED : null),
    run: (api) => {
      const res = receiveMailboxPdf(api, S.roomsList)
      if (!res.ok) return { ok: false, message: res.message }
      return { ok: true, message: `Mr Okafor's List arrived from the rooms' mailbox: ${plural(res.value.rowIds.length, 'patient')}, one waiting for an NHI.` }
    },
    indexPath: () => INTAKE_ARRIVALS_ROUTE,
  },
  {
    id: 'intake-rooms-resend',
    // D119: "Rooms re-send it" (the run sheet's label kept until the sweep).
    label: 'Receive updated PDF from rooms',
    description:
      "Mr Okafor's rooms re-send his Wed 25 Nov PM List: Ingrid Lindqvist moved to 15:30, Helen Brooks added, Gordon Pike no longer on it. Once his List is held (placed from the first PDF), it lands as an Update, with Gordon Pike's Booking to confirm as a removal; before that it lands as a second new List.",
    screen: INTAKE_ARRIVALS_SCREEN,
    routes: [INTAKE_ARRIVALS_ROUTE, INTAKE_ARRIVAL_ROUTE],
    surfaces: ['bar'],
    disabledReason: (state) => {
      if (!mailboxPdfReceived(state, S.roomsList.id)) return "Mr Okafor's first List has not arrived yet"
      return mailboxPdfReceived(state, S.roomsResend.id) ? ALREADY_RECEIVED : null
    },
    run: (api) => {
      if (!mailboxPdfReceived(api.getState(), S.roomsList.id)) return { ok: false, message: "Mr Okafor's first List has not arrived yet" }
      const res = receiveMailboxPdf(api, S.roomsResend)
      if (!res.ok) return { ok: false, message: res.message }
      const removals = res.value.removalRowIds.length
      return {
        ok: true,
        message:
          removals > 0
            ? `Mr Okafor's rooms re-sent the List. It arrived as an Update, with ${plural(removals, 'Booking')} missing from it to confirm as a removal.`
            : "Mr Okafor's rooms re-sent the List. His List is not held yet, so it arrived as a second new List.",
      }
    },
    indexPath: () => INTAKE_ARRIVALS_ROUTE,
  },
  {
    id: 'intake-stg-day-before',
    // D119: "St George's sends the day-before List" (the run sheet's label kept until the sweep).
    label: 'Import hospital file',
    description:
      "St George's feed sends its Lists for Wed 25 Nov: Mr Okafor's with the hospital's fuller wording, an approval number, a time shift and Sione Faleolo's NHI, and the day's other Lists exactly as AA holds them. It arrives as a hospital file over its Lists. Nothing is decided.",
    screen: INTAKE_ARRIVALS_SCREEN,
    routes: [INTAKE_ARRIVALS_ROUTE, INTAKE_ARRIVAL_ROUTE],
    surfaces: ['bar'],
    disabledReason: (state) => stgDayBeforeRefusal(state),
    run: (api) => {
      const state = api.getState()
      const reason = stgDayBeforeRefusal(state)
      if (reason !== null) return { ok: false, message: reason }
      const rows = stgDayBeforeRows(state)
      const res = receiveHospitalBatch(api, S.stgDayBefore.hospitalId, S.stgDayBefore.label, rows, { sampleId: S.stgDayBefore.id })
      if (!res.ok) return { ok: false, message: res.message }
      const others = new Set(rows.slice(S.stgDayBefore.okaforRows.length).map((r) => `${r.session}|${r.surgeon?.name ?? ''}`)).size
      return {
        ok: true,
        message:
          others > 0
            ? `St George's sent its Lists for Wed 25 Nov: Mr Okafor's, with Sione Faleolo's NHI, and ${plural(others, 'other List')} matching what AA holds.`
            : "St George's sent its Lists for Wed 25 Nov: Mr Okafor's, with Sione Faleolo's NHI.",
      }
    },
    indexPath: () => INTAKE_ARRIVALS_ROUTE,
  },
  {
    id: 'intake-sx-cancels',
    // D119: "Southern Cross cancels a Booking" (the run sheet's label kept until the sweep).
    label: 'Send update for a matched Booking',
    description:
      "Southern Cross's feed cancels its next Booking ahead (by day, session and time). It waits at Intake as a Cancellation; the Booking is unchanged until the office applies it, and then stays visible, marked cancelled.",
    screen: INTAKE_ARRIVALS_SCREEN,
    routes: [INTAKE_ARRIVALS_ROUTE, INTAKE_ARRIVAL_ROUTE],
    surfaces: ['bar'],
    disabledReason: (state) => sxCancelRefusal(state),
    run: (api) => {
      const state = api.getState()
      const reason = sxCancelRefusal(state)
      const row = sxCancellationRow(state)
      if (reason !== null || row === undefined) return { ok: false, message: reason ?? 'No Southern Cross Booking ahead to cancel' }
      const res = receiveCancellation(api, S.sxCancellation.hospitalId, row, S.sxCancellation.label)
      if (!res.ok) return { ok: false, message: res.message }
      return { ok: true, message: `Southern Cross cancelled ${row.patient.name}'s Booking on ${sessionLabel(row.dateISO, row.session)}. It waits at Intake; the Booking is unchanged until the office applies it.` }
    },
    indexPath: () => INTAKE_ARRIVALS_ROUTE,
  },
  {
    id: 'intake-scanned-pdf',
    label: 'A scanned PDF arrives',
    description:
      "A PDF arrives in the rooms' mailbox: a scanned cataract List, read with its unsure values marked to check, or a page that cannot be read, which lands with its reason. Never dropped.",
    screen: INTAKE_ARRIVALS_SCREEN,
    routes: [INTAKE_ARRIVALS_ROUTE, INTAKE_ARRIVAL_ROUTE],
    surfaces: ['bar'],
    choices: () => [
      { id: 'scan', label: 'A scan with values to check' },
      { id: 'unreadable', label: 'A page that cannot be read' },
    ],
    // The first choice that can still run.
    defaultChoice: (state) => (scanRefusal(state, 'scan') === null ? 'scan' : 'unreadable'),
    disabledReason: (state, _ctx, choiceId) => scanRefusal(state, scanChoice(choiceId)),
    run: (api, _ctx, choiceId) => {
      const choice = scanChoice(choiceId)
      const reason = scanRefusal(api.getState(), choice)
      if (reason !== null) return { ok: false, message: reason }
      if (choice === 'scan') {
        const res = receiveMailboxPdf(api, S.scan)
        if (!res.ok) return { ok: false, message: res.message }
        const list = api.getState().intake.pdfLists[res.value.pdfListId]
        const toCheck = list !== undefined ? toCheckCount(list) : 0
        return { ok: true, message: `Mr Whitford's cataract List arrived as a scan, read with ${plural(toCheck, 'value')} to check.` }
      }
      const res = receiveUnreadablePdf(api, { fileName: S.unreadable.fileName, facsimile: S.unreadable.facsimile, senderEmail: S.unreadable.senderEmail, reason: S.unreadable.reason })
      if (!res.ok) return { ok: false, message: res.message }
      return { ok: true, message: `${S.unreadable.fileName} arrived in the rooms' mailbox but cannot be read: ${S.unreadable.reason}` }
    },
    indexPath: () => INTAKE_ARRIVALS_ROUTE,
  },
  {
    id: 'intake-feed-fails',
    label: 'A feed message fails',
    description:
      "Southern Cross's feed sends a message that names no patient. It is held with its reason, its raw text kept behind the restricted view, and shown in the feed and under Southern Cross on Sources. Never dropped.",
    screen: INTAKE_ARRIVALS_SCREEN,
    alsoScreens: [INTAKE_SOURCES_SCREEN],
    routes: [INTAKE_ARRIVALS_ROUTE, INTAKE_ARRIVAL_ROUTE, INTAKE_SOURCES_ROUTE],
    surfaces: ['bar'],
    disabledReason: (state) => feedFailsRefusal(state),
    run: (api) => {
      const reason = feedFailsRefusal(api.getState())
      if (reason !== null) return { ok: false, message: reason }
      const res = receiveFailedMessage(api, S.failedMessage.hospitalId, { label: S.failedMessage.label, reason: S.failedMessage.reason, raw: S.failedMessage.raw })
      if (!res.ok) return { ok: false, message: res.message }
      return { ok: true, message: `A Southern Cross message was held at Intake: ${S.failedMessage.reason}` }
    },
    indexPath: () => INTAKE_ARRIVALS_ROUTE,
  },
]
