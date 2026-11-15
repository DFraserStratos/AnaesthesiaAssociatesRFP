import { useMemo, useState } from 'react'
import { neutral, semantic } from '../../theme/tokens'
import type { Procedure } from '../../domain/types'
import { railAnswersText } from '../../domain/billing/contractRail'
import {
  railActorOf,
  railContextForList,
  railStartFor,
  pickRvgGroup,
  setProcedureContract,
  setRailAnswers,
  useAppStore,
  type Actor,
} from '../../store'
import { ContractRail } from '../flows/ContractRail'
import { TextAction } from '../ui/TextAction'

interface ProcedureContractRowProps {
  procedure: Procedure
  actor: Actor
  /** The actor may edit this Booking (38a's window: ACTIVE or SUBMITTED, not AUTHORISED, not cancelled). */
  canEdit: boolean
  /** Shown under the anaesthetist's row: the office sees any change at review. */
  caption?: string
  /** The capture hook (default `procedure-contract-row`; the procedure stack's Contract part owns `procedure-contract`, catch-up Phase 20a). */
  shot?: string
}

export const CONTRACT_CHANGE_CAPTION = 'The office sees any change to the Contract at review.'
export const PRICE_CLEARED_NOTE = 'Any typed price was cleared for the new Contract.'
export const NEEDS_INVOICE_DESTINATION = 'Needs an invoice destination'
export const SET_BY_THE_OFFICE = 'Set by the office'

/**
 * The Procedure's one Contract (catch-up Phase 20; US-04.3.1, US-03.4.1): its
 * name and AA code with a teal "Change", or "Needs an invoice destination"
 * with the answers so far and a teal "Choose". Both open the step rail at the
 * same point for the office and the anaesthetist. A prepaid Contract reads
 * "Set by the office" for the anaesthetist (A17). On the Booking the procedure
 * stack shows the Contract (catch-up Phase 20a); this row stays in the edit
 * sheet "Contract and payer".
 */
export function ProcedureContractRow({ procedure, actor, canEdit, caption, shot = 'procedure-contract-row' }: ProcedureContractRowProps) {
  const masters = useAppStore((s) => s.masters)
  const schedule = useAppStore((s) => s.schedule)
  const [open, setOpen] = useState(false)
  const [cleared, setCleared] = useState(false)

  const booking = schedule.bookings[procedure.bookingId]
  const list = booking !== undefined ? schedule.lists[booking.listId] : undefined
  const context = useMemo(() => (list !== undefined ? railContextForList({ masters }, list) : undefined), [masters, list])
  const contract = procedure.governingContractId !== undefined ? masters.contracts[procedure.governingContractId] : undefined
  const railActor = railActorOf(actor)
  const officeOnly = railActor === 'anaesthetist' && contract?.prepaid === true
  const mayOpen = canEdit && !officeOnly && context !== undefined

  return (
    <div data-shot={shot} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
        {contract !== undefined ? (
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: neutral.ink }}>{contract.name}</span>
            <span className="mono" style={{ fontSize: 12, color: neutral.slate }}>{contract.aaCode}</span>
          </span>
        ) : (
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span data-shot="needs-invoice-destination" style={{ fontSize: 14, fontWeight: 600, color: semantic.warning.onTint }}>
              {NEEDS_INVOICE_DESTINATION}
            </span>
            {procedure.railAnswers !== undefined && context !== undefined && (
              <span style={{ fontSize: 12.5, color: neutral.slate }}>So far: {railAnswersText(masters, context, procedure.railAnswers)}</span>
            )}
          </span>
        )}
        {officeOnly ? (
          <span data-shot="contract-set-by-office" style={{ fontSize: 12.5, color: neutral.slate, whiteSpace: 'nowrap' }}>{SET_BY_THE_OFFICE}</span>
        ) : (
          mayOpen && (
            <TextAction small shot="procedure-contract-change" onClick={() => setOpen(true)}>
              {contract !== undefined ? 'Change' : 'Choose'}
            </TextAction>
          )
        )}
      </div>
      {cleared && <span data-shot="contract-price-cleared" style={{ fontSize: 12.5, color: neutral.slate }}>{PRICE_CLEARED_NOTE}</span>}
      {caption !== undefined && mayOpen && <span style={{ fontSize: 12, color: neutral.mist }}>{caption}</span>}
      {context !== undefined && (
        <ContractRail
          open={open}
          actor={railActor}
          context={context}
          start={railStartFor({ masters, schedule }, procedure.id)}
          {...(procedure.governingContractId !== undefined ? { currentContractId: procedure.governingContractId } : {})}
          {...(procedure.enteredPrice !== undefined ? { currentEnteredPrice: procedure.enteredPrice } : {})}
          onDone={(pick) => {
            const changing = procedure.governingContractId !== undefined && procedure.governingContractId !== pick.contractId
            const outcome = setProcedureContract(useAppStore, actor, procedure.id, pick.contractId, pick.enteredPrice !== undefined ? { enteredPrice: pick.enteredPrice } : {})
            if (!outcome.ok) return outcome.message
            if (pick.rvgGroupId !== undefined) {
              const coded = pickRvgGroup(useAppStore, actor, procedure.id, pick.rvgGroupId)
              if (!coded.ok) return coded.message
            }
            setCleared(changing)
            return null
          }}
          onLeave={(answers) => {
            if (answers !== undefined) setRailAnswers(useAppStore, actor, procedure.id, answers)
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  )
}
