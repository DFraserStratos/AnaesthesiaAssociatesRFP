/**
 * The `catalogue:changed` delivery (FINDINGS R-159): the changes of one re-sync or one write request,
 * merged into one message. A later change to the same record, or a later layout, config, issues or
 * asset version, replaces the earlier one; record order is the order the changes came in.
 */
import type { CatalogueChange, CatalogueDelivery } from './types.ts'

/** The changes part of a delivery (no `epoch` or `seq` yet). */
export type DeliveryBody = Omit<CatalogueDelivery, 'epoch' | 'seq'>

/** Fold one change into a delivery body (in place). */
export function addChange(d: DeliveryBody, c: CatalogueChange): void {
  switch (c.kind) {
    case 'item':
      ;(d.items ??= {})[c.id] = c.record
      break
    case 'question':
      ;(d.questions ??= {})[c.id] = c.record
      break
    case 'artifact':
      ;(d.artifacts ??= {})[c.id] = c.record
      break
    case 'layout':
      d.layout = c.layout
      break
    case 'config':
      d.config = c.config
      break
    case 'issues':
      d.issues = c.issues
      break
    case 'assets':
      d.assets = { ...d.assets, ...c.assets }
      break
  }
}

/** True when a delivery body carries nothing. */
export const isEmptyBody = (d: DeliveryBody) => Object.keys(d).length === 0

/** Whether a delivery changes any record (item, question or artifact): what the Diff review counts. */
export const changesRecords = (d: DeliveryBody) => !!(d.items && Object.keys(d.items).length) || !!(d.questions && Object.keys(d.questions).length) || !!(d.artifacts && Object.keys(d.artifacts).length)
