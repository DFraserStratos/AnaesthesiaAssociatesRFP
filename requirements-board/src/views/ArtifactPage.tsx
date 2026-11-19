/**
 * One artifact, full size: its panel docked on the left (as a card's sheet docks on the board,
 * resizable, width kept per browser) and the artifact filling the rest. `?region=` names the spot
 * to bring into view in the red box, or the step of a stepped diagram to show. Full screen hides
 * the masthead and the panel so the artifact fills the window (the screen too, where the browser
 * allows it); Esc or the same button comes back.
 *
 * When the artifact goes (renamed, removed, its sidecar failing to parse), full screen is left; unsaved
 * details edits are shown so they can be copied, and asked about before they go (as on a card). If it
 * comes back, the panel picks it up, with any edits.
 */
import { ChevronLeft } from 'lucide-react'
import { useEffect, useState, type CSSProperties } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import type { Artifact } from '../../shared/types.ts'
import { ArtifactPanel, PanelVeil, usePanelKeys } from '../artifacts/ArtifactPanel.tsx'
import { ArtifactViewer } from '../artifacts/ArtifactViewer.tsx'
import { useFullScreen } from '../artifacts/fullScreen.ts'
import { OrphanBody, changedRows, discardConfirm } from '../components/EditChrome.tsx'
import { PanelResizer, readPanel, writePanel } from '../components/PanelResizer.tsx'
import { useEditableRecord } from '../components/useEditableRecord.ts'
import { useOpen } from '../nav.ts'
import { useCatalogue } from '../store.ts'

const PANEL_KEY = 'requirements-board:artifact-panel-width'

export function ArtifactPage() {
  const { id = '' } = useParams()
  const [params] = useSearchParams()
  const spot = params.get('region')
  const rec = useCatalogue((s) => s.artifacts[id])
  const open = useOpen()
  const [panelW, setPanelW] = useState(() => readPanel(PANEL_KEY))
  useEffect(() => writePanel(PANEL_KEY, panelW), [panelW])
  // Asking for the same spot again (a second click) still brings the view back to it.
  const [asks, setAsks] = useState(0)
  const [preview, setPreview] = useState<string | null>(null)
  const full = useFullScreen()
  // Nothing to fill the screen with: the masthead comes back.
  const gone = !rec
  useEffect(() => {
    if (gone && full.on) full.toggle()
  }, [gone, full.on])

  if (!rec) return <ArtifactGone key={id} id={id} />
  const goTo = (s: string | null) => {
    setAsks((n) => n + 1)
    open.artifact(id, s, { replace: true })
  }
  return (
    <div className={`board-split artifact-split${full.on ? ' is-full' : ' has-panel'}`} style={{ '--panel-w': `${panelW}%` } as CSSProperties}>
      {/* Hidden, not unmounted, in full screen: the panel's tab and any edit in progress are kept. */}
      <aside className="dock artifact-dock" aria-label="Artifact details" hidden={full.on}>
        <ArtifactPanel key={id} rec={rec} spot={spot} onSpot={goTo} onPreview={setPreview} />
      </aside>
      {!full.on && <PanelResizer width={panelW} onChange={setPanelW} label="Resize the artifact panel" />}
      <div className="artifact-stage">
        <ArtifactViewer key={id} rec={rec} spot={spot} focusKey={`${spot ?? ''}|${asks}`} preview={full.on ? null : preview} onSpot={goTo} fullScreen={full} />
      </div>
    </div>
  )
}

/** The artifact is not in the catalogue: its unsaved details edits, if there are any, else a plain note. */
function ArtifactGone({ id }: { id: string }) {
  const artifacts = useCatalogue((s) => s.artifacts)
  const navigate = useNavigate()
  // Only its stored draft is read here: with no record there is nothing to save or adopt.
  const ed = useEditableRecord<Artifact>({
    key: `artifact:${id}`,
    kind: 'artifact',
    rec: undefined,
    save: () => Promise.reject(new Error(`${id} is not in the catalogue`)),
    adopt: () => {},
  })
  // The replacement by its name, as the form shows it.
  const show = (field: string, value: unknown) => (field === 'supersededBy' && typeof value === 'string' ? `${value} ${artifacts[value]?.data.title ?? ''}`.trim() : undefined)
  const confirm = discardConfirm(ed, id)
  usePanelKeys(ed, confirm)

  if (!ed.orphaned || !ed.draft || !ed.base) {
    return (
      <div className="page">
        <div className="page-inner">
          <p className="empty">There is no artifact {id}. It may have been renamed or removed, or its sidecar may not read. This page shows it as soon as it is back.</p>
        </div>
      </div>
    )
  }
  return (
    <div className="board-split artifact-split has-panel">
      <aside className="dock artifact-dock" aria-label="Artifact details">
        <div className="artifact-panel">
          <header className="artifact-panel-head">
            <button className="crumb" onClick={() => ed.leave(() => navigate('/artifacts'))}>
              <ChevronLeft size={14} /> <span>Artifacts</span>
            </button>
            <h2>{id} not found</h2>
          </header>
          <OrphanBody id={id} rows={changedRows('artifact', ed.base.data, ed.draft, show)} />
          <footer className="sheet-foot artifact-panel-foot">
            <span className="spacer" />
            <button className="btn danger" onClick={ed.discard}>
              Discard edits
            </button>
          </footer>
          {confirm && <PanelVeil confirm={confirm} />}
        </div>
      </aside>
    </div>
  )
}
