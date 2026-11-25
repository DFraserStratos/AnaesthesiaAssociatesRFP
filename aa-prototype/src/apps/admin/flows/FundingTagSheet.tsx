/**
 * Add or edit a funding tag (catch-up Phase 18a; US-13.4.5), opened from the
 * Funding tags tab of the Contracts section (build plan Phase 48 moved it
 * here unchanged): its code and the insurer or funder Party it names. The
 * store is the rule source; a refusal shows its own sentence.
 */

import { useMemo, useState } from 'react'
import { neutral } from '../../../theme/tokens'
import { FUNDER_PARTY_KINDS, normaliseTagCode, type FundingTag } from '../../../domain/billing/fundingTags'
import { createFundingTag, editFundingTag, useAppStore, type Actor } from '../../../store'
import { Button, FormError, TextField, useSurface } from '../../../shared'
import { SelectField } from '../../../shared/ui'
import { OverlayHeader, SheetActions } from '../../../shared/surface'
import { PARTY_KIND_LABEL } from '../../../shared/contracts'

export function FundingTagSheet({ tag, actor, onClose }: { tag?: FundingTag; actor: Actor; onClose: () => void }) {
  const { Overlay } = useSurface()
  const parties = useAppStore((s) => s.masters.parties)
  const [code, setCode] = useState(tag?.code ?? '')
  const [funderPartyId, setFunderPartyId] = useState(tag?.funderPartyId ?? '')
  const [error, setError] = useState<string | null>(null)
  const funders = useMemo(
    () => FUNDER_PARTY_KINDS.map((kind) => [kind, Object.values(parties).filter((p) => p.kind === kind).sort((a, b) => a.name.localeCompare(b.name))] as const),
    [parties],
  )

  function save() {
    const fields = { code, funderPartyId }
    const outcome = tag === undefined ? createFundingTag(useAppStore, actor, fields) : editFundingTag(useAppStore, actor, tag.id, fields)
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    onClose()
  }

  return (
    <Overlay open onClose={onClose}>
      <div data-shot="funding-tag-sheet" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <OverlayHeader title={tag === undefined ? 'Add a funding tag' : `Edit ${tag.code}`} />
        <TextField label="Code" value={code} onChange={(v) => setCode(normaliseTagCode(v))} mono placeholder="e.g. NZDF" hint="The short label shown on Contracts and when choosing one." />
        <SelectField label="Funder" value={funderPartyId} onChange={setFunderPartyId} hint="The insurer or funder whose work arrives under this tag. Optional.">
          <option value="">No funder named</option>
          {funders.map(([kind, list]) => (
            <optgroup key={kind} label={PARTY_KIND_LABEL[kind]}>
              {list.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </optgroup>
          ))}
        </SelectField>
        {tag !== undefined && <div style={{ fontSize: 12.5, color: neutral.slate }}>Changing the code does not rename the Fixed price Contracts already made for it; rename those in Contracts.</div>}
        <FormError message={error} />
        <SheetActions primary={<Button variant="primary" block onClick={save}>{tag === undefined ? 'Add funding tag' : 'Save changes'}</Button>} />
      </div>
    </Overlay>
  )
}
