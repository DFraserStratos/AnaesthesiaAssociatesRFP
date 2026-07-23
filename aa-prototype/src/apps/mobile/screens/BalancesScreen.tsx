import { CircleDollarSign } from 'lucide-react'
import { neutral } from '../../../theme/tokens'
import { MobileHeader } from '../components'

/**
 * Balances tab — an honest stub. Phase 08's run raises invoices, but the RFP's
 * outstanding-balance view is one flat row per ACCPAY invoice (M11), which
 * exists only after Phase 10's Xero handoff — so this stays a stub until then.
 */
export function BalancesScreen({ initials }: { initials: string }) {
  return (
    <div style={{ height: '100%', overflow: 'auto', padding: '64px 20px 116px' }}>
      <MobileHeader eyebrow="Your account" title="Balances" initials={initials} />
      <div
        style={{
          marginTop: 24,
          background: neutral.surface,
          border: `1px solid ${neutral.line}`,
          borderRadius: 20,
          padding: '28px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          textAlign: 'center',
        }}
      >
        <span
          style={{
            width: 52,
            height: 52,
            borderRadius: 999,
            background: neutral.sunken,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: neutral.mist,
          }}
        >
          <CircleDollarSign size={26} strokeWidth={2} aria-hidden />
        </span>
        <div style={{ fontSize: 17, fontWeight: 600 }}>Balances arrive with billing</div>
        <div style={{ fontSize: 14, color: neutral.slate, maxWidth: 260 }}>
          Outstanding invoices and payments land here once the billing pipeline is built, in Phase 10.
        </div>
      </div>
    </div>
  )
}
