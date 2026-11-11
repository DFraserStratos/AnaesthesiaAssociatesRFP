import { Navigate, useParams } from 'react-router-dom'
import { AdminCatalogue } from './AdminCatalogue'
import { WebCatalogue } from './WebCatalogue'
import { MobileCatalogue } from './MobileCatalogue'

/** /demo/catalogue/:app · demo-only UI component catalogue, reached by URL (not in the app switcher). */
export function ComponentCatalogue() {
  const { app } = useParams()
  if (app === 'admin') return <AdminCatalogue />
  if (app === 'web') return <WebCatalogue />
  if (app === 'mobile') return <MobileCatalogue />
  return <Navigate to="/demo/catalogue/admin" replace />
}
