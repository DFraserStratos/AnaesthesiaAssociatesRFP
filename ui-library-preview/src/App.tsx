import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import { AdminCatalogue } from '@proto/apps/demo/catalogue/AdminCatalogue.tsx'
import { WebCatalogue } from '@proto/apps/demo/catalogue/WebCatalogue.tsx'
import { MobileCatalogue } from '@proto/apps/demo/catalogue/MobileCatalogue.tsx'
import { AppIdContext } from './kit/Kit'
import { ThemeSink } from './kit/ThemeSink'
import type { AppId } from './kit/verdicts'
import type { ReactNode } from 'react'

function Page({ app, children }: { app: AppId; children: ReactNode }) {
  return <AppIdContext.Provider value={app}>{children}</AppIdContext.Provider>
}

/** The prototype kit's app tabs link to /demo/catalogue/:app; send them to the preview's own routes. */
function CatalogueLinkRedirect() {
  const { app } = useParams()
  return <Navigate to={`/${app ?? 'admin'}`} replace />
}

export function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="/admin" element={<Page app="admin"><AdminCatalogue /></Page>} />
        <Route path="/web" element={<Page app="web"><WebCatalogue /></Page>} />
        <Route path="/mobile" element={<Page app="mobile"><MobileCatalogue /></Page>} />
        <Route path="/theme" element={<ThemeSink />} />
        <Route path="/demo/catalogue/:app" element={<CatalogueLinkRedirect />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
