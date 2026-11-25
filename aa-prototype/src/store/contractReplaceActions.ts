/**
 * Replace a Contract from a date (build plan Phase 49; US-04.1.8, US-04.1.3,
 * DM-01, DM-02): one action for a dated change that is not a price. It creates
 * a copy of the old Contract with any setting changed (the ones fixed at
 * creation included) under the new holder's next AA code, copies its event
 * fees, moves only the Procedures the office ticks from those still on the old
 * Contract from the change date, and disables the old one when asked; every
 * write in ONE change set (kind `move`), the create first and the disable last.
 *
 * The link and the change date ride only the new Contract's `contract.create`
 * audit entry (`after.replaces`, D94): no field on the Contract, so a Contract
 * keeps "No dates" (US-04.1.2) and OQ-144 stays open (D90). Nothing moves by
 * itself: each moved Procedure is the office's own tick, through the same
 * `setProcedureContract` (and its guards and side effects) as a move by hand.
 */

import type { Contract, ContractId, ProcedureId } from '../domain/types'
import { CONTRACT_REFUSAL_MESSAGES, nextAaCode } from '../domain/billing/contracts'
import type { StillOnRow } from '../domain/billing/contractChanges'
import { eventFeesForContract } from '../domain/billing/contractEventFees'
import type { AppState, AppStoreApi } from './appStore'
import { contractInputOf, createContract, disableContract, planContractCreate, type ContractInput } from './contractActions'
import { stillOnContract } from './contractChangeSelectors'
import { addContractEventFee } from './contractEventFeeActions'
import { contractPickRefusal, procedureOn, setProcedureContract } from './contractSelectionActions'
import { editRefusal } from './lifecycle'
import { ok, refuse, withChangeSet, type Actor, type Outcome } from './mutate'

/** What the office changes on the copy; the AA code is always the new holder's next one. */
export type ReplacePatch = Partial<Omit<ContractInput, 'aaCode'>>

export interface ReplaceRequest {
  /** The settings that differ from the old Contract (any, the fixed ones included). */
  patch: ReplacePatch
  /** The change date (`YYYY-MM-DD`); a past date is allowed. */
  fromISO: string
  /** The ticked Procedures: each must be one the old Contract still holds from `fromISO`. */
  moveProcedureIds: readonly ProcedureId[]
  /** Disable the old Contract now; otherwise it stays Active and a to-do on the date reminds the office. */
  disableNow: boolean
}

/** One ticked Procedure's outcome: moved, or why not. */
export type ReplaceRowOutcome = { procedureId: ProcedureId; moved: true } | { procedureId: ProcedureId; moved: false; message: string }

export interface ReplaceResult {
  contract: Contract
  rows: ReplaceRowOutcome[]
  disabled: boolean
}

const DAY = /^\d{4}-\d{2}-\d{2}$/

/** A ticked id that is not on the sheet's list: locked, earlier, cancelled, on another Contract or unknown. */
export const NOT_LISTED_MESSAGE = 'This Procedure is not on the list to move, so it stays where it is.'

/** The refusal before anything is written, or null. */
function replaceRefusal(state: Pick<AppState, 'masters'>, actor: Actor, oldId: ContractId, fromISO: string): Outcome<never> | null {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can replace a Contract.')
  const old = state.masters.contracts[oldId]
  if (old === undefined) return refuse('notFound', 'Contract not found.')
  if (old.systemRole !== undefined) return refuse('systemNotReplaced', CONTRACT_REFUSAL_MESSAGES.systemNotReplaced)
  if (old.status !== 'active') return refuse('notActive', 'Only an active Contract can be replaced. Make it active first.')
  if (!DAY.test(fromISO)) return refuse('fromRequired', 'Choose the date the new Contract takes over from.')
  return null
}

/** The copy's input: the old Contract's settings with the patch over them. */
function copyInput(old: Contract, patch: ReplacePatch): ContractInput {
  const { aaCode: _ignored, ...base } = contractInputOf(old)
  return { ...base, ...patch }
}

/**
 * Replace `oldId` from `fromISO` (US-04.1.8): refused with nothing written for
 * any actor but the office, an unknown, Disabled or system Contract, or no
 * date; a refused create returns its refusal and writes nothing. Then, in one
 * change set: the create (with `replaces`), the event fee copies, each ticked
 * Procedure moved in turn (a refused one reported, the rest still moved), and
 * the disable when `disableNow`.
 */
export function replaceContract(api: AppStoreApi, actor: Actor, oldId: ContractId, req: ReplaceRequest): Outcome<ReplaceResult> {
  const state = api.getState()
  const refused = replaceRefusal(state, actor, oldId, req.fromISO)
  if (refused !== null) return refused
  const old = state.masters.contracts[oldId]!
  // The rows the sheet listed, from the state before any write.
  const listed = new Set(stillOnContract(state, oldId, req.fromISO).map((r) => r.procedureId))
  const input = copyInput(old, req.patch)
  const replaces = { contractId: oldId, fromISO: req.fromISO }

  return withChangeSet(api, 'move', (): Outcome<ReplaceResult> => {
    // 1. The create: the first write, so a refused one leaves nothing written (no change set either).
    const created = createContract(api, actor, input, { replaces })
    if (!created.ok) return created
    const contract = created.value.contract

    // 2. The event fees, copied as they stand.
    for (const fee of eventFeesForContract(api.getState().masters.contractEventFees, oldId)) {
      addContractEventFee(api, actor, contract.id, {
        eventType: fee.eventType,
        ...(fee.holderCode !== undefined ? { holderCode: fee.holderCode } : {}),
        ...(fee.holderDescription !== undefined ? { holderDescription: fee.holderDescription } : {}),
        fixedPrice: fee.fixedPrice,
      })
    }

    // 3. Only the listed, ticked Procedures move, each through the by-hand move and its guards.
    const rows: ReplaceRowOutcome[] = []
    for (const procedureId of new Set(req.moveProcedureIds)) {
      if (!listed.has(procedureId)) {
        rows.push({ procedureId, moved: false, message: NOT_LISTED_MESSAGE })
        continue
      }
      const moved = setProcedureContract(api, actor, procedureId, contract.id)
      rows.push(moved.ok ? { procedureId, moved: true } : { procedureId, moved: false, message: moved.message })
    }

    // 4. Then the disable, when chosen.
    const disabled = req.disableNow ? disableContract(api, actor, oldId).ok : false
    return ok({ contract, rows, disabled })
  })
}

// ---------------------------------------------------------------------------
// The preview (the sheet's rows before saving)
// ---------------------------------------------------------------------------

/** One row of the sheet: the Procedure still on the old Contract, and why it cannot move (null when it can). */
export interface ReplacePreviewRow {
  row: StillOnRow
  refusal: string | null
}

export interface ReplacePreview {
  /** The AA code the copy takes (the new holder's next). */
  aaCode: string
  /** Why the copy would be refused as it stands, or null. */
  createRefusal: string | null
  rows: ReplacePreviewRow[]
}

/**
 * The sheet's preview (pure over state): the AA code the copy takes, its
 * create refusal if any, and the Procedures still on the old Contract from
 * `fromISO`, each with the reason the copy could not take it (holder, links or
 * specialties changed, a List no longer editable), checked against the state
 * the create would produce. The action re-checks every row when it applies.
 */
export function planReplaceRows(state: AppState, actor: Actor, oldId: ContractId, req: Pick<ReplaceRequest, 'patch' | 'fromISO'>): ReplacePreview {
  const old = state.masters.contracts[oldId]
  if (old === undefined) return { aaCode: '', createRefusal: 'Contract not found.', rows: [] }
  const input = copyInput(old, req.patch)
  const holder = state.masters.parties[input.holderId]
  const aaCode = holder !== undefined ? nextAaCode(holder.codePrefix, Object.values(state.masters.contracts).map((c) => c.aaCode)) : ''
  const listed = DAY.test(req.fromISO) ? stillOnContract(state, oldId, req.fromISO) : []
  const refused = replaceRefusal(state, actor, oldId, DAY.test(req.fromISO) ? req.fromISO : '0001-01-01')
  if (refused !== null && !refused.ok) return { aaCode, createRefusal: refused.message, rows: listed.map((row) => ({ row, refusal: null })) }
  const plan = planContractCreate(state, actor, input)
  if (!plan.ok) return { aaCode, createRefusal: plan.message, rows: listed.map((row) => ({ row, refusal: null })) }
  const after: AppState = { ...state, ...plan.value.next }
  const newId = plan.value.contract.id
  return {
    aaCode: plan.value.contract.aaCode,
    createRefusal: null,
    rows: listed.map((row) => ({ row, refusal: rowRefusal(after, actor, row.procedureId, newId) })),
  }
}

/** Why the copy could not take this Procedure, or null. */
function rowRefusal(state: AppState, actor: Actor, procedureId: ProcedureId, newId: ContractId): string | null {
  const at = procedureOn(state, procedureId)
  if (!at.found) return at.refusal.ok ? null : at.refusal.message
  const rights = editRefusal(actor, at.list)
  if (rights !== null && !rights.ok) return rights.message
  const pick = contractPickRefusal(state, actor, at.list, at.procedure, newId)
  return pick !== null && !pick.ok ? pick.message : null
}
