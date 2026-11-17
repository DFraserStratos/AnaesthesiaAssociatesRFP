/**
 * Test support (catch-up Phase 23): one Procedure's fee view through the one UI
 * assembler (`bookingFee`), priced with its Booking's other Procedures when
 * given, else as the Booking's only Procedure (its primary). Imported only by
 * tests; the app never prices a Procedure alone.
 */

import type { Procedure } from '../domain/types'
import { bookingFee, type BookingFeeArgs, type ProcedureFeeView } from '../shared/capture/feeContext'

export function procedureFeeAlone(args: Omit<BookingFeeArgs, 'procedures'> & { procedure: Procedure; siblings?: readonly Procedure[] }): ProcedureFeeView {
  const { procedure, siblings, ...rest } = args
  const procedures = siblings !== undefined ? siblings.map((p) => (p.id === procedure.id ? procedure : p)) : [{ ...procedure, isPrimary: true }]
  const view = bookingFee({ ...rest, procedures }).views[procedure.id]
  if (view === undefined) throw new Error(`no fee for ${procedure.id}`)
  return view
}
