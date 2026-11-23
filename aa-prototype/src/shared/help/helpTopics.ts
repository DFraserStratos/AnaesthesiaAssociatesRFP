/**
 * All point-of-need help copy in the app (catch-up Phase 43a; US-15.0.1). One
 * entry per tip; a screen keeps its tip by keeping the topic id, and an answered
 * open question changes one entry here.
 *
 * Copy states only answered rules, in the contract model's plain words (AR-58):
 * at most 60 words a topic, no dashes, never "slot", "event", "estimate" or
 * "deposit", and a tier named only in the Admin Draft Lists tip (D36). Each was
 * written against the screen it sits on (`helpTopics.test.ts` pins the rules).
 * Pure TypeScript (PWA closure); the Draft List words come from `scheduleTerms`.
 */

import { DRAFT_LIST, DRAFT_LISTS } from '../scheduleTerms'

export type HelpTopicId =
  | 'capture.stack'
  | 'capture.rvg'
  | 'capture.contract'
  | 'capture.price'
  | 'capture.modifiers'
  | 'capture.payer'
  | 'capture.times'
  | 'capture.warnings'
  | 'day.statuses'
  | 'day.draftLists'
  | 'day.needsDestination'
  | 'day.todo'
  | 'review.flags'
  | 'review.contracts'
  | 'review.price'
  | 'review.authorise'

export interface HelpTopic {
  title: string
  /** One to three short sentences a paragraph; at most 60 words in all. */
  body: readonly string[]
  /** For a sentence that rests on an open point. No topic is provisional today. */
  provisional?: { oq?: string; note: string }
}

export const HELP_TOPICS: Readonly<Record<HelpTopicId, HelpTopic>> = {
  'capture.stack': {
    title: 'Reading a procedure',
    body: [
      'Each procedure shows the text the rooms or the hospital sent, kept exactly as received.',
      "The Billing card shows where the invoice goes, the Contract and the price. The invoice wording starts as the rooms' text, becomes the hospital's when one arrives, or the Contract's own when it has one; the office can edit it.",
    ],
  },
  'capture.rvg': {
    title: 'Choosing an RVG code',
    body: [
      'Type a code or a few words. A Contract with its own RVG code fills it in for you.',
      "The starting base units come from the code's RVG group. You can change them; the office sees the change when it reviews the List.",
    ],
  },
  'capture.contract': {
    title: 'Contract',
    body: [
      'Each procedure has its own Contract. The office sets where the invoice goes and the Contract; where it prices on the RVG, you add the RVG code.',
      'Insurance never narrows the choices. You can change the Contract until the List is authorised; the office sees every change.',
    ],
  },
  'capture.price': {
    title: 'Price',
    body: [
      'The price follows its Contract, and how it is worked out shows here.',
      'Where an RVG Contract allows it you can type a different amount; on No contract · Fixed price you type the amount. A prepaid price is never editable, nor a Contract\'s own discount. The office sees every change.',
    ],
  },
  'capture.modifiers': {
    title: 'Modifiers',
    body: [
      "Age modifiers, from the patient's age on the procedure date, and P1 on neurosurgery and spine codes, are added for you; remove one if it does not apply.",
      'Every other modifier, ASA included, is optional: tick it and add a short explanation of why it applies.',
    ],
  },
  'capture.payer': {
    title: 'Who pays',
    body: [
      'Each procedure has its own payer, shown once its Contract bills the payer; until it has a Contract it reads Payer: not billed yet.',
      'Changing one offers the same change to the other procedures billing that payer, each ticked and yours to untick.',
    ],
  },
  'capture.times': {
    title: 'Times',
    body: [
      'Tap Start now when the anaesthetic starts and Finish now when it ends. You can adjust either time afterwards.',
      'Time units come from these two times, and a part interval always counts as a whole one.',
    ],
  },
  'capture.warnings': {
    title: 'Warnings',
    body: [
      'A warning is a reminder, never a block, such as an insurer with no approval number. It shows when you open the Booking, and the approval number shows with the insurer where there is one.',
      'You can still complete and submit as usual. The office sees the same warning.',
    ],
  },
  'day.statuses': {
    title: 'Reading the day',
    body: [
      "Each row is one anaesthetist's day: a morning and an afternoon session. A session shows its List, or its availability when it has none.",
      "The legend names each kind of List, then each availability status from the office's own list. Select one in the legend to hide or show it.",
    ],
  },
  'day.draftLists': {
    title: DRAFT_LISTS,
    body: [
      `A ${DRAFT_LIST} has a hospital, surgeon, day and session, but no anaesthetist yet. Only the office assigns one; anaesthetists never see them.`,
      'A List lands here when, for example, its anaesthetist returns it or a surgeon\'s regular booking falls on a session marked unavailable. Suggestions come in tier order, Tier 1 first, with any Not preferred pairing shown apart.',
    ],
  },
  'day.needsDestination': {
    title: 'Needs an invoice destination',
    body: [
      'These Bookings arrived without a place for the invoice to go, and no procedure can be completed without a Contract.',
      'Open one and work down the steps: where the invoice goes, the step that narrows it, then the Contract. An RVG-priced Contract goes to the anaesthetist for the RVG code. Nothing is chosen for you from the hospital.',
    ],
  },
  'day.todo': {
    title: 'To-do',
    body: [
      'Warnings that need action land here. None of them blocks anything. Open one to see the Booking, and Clear it once it is dealt with.',
      'Notices that need no action, such as a List an anaesthetist moved, go to Notifications instead.',
    ],
  },
  'review.flags': {
    title: 'Flags',
    body: [
      'Flags are things to check before you authorise. Fix them here, or phone the anaesthetist.',
      'A List is never sent back to the anaesthetist for changes.',
    ],
  },
  'review.contracts': {
    title: 'Procedures and Contracts',
    body: [
      "Each procedure shows its wording as received, its Contract and the RVG code. Check the Contract and each procedure's payer; a change the anaesthetist made is flagged.",
      'An insurer with no approval number is the one insurance warning, and you can still authorise.',
    ],
  },
  'review.price': {
    title: 'How the price is set',
    body: [
      'The price is held on each procedure. It follows its Contract, units times the rate less any discount, until a typed price or an invoice holds it.',
      'An anaesthetist can change theirs only where an RVG Contract allows it, or the amount on No contract · Fixed price. Every change is flagged here.',
    ],
  },
  'review.authorise': {
    title: 'Authorising',
    body: [
      'Authorising locks the List, its Bookings and the prices they use, and passes it to billing for its invoices.',
      'Anything added afterwards is invoiced in the next run. A correction is made by hand, with an additional invoice or a credit note.',
    ],
  },
}

export function helpTopic(id: HelpTopicId): HelpTopic {
  return HELP_TOPICS[id]
}

/** Words in a topic's body, for the 60-word rule. */
export function helpWordCount(topic: HelpTopic): number {
  return topic.body.join(' ').split(/\s+/).filter((w) => w !== '').length
}
