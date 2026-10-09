import { describe, expect, it } from 'vitest'
import { xeroIndividualContactName } from './xeroContact'

describe('xeroIndividualContactName (US-09.3.1)', () => {
  it('labels a patient contact by its hidden id', () => {
    expect(xeroIndividualContactName('patient', 'PT0001')).toBe('Patient PT0001')
  })

  it('labels a billable-party contact by its hidden id', () => {
    expect(xeroIndividualContactName('billableParty', 'BP0001')).toBe('Billable party BP0001')
  })
})
