/** Tests: a delivery read back as its separate changes (records first, in the order they came), as the old per-change events were. */
import type { DeliveryBody } from '../shared/delivery.ts'
import type { CatalogueChange } from '../shared/types.ts'

export function changesOf(d: DeliveryBody): CatalogueChange[] {
  const out: CatalogueChange[] = []
  for (const [id, record] of Object.entries(d.items ?? {})) out.push({ kind: 'item', id, record })
  for (const [id, record] of Object.entries(d.questions ?? {})) out.push({ kind: 'question', id, record })
  for (const [id, record] of Object.entries(d.artifacts ?? {})) out.push({ kind: 'artifact', id, record })
  if (d.layout) out.push({ kind: 'layout', layout: d.layout })
  if (d.config) out.push({ kind: 'config', config: d.config })
  if (d.assets) out.push({ kind: 'assets', assets: d.assets })
  if (d.issues) out.push({ kind: 'issues', issues: d.issues })
  return out
}
