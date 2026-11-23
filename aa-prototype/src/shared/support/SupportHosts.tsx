import type { SupportTicket } from '../../domain/types'
import type { Actor } from '../../store'
import { BottomSheet } from '../surface/BottomSheet'
import { OverlayHeader } from '../surface/OverlayHeader'
import { SidePanel } from '../surface/SidePanel'
import { SupportPanel } from './SupportPanel'
import { SUPPORT_TITLE } from './supportCopy'

/**
 * The support panel on the phone (catch-up Phase 43b): a bottom sheet under
 * the shared overlay header, Send at the foot of the form. Mobile More tab,
 * framed and installed alike.
 */
export function SupportSheet({ open, onClose, actor, app }: { open: boolean; onClose: () => void; actor: Actor; app: 'mobile' | 'pwa' }) {
  return (
    <BottomSheet open={open} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <OverlayHeader title={SUPPORT_TITLE} />
        {open && <SupportPanel channels={['helpLine']} actor={actor} app={app} seesEveryRequest={false} buttonSize="touch" />}
      </div>
    </BottomSheet>
  )
}

/**
 * The support panel on the desktop apps (catch-up Phase 43b): the shared
 * `SidePanel` at the record width. Web shows the help line for the
 * anaesthetist's own requests; Admin adds the Product support tab and sees
 * every request.
 */
export function SupportSidePanel({ open, onClose, actor, app }: { open: boolean; onClose: () => void; actor: Actor; app: Extract<SupportTicket['raisedBy']['app'], 'web' | 'admin'> }) {
  const office = app === 'admin'
  return (
    <SidePanel open={open} onClose={onClose} title={SUPPORT_TITLE} width="record" testId="support-side-panel" underHarness>
      {open && (
        <SupportPanel
          channels={office ? ['helpLine', 'productSupport'] : ['helpLine']}
          actor={actor}
          app={app}
          seesEveryRequest={office}
          buttonSize="desktop"
        />
      )}
    </SidePanel>
  )
}
