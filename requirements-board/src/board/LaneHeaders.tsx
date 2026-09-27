/**
 * The Mapped board's lane headers ("MVP | 67"). They are drawn inside the
 * canvas (a ViewportPortal, in the same coordinates as the cards), so they zoom
 * with the map like every other label, with the same semantic zoom bumps
 * (styles.css). Horizontally each is pinned to the visible left edge of the
 * board (right of the item panel, when one is open over it): its x is the map's left edge or that edge, whichever is
 * further right, so a lane stays named however far the map is panned sideways. Clicking any
 * lane's name (the first lane's too) turns it into a text box to rename it.
 * Each named lane also has a small menu (rename, move, delete); "+ Add lane"
 * sits under the last.
 */
import { useStore, useViewport, ViewportPortal } from '@xyflow/react'
import { ChevronDown, ChevronRight, MoreHorizontal, Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { firstLaneName } from '../../shared/types.ts'
import { useCatalogue } from '../store.ts'
import { useDismiss } from '../useDismiss.ts'
import { LANE_MARGIN, laneKey, type LaneBand } from './mappedLayout.ts'

/** The gap between a header and the board's left edge, in screen pixels. */
const GUTTER = 16

/** Render inside <ReactFlow>. Positions are in flow coordinates; the viewport's transform does the rest. */
export function LaneHeaders({ bands, collapsed, onToggle, inset = 0 }: { bands: LaneBand[]; collapsed: ReadonlySet<string>; onToggle: (key: string) => void; /** Screen pixels covered on the left (the item panel). */ inset?: number }) {
  const { x, y, zoom } = useViewport()
  const paneH = useStore((s) => s.height)
  // The flow x at the board's visible left edge, plus the gutter; never left of the map itself.
  const left = Math.max(-LANE_MARGIN + GUTTER / zoom, (inset + GUTTER - x) / zoom)
  const last = bands.at(-1)
  return (
    <ViewportPortal>
      {/* Popovers stay at screen size, so they are scaled back by 1/zoom. */}
      <div className="lane-headers" style={{ '--inv-zoom': 1 / zoom } as React.CSSProperties}>
        {bands
          .filter((b) => b.head > 0)
          .map((b) => (
            <LaneHeader
              key={laneKey(b.key)}
              band={b}
              left={left}
              // In the lower half of the board a header opens its menu upward, so it never falls off screen.
              up={(b.y + b.head / 2) * zoom + y > paneH / 2}
              open={!collapsed.has(laneKey(b.key))}
              onToggle={() => onToggle(laneKey(b.key))}
            />
          ))}
        {last && <AddLane top={last.y + last.h} left={left} />}
      </div>
    </ViewportPortal>
  )
}

function LaneHeader({ band, left, up, open, onToggle }: { band: LaneBand; left: number; up: boolean; open: boolean; onToggle: () => void }) {
  const lanes = useCatalogue((s) => s.layout.lanes)
  const setLanes = useCatalogue((s) => s.setLanes)
  const renameLane = useCatalogue((s) => s.renameLane)
  const [menu, setMenu] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [askDelete, setAskDelete] = useState(false)
  const menuBtn = useRef<HTMLButtonElement>(null)
  const named = band.key !== null && !band.unknown
  const at = band.key === null ? -1 : lanes.indexOf(band.key)
  const move = (d: -1 | 1) => {
    const next = [...lanes]
    next.splice(at, 1)
    next.splice(at + d, 0, band.key!)
    void setLanes(next)
  }

  return (
    // The header strip, in flow units: the header sits centred in it.
    <div className={`lane-strip${up ? ' up' : ''}`} style={{ top: band.y, left, height: band.head }}>
    <div className={`lane-head nopan nodrag${band.unknown ? ' unknown' : ''}`}>
      <button className="lane-toggle" onClick={onToggle} aria-expanded={open} aria-label={`${open ? 'Collapse' : 'Expand'} ${band.name}`} title={open ? 'Collapse lane' : 'Expand lane'}>
        {open ? <ChevronDown size="1em" /> : <ChevronRight size="1em" />}
      </button>
      {renaming ? (
        <LaneNameInput
          initial={band.name}
          label={`Rename ${band.name}`}
          onDone={(name) => {
            setRenaming(false)
            if (name && name !== band.name) void renameLane(band.key, name)
          }}
        />
      ) : (
        <button
          className="lane-name"
          onClick={() => setRenaming(true)}
          aria-label={`Rename ${band.name}`}
          title={band.unknown ? 'A story names this lane, but the board has no lane called that. Click to rename it, which makes it a lane' : 'Click to rename'}
        >
          {band.name}
        </button>
      )}
      <span className="lane-count" aria-label={`${band.count} stories`}>
        {band.count}
      </span>
      {band.unknown && <span className="lane-flag">not a lane</span>}
      {band.key !== null && !renaming && (
        <button ref={menuBtn} className="lane-menu-btn" aria-label={`${band.name} lane actions`} aria-expanded={menu} onClick={() => setMenu((v) => !v)}>
          <MoreHorizontal size="1.1em" />
        </button>
      )}
      {menu && (
        <LaneMenu anchor={menuBtn} onClose={() => setMenu(false)}>
          {named ? (
            <>
              <button role="menuitem" onClick={() => (setMenu(false), setRenaming(true))}>
                Rename
              </button>
              <button role="menuitem" disabled={at <= 0} onClick={() => (setMenu(false), move(-1))}>
                Move up
              </button>
              <button role="menuitem" disabled={at < 0 || at >= lanes.length - 1} onClick={() => (setMenu(false), move(1))}>
                Move down
              </button>
              <button role="menuitem" className="danger" onClick={() => (setMenu(false), setAskDelete(true))}>
                Delete lane
              </button>
            </>
          ) : (
            <button role="menuitem" onClick={() => (setMenu(false), void setLanes([...lanes, band.key!]))}>
              Add as a lane
            </button>
          )}
        </LaneMenu>
      )}
      {askDelete && <DeleteAsk band={band} onClose={() => setAskDelete(false)} />}
    </div>
    </div>
  )
}

function LaneMenu({ anchor, onClose, children }: { anchor: React.RefObject<HTMLButtonElement | null>; onClose: () => void; children: React.ReactNode }) {
  const ref = useDismiss<HTMLDivElement>(onClose, anchor)
  return (
    <div ref={ref} className="lane-menu" role="menu">
      {children}
    </div>
  )
}

/** Asks in the board's own frame, like Tidy all: the safe answer is the filled button that holds focus. */
function DeleteAsk({ band, onClose }: { band: LaneBand; onClose: () => void }) {
  const deleteLane = useCatalogue((s) => s.deleteLane)
  const firstLane = useCatalogue((s) => firstLaneName(s.layout))
  const ref = useDismiss<HTMLDivElement>(onClose)
  const keep = useRef<HTMLButtonElement>(null)
  useEffect(() => keep.current?.focus(), [])
  return (
    <div ref={ref} className="popover ask lane-ask" role="dialog" aria-label={`Delete ${band.name}`}>
      <p>
        Delete the {band.name} lane?{' '}
        {band.count ? `Its ${band.count === 1 ? 'story moves' : `${band.count} stories move`} to ${firstLane}; nothing else changes.` : 'It has no stories.'}
      </p>
      <div className="ask-actions">
        <button ref={keep} className="btn primary" onClick={onClose}>
          Keep lane
        </button>
        <button
          className="btn ghost danger"
          onClick={() => {
            onClose()
            void deleteLane(band.name)
          }}
        >
          Delete lane
        </button>
      </div>
    </div>
  )
}

function AddLane({ top, left }: { top: number; left: number }) {
  const lanes = useCatalogue((s) => s.layout.lanes)
  const setLanes = useCatalogue((s) => s.setLanes)
  const [adding, setAdding] = useState(false)
  return (
    <div className="lane-add nopan nodrag" style={{ top, left }}>
      {adding ? (
        <LaneNameInput
          initial=""
          label="New lane name"
          onDone={(name) => {
            setAdding(false)
            if (name) void setLanes([...lanes, name])
          }}
        />
      ) : (
        <button className="lane-add-btn" onClick={() => setAdding(true)}>
          <Plus size="1.1em" /> Add lane
        </button>
      )}
    </div>
  )
}

/** Enter keeps the name, Esc or a click away drops it. */
function LaneNameInput({ initial, label, onDone }: { initial: string; label: string; onDone: (name: string | null) => void }) {
  const [value, setValue] = useState(initial)
  const done = useRef(false)
  const finish = (name: string | null) => {
    if (done.current) return
    done.current = true
    onDone(name)
  }
  return (
    <input
      className="input lane-input"
      autoFocus
      aria-label={label}
      placeholder="Lane name, e.g. MVP"
      maxLength={40}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onFocus={(e) => e.currentTarget.select()}
      onBlur={() => finish(null)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          finish(value.trim() || null)
        } else if (e.key === 'Escape') {
          e.preventDefault()
          e.stopPropagation()
          finish(null)
        }
      }}
    />
  )
}
