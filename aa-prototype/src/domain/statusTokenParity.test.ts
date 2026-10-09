/**
 * The domain's `StatusColourToken` (the palette a status or List kind picks
 * from) must stay string-identical to the theme's `STATUS_PALETTE` keys
 * (catch-up Phase 29, convention 10 amended: the palette is fixed, the list of
 * availability statuses is master data). The domain stays self-contained (no
 * theme import in domain SOURCES); this test is the one bridge that asserts
 * parity at compile time and at runtime.
 */

import { describe, expect, it } from 'vitest'
import { LIST_KINDS, STATUS_COLOUR_TOKENS, type StatusColourToken } from './types'
import { LIST_KIND_VISUAL, STATUS_PALETTE } from '../theme/statusColours'

type MutuallyAssignable<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never
const typeParity: MutuallyAssignable<StatusColourToken, keyof typeof STATUS_PALETTE> = true

describe('status token parity (domain StatusColourToken vs theme STATUS_PALETTE)', () => {
  it('the token unions are mutually assignable and the value sets match', () => {
    expect(typeParity).toBe(true)
    expect(new Set<string>(STATUS_COLOUR_TOKENS)).toEqual(new Set<string>(Object.keys(STATUS_PALETTE)))
  })

  it('every List kind maps to a palette token', () => {
    for (const kind of LIST_KINDS) expect(STATUS_COLOUR_TOKENS).toContain(LIST_KIND_VISUAL[kind].colour)
  })
})
