import type { SliceReplacements } from '../../registry'

/** Rows the prototype catalogue added after the preview was built (catch-up Phase 20a). */
export const replacements: SliceReplacements = {
  ProcedureStack: {
    library: 'Custom (a description list on library primitives)',
    changes: ['Not rebuilt yet: the prototype catalogue added this row in Phase 20a, after the preview was built'],
    status: 'custom',
    customReason: 'Stays custom per the catalogue: a description list of procedure text, invoice description and Contract. Not yet rebuilt on library primitives here.',
  },
}
