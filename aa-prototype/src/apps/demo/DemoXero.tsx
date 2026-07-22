import { DemoSurface } from './DemoSurface'
import { Placeholder } from '../Placeholder'

/**
 * Billing monitor & Xero simulation stub (`/demo/xero`). The billing run,
 * invoices, exception monitor and the Xero contact/invoice/payment simulation
 * arrive in Phases 08 to 10.
 */
export function DemoXero() {
  return (
    <DemoSurface
      title="Billing monitor & Xero"
      subtitle="The billing run, invoice documents, the exception monitor and the simulated Xero contacts, invoices and payments: all fake and in-browser."
    >
      <Placeholder title="Billing monitor & Xero simulation" phase="Phases 08 to 10">
        Built across the billing phases. Only the simulation triggers carry the demo badge; the
        billing monitor itself is proposed product UI (PROGRESS convention 13).
      </Placeholder>
    </DemoSurface>
  )
}
