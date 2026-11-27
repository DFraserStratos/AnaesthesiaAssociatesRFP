/**
 * New contract's "Where it will show" (build plan Phase 46; US-04.3.8, US-04.2.17,
 * D91): where the Contract will sit on the step rail, live as the form changes.
 * The path is `destinationHint(destinationOf(...))`, the one placement rule
 * (an untagged hospital Contract reads "Offered under Special" while OQ-145 is
 * open); the sentence under it says who sees it, from the same settings. A
 * read-out, never a tester (D95). Nothing is placed until a holder is chosen.
 */

import { destinationHint, destinationOf } from '../../../../../domain/billing/fallbacks'
import { formatRangeDate } from '../../../../../domain/billing/priceRanges'
import { contractSpecialtyLabel } from '../../../../../domain/specialties'
import { Card } from '../../../../../shared/ui'
import { useAppStore } from '../../../../../store'
import { neutral } from '../../../../../theme/tokens'
import type { ContractDraft, DraftRules } from '../../../flows/contractDraft'

/** "A", "A and B", "A, B and C". */
function joinNames(names: readonly string[]): string {
  if (names.length <= 1) return names.join('')
  return `${names.slice(0, -1).join(', ')} and ${names.at(-1)!}`
}

/** Who sees it, for what and from when, in one sentence. */
export function whereSentence(
  draft: ContractDraft,
  rules: DraftRules,
  names: { surgeons: readonly string[]; anaesthetist: string | null },
  specialties: string,
): string {
  const linked = rules.showLinks ? [...names.surgeons, ...(names.anaesthetist !== null ? [names.anaesthetist] : [])] : []
  const lists = linked.length === 0 ? 'On every List' : linked.length === 1 ? `On ${linked[0]!}'s Lists` : `On the Lists of ${joinNames(linked)}`
  const forWhat = draft.specialtyIds.length === 0 ? 'for every specialty' : `for ${specialties}`
  const from = draft.kind === 'fixed' && draft.firstStart !== '' ? `, from ${formatRangeDate(draft.firstStart)}` : ''
  const bills = rules.billsTo === 'payer' ? 'Bills the payer on the Procedure.' : `Bills ${rules.holder?.name ?? 'its holder'}.`
  return `${lists}, ${forWhat}${from}. ${bills}`
}

/** `shot` names the card (Replace from a date's rail shows it too). */
export function WhereItWillShow({ draft, rules, shot = 'new-contract-where' }: { draft: ContractDraft; rules: DraftRules; shot?: string }) {
  const masters = useAppStore((s) => s.masters)
  const holder = rules.holder
  const placement =
    holder === undefined
      ? null
      : destinationHint(
          destinationOf({ billsTo: rules.billsTo, prepaid: draft.prepaid, holderId: holder.id, ...(draft.fundingTagId !== '' ? { fundingTagId: draft.fundingTagId } : {}) }, masters.parties),
          masters.parties,
          masters.fundingTags,
        )
  const sentence =
    holder === undefined
      ? null
      : whereSentence(
          draft,
          rules,
          {
            surgeons: draft.surgeonIds.map((id) => masters.surgeons[id]?.name ?? id),
            anaesthetist: draft.anaesthetistId !== '' ? (masters.anaesthetists[draft.anaesthetistId]?.name ?? draft.anaesthetistId) : null,
          },
          contractSpecialtyLabel(masters, draft.specialtyIds),
        )
  return (
    <Card title="Where it will show" shot={shot}>
      {placement === null ? (
        <span style={{ fontSize: 13, color: neutral.mist }}>Choose the holder to see where it will show on the step rail.</span>
      ) : (
        <>
          <div data-shot="contract-placement" aria-live="polite" style={{ fontSize: 13, fontWeight: 600, color: neutral.ink }}>
            {placement}
          </div>
          <p style={{ margin: 0, fontSize: 12.5, lineHeight: '18px', color: neutral.slate }}>{sentence}</p>
        </>
      )}
    </Card>
  )
}
