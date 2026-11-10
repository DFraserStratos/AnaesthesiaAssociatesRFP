import { useId, useMemo, useState } from 'react'
import { neutral } from '../../../../theme/tokens'
import { FUNDER_PARTY_KINDS, fundingTagsInOrder, fundingTagUsage, normaliseTagCode, type FundingTag } from '../../../../domain/billing/fundingTags'
import { createFundingTag, editFundingTag, moveFundingTagInList, removeFundingTag, useAppStore, type Actor } from '../../../../store'
import { Button, FieldLabel, FormError, TextField, useSurface } from '../../../../shared'
import { HistorySheet } from '../../../../shared/booking'
import { PARTY_KIND_LABEL } from '../../../../shared/contracts'
import { selectControlStyle } from '../../flows/fieldChrome'
import { Header, Table, TextAction } from './chrome'
import { cellStyle } from './tableStyles'

/**
 * Master data, Funding tags (catch-up Phase 18a; US-13.4.5): who funds a
 * hospital's work, such as SXAP, HNZ and ACC. The list order is the order the
 * step rail shows a hospital's tags. Each tag may name its insurer or funder
 * Party. A tag any Contract carries cannot be removed (the store's sentence is
 * shown); edit its code instead.
 */
export function FundingTagsView({ actor }: { actor: Actor }) {
  const tags = useAppStore((s) => s.masters.fundingTags)
  const contracts = useAppStore((s) => s.masters.contracts)
  const parties = useAppStore((s) => s.masters.parties)
  const [sheet, setSheet] = useState<{ tag?: FundingTag } | null>(null)
  const [history, setHistory] = useState<FundingTag | null>(null)
  const [error, setError] = useState<string | null>(null)
  const rows = fundingTagsInOrder(tags)

  function act(outcome: { ok: boolean; message?: string }) {
    setError(outcome.ok ? null : (outcome.message ?? null))
  }

  return (
    <>
      <Header
        title="Funding tags"
        sub="Who funds a hospital's work. A Contract carries at most one, and with who it bills, the tag decides where it is offered. When choosing a Contract, a hospital's tags show in this order."
        action={<Button variant="secondary" onClick={() => { setError(null); setSheet({}) }}>Add funding tag</Button>}
      />
      <FormError message={error} />
      <Table heads={['Tag', 'Funder', 'Contracts', '']} rightAlign={[2, 3]} shot="masters-funding-tags">
        {rows.map((t, i) => {
          const used = fundingTagUsage(contracts, t.id)
          const funder = t.funderPartyId !== undefined ? parties[t.funderPartyId] : undefined
          return (
            <tr key={t.id} data-tag={t.id}>
              <td className="mono" style={{ ...cellStyle, fontWeight: 600 }}>{t.code}</td>
              <td style={cellStyle}>{funder !== undefined ? funder.name : <span style={{ color: neutral.mist }}>No funder named</span>}</td>
              <td className="mono" style={{ ...cellStyle, textAlign: 'right' }}>{used}</td>
              <td style={{ ...cellStyle, textAlign: 'right', whiteSpace: 'nowrap' }}>
                <span style={{ display: 'inline-flex', gap: 12 }}>
                  <TextAction disabled={i === 0} onClick={() => act(moveFundingTagInList(useAppStore, actor, t.id, 'up'))} label={`Move ${t.code} up`}>Up</TextAction>
                  <TextAction disabled={i === rows.length - 1} onClick={() => act(moveFundingTagInList(useAppStore, actor, t.id, 'down'))} label={`Move ${t.code} down`}>Down</TextAction>
                  <TextAction onClick={() => setHistory(t)} label={`History of ${t.code}`}>History</TextAction>
                  <TextAction onClick={() => { setError(null); setSheet({ tag: t }) }} label={`Edit ${t.code}`}>Edit</TextAction>
                  <TextAction onClick={() => act(removeFundingTag(useAppStore, actor, t.id))} label={`Remove ${t.code}`}>Remove</TextAction>
                </span>
              </td>
            </tr>
          )
        })}
      </Table>
      {sheet !== null && <FundingTagSheet key={sheet.tag?.id ?? 'new'} tag={sheet.tag} actor={actor} onClose={() => setSheet(null)} />}
      <HistorySheet open={history !== null} entityIds={history !== null ? [history.id] : []} title="Funding tag history" onClose={() => setHistory(null)} />
    </>
  )
}

function FundingTagSheet({ tag, actor, onClose }: { tag?: FundingTag; actor: Actor; onClose: () => void }) {
  const { Overlay } = useSurface()
  const parties = useAppStore((s) => s.masters.parties)
  const [code, setCode] = useState(tag?.code ?? '')
  const [funderPartyId, setFunderPartyId] = useState(tag?.funderPartyId ?? '')
  const [error, setError] = useState<string | null>(null)
  const funderHintId = useId()
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
        <div style={{ fontSize: 18, fontWeight: 700 }}>{tag === undefined ? 'Add a funding tag' : `Edit ${tag.code}`}</div>
        <TextField label="Code" value={code} onChange={(v) => setCode(normaliseTagCode(v))} mono placeholder="e.g. NZDF" hint="The short label shown on Contracts and when choosing one." />
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <FieldLabel>Funder</FieldLabel>
          <select value={funderPartyId} onChange={(e) => setFunderPartyId(e.target.value)} aria-describedby={funderHintId} style={selectControlStyle}>
            <option value="">No funder named</option>
            {funders.map(([kind, list]) => (
              <optgroup key={kind} label={PARTY_KIND_LABEL[kind]}>
                {list.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </optgroup>
            ))}
          </select>
        </label>
        <div id={funderHintId} style={{ fontSize: 12, color: neutral.mist, marginTop: -8 }}>The insurer or funder whose work arrives under this tag. Optional.</div>
        {tag !== undefined && <div style={{ fontSize: 12.5, color: neutral.slate }}>Changing the code does not rename the Fixed price Contracts already made for it; rename those in Contracts.</div>}
        <FormError message={error} />
        <Button variant="primary" block onClick={save}>{tag === undefined ? 'Add funding tag' : 'Save changes'}</Button>
      </div>
    </Overlay>
  )
}
