import { describe, expect, it } from 'vitest'
import { maskBankAccount, normaliseNzBankAccount, seedBankAccountNumber } from './bankAccount'

describe('normaliseNzBankAccount', () => {
  it('accepts dashes, spaces or none, with a 2 or 3 digit suffix', () => {
    expect(normaliseNzBankAccount('99-0101-0034821-00')).toBe('99-0101-0034821-00')
    expect(normaliseNzBankAccount('99 0101 0034821 00')).toBe('99-0101-0034821-00')
    expect(normaliseNzBankAccount('990101003482100')).toBe('99-0101-0034821-00')
    expect(normaliseNzBankAccount(' 12-3456-7654321-001 ')).toBe('12-3456-7654321-001')
  })

  it('refuses anything that is not the NZ shape', () => {
    for (const bad of ['', '   ', '99-0101-34821-00', '99-0101-0034821-0', '99-0101-0034821-0001', 'AB-0101-0034821-00', '9-0101-0034821-00']) {
      expect(normaliseNzBankAccount(bad)).toBeNull()
    }
  })
})

describe('maskBankAccount', () => {
  it('hides the first five digits of the account', () => {
    expect(maskBankAccount('99-0101-0034821-00')).toBe('99-0101-•••••21-00')
    expect(maskBankAccount('12-3456-7654321-001')).toBe('12-3456-•••••21-001')
  })

  it('masks a malformed value whole, never showing it', () => {
    expect(maskBankAccount('12345')).toBe('•••••')
    expect(maskBankAccount('')).toBe('••••')
  })
})

describe('seedBankAccountNumber', () => {
  it('builds a fictional bank 99 number from the registration number', () => {
    expect(seedBankAccountNumber('34821')).toBe('99-0101-0034821-00')
    expect(normaliseNzBankAccount(seedBankAccountNumber('4'))).toBe('99-0101-0000004-00')
  })
})
