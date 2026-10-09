/**
 * The domain's `DisplayStatusKey` (catch-up Phase 28: was `ListStatusKey`)
 * must stay string-identical to the theme's `StatusKey` (PROGRESS convention
 * 10). The domain stays self-contained (no theme import in domain SOURCES) —
 * this test is the bridge that asserts parity both at compile time and at
 * runtime. Since Phase 28 the key is derived (`displayStatusKey`): the Slot
 * statuses plus the List kinds must be exactly these six keys.
 */

import { describe, expect, it } from 'vitest'
import { DISPLAY_STATUS_KEYS, LIST_KINDS, SLOT_STATUSES } from './types'
import type { DisplayStatusKey, ListKind, SlotStatus } from './types'
import { STATUS_ORDER } from '../theme/statusColours'
import type { StatusKey } from '../theme/statusColours'

// Compile-time parity: mutual assignability. If either union drifts, this
// line stops compiling.
type MutuallyAssignable<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never
const typeParity: MutuallyAssignable<DisplayStatusKey, StatusKey> = true
const partsParity: MutuallyAssignable<SlotStatus | ListKind, DisplayStatusKey> = true

describe('status key parity (domain DisplayStatusKey vs theme StatusKey)', () => {
  it('the unions are mutually assignable and the value sets match', () => {
    expect(typeParity).toBe(true)
    expect(new Set<string>(DISPLAY_STATUS_KEYS)).toEqual(new Set<string>(STATUS_ORDER))
  })

  it('the Slot statuses and the List kinds together are exactly the six keys, with no overlap', () => {
    expect(partsParity).toBe(true)
    const parts = [...SLOT_STATUSES, ...LIST_KINDS]
    expect(parts).toHaveLength(6)
    expect(new Set<string>(parts)).toEqual(new Set<string>(DISPLAY_STATUS_KEYS))
  })
})
