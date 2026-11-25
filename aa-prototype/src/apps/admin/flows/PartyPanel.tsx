/**
 * New party (catch-up Phase 18; build plan Phase 48; US-04.1.5): the Parties
 * tab's create panel, the Admin wide side panel over `PartyFormFields`. Add
 * Party saves through `createParty` and opens the new Party's page; a refusal
 * shows `partyRefusal`'s own sentence in the panel. Editing a Party is on its
 * page (the Details card). Saving a Party creates no Contract.
 */

import { useState } from 'react'
import type { Party } from '../../../domain/types'
import { createParty, useAppStore, type Actor } from '../../../store'
import { Button, FormError } from '../../../shared'
import { MasterPanel } from '../components/MasterPanel'
import { partyDraftFrom, partyFieldsOf, PartyFormFields, shownCodePrefix, useTakenPrefixes } from './PartyFormFields'

interface Props {
  open: boolean
  actor: Actor
  onClose: () => void
  /** Called with the new Party once it is saved (the tab opens its page). */
  onCreated: (party: Party) => void
}

export function PartyPanel({ open, actor, onClose, onCreated }: Props) {
  const [draft, setDraft] = useState(() => partyDraftFrom())
  const [error, setError] = useState<string | null>(null)
  const codePrefix = shownCodePrefix(draft, useTakenPrefixes())

  function save() {
    const outcome = createParty(useAppStore, actor, partyFieldsOf(draft, codePrefix))
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    onCreated(outcome.value.party)
  }

  return (
    <MasterPanel
      open={open}
      onClose={onClose}
      title="New Party"
      shot="party-panel"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save}>Add Party</Button>
        </>
      }
    >
      <PartyFormFields draft={draft} onChange={setDraft} holdsContracts={false} billedByAContract={false} codePrefix={codePrefix} />
      <FormError message={error} />
    </MasterPanel>
  )
}
