import { create } from 'zustand'

/**
 * Per-trigger memory that "Replay" needs (catch-up Phase 14). Shared across
 * screens, so a message fired on Mobile Lists can be replayed from Admin
 * Integrations. Not persisted: a reload forgets it, and a replay against an
 * entity a reset removed refuses with a readable message.
 *
 * It also carries the UI-only request behind "Photo capture (Future scope)"
 * (catch-up Phase 15b): the trigger asks, `MobileListsRoute` opens the Add a
 * booking sheet on the photo prong and clears it. No domain state, no audit.
 */
export interface DemoTriggerMemory {
  /** The last hospital message fired. */
  lastMessageId: string | null
  /** The last payment webhook sent, replayed with the same key. */
  lastWebhook: { accRecId: string; key: string; amount: number } | null
  /** Webhook key counter, the `<n>` in `WEBHOOK-<accRecId>-<n>`. */
  webhookCounter: number
  /** A pending "open the photo demo on this List"; `n` lets a repeat re-open it. */
  photoCaptureRequest: { listId: string; n: number } | null
  /** Photo request counter, the `n` above; it outlives a clear, so a repeat still differs. */
  photoCaptureCounter: number
  rememberMessage: (id: string) => void
  rememberWebhook: (webhook: { accRecId: string; key: string; amount: number }, n: number) => void
  requestPhotoCapture: (listId: string) => void
  clearPhotoCaptureRequest: () => void
}

/** A UI-only store of its own, written only through its actions. */
export const useDemoTriggerMemory = create<DemoTriggerMemory>((set) => ({
  lastMessageId: null,
  lastWebhook: null,
  webhookCounter: 0,
  photoCaptureRequest: null,
  photoCaptureCounter: 0,
  rememberMessage: (id) => set({ lastMessageId: id }),
  rememberWebhook: (webhook, n) => set({ lastWebhook: webhook, webhookCounter: n }),
  requestPhotoCapture: (listId) =>
    set((m) => ({ photoCaptureRequest: { listId, n: m.photoCaptureCounter + 1 }, photoCaptureCounter: m.photoCaptureCounter + 1 })),
  clearPhotoCaptureRequest: () => set({ photoCaptureRequest: null }),
}))
