/**
 * Master-data invariants (7th review B14 + 3rd review #9): every hospital and
 * every direct-billing insurer ALWAYS holds a protected default Type 1
 * contract — so creating a hospital, or flipping an insurer to direct claims,
 * atomically creates that contract in the same commit. (Phase 07's
 * delete/end-date protection is the other half of the guarantee.)
 */

import type { Contract, Hospital } from '../domain/types'
import { allocateId, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppStoreApi } from './appStore'

function defaultType1(
  id: string,
  name: string,
  holderType: Contract['holderType'],
  holderId: string,
  effectiveFromISO: string,
): Contract {
  return {
    id,
    name,
    type: 1,
    holderType,
    holderId,
    scope: { kind: 'organisation' },
    permitsIndividualArrangement: false,
    isDefault: true,
    effectiveFromISO,
  }
}

export function createHospital(
  api: AppStoreApi,
  actor: Actor,
  name: string,
): Outcome<{ hospital: Hospital; defaultContract: Contract }> {
  if (actor.role !== 'office') {
    return refuse('officeOnly', 'Only the office can add a hospital.')
  }
  const trimmed = name.trim()
  if (trimmed === '') return refuse('nameRequired', 'A hospital name is required.')
  const state = api.getState()
  if (Object.values(state.masters.hospitals).some((h) => h.name === trimmed)) {
    return refuse('duplicateName', 'A hospital with that name already exists.')
  }

  let hospital: Hospital | undefined
  let contract: Contract | undefined
  const metas: MutationMeta[] = []
  mutate(api, actor, metas, (s) => {
    const hospitalAlloc = allocateId(s.counters, 'hospital')
    const contractAlloc = allocateId(hospitalAlloc.counters, 'contract')
    hospital = { id: hospitalAlloc.id, name: trimmed }
    contract = defaultType1(
      contractAlloc.id,
      `${trimmed} standard units (default Type 1)`,
      'hospital',
      hospitalAlloc.id,
      s.clock.todayISO,
    )
    metas.push(
      { entityType: 'hospital', entityId: hospital.id, action: 'hospital.create', after: { name: trimmed } },
      {
        entityType: 'contract',
        entityId: contract.id,
        action: 'contract.create',
        after: { holderType: 'hospital', holderId: hospital.id, isDefault: true },
      },
    )
    return {
      masters: {
        ...s.masters,
        hospitals: { ...s.masters.hospitals, [hospital.id]: hospital },
        contracts: { ...s.masters.contracts, [contract.id]: contract },
      },
      counters: contractAlloc.counters,
    }
  })

  if (hospital === undefined || contract === undefined) {
    return refuse('createFailed', 'The hospital could not be created.')
  }
  return ok({ hospital, defaultContract: contract })
}

export function setInsurerDirectClaims(
  api: AppStoreApi,
  actor: Actor,
  insurerId: string,
  acceptsDirectClaims: boolean,
): Outcome<{ createdDefaultContract: Contract | null }> {
  if (actor.role !== 'office') {
    return refuse('officeOnly', 'Only the office can change insurer settings.')
  }
  const state = api.getState()
  const insurer = state.masters.insurers[insurerId]
  if (insurer === undefined) return refuse('notFound', 'Insurer not found.')
  if (insurer.acceptsDirectClaims === acceptsDirectClaims) {
    return ok({ createdDefaultContract: null })
  }

  const hasDefault = Object.values(state.masters.contracts).some(
    (c) => c.isDefault && c.holderType === 'insurer' && c.holderId === insurerId,
  )
  const needsDefault = acceptsDirectClaims && !hasDefault

  let contract: Contract | null = null
  const metas: MutationMeta[] = []
  mutate(api, actor, metas, (s) => {
    metas.push({
      entityType: 'insurer',
      entityId: insurerId,
      action: 'insurer.update',
      before: { acceptsDirectClaims: insurer.acceptsDirectClaims },
      after: { acceptsDirectClaims },
    })
    let counters = s.counters
    let contracts = s.masters.contracts
    if (needsDefault) {
      const alloc = allocateId(counters, 'contract')
      counters = alloc.counters
      contract = defaultType1(
        alloc.id,
        `${insurer.name} standard units (default Type 1)`,
        'insurer',
        insurerId,
        s.clock.todayISO,
      )
      contracts = { ...contracts, [alloc.id]: contract }
      metas.push({
        entityType: 'contract',
        entityId: alloc.id,
        action: 'contract.create',
        after: { holderType: 'insurer', holderId: insurerId, isDefault: true },
      })
    }
    return {
      masters: {
        ...s.masters,
        insurers: { ...s.masters.insurers, [insurerId]: { ...insurer, acceptsDirectClaims } },
        contracts,
      },
      counters,
    }
  })

  return ok({ createdDefaultContract: contract })
}
