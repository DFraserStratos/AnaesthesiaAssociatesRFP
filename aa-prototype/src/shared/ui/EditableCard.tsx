/**
 * A record page's card, edited and saved on its own (lifted out of the Contract page by build plan
 * Phase 53; D104, US-13.4.1 "One card, one change"): Edit in its heading, its form and a Cancel and
 * Save footer while in edit, and a refusal under it in the rule's own words. `useCardEdit` holds the
 * card's draft: Save hands `commit` only the patch the card builds, so each save is one audited
 * change of that card's fields; a refusal keeps the draft open and shows its message on the card.
 * Several cards may be in edit at once, each saving alone. The People pages (54 to 57) build on these
 * and extend them by a prop that defaults to today's behaviour; none copies them.
 */

import { useState, type CSSProperties, type ReactNode } from 'react'
import { Button } from './Button'
import { Card } from './Card'
import { FormError, type DataAttributes } from './Field'
import { TextAction } from './TextAction'

/** A card's save: the store action for the card's patch, reporting a refusal in the rule's words. */
export type CardCommit<P> = (patch: P) => { ok: true } | { ok: false; message: string }

/** One card's edit: its draft (null while it reads), Edit (`start`), `cancel` and `save`. */
export function useCardEdit<D, P>(from: () => D, commit: CardCommit<P>) {
  const [draft, setDraft] = useState<D | null>(null)
  const [error, setError] = useState<string | null>(null)
  return {
    draft,
    setDraft: (next: D) => setDraft(next),
    error,
    start: () => {
      setDraft(from())
      setError(null)
    },
    cancel: () => {
      setDraft(null)
      setError(null)
    },
    save: (patch: P) => {
      const outcome = commit(patch)
      if (!outcome.ok) {
        setError(outcome.message)
        return
      }
      setDraft(null)
      setError(null)
    },
  }
}

export interface EditableCardProps extends DataAttributes {
  title: ReactNode
  /** The card's hook (`data-*` pass through to it); its Edit, Cancel, Save and refusal carry `${shot}-edit`, `-cancel`, `-save` and `-error`. */
  shot: string
  editable: boolean
  editing: boolean
  onEdit: () => void
  onCancel: () => void
  onSave: () => void
  error: string | null
  /** The card's frame (a record page passes its profile card style). */
  style?: CSSProperties
  /**
   * Why Save is held back (build plan Phase 54: a mandatory field left blank), shown under the
   * button in the rule's own words. Default none: Save is always enabled, as before.
   */
  saveDisabledReason?: string | null
  children: ReactNode
}

/** A card with Edit in its heading where `editable`, its form and footer while in edit, its refusal under it. */
export function EditableCard({ title, shot, editable, editing, onEdit, onCancel, onSave, error, style, saveDisabledReason = null, children, ...data }: EditableCardProps) {
  return (
    <Card
      {...data}
      {...(style !== undefined ? { style } : {})}
      title={title}
      shot={shot}
      editing={editing}
      {...(editable && !editing ? { action: <TextAction size="sm" flush onClick={onEdit} shot={`${shot}-edit`} label={`Edit ${typeof title === 'string' ? title.toLowerCase() : 'this card'}`}>Edit</TextAction> } : {})}
      {...(editing
        ? {
            footer: (
              <>
                <Button variant="secondary" size="compact" onClick={onCancel} shot={`${shot}-cancel`}>Cancel</Button>
                <Button
                  variant="primary"
                  size="compact"
                  onClick={onSave}
                  shot={`${shot}-save`}
                  {...(saveDisabledReason !== null ? { disabled: true, disabledReason: saveDisabledReason } : {})}
                >
                  Save
                </Button>
              </>
            ),
          }
        : {})}
    >
      {children}
      <FormError message={error} shot={`${shot}-error`} />
    </Card>
  )
}
