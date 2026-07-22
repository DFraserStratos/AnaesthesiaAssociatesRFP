/**
 * The domain's `ListStatusKey` must stay string-identical to the theme's
 * `StatusKey` (PROGRESS convention 10). The domain stays self-contained (no
 * theme import in domain SOURCES) — this test is the bridge that asserts
 * parity both at compile time and at runtime.
 */

import { describe, expect, it } from 'vitest'
import { LIST_STATUS_KEYS } from './types'
import type { ListStatusKey } from './types'
import { STATUS_ORDER } from '../theme/statusColours'
import type { StatusKey } from '../theme/statusColours'

// Compile-time parity: mutual assignability. If either union drifts, this
// line stops compiling.
type MutuallyAssignable<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never
const typeParity: MutuallyAssignable<ListStatusKey, StatusKey> = true

describe('status key parity (domain ListStatusKey vs theme StatusKey)', () => {
  it('the unions are mutually assignable and the value sets match', () => {
    expect(typeParity).toBe(true)
    expect(new Set<string>(LIST_STATUS_KEYS)).toEqual(new Set<string>(STATUS_ORDER))
  })
})
