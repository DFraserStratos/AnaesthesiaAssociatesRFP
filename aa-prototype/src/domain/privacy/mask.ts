/**
 * Masking the raw hospital row (catch-up Phase 43; US-15.0.6). The catalogue
 * sets no masking policy, so this one labelled block is AA's to agree (on the
 * owner's review list); the sheet says so. Pure.
 */

import type { RawImportRow } from '../types'
import { maskNhi, maskNhisIn } from './nhiDetect'

export type MaskRule = 'nhi' | 'yearOnly' | 'lastThree' | 'domainOnly' | 'suburbOnly' | 'initials' | 'asSent'

/** RAW_ROW_MASKING: the column (by name) to its rule. Any other column shows as sent, with NHI-shaped values masked. */
export const RAW_ROW_MASKING: Readonly<Record<string, MaskRule>> = {
  NHI: 'nhi',
  'Date of birth': 'yearOnly',
  'Hospital patient number': 'lastThree',
  Phone: 'lastThree',
  'Next of kin phone': 'lastThree',
  Email: 'domainOnly',
  Address: 'suburbOnly',
  'Next of kin': 'initials',
}

export const MASKING_POLICY_NOTE = 'Masking policy is for AA to agree'

const DOT = '•'

function lastThree(value: string): string {
  const digits = value.replace(/\D/g, '')
  return digits.length === 0 ? '' : `${DOT.repeat(Math.max(3, digits.length - 3))}${digits.slice(-3)}`
}

export function maskValue(value: string, rule: MaskRule): string {
  if (value === '') return ''
  switch (rule) {
    case 'nhi':
      return maskNhi(value.trim().toUpperCase())
    case 'yearOnly':
      return /^\d{4}/.test(value) ? `${value.slice(0, 4)}-${DOT}${DOT}-${DOT}${DOT}` : DOT.repeat(4)
    case 'lastThree':
      return lastThree(value)
    case 'domainOnly': {
      const at = value.indexOf('@')
      return at >= 0 ? `${DOT.repeat(3)}${value.slice(at)}` : DOT.repeat(3)
    }
    case 'suburbOnly': {
      const parts = value.split(',').map((p) => p.trim())
      return parts.length >= 2 ? `${DOT.repeat(3)}, ${parts[1]}` : DOT.repeat(3)
    }
    case 'initials':
      return value
        .split(/\s+/)
        .filter((w) => w !== '')
        .map((w) => `${w.charAt(0).toUpperCase()}.`)
        .join(' ')
    case 'asSent':
      return value
  }
}

/** The raw row with every identifying column masked by `policy`; NHI-shaped values masked in any column. */
export function maskRawRow(raw: RawImportRow, policy: Readonly<Record<string, MaskRule>> = RAW_ROW_MASKING): RawImportRow {
  return {
    columns: raw.columns.map(({ name, value }) => {
      const rule = policy[name]
      const masked = rule !== undefined ? maskValue(value, rule) : value
      return { name, value: maskNhisIn(masked) }
    }),
  }
}
