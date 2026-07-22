import { DemoSurface } from './DemoSurface'
import { Placeholder } from '../Placeholder'

/**
 * Integrations simulation stub (`/demo/integrations`). The HL7 / FHIR feeds,
 * per-hospital field mapping, idempotency/dead-letter framing and duplicate
 * replay arrive in Phase 11.
 */
export function DemoIntegrations() {
  return (
    <DemoSurface
      title="Integrations"
      subtitle="Simulated HL7 and FHIR feeds into the fake backend: per-hospital field mapping, message dedupe by control ID, retry logic and a dead-letter queue, replayable from here."
    >
      <Placeholder title="Integration simulator" phase="Phase 11">
        Built in Phase 11. Feeds, mapping config, idempotency and duplicate replay are demonstrated
        against the fake in-browser backend.
      </Placeholder>
    </DemoSurface>
  )
}
