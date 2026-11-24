/**
 * The purpose statement wherever an NHI is looked up (catch-up Phase 40a;
 * US-14.4.1, HIPC 2020): who the lookup is made for, and that the NHI is used
 * only to identify the patient. Caption type, neutral slate, a small shield;
 * the HPI CPN in mono.
 */

import { ShieldCheck } from 'lucide-react'
import { neutral } from '../../theme/tokens'
import { useAppStore } from '../../store'
import { formatHpiCpn } from '../format'

/** Who the office looks an NHI up as, with no anaesthetist to name (a Draft List, a waiting row, the record). */
export const AA_OFFICE_PRACTITIONER = 'the AA office'

/** Who a lookup is made for: a practitioner's name and HPI CPN, or the AA office. */
export interface PurposePractitioner {
  name: string
  hpiId?: string
}

export const AA_OFFICE: PurposePractitioner = { name: AA_OFFICE_PRACTITIONER }

/** The practitioner a List's lookup is made for: its anaesthetist with their HPI CPN, or the AA office for a Draft List. */
export function usePurposePractitioner(listId?: string): PurposePractitioner {
  const name = useAppStore((s) => {
    const list = listId !== undefined ? s.schedule.lists[listId] : undefined
    return list?.anaesthetistId !== undefined ? s.masters.anaesthetists[list.anaesthetistId]?.name : undefined
  })
  const hpiId = useAppStore((s) => {
    const list = listId !== undefined ? s.schedule.lists[listId] : undefined
    return list?.anaesthetistId !== undefined ? s.masters.anaesthetists[list.anaesthetistId]?.hpiId : undefined
  })
  return name !== undefined ? { name, ...(hpiId !== undefined ? { hpiId } : {}) } : AA_OFFICE
}

export function NhiPurposeNote({ practitioner }: { practitioner: PurposePractitioner }) {
  const cpn = formatHpiCpn(practitioner.hpiId)
  return (
    <div data-shot="nhi-purpose" style={{ display: 'flex', gap: 6, alignItems: 'flex-start', fontSize: 12, lineHeight: '16px', color: neutral.slate }}>
      <ShieldCheck size={14} strokeWidth={2} aria-hidden style={{ flex: 'none', marginTop: 1 }} />
      <span>
        Looked up on behalf of {practitioner.name}
        {cpn !== null && (
          <>
            {' ('}
            <span className="mono">{cpn}</span>
            {')'}
          </>
        )}
        , only to identify this patient. Health Information Privacy Code 2020.
      </span>
    </div>
  )
}
