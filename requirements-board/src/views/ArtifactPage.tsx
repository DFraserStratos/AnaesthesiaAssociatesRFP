/**
 * One artifact, full size: its panel docked on the left (as a card's sheet docks on the board,
 * resizable, width kept per browser) and the artifact filling the rest. `?region=` names the spot
 * to bring into view in the red box, or the step of a stepped diagram to show. Full screen hides
 * the masthead and the panel so the artifact fills the window (the screen too, where the browser
 * allows it); Esc or the same button comes back.
 */
import { useEffect, useState, type CSSProperties } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { ArtifactPanel } from '../artifacts/ArtifactPanel.tsx'
import { ArtifactViewer } from '../artifacts/ArtifactViewer.tsx'
import { useFullScreen } from '../artifacts/fullScreen.ts'
import { PanelResizer, readPanel, writePanel } from '../components/PanelResizer.tsx'
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

  if (!rec) {
    return (
      <div className="page">
        <div className="page-inner">
          <p className="empty">There is no artifact {id}. It may have been renamed or removed from the catalogue.</p>
        </div>
      </div>
    )
  }
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
