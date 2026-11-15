import { useId, useMemo, useState } from 'react'
import { sessionText } from '@proto/domain/outOfHours'
import { timesDraftError } from '@proto/apps/admin/flows/SessionTimesFields'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { AutocompleteField } from './AutocompleteField'
import { useStore } from './data'
import { FormAlert } from './shared'

interface TimesDraft {
  startTime: string
  endTime: string
}

/** Every quarter hour from 06:00 to 21:00: the suggestions for the typed variant. */
const QUARTER_HOURS: string[] = Array.from({ length: (21 - 6) * 4 + 1 }, (_, i) => {
  const m = 6 * 60 + i * 15
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
})

/**
 * SessionTimesFields on shadcn Field. Same AM defaults from the store, same "Default AM times" or
 * "Own times" hint, same Use default action (now a link Button) and the prototype's own
 * `timesDraftError` under the pair. `control` picks the time control: the browser's time input in
 * the kit Input (as today: neither Base UI nor react-day-picker has a time field), or a typed
 * field suggesting quarter hours (Base UI Autocomplete).
 */
export function SessionTimesReplacement({ control }: { control: 'native' | 'typed' }) {
  const defaults = useStore((s) => s.appSettings.schedule.defaultTimes.AM) as TimesDraft
  const def = useMemo(() => ({ startTime: defaults.startTime, endTime: defaults.endTime }), [defaults])
  const [draft, setDraft] = useState<TimesDraft>(def)
  const startId = useId()
  const endId = useId()
  const errorId = useId()
  const error = timesDraftError(draft) as string | null
  const isDefault = draft.startTime === def.startTime && draft.endTime === def.endTime
  const session = sessionText('AM') as string

  const timeControl = (id: string, key: keyof TimesDraft) =>
    control === 'native' ? (
      <Input
        id={id}
        type="time"
        value={draft[key]}
        onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
        aria-invalid={error !== null ? true : undefined}
        aria-describedby={error !== null ? errorId : undefined}
        className="tw:font-mono tw:tabular-nums"
      />
    ) : (
      <AutocompleteField
        id={id}
        items={QUARTER_HOURS}
        value={draft[key]}
        onValueChange={(v) => setDraft({ ...draft, [key]: v })}
        placeholder="HH:MM"
        mono
        invalid={error !== null}
        aria-describedby={error !== null ? errorId : undefined}
        emptyText="No quarter hour matches. Any HH:MM time is kept."
      />
    )

  return (
    <div className="tw:flex tw:flex-col tw:gap-2">
      <div className="tw:flex tw:flex-col tw:gap-1.5">
        <div className="tw:flex tw:gap-3">
          <Field className="tw:flex-1">
            <FieldLabel htmlFor={startId}>Start</FieldLabel>
            {timeControl(startId, 'startTime')}
          </Field>
          <Field className="tw:flex-1">
            <FieldLabel htmlFor={endId}>End</FieldLabel>
            {timeControl(endId, 'endTime')}
          </Field>
        </div>
        <div className="tw:flex tw:items-baseline tw:gap-2.5 tw:text-xs tw:text-slate">
          {isDefault ? (
            <span>
              Default {session} times ({def.startTime} to {def.endTime})
            </span>
          ) : (
            <>
              <span>
                Own times. The {session} default is {def.startTime} to {def.endTime}.
              </span>
              <Button variant="link" className="tw:text-xs tw:font-semibold" onClick={() => setDraft({ ...def })}>
                Use default
              </Button>
            </>
          )}
        </div>
      </div>
      <div id={errorId}>
        <FormAlert message={error} />
      </div>
    </div>
  )
}
