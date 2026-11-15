import { useState } from 'react'
import { XIcon } from 'lucide-react'
import { useWebFixtures } from '@proto/apps/demo/catalogue/web/fixtures'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { Segmented } from './shared'

interface Attachment {
  id: string
  name: string
  kind: string
  dataUrl?: string
}

/**
 * The attachment thumbnails, custom, with library parts: the remove control is a shadcn Button (24px
 * mark in a 44px target) with a Tooltip naming the file, and a refusal shows in an Alert. `reveal`:
 * the control fades in on hover or keyboard focus and stays mounted (as today), or is always shown.
 */
function Strip({ attachments, canRemove, onRemove, reveal }: { attachments: Attachment[]; canRemove: boolean; onRemove: (id: string) => { ok: boolean; message?: string }; reveal: 'hover' | 'always' }) {
  const [error, setError] = useState<string | null>(null)
  if (attachments.length === 0) return <div className="tw:text-[13px] tw:text-mist">No attachments on this List.</div>
  return (
    <div className="tw:flex tw:flex-col tw:gap-2">
      <ul className="tw:m-0 tw:flex tw:list-none tw:flex-wrap tw:gap-2 tw:p-0">
        {attachments.map((a) => (
          <li key={a.id} className="tw:group/att tw:relative tw:flex tw:w-[72px] tw:flex-col tw:gap-1">
            {a.dataUrl !== undefined ? (
              <img src={a.dataUrl} alt={a.name} className="tw:h-[92px] tw:w-[72px] tw:rounded-[8px] tw:border tw:border-line tw:bg-surface tw:object-cover" />
            ) : (
              <div className="tw:flex tw:h-[92px] tw:w-[72px] tw:items-center tw:justify-center tw:rounded-[8px] tw:bg-sunken tw:text-[11px] tw:text-mist">{a.kind}</div>
            )}
            {a.kind === 'pdf' && (
              <span aria-hidden className="tw:absolute tw:top-[70px] tw:left-1 tw:rounded-[4px] tw:border tw:border-line tw:bg-surface tw:px-1 tw:py-px tw:text-[9px] tw:font-bold tw:tracking-[0.04em] tw:text-slate">
                PDF
              </span>
            )}
            {canRemove && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove ${a.name}`}
                      onClick={() => {
                        const r = onRemove(a.id)
                        setError(r.ok ? null : (r.message ?? 'That attachment could not be removed.'))
                      }}
                      className={cn(
                        'tw:group/rm tw:absolute tw:-top-4 tw:-right-4 tw:size-11 tw:rounded-pill! tw:p-0 tw:hover:bg-transparent tw:focus-visible:shadow-none',
                        reveal === 'hover' && 'tw:opacity-0 tw:transition-opacity tw:duration-120 tw:ease-out tw:group-hover/att:opacity-100 tw:focus-visible:opacity-100',
                      )}
                    />
                  }
                >
                  <span className="tw:flex tw:size-6 tw:items-center tw:justify-center tw:rounded-pill tw:border tw:border-line tw:bg-surface tw:text-error-on-tint tw:shadow-e1 tw:group-focus-visible/rm:shadow-focus">
                    <XIcon aria-hidden className="tw:size-[13px]" strokeWidth={2.6} />
                  </span>
                </TooltipTrigger>
                <TooltipContent>Remove {a.name}</TooltipContent>
              </Tooltip>
            )}
            <span className="tw:truncate tw:text-[10px] tw:text-mist">{a.name}</span>
          </li>
        ))}
      </ul>
      {error !== null && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

/** The row: the same three seeded attachments, removals held locally, an Editable switch and Put them back. */
export function AttachmentStripReplacement({ reveal = 'hover' }: { reveal?: 'hover' | 'always' }) {
  const f = useWebFixtures() as { attachments: Attachment[] }
  const [items, setItems] = useState(f.attachments)
  const [editable, setEditable] = useState<'yes' | 'no'>('yes')
  return (
    <div className="tw:flex tw:flex-col tw:gap-3">
      <div className="tw:flex tw:items-center tw:gap-2">
        <span className="tw:text-xs tw:font-semibold tw:text-mist">Editable</span>
        <Segmented label="Editable" size="sm" value={editable} options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No (locked)' }]} onChange={setEditable} />
      </div>
      <Strip
        attachments={items}
        canRemove={editable === 'yes'}
        reveal={reveal}
        onRemove={(id) => {
          setItems((prev) => prev.filter((a) => a.id !== id))
          return { ok: true }
        }}
      />
      {items.length < f.attachments.length && (
        <Button variant="outline" size="sm" className="tw:self-start" onClick={() => setItems(f.attachments)}>
          Put them back
        </Button>
      )}
    </div>
  )
}
