/**
 * The drawer's attention box (catch-up Phase 30; US-01.5.2, US-01.5.4): each
 * live conflict with its reason and detail and, for the office, "Clear
 * conflict"; each office clear as one muted line with "Flag again"; then any
 * attention that is not a conflict (a private List with no surgeon).
 */

import { useState } from 'react'
import { conflictFromCause, describeConflict, type ExpectedConflict } from '../../../../domain/conflicts'
import type { List } from '../../../../domain/types'
import { restoreListConflict, useAppStore, useConflictLookups, type Actor } from '../../../../store'
import { hhmm } from '../../../../shared/format'
import { neutral, radius, semantic } from '../../../../theme/tokens'
import { ClearConflictSheet } from './ClearConflictSheet'
import { textActionStyle } from '../../tableChrome'

const linkStyle = textActionStyle

export function ConflictPanel({ list, actor }: { list: List; actor: Actor }) {
  const lookups = useConflictLookups()
  const [clearing, setClearing] = useState<ExpectedConflict | null>(null)
  const office = actor.role === 'office'
  const clears = list.conflictClears ?? []
  if (list.conflicts.length === 0 && clears.length === 0) return null

  return (
    <>
      <div data-shot="drawer-attention" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {list.conflicts.length > 0 && (
          <div style={{ background: semantic.warning.tint, color: semantic.warning.onTint, border: list.conflicts.length > 0 ? `1.5px solid ${semantic.warning.solid}` : undefined, borderRadius: radius.card, padding: 12, fontSize: 13, lineHeight: '18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <strong>{list.conflicts.length === 1 ? 'Conflict' : `${list.conflicts.length} conflicts`}</strong>
            {list.conflicts.map((c) => {
              const d = describeConflict(c, list, lookups)
              return (
                <div key={c.cause} data-conflict-cause={c.cause} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontWeight: 600 }}>{d.reason}</span>
                  <span>{d.detail}</span>
                  {office && (
                    <span>
                      <button type="button" style={linkStyle} onClick={() => setClearing(c)}>
                        Clear conflict
                      </button>
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
        {clears.map((clear) => {
          const c = conflictFromCause(clear.cause)
          if (c === null) return null
          const d = describeConflict(c, list, lookups)
          return (
            <div key={clear.cause} data-shot="drawer-conflict-cleared" title={`${d.reason}: ${d.detail}`} style={{ background: neutral.bg, borderRadius: radius.card, padding: '10px 12px', fontSize: 12.5, color: neutral.slate, lineHeight: '18px', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <span>
                Cleared by {clear.by}, <span className="mono">{hhmm(clear.atISO)}</span>
                {clear.note !== undefined ? `: ${clear.note}` : ''}
              </span>
              {office && (
                <button type="button" style={{ ...linkStyle, flex: 'none' }} onClick={() => restoreListConflict(useAppStore, actor, list.id, clear.cause)}>
                  Flag again
                </button>
              )}
            </div>
          )
        })}
      </div>
      <ClearConflictSheet open={clearing !== null} actor={actor} listId={list.id} conflict={clearing} onClose={() => setClearing(null)} />
    </>
  )
}
