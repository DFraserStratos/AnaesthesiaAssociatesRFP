import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { format, parseISO } from 'date-fns'
import { neutral, radius } from '../../theme/tokens'
import { useAppStore, type Actor } from '../../store'
import type { SlotStatusKey } from '../../domain/types'
import { locationName } from '../format'
import { resolveDisplayStatus, useSlotStatusRecords } from '../status/useSlotStatuses'
import { Button } from '../ui'
import { useSurface } from '../surface'
import { MoveListSheet } from './MoveListSheet'

/** What a screen can ask the host for. */
export interface MoveListPromptApi {
  /** Open the move sheet on one of her Lists (optionally with a colleague's session chosen). */
  openMove: (listId: string, options?: { toSlotId?: string }) => void
  /**
   * US-01.5.5: a closed status was refused because these sessions hold her
   * Lists (`holdsList`). Prompt for each List in turn, one per sheet; `onDone`
   * gets true once every List has moved (the caller then saves the status), or
   * false when she stops (nothing is saved; the Lists already moved stay moved).
   */
  promptUnavailable: (input: { listIds: readonly string[]; statusKey: SlotStatusKey; onDone: (allMoved: boolean) => void }) => void
}

const MoveListPromptContext = createContext<MoveListPromptApi | null>(null)

/** The host's prompt, or null where no anaesthetist app hosts one (the form then shows the store's refusal inline). */
export function useMoveListPrompt(): MoveListPromptApi | null {
  return useContext(MoveListPromptContext)
}

type Prompt =
  | { kind: 'move'; listId: string; toSlotId?: string }
  | { kind: 'intro'; listIds: readonly string[]; statusKey: SlotStatusKey; onDone: (allMoved: boolean) => void }
  | { kind: 'unavailable'; listIds: readonly string[]; index: number; statusKey: SlotStatusKey; moved: boolean; onDone: (allMoved: boolean) => void }

/**
 * Hosts the one move sheet for an anaesthetist app (catch-up Phase 32), above
 * whatever screen or sheet asked for it, so a form inside the availability
 * sheet can prompt without nesting overlays. Mounted once by the mobile app
 * (and the PWA, which renders it) and once by the web app, inside their
 * `SurfaceProvider`.
 */
export function MoveListPromptProvider({ actor, children }: { actor: Actor; children: ReactNode }) {
  const [prompt, setPrompt] = useState<Prompt | null>(null)

  const openMove = useCallback((listId: string, options?: { toSlotId?: string }) => {
    setPrompt({ kind: 'move', listId, ...(options?.toSlotId !== undefined ? { toSlotId: options.toSlotId } : {}) })
  }, [])

  const promptUnavailable = useCallback<MoveListPromptApi['promptUnavailable']>(({ listIds, statusKey, onDone }) => {
    if (listIds.length === 0) {
      onDone(true)
      return
    }
    setPrompt(listIds.length > 1 ? { kind: 'intro', listIds, statusKey, onDone } : { kind: 'unavailable', listIds, index: 0, statusKey, moved: false, onDone })
  }, [])

  const api = useMemo(() => ({ openMove, promptUnavailable }), [openMove, promptUnavailable])

  function closeUnavailable(p: Extract<Prompt, { kind: 'unavailable' }>) {
    if (!p.moved) {
      setPrompt(null)
      p.onDone(false)
      return
    }
    const next = p.index + 1
    if (next < p.listIds.length) {
      setPrompt({ ...p, index: next, moved: false })
      return
    }
    setPrompt(null)
    p.onDone(true)
  }

  return (
    <MoveListPromptContext.Provider value={api}>
      {children}
      {prompt?.kind === 'move' && (
        <MoveListSheet
          key={`move-${prompt.listId}-${prompt.toSlotId ?? ''}`}
          open
          actor={actor}
          listId={prompt.listId}
          {...(prompt.toSlotId !== undefined ? { toSlotId: prompt.toSlotId } : {})}
          onClose={() => setPrompt(null)}
        />
      )}
      {prompt?.kind === 'intro' && (
        <ListsToMoveIntro
          listIds={prompt.listIds}
          statusKey={prompt.statusKey}
          onStart={() => setPrompt({ kind: 'unavailable', listIds: prompt.listIds, index: 0, statusKey: prompt.statusKey, moved: false, onDone: prompt.onDone })}
          onCancel={() => {
            setPrompt(null)
            prompt.onDone(false)
          }}
        />
      )}
      {prompt?.kind === 'unavailable' && prompt.listIds[prompt.index] !== undefined && (
        <MoveListSheet
          key={`unavailable-${prompt.index}-${prompt.listIds[prompt.index]}`}
          open
          actor={actor}
          listId={prompt.listIds[prompt.index]!}
          unavailable={{ statusKey: prompt.statusKey }}
          progress={{ index: prompt.index + 1, total: prompt.listIds.length }}
          onMoved={() => setPrompt((p) => (p?.kind === 'unavailable' ? { ...p, moved: true } : p))}
          onClose={() => closeUnavailable(prompt)}
        />
      )}
    </MoveListPromptContext.Provider>
  )
}

/** Before a range or series that covers several of her Lists: which ones, then one prompt each. */
function ListsToMoveIntro({ listIds, statusKey, onStart, onCancel }: { listIds: readonly string[]; statusKey: SlotStatusKey; onStart: () => void; onCancel: () => void }) {
  const { Overlay, variant } = useSurface()
  const lists = useAppStore((s) => s.schedule.lists)
  const hospitals = useAppStore((s) => s.masters.hospitals)
  const statuses = useSlotStatusRecords()
  const label = resolveDisplayStatus(statusKey, statuses).label
  return (
    <Overlay open onClose={onCancel}>
      <div data-shot="move-lists-intro" style={{ display: 'flex', flexDirection: 'column', gap: 14, width: variant === 'web' ? 460 : undefined, maxWidth: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: neutral.ink }}>
            {listIds.length} of your sessions have Lists
          </span>
          <span style={{ fontSize: 13, lineHeight: '19px', color: neutral.slate }}>
            Before these sessions are marked {label}, choose where each List goes: back to the office or to a colleague. One at a time.
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', border: `1px solid ${neutral.line}`, borderRadius: radius.card, overflow: 'hidden' }}>
          {listIds.map((id, i) => {
            const l = lists[id]
            if (l === undefined) return null
            return (
              <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderTop: i === 0 ? 'none' : `1px solid ${neutral.sunken}`, fontSize: 13.5 }}>
                <span className="mono" style={{ fontSize: 12, color: neutral.mist, width: 44, flex: 'none' }}>
                  {i + 1} of {listIds.length}
                </span>
                <span style={{ flex: 1, minWidth: 0, color: neutral.ink }}>
                  {format(parseISO(l.dateISO), 'EEE d MMM')} {l.session} · {locationName(l.hospitalId, hospitals)}
                </span>
              </div>
            )
          })}
        </div>
        <Button variant="primary" block onClick={onStart}>
          Choose where they go
        </Button>
        <Button variant="secondary" block onClick={onCancel}>
          Not now
        </Button>
      </div>
    </Overlay>
  )
}
