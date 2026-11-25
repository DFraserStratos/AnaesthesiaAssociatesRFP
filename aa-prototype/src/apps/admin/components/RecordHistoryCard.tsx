import { useMemo, useState } from 'react'
import { HistorySheet } from '../../../shared/booking'
import { Card, TextAction } from '../../../shared/ui'
import { useAppStore } from '../../../store'
import { neutral } from '../../../theme/tokens'

/**
 * A person page's History in the side panel, as the Party and specialty pages show theirs: "N changes
 * recorded" and See history, which opens the shared History sheet on the record and, on the
 * anaesthetist and surgeon pages, its pairings (`useProfileHistory`). Hooks: the card `shot`, its
 * See history `${shot}-open` unless `openShot` names it.
 */
export function RecordHistoryCard({
  entityIds,
  entityLabels,
  name,
  shot,
  openShot,
}: {
  entityIds: string[]
  entityLabels?: Record<string, string>
  /** The record's name, for the sheet's title ("History · Mr T. Hale"). */
  name: string
  shot: string
  openShot?: string
}) {
  const audit = useAppStore((s) => s.audit)
  const idSet = entityIds.join('|')
  const changes = useMemo(() => {
    const ids = new Set(idSet.split('|'))
    return audit.filter((a) => ids.has(a.entityId)).length
  }, [audit, idSet])
  const [open, setOpen] = useState(false)
  return (
    <Card title="History" shot={shot}>
      <span style={{ fontSize: 13, color: neutral.slate }}>
        <span className="mono">{changes}</span> {changes === 1 ? 'change recorded' : 'changes recorded'}
      </span>
      {changes > 0 && (
        <TextAction size="sm" flush shot={openShot ?? `${shot}-open`} onClick={() => setOpen(true)}>See history</TextAction>
      )}
      <HistorySheet open={open} entityIds={entityIds} {...(entityLabels !== undefined ? { entityLabels } : {})} title={`History · ${name}`} onClose={() => setOpen(false)} />
    </Card>
  )
}
