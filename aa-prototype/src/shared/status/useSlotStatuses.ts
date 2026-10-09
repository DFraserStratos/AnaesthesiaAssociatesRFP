/**
 * The availability status master as every app reads it (catch-up Phase 29;
 * US-01.2.2). A display key is a List kind (fixed label and token) or an
 * availability status ID (label, description, token and treatment from
 * `masters.slotStatuses`), so a rename, recolour or added status shows in
 * every view at once. PWA-safe: store, domain and theme only.
 */

import { useMemo } from 'react'
import { useAppStore } from '../../store'
import type { DisplayKey, SlotStatus, SlotStatusKey } from '../../domain/types'
import { LIST_KIND_LABELS } from '../../domain/types'
import { activeStatuses, anaesthetistChoices, defaultSlotStatus, isListKind, statusFor, type SlotStatusRecords } from '../../domain/slotStatus'
import { LIST_KIND_VISUAL, resolveStatusVisual, type StatusVisual } from '../../theme/statusColours'
import { neutral } from '../../theme/tokens'

export interface ResolvedStatus {
  key: DisplayKey
  label: string
  longLabel: string
  description?: string
  visual: StatusVisual
  /** False for an ID the master does not hold (rendered as "Unknown status", never the raw ID). */
  known: boolean
  /** The status record, when the key is an availability status. */
  status?: SlotStatus
}

const UNKNOWN_VISUAL: StatusVisual = {
  rowEdge: neutral.line,
  solid: neutral.mist,
  tint: neutral.sunken,
  onTint: neutral.slate,
  treatment: 'solid',
  blockBackground: neutral.sunken,
  solidBackground: neutral.mist,
  leftBar: neutral.mist,
}

/** Pure: how a display key renders, from the status records. */
export function resolveDisplayStatus(key: DisplayKey, statuses: SlotStatusRecords): ResolvedStatus {
  if (isListKind(key)) {
    return { key, ...LIST_KIND_LABELS[key], visual: resolveStatusVisual(LIST_KIND_VISUAL[key]), known: true }
  }
  const status = statusFor(statuses, key)
  if (status === undefined) {
    return { key, label: 'Unknown status', longLabel: 'Unknown status', visual: UNKNOWN_VISUAL, known: false }
  }
  return {
    key,
    label: status.label,
    longLabel: status.longLabel,
    description: status.description,
    visual: resolveStatusVisual(status),
    known: true,
    status,
  }
}

/** The status records (stable reference from the store). */
export function useSlotStatusRecords(): SlotStatusRecords {
  return useAppStore((s) => s.masters.slotStatuses)
}

/** The active statuses in `order`. */
export function useSlotStatuses(): SlotStatus[] {
  const records = useSlotStatusRecords()
  return useMemo(() => activeStatuses(records), [records])
}

/** What an anaesthetist may choose (active and settable, in `order`). */
export function useAnaesthetistStatusChoices(): SlotStatus[] {
  const records = useSlotStatusRecords()
  return useMemo(() => anaesthetistChoices(records), [records])
}

/** One status record by ID. */
export function useSlotStatus(key: SlotStatusKey | undefined): SlotStatus | undefined {
  const records = useSlotStatusRecords()
  return key === undefined ? undefined : statusFor(records, key)
}

/** The default status (Free unless an admin changed it), resolved: what every "open session" cue shows. */
export function useDefaultStatus(): ResolvedStatus {
  const records = useSlotStatusRecords()
  return useMemo(() => resolveDisplayStatus(defaultSlotStatus(records).key, records), [records])
}

/** How a display key renders (label, colours, treatment). */
export function useDisplayStatus(key: DisplayKey): ResolvedStatus {
  const records = useSlotStatusRecords()
  return useMemo(() => resolveDisplayStatus(key, records), [key, records])
}

/**
 * The one line an empty session shows under its status: its own note, else
 * "<label> / open for cover" when it is open (for example "Free / open for
 * cover"), else the status's long label (for example "On holiday"). No screen
 * keeps its own wording per status.
 */
export function emptySessionLine(slot: { status: SlotStatusKey; note?: string }, open: boolean, statuses: SlotStatusRecords): string {
  if (slot.note !== undefined && slot.note !== '') return slot.note
  const resolved = resolveDisplayStatus(slot.status, statuses)
  if (open) return `${resolved.label} / open for cover`
  return resolved.longLabel
}
