import { useId, useMemo, useState } from 'react'
import { useAppStore } from '@proto/store'
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from '@/components/ui/combobox'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'

interface Specialty {
  id: string
  name: string
}

/**
 * ChipMultiSelect on Base UI Combobox (multiple): the chips sit in the field and
 * the input types to filter the list (chosen ones stay, ticked); Enter adds, Backspace on an empty
 * input removes the last chip, each chip keeps its remove button. Order is the
 * order chosen, as today. "Any specialty" shows as the placeholder when none.
 */
export function ChipMultiSelectReplacement() {
  const specialties: Record<string, Specialty> = useAppStore((s: { masters: { specialties: Record<string, Specialty> } }) => s.masters.specialties)
  const options = useMemo(() => Object.values(specialties).sort((a, b) => a.name.localeCompare(b.name)), [specialties])
  const [value, setValue] = useState<Specialty[]>([])
  const anchor = useComboboxAnchor()
  const id = useId()
  const hintId = useId()
  return (
    <Field>
      <FieldLabel htmlFor={id}>Specialties</FieldLabel>
      <Combobox<Specialty, true>
        multiple
        items={options}
        value={value}
        onValueChange={(v, details) => {
          // Base UI clears the whole selection on Escape when the list is closed; keep the chips, as today.
          if (details.reason === 'escape-key') return
          setValue(v)
        }}
        itemToStringLabel={(o) => o.name}
        isItemEqualToValue={(a, b) => a.id === b.id}
        autoHighlight
      >
        <ComboboxChips ref={anchor} className="tw:w-full">
          <ComboboxValue>
            {(chosen: Specialty[]) => (
              <>
                {chosen.map((s) => (
                  <ComboboxChip key={s.id} aria-label={s.name}>
                    {s.name}
                  </ComboboxChip>
                ))}
                <ComboboxChipsInput
                  id={id}
                  aria-describedby={hintId}
                  placeholder={chosen.length === 0 ? 'Any specialty · type to add one' : 'Add a specialty'}
                  className="tw:bg-transparent tw:text-[15px] tw:placeholder:text-mist"
                />
              </>
            )}
          </ComboboxValue>
        </ComboboxChips>
        <ComboboxContent anchor={anchor}>
          <ComboboxEmpty>No specialty matches.</ComboboxEmpty>
          <ComboboxList>
            {(s: Specialty) => (
              <ComboboxItem key={s.id} value={s}>
                {s.name}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      <FieldDescription id={hintId} className="tw:text-[12.5px]">Local state only.</FieldDescription>
    </Field>
  )
}
