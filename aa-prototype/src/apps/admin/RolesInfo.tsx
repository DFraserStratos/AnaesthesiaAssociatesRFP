import { useState } from 'react'
import { accent, neutral, radius } from '../../theme/tokens'
import { useSurface } from '../../shared'

interface RoleEntry {
  role: string
  view: string
  edit: string
}

/**
 * "Roles in this prototype" (Phase 07, RBAC demonstration). Covers BOTH view
 * scoping and edit rights per role (A8 + the RFP: "controls around view, access,
 * edit rights ... managed by role", RFP.md:353). Everything here is provable
 * live via the persona switch: the anaesthetist apps are scoped to the persona's
 * own Lists/Cards; colleague availability exposes session status only;
 * authorisation, master data, audit and the billing monitor live solely in the
 * admin app. Opened from the admin side-nav footer.
 */
const ROLES: RoleEntry[] = [
  {
    role: 'Anaesthetist (e.g. Dr Melanie Souter)',
    view: 'Only their OWN Lists and Cards. A colleague\'s availability shows session status only, never patient or billing detail.',
    edit: 'Edits their own Cards while the List is DRAFT; sets their own availability; submits their own Lists. No access to authorisation, master data, audit or billing.',
  },
  {
    role: 'OfficeAdmin (Kirsty W. · Office)',
    view: 'The whole day across every anaesthetist; every Card, the master data, the audit trail and the billing monitor.',
    edit: 'Edits Cards on DRAFT and SUBMITTED Lists, corrects billing setup, reassigns, authorises for billing, and manages master data. Cannot edit an AUTHORISED List (locked).',
  },
  {
    role: 'Integration (HL7 / FHIR feed · source integration)',
    view: 'Writes appointment Cards through the feed; no interactive UI.',
    edit: 'Creates and updates Cards only while the List is DRAFT; never completes or authorises. A write to a SUBMITTED / AUTHORISED List is refused into a monitor manual-intervention item.',
  },
  {
    role: 'System / Demo (automated · source system/demo)',
    view: 'No UI; the billing run and the demo clock act here.',
    edit: 'Automated actions (billing run, canvas roll) are audited with source system / demo, so they are reconstructable in the audit viewer alongside human actions.',
  },
]

export function RolesInfo() {
  const { Overlay } = useSurface()
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{ border: 'none', background: 'none', padding: '2px 8px', color: 'rgba(255,255,255,0.6)', fontFamily: 'inherit', fontSize: 12, fontWeight: 500, cursor: 'pointer', textAlign: 'left' }}
      >
        Roles in this prototype
      </button>

      <Overlay open={open} onClose={() => setOpen(false)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Roles in this prototype</div>
          <div style={{ fontSize: 13, color: neutral.slate }}>
            View, access and edit rights are managed by role (RFP). Each is provable live by switching persona in the app switcher.
          </div>
          {ROLES.map((r) => (
            <div key={r.role} style={{ border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: accent.pressed }}>{r.role}</div>
              <div style={{ fontSize: 12.5, color: neutral.ink }}><strong style={{ color: neutral.slate }}>Sees: </strong>{r.view}</div>
              <div style={{ fontSize: 12.5, color: neutral.ink }}><strong style={{ color: neutral.slate }}>Edits: </strong>{r.edit}</div>
            </div>
          ))}
        </div>
      </Overlay>
    </>
  )
}
