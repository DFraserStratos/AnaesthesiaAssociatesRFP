/**
 * A Contract's default RVG code as a field (catch-up Phase 19a; US-04.2.18):
 * the chosen group's code and description in a field well, Choose or Change
 * (19's type-ahead, `CodePickerSheet`) and Clear. It stores the group's hidden
 * id and shows its code. One component for the invoice-and-codes card on a
 * Contract's page and the create panel (build plan Phase 45; the panel goes
 * in 46).
 */

import { useState } from 'react'
import { rvgGroupLabel } from '../../../../domain/billing/rvgGroups'
import { CodePickerSheet } from '../../../../shared/capture/CodePickerSheet'
import { FieldHint, FieldLabel, TextAction } from '../../../../shared/ui'
import { useAppStore } from '../../../../store'
import { neutral, radius } from '../../../../theme/tokens'

export function DefaultRvgCodeField({ value, onChange }: { value: string | null; onChange: (groupId: string | null) => void }) {
  const rvgGroups = useAppStore((s) => s.masters.rvgGroups)
  const [pickerOpen, setPickerOpen] = useState(false)
  const group = value !== null ? rvgGroups[value] : undefined
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
      <FieldLabel>Default RVG code</FieldLabel>
      <div
        data-shot="contract-default-rvg"
        style={{ minHeight: 48, boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px', borderRadius: radius.ctl, border: `1px solid ${neutral.line}`, background: neutral.bg }}
      >
        <span style={{ flex: 1, minWidth: 0, fontSize: 14, color: group !== undefined ? neutral.ink : neutral.mist, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={group !== undefined ? rvgGroupLabel(group) : undefined}>
          {group !== undefined ? (
            <>
              <span className="mono" style={{ fontWeight: 600 }}>{group.code}</span>
              <span style={{ color: neutral.slate }}> · {group.description}</span>
            </>
          ) : (
            'None'
          )}
        </span>
        <TextAction size="sm" flush onClick={() => setPickerOpen(true)} label="Choose the default RVG code">{group !== undefined ? 'Change' : 'Choose'}</TextAction>
        {group !== undefined && <TextAction size="sm" flush onClick={() => onChange(null)} label="Clear the default RVG code">Clear</TextAction>}
      </div>
      <FieldHint>Fills a Procedure's RVG code when it has none.</FieldHint>
      <CodePickerSheet
        open={pickerOpen}
        {...(value !== null ? { currentId: value } : {})}
        rvgGroups={rvgGroups}
        onPick={(id) => {
          onChange(id)
          setPickerOpen(false)
        }}
        onClose={() => setPickerOpen(false)}
      />
    </div>
  )
}
