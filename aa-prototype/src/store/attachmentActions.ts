/**
 * Attachments on a Booking or on a whole List (US-03.1.3; catch-up Phase 15).
 * These two actions are the ONLY writers of `Booking.attachments` and
 * `List.attachments`: `editBooking` no longer accepts them. Ids are
 * store-allocated (`AT####`), so a remove and re-add never reuses one, and the
 * audit carries the attachment's metadata only, never its data URL, to keep the
 * log small.
 *
 * Rights follow the Booking edit matrix (`editRefusal`) on the List: the
 * anaesthetist on their own DRAFT List, the office on DRAFT and SUBMITTED,
 * nobody on AUTHORISED. A cancelled Booking takes no attachments.
 */

import type { Attachment, Booking, List } from '../domain/types'
import { allocateId, mutate, ok, refuse, type Actor, type Outcome } from './mutate'
import type { AppStoreApi } from './appStore'
import { editRefusal, getBooking } from './lifecycle'

export type AttachmentTarget = { kind: 'booking'; id: string } | { kind: 'list'; id: string }

/** What the picker hands over. The id is the store's to allocate. */
export interface AttachmentFile {
  name: string
  kind: Attachment['kind']
  dataUrl?: string
}

/**
 * Build a stored attachment, allocating its `AT` id. Shared with
 * `createBooking`'s photo path so every attachment id comes from one place.
 */
export function newAttachment(
  counters: Record<string, number>,
  file: AttachmentFile,
): { attachment: Attachment; counters: Record<string, number> } {
  const alloc = allocateId(counters, 'attachment')
  const attachment: Attachment = { id: alloc.id, name: file.name.trim(), kind: file.kind }
  if (file.dataUrl !== undefined) attachment.dataUrl = file.dataUrl
  return { attachment, counters: alloc.counters }
}

type Resolved = { kind: 'booking'; booking: Booking; list: List } | { kind: 'list'; list: List }

function resolve(api: AppStoreApi, actor: Actor, target: AttachmentTarget): Outcome<Resolved> {
  const state = api.getState()
  if (target.kind === 'booking') {
    const found = getBooking(state, target.id)
    if (found === undefined) return refuse('notFound', 'Booking not found.')
    if (found.booking.cancellation !== undefined) {
      return refuse('bookingCancelled', 'This Booking is cancelled; its attachments cannot change.')
    }
    const rights = editRefusal(actor, found.list)
    if (rights !== null) return rights
    return ok({ kind: 'booking', booking: found.booking, list: found.list })
  }
  const list = state.schedule.lists[target.id]
  if (list === undefined) return refuse('notFound', 'List not found.')
  const rights = editRefusal(actor, list)
  if (rights !== null) return rights
  return ok({ kind: 'list', list })
}

/** The audited metadata of an attachment: never its data URL. */
function metaOf(attachment: Attachment): { attachmentId: string; name: string; kind: Attachment['kind'] } {
  return { attachmentId: attachment.id, name: attachment.name, kind: attachment.kind }
}

/** Attach a file or photo to a Booking or a List. Audited `booking.attachmentAdd` or `list.attachmentAdd`. */
export function addAttachment(
  api: AppStoreApi,
  actor: Actor,
  target: AttachmentTarget,
  file: AttachmentFile,
): Outcome<{ attachmentId: string }> {
  const resolved = resolve(api, actor, target)
  if (!resolved.ok) return resolved
  if (file.name.trim() === '') return refuse('attachmentNameRequired', 'An attachment needs a name.')
  const found = resolved.value
  const alloc = newAttachment(api.getState().counters, file)
  const attachment = alloc.attachment

  if (found.kind === 'booking') {
    const { booking } = found
    mutate(
      api,
      actor,
      { entityType: 'booking', entityId: booking.id, action: 'booking.attachmentAdd', after: metaOf(attachment) },
      (s) => ({
        schedule: {
          ...s.schedule,
          bookings: { ...s.schedule.bookings, [booking.id]: { ...booking, attachments: [...booking.attachments, attachment] } },
        },
        counters: alloc.counters,
      }),
    )
  } else {
    const { list } = found
    mutate(
      api,
      actor,
      { entityType: 'list', entityId: list.id, action: 'list.attachmentAdd', after: metaOf(attachment), stampBookingId: null },
      (s) => ({
        schedule: {
          ...s.schedule,
          lists: { ...s.schedule.lists, [list.id]: { ...list, attachments: [...(list.attachments ?? []), attachment] } },
        },
        counters: alloc.counters,
      }),
    )
  }
  return ok({ attachmentId: attachment.id })
}

/** Remove one attachment from a Booking or a List. Audited `booking.attachmentRemove` or `list.attachmentRemove`. */
export function removeAttachment(api: AppStoreApi, actor: Actor, target: AttachmentTarget, attachmentId: string): Outcome {
  const resolved = resolve(api, actor, target)
  if (!resolved.ok) return resolved
  const found = resolved.value
  const current = found.kind === 'booking' ? found.booking.attachments : (found.list.attachments ?? [])
  const attachment = current.find((a) => a.id === attachmentId)
  if (attachment === undefined) return refuse('notFound', 'Attachment not found.')
  const remaining = current.filter((a) => a.id !== attachmentId)

  if (found.kind === 'booking') {
    const { booking } = found
    mutate(
      api,
      actor,
      { entityType: 'booking', entityId: booking.id, action: 'booking.attachmentRemove', before: metaOf(attachment) },
      (s) => ({
        schedule: { ...s.schedule, bookings: { ...s.schedule.bookings, [booking.id]: { ...booking, attachments: remaining } } },
      }),
    )
  } else {
    const { list } = found
    mutate(
      api,
      actor,
      { entityType: 'list', entityId: list.id, action: 'list.attachmentRemove', before: metaOf(attachment), stampBookingId: null },
      (s) => ({
        schedule: { ...s.schedule, lists: { ...s.schedule.lists, [list.id]: { ...list, attachments: remaining } } },
      }),
    )
  }
  return ok(undefined)
}
