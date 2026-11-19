/**
 * The Data Inspector's Privacy checks (catch-up Phase 43; US-15.0.6): the last
 * "Scan for NHI leaks" report, kept in the demo memory (not persisted, cleared
 * by Reset). One row per area: success "0 found", error "1 found" with each
 * hit's location masked, and the core-platform rows in neutral, "Held by
 * design". Semantic tints only for results; figures in mono.
 */

import { useDemoTriggerMemory } from '../../shared/demoTriggers/memory'
import { Pill } from '../../shared/ui'
import { TableShell, Td, Th } from '../../shared/table'
import { formatCount, stampText } from '../../shared/format'
import { neutral } from '../../theme/tokens'

export function PrivacyChecks() {
  const report = useDemoTriggerMemory((m) => m.nhiScan)
  if (report === null) {
    return (
      <div data-shot="nhi-scan-report" data-scanned="false" style={{ fontSize: 13, color: neutral.slate }}>
        No scan yet. Run Demo actions, Scan for NHI leaks.
      </div>
    )
  }
  return (
    <div data-shot="nhi-scan-report" data-scanned="true" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <TableShell label="Privacy checks" density="dense">
        <thead>
          <tr>
            <Th>Area</Th>
            <Th>What was scanned</Th>
            <Th align="right">Items</Th>
            <Th>NHIs found</Th>
          </tr>
        </thead>
        <tbody>
          {report.areas.map((area) => (
            <tr key={area.key} data-scan-area={area.key} data-hits={area.hits.length}>
              <Td bold>{area.label}</Td>
              <Td>{area.scanned}</Td>
              <Td mono align="right">{formatCount(area.items)}</Td>
              <Td>
                {area.heldByDesign ? (
                  <Pill tone="neutral">Held by design</Pill>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                    <Pill tone={area.hits.length === 0 ? 'success' : 'error'} mono>
                      {`${area.hits.length} found`}
                    </Pill>
                    {area.checksPersonalDetails && <span style={{ fontSize: 11.5, color: neutral.slate }}>NHIs or personal details found</span>}
                    {area.hits.slice(0, 5).map((h, i) => (
                      <span key={i} className="mono" style={{ fontSize: 11.5, color: neutral.slate }}>
                        {h.location} · {h.what}
                      </span>
                    ))}
                    {area.hits.length > 5 && <span style={{ fontSize: 11.5, color: neutral.slate }}>{`and ${formatCount(area.hits.length - 5)} more`}</span>}
                  </div>
                )}
              </Td>
            </tr>
          ))}
        </tbody>
      </TableShell>
      <span className="mono" style={{ fontSize: 12, color: neutral.slate }}>
        {`Scanned in ${report.ms} ms · ${stampText(report.atISO, { weekday: false })}`}
      </span>
    </div>
  )
}
