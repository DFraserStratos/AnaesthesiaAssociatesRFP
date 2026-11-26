import { Card } from '../ui'
import { neutral, type } from '../../theme/tokens'
import {
  FORMAT_CHECKS_ETHNICITY_LABEL,
  FORMAT_CHECKS_ETHNICITY_LINES,
  FORMAT_CHECKS_NHI_LABEL,
  FORMAT_CHECKS_NHI_LINES,
  FORMAT_CHECKS_TITLE,
} from './supportCopy'

const LABEL = { margin: 0, fontSize: type.label.size, lineHeight: `${type.label.line}px`, fontWeight: type.label.weight, color: neutral.ink } as const
const LINE = { margin: 0, fontSize: type.small.size, lineHeight: `${type.small.line}px`, color: neutral.slate } as const

/**
 * How the NHI and the ethnicity code are checked (build plan Phase 72;
 * US-11.1.2): the explanation the Intake Validators tab used to carry, now
 * plain text in Admin's Help, on the shared Card under one heading. No try-it
 * boxes: the NHI field already checks as it is typed.
 */
export function FormatChecks({ shot = 'support-format-checks' }: { shot?: string }) {
  return (
    <Card title={FORMAT_CHECKS_TITLE} titleLevel={3} shot={shot}>
      <Group label={FORMAT_CHECKS_NHI_LABEL} lines={FORMAT_CHECKS_NHI_LINES} shot={`${shot}-nhi`} />
      <Group label={FORMAT_CHECKS_ETHNICITY_LABEL} lines={FORMAT_CHECKS_ETHNICITY_LINES} shot={`${shot}-ethnicity`} />
    </Card>
  )
}

function Group({ label, lines, shot }: { label: string; lines: readonly string[]; shot: string }) {
  return (
    <div data-shot={shot} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <p style={LABEL}>{label}</p>
      {lines.map((line) => (
        <p key={line} style={LINE}>
          {line}
        </p>
      ))}
    </div>
  )
}
