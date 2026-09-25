import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import '@fontsource/hanken-grotesk/400.css'
import '@fontsource/hanken-grotesk/500.css'
import '@fontsource/hanken-grotesk/600.css'
import '@fontsource/hanken-grotesk/700.css'
import '@fontsource/hanken-grotesk/800.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import '@fontsource/jetbrains-mono/600.css'
import '@xyflow/react/dist/base.css'
import './styles.css'
import { App } from './App.tsx'
import { blockPagePinch } from './board/trackpad.ts'

// The page never pinch-zooms: only the board zooms (see trackpad.ts).
blockPagePinch(window)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
