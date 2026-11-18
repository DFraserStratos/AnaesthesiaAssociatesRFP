import { useState } from 'react'
import { parseAmount } from '../format'
import { UNIT_VALUE_INVALID, editAnaesthetist, useAppStore, type Actor } from '../../store'

/**
 * The rate-per-unit editor both profiles share (catch-up Phase 26; US-12.1.1):
 * the typed text, a store refusal to show verbatim, and `save`, which writes
 * the anaesthetist's own `unitValue` through `editAnaesthetist` (audited, the
 * store's permission check the only gate). Text that is no amount is refused
 * in the store's own words before any write. When the stored rate changes
 * elsewhere (another tab, a Reset) and nothing has been typed, the field
 * follows it, so Save never writes a stale rate back.
 */
export function useRateEditor(actor: Actor, anaesthetistId: string, current: number) {
  const [text, setText] = useState(current.toFixed(2))
  const [baseline, setBaseline] = useState(current)
  const [error, setError] = useState<string | null>(null)

  if (current !== baseline) {
    setBaseline(current)
    if (text === baseline.toFixed(2)) setText(current.toFixed(2))
  }

  function change(next: string) {
    setText(next)
    setError(null)
  }

  /** True when saved (or nothing changed). */
  function save(): boolean {
    const amount = parseAmount(text)
    if (amount === undefined || amount <= 0) {
      setError(UNIT_VALUE_INVALID)
      return false
    }
    const outcome = editAnaesthetist(useAppStore, actor, anaesthetistId, { unitValue: amount })
    if (!outcome.ok) {
      setError(outcome.message)
      return false
    }
    setText(amount.toFixed(2))
    setError(null)
    return true
  }

  const parsed = parseAmount(text)
  const dirty = parsed === undefined || parsed !== current

  return { text, change, error, save, dirty }
}
