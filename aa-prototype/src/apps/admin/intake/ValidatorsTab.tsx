/**
 * Admin Intake · Validators (`/admin/intake/validators`; Phase 11, moved under
 * Intake in catch-up Phase 34): the NHI and NZHIS ethnicity validators, product
 * UI, unbadged and unchanged (US-11.1.2).
 */

import { useState } from 'react'
import { neutral, radius, semantic } from '../../../theme/tokens'
import { Pill, TextField } from '../../../shared/ui'
import { validateNhi } from '../../../domain/nhi'
import { validateEthnicityCode, ETHNICITY_DEMO_SUBSET } from '../../../domain/nzhis'

export function ValidatorsTab() {
  const [nhi, setNhi] = useState('')
  const [eth, setEth] = useState('')
  const nhiVerdict = nhi.trim() !== '' ? validateNhi(nhi) : undefined
  const ethVerdict = eth.trim() !== '' ? validateEthnicityCode(eth) : undefined

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 720 }}>
      <div data-shot="integrations-nhi-validator" style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>NHI validator</div>
        <div style={{ fontSize: 12, color: neutral.slate }}>
          Current format AAANNNC uses a mod-11 check digit; the new format AAANNAX uses a mod-23 check
          letter. The RFP labels the current algorithm &ldquo;Modulus 24&rdquo;, but its own example NHIs validate
          only under mod-11, so this demo uses mod-11 and flags the label as a discovery item. Both
          formats are mandated dual-format from 1 July 2027.
        </div>
        <TextField label="NHI to check" hideLabel value={nhi} onChange={(v) => setNhi(v.toUpperCase())} placeholder="e.g. ZAA0067 or ACA31FM" mono width={280} />
        {nhiVerdict !== undefined && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <VerdictLine ok={nhiVerdict.valid} text={nhiVerdict.valid ? 'Valid NHI' : 'Not valid'} />
            <div style={{ fontSize: 12.5, color: neutral.slate }}>
              Format: {nhiVerdict.format === 'current' ? 'current (AAANNNC, mod-11)' : nhiVerdict.format === 'new' ? 'new (AAANNAX, mod-23)' : 'unrecognised'}
              {nhiVerdict.reason !== undefined ? ` · ${nhiVerdict.reason}` : ''}
            </div>
          </div>
        )}
      </div>

      <div style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>Ethnicity code validator</div>
        <div style={{ fontSize: 12, color: neutral.slate }}>
          NZHIS Level 4 codes are 5 digits. This demo validates against a curated subset; a well-formed
          code outside it may still be a valid NZHIS code, so it is labelled as such, never &ldquo;invalid&rdquo;.
        </div>
        <TextField label="Ethnicity code to check" hideLabel value={eth} onChange={setEth} placeholder="e.g. 21111" mono width={280} />
        {ethVerdict !== undefined && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {ethVerdict.verdict === 'valid' ? (
              <>
                <VerdictLine ok text="Valid NZHIS code" />
                <div style={{ fontSize: 12.5, color: neutral.slate }}>{ethVerdict.label} · {ethVerdict.level1Group}</div>
              </>
            ) : ethVerdict.verdict === 'outsideDemoSubset' ? (
              <>
                <VerdictLine ok={undefined} text="Outside this demo's curated subset" />
                <div style={{ fontSize: 12.5, color: neutral.slate }}>{ethVerdict.message}</div>
              </>
            ) : (
              <>
                <VerdictLine ok={false} text="Malformed" />
                <div style={{ fontSize: 12.5, color: neutral.slate }}>{ethVerdict.reason}</div>
              </>
            )}
          </div>
        )}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
          {ETHNICITY_DEMO_SUBSET.map((e) => (
            <Pill key={e.code} size="sm" mono title={`${e.label} · ${e.level1Group}`}>{e.code}</Pill>
          ))}
        </div>
      </div>
    </div>
  )
}

function VerdictLine({ ok, text }: { ok: boolean | undefined; text: string }) {
  const colour = ok === true ? semantic.success.onTint : ok === false ? semantic.error.onTint : semantic.warning.onTint
  return <div style={{ fontSize: 13.5, fontWeight: 700, color: colour }}>{text}</div>
}
